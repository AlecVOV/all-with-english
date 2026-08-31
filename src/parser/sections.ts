/**
 * Cắt file .md thành các vùng. Nhận diện heading cấp 1 theo **từ khoá**,
 * không khớp chính xác cả chuỗi (CLAUDE.md §4.1).
 */

import type { Frontmatter } from './types';

export interface Sections {
  frontmatter?: Frontmatter;
  frontmatterWarnings: string[];
  /** H1 đầu file, sau frontmatter */
  h1?: string;
  /** markdown thô mọi blockquote trước `# READING PASSAGE` */
  intro?: string;
  passageTitle: string;
  passageLines: string[];
  questionLines: string[];
  answerLines: string[];
  diagnosticsLines: string[];
  vocabulary?: string;
  paraphrases?: string;
  comparison?: string;
}

/** Dòng nào nằm trong code fence — heading trong fence không phải heading. */
export function fenceMap(lines: string[]): boolean[] {
  const m = new Array<boolean>(lines.length).fill(false);
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i] ?? '')) {
      fence = !fence;
      continue;
    }
    m[i] = fence;
  }
  return m;
}

/**
 * Frontmatter YAML tối giản — chỉ đủ cho lược đồ ở canonical-format §N-A.
 * Cố ý không dùng thư viện YAML: hình dạng đã cố định và `validate` canh nó.
 */
function parseFrontmatter(lines: string[]): {
  fm?: Frontmatter;
  warnings: string[];
  end: number;
} {
  const warnings: string[] = [];
  if (lines[0] !== '---') return { warnings: ['thiếu YAML frontmatter ở dòng 1'], end: 0 };
  const close = lines.indexOf('---', 1);
  if (close < 0) return { warnings: ['frontmatter không có dòng `---` đóng'], end: 0 };

  /**
   * Bỏ cặp nháy bao ngoài của một giá trị YAML.
   * Bắt buộc phải có: tiêu đề chứa dấu `:` — vd `title: "Two Arrivals: Theravāda…"` —
   * là YAML **không hợp lệ** nếu không bọc nháy, nên file sau chắc chắn sẽ có dạng này.
   */
  const unquote = (v: string): string => {
    const t = v.trim();
    if (t.length >= 2 && ((t[0] === '"' && t.endsWith('"')) || (t[0] === "'" && t.endsWith("'")))) {
      return t.slice(1, -1);
    }
    return t;
  };

  const raw: Record<string, string | string[]> = {};
  let listKey: string | null = null;
  for (let i = 1; i < close; i++) {
    const line = lines[i] ?? '';
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      (raw[listKey] as string[]).push(unquote(item[1]!));
      continue;
    }
    // Chỉ tách ở dấu `:` ĐẦU TIÊN — phần còn lại là giá trị, dù có `:` bên trong.
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv as unknown as [string, string, string];
    if (value === '') {
      listKey = key;
      raw[key] = [];
    } else if (/^\[.*\]$/.test(value)) {
      listKey = null;
      raw[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s))
        .filter(Boolean);
    } else {
      listKey = null;
      raw[key] = unquote(value);
    }
  }

  const str = (k: string): string => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const list = (k: string): string[] => (Array.isArray(raw[k]) ? (raw[k] as string[]) : []);
  const num = (k: string): number => Number(str(k));

  for (const k of [
    'workbook_id',
    'title',
    'topic_slug',
    'passage_word_count',
    'question_count',
    'question_types',
    'answer_language',
    'passage_language',
    'created',
  ]) {
    if (raw[k] === undefined) warnings.push(`frontmatter thiếu trường \`${k}\``);
  }

  const fm: Frontmatter = {
    workbook_id: num('workbook_id'),
    title: str('title'),
    topic_slug: str('topic_slug'),
    passage_word_count: num('passage_word_count'),
    question_count: num('question_count'),
    question_types: list('question_types'),
    answer_language: list('answer_language'),
    passage_language: str('passage_language'),
    created: str('created'),
  };
  return { fm, warnings, end: close + 1 };
}

export function splitSections(raw: string): Sections {
  const lines = raw.split(/\r?\n/);
  const { fm, warnings, end } = parseFrontmatter(lines);
  const fmap = fenceMap(lines);

  const h1s: number[] = [];
  for (let i = end; i < lines.length; i++) {
    if (!fmap[i] && /^# /.test(lines[i] ?? '')) h1s.push(i);
  }
  const findH1 = (re: RegExp): number => h1s.find((i) => re.test(lines[i] ?? '')) ?? -1;

  const iPassage = findH1(/READING\s+PASSAGE/i);
  const iAnswers = findH1(/ĐÁP\s*ÁN/i);
  const iDiag = findH1(/TỰ\s*CHẨN\s*ĐOÁN/i);
  const iCompare = findH1(/SO\s*SÁNH/i);
  const iVocab = findH1(/VOCABULARY/i);
  const iPara = findH1(/PARAPHRASE/i);

  /** Heading đầu tiên đứng sau `from`, dùng làm mốc đóng vùng. */
  const nextH1 = (from: number): number => h1s.find((i) => i > from) ?? lines.length;

  // H1 đầu tiên sau frontmatter, trước READING PASSAGE = tiêu đề file (N33)
  const iTitle = h1s.find((i) => i < (iPassage < 0 ? lines.length : iPassage));
  const h1 = iTitle === undefined ? undefined : (lines[iTitle] ?? '').replace(/^#\s+/, '').trim();

  // intro = mọi blockquote trước READING PASSAGE (#29, #30 KEEP)
  const introEnd = iPassage < 0 ? lines.length : iPassage;
  const introRaw: string[] = [];
  for (let i = end; i < introEnd; i++) {
    const l = lines[i] ?? '';
    if (/^>/.test(l)) introRaw.push(l);
    else if (introRaw.length && l.trim() === '' && introRaw[introRaw.length - 1] !== '') introRaw.push('');
  }
  while (introRaw.length && introRaw[introRaw.length - 1] === '') introRaw.pop();

  // Vùng câu hỏi: từ heading `# PHẦN` đầu tiên tới `# ĐÁP ÁN`.
  // Nếu file không dùng `# PHẦN` thì lấy ngay sau vùng passage.
  const passageEnd = iPassage < 0 ? -1 : nextH1(iPassage);
  const iFirstPart = h1s.find((i) => i > iPassage && /^#\s+PHẦN/i.test(lines[i] ?? '')) ?? passageEnd;

  const slice = (a: number, b: number): string[] => (a < 0 || a >= b ? [] : lines.slice(a, b));

  const sectionText = (i: number): string | undefined => {
    if (i < 0) return undefined;
    const body = lines
      .slice(i + 1, nextH1(i))
      .join('\n')
      .replace(/^\s*\n/, '')
      .replace(/\n?---\s*$/, '')
      .trim();
    return body || undefined;
  };

  return {
    ...(fm ? { frontmatter: fm } : {}),
    frontmatterWarnings: warnings,
    ...(h1 ? { h1 } : {}),
    ...(introRaw.length ? { intro: introRaw.join('\n') } : {}),
    passageTitle:
      slice(iPassage, passageEnd)
        .find((l) => /^###\s+/.test(l))
        ?.replace(/^###\s+/, '')
        .trim() ?? '',
    passageLines: slice(iPassage, passageEnd),
    questionLines: slice(iFirstPart, iAnswers < 0 ? lines.length : iAnswers),
    answerLines: slice(iAnswers, iAnswers < 0 ? -1 : nextH1(iAnswers)),
    diagnosticsLines: slice(iDiag, iDiag < 0 ? -1 : nextH1(iDiag)),
    ...(sectionText(iVocab) ? { vocabulary: sectionText(iVocab) } : {}),
    ...(sectionText(iPara) ? { paraphrases: sectionText(iPara) } : {}),
    ...(sectionText(iCompare) ? { comparison: sectionText(iCompare) } : {}),
  };
}

/** Đoạn văn: dòng chỉ chứa `**A**` mở đầu một paragraph (CLAUDE.md §4.2). */
export function parseParagraphs(passageLines: string[]): { label: string; text: string }[] {
  const out: { label: string; lines: string[] }[] = [];
  let cur: { label: string; lines: string[] } | null = null;
  for (const line of passageLines) {
    const m = line.match(/^\*\*([A-Z])\*\*\s*$/);
    if (m) {
      cur = { label: m[1]!, lines: [] };
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    if (line === '---' || /^#{1,6}\s/.test(line)) {
      cur = null;
      continue;
    }
    cur.lines.push(line);
  }
  return out.map((p) => ({ label: p.label, text: p.lines.join('\n').trim() }));
}
