/**
 * Parse vùng câu hỏi thành QuestionBlock[].
 *
 * Sau khi corpus đã qua scripts/normalize.mjs, biến thiên còn lại đúng bằng
 * danh sách KEEP ở docs/canonical-format.md §5. Gặp thứ ngoài danh sách đó
 * thì phải đẩy vào parseWarnings, không được im lặng bỏ qua (CLAUDE.md §10).
 */

import type { Option, Question, QuestionBlock, QuestionKind, Segment } from './types';
import { fenceMap } from './sections';

/** Tên dạng (tiếng Anh) → kind. Không bao giờ dựa vào số thứ tự dạng. */
const KIND_RULES: [string, QuestionKind][] = [
  ['Matching Sentence Endings', 'matching-endings'],
  ['Matching Headings', 'matching-headings'],
  ['Matching Information', 'matching-information'],
  ['Matching Features', 'matching-features'],
  ['True / False / Not Given', 'tfng'],
  ['Yes / No / Not Given', 'ynng'],
  ['Summary Completion (with a word list)', 'gap-select'],
  ['Summary Completion (words from the passage)', 'gap-text'],
  ['Sentence Completion', 'gap-text'],
  ['Note Completion', 'gap-text'],
  ['Table Completion', 'gap-table'],
  ['Flow-chart Completion', 'gap-flow'],
  ['Diagram Label Completion', 'gap-diagram'],
  ['Multiple Choice, more than one answer', 'mcq-multi'],
  ['Multiple Choice, one answer', 'mcq-single'],
  ['Short-answer', 'short-answer'],
];

export function kindFromTypeName(typeName: string): QuestionKind {
  const hit = KIND_RULES.find(([needle]) => typeName.includes(needle));
  return hit ? hit[1] : 'unknown';
}

const TFNG_OPTIONS: Option[] = [
  { letter: 'TRUE', text: 'TRUE' },
  { letter: 'FALSE', text: 'FALSE' },
  { letter: 'NOT GIVEN', text: 'NOT GIVEN' },
];
const YNNG_OPTIONS: Option[] = [
  { letter: 'YES', text: 'YES' },
  { letter: 'NO', text: 'NO' },
  { letter: 'NOT GIVEN', text: 'NOT GIVEN' },
];

/** Dòng khai báo options cố định: `**TRUE** / **FALSE** / **NOT GIVEN**` (#34). */
const FIXED_OPTION_LINE = /^\*\*\w+\*\*(\s*\/\s*\*\*[\w ]+\*\*)+$/;

/** Chỗ trống: từ 3 gạch dưới trở lên (sau N13 luôn đúng 6, nhưng chấp nhận rộng). */
const BLANK = /_{3,}/;

/**
 * Rút wordLimit từ instruction.
 * Ví dụ: "Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage…"
 */
export function extractWordLimit(instruction: string): { text?: string; count?: number } {
  const m = instruction.match(/NO MORE THAN (ONE|TWO|THREE|FOUR)( WORDS?)?( AND\/OR A NUMBER)?/i);
  if (!m) return {};
  const words: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 };
  return { text: m[0].replace(/\s+/g, ' '), count: words[m[1]!.toUpperCase()] };
}

/** Tách một dòng thành mảnh text xen kẽ chỗ trống. */
export function toSegments(line: string, inFence: boolean, range: [number, number]): Segment[] {
  // Ngoài fence: số in đậm `**55** ______`. Trong fence: số trần `66 ______` (§3.3).
  const re = inFence ? /(?:\*\*(\d+)\*\*|(\d+))(\s*)(_{3,})/g : /\*\*(\d+)\*\*(\s*)(_{3,})/g;
  const out: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const qno = Number(inFence ? (m[1] ?? m[2]) : m[1]);
    // Blank số trần chỉ hợp lệ trong fence và số phải nằm trong range (#31 KEEP)
    if (!(qno >= range[0] && qno <= range[1])) continue;
    if (m.index > last) out.push({ type: 'text', value: line.slice(last, m.index) });
    out.push({ type: 'blank', qno });
    last = m.index + m[0].length;
  }
  if (last === 0) return [{ type: 'text', value: line }];
  if (last < line.length) out.push({ type: 'text', value: line.slice(last) });
  return out;
}

const segHasBlank = (segs: Segment[]): boolean => segs.some((s) => s.type === 'blank');

interface RawBlock {
  typeIndex: number;
  typeName: string;
  range: [number, number];
  lines: string[];
  inFence: boolean[];
}

/** Cắt vùng câu hỏi thành các khối `## Dạng n — Tên (Questions a–b)`. */
function splitBlocks(lines: string[], warn: (s: string) => void): RawBlock[] {
  const fmap = fenceMap(lines);
  const heads: number[] = [];
  lines.forEach((l, i) => {
    if (!fmap[i] && /^##\s+Dạng\s+\d+/.test(l)) heads.push(i);
  });

  const out: RawBlock[] = [];
  heads.forEach((start, k) => {
    const end = heads[k + 1] ?? lines.length;
    const head = lines[start] ?? '';
    // Dấu gạch: chấp nhận cả `-`, `–`, `—` (CLAUDE.md §4.3)
    const m = head.match(/^##\s+Dạng\s+(\d+)\s*[–—-]\s*(.+?)\s*\(Questions\s+(\d+)\s*[–—-]\s*(\d+)\)\s*$/);
    if (!m) {
      warn(`heading khối không đúng dạng "## Dạng n — Tên (Questions a–b)": ${head.trim()}`);
      return;
    }
    out.push({
      typeIndex: Number(m[1]),
      typeName: m[2]!.trim(),
      range: [Number(m[3]), Number(m[4])],
      lines: lines.slice(start + 1, end),
      inFence: fmap.slice(start + 1, end),
    });
  });
  return out;
}

export function parseQuestionBlocks(lines: string[], warn: (s: string) => void): QuestionBlock[] {
  return splitBlocks(lines, warn).map((rb) => parseOneBlock(rb, warn));
}

function parseOneBlock(rb: RawBlock, warn: (s: string) => void): QuestionBlock {
  const kind = kindFromTypeName(rb.typeName);
  if (kind === 'unknown') {
    warn(`Dạng ${rb.typeIndex}: không nhận ra tên dạng "${rb.typeName}" → rơi về ô nhập text`);
  }

  const block: QuestionBlock = {
    typeIndex: rb.typeIndex,
    typeName: rb.typeName,
    kind,
    range: rb.range,
    questions: [],
  };

  /* ---- 1. Khối chiến thuật: blockquote liền sau heading ------------- *
   * Sau N03, `>` trong vùng câu hỏi CHỈ có nghĩa "chiến thuật".        */
  const strategyLines: string[] = [];
  let i = 0;
  while (i < rb.lines.length && (rb.lines[i] ?? '').trim() === '') i++;
  while (i < rb.lines.length && /^>/.test(rb.lines[i] ?? '')) {
    strategyLines.push((rb.lines[i] ?? '').replace(/^>\s?/, ''));
    i++;
  }
  if (strategyLines.length) {
    if (!/^\*\*Chiến thuật\*\*\s*$/.test(strategyLines[0] ?? '')) {
      warn(`Dạng ${rb.typeIndex}: nhãn chiến thuật không đúng \`> **Chiến thuật**\` (N04)`);
    }
    block.strategy = strategyLines.join('\n').trim();
  } else {
    warn(`Dạng ${rb.typeIndex}: thiếu khối \`> **Chiến thuật**\``);
  }

  /* ---- 2. Instruction: các dòng in nghiêng liên tiếp (#6 KEEP) ------ */
  const rest = rb.lines.slice(i);
  const restFence = rb.inFence.slice(i);
  const instr: string[] = [];
  let j = 0;
  while (j < rest.length && (rest[j] ?? '').trim() === '') j++;
  while (j < rest.length && /^\*[^*].*\*$/.test((rest[j] ?? '').trim())) {
    instr.push((rest[j] ?? '').trim().replace(/^\*|\*$/g, ''));
    j++;
  }
  if (instr.length) {
    block.instruction = instr.join(' ');
    const wl = extractWordLimit(block.instruction);
    if (wl.text) block.wordLimit = wl.text;
    if (wl.count) block.wordLimitCount = wl.count;
  } else {
    warn(`Dạng ${rb.typeIndex}: thiếu dòng instruction in nghiêng`);
  }

  /* ---- 3. Thân khối -------------------------------------------------- */
  const body = rest.slice(j);
  const bodyFence = restFence.slice(j);

  if (kind === 'tfng') block.options = TFNG_OPTIONS;
  if (kind === 'ynng') block.options = YNNG_OPTIONS;

  // (a) code fence — gap-flow / gap-diagram giữ raw byte-exact (#14 KEEP)
  if (kind === 'gap-flow' || kind === 'gap-diagram') {
    const open = body.findIndex((l) => /^```/.test(l));
    const close = open < 0 ? -1 : body.findIndex((l, k) => k > open && /^```/.test(l));
    if (open >= 0 && close > open) {
      block.raw = body.slice(open + 1, close).join('\n');
      for (const line of body.slice(open + 1, close)) {
        for (const seg of toSegments(line, true, rb.range)) {
          if (seg.type === 'blank') block.questions.push({ qno: seg.qno! });
        }
      }
      block.questions.sort((a, b) => a.qno - b.qno);
    } else {
      warn(`Dạng ${rb.typeIndex}: ${kind} nhưng không tìm thấy code fence`);
    }
    return finish(block, warn);
  }

  // (b) gap-table — dựng lại bảng, ô nào có chỗ trống thì nhúng input
  if (kind === 'gap-table') {
    const rows = body.filter((l) => /^\s*\|.*\|\s*$/.test(l));
    const cellsOf = (l: string): string[] =>
      l.trim().slice(1, -1).split('|').map((c) => c.trim());
    const dataRows = rows.filter((l) => !/^\s*\|(\s*:?-{2,}:?\s*\|)+\s*$/.test(l));
    const header = dataRows[0] ? cellsOf(dataRows[0]).map((c) => toSegments(c, false, rb.range)) : [];
    const bodyRows = dataRows.slice(1).map((l) => cellsOf(l).map((c) => toSegments(c, false, rb.range)));
    block.table = { header, rows: bodyRows };
    for (const row of bodyRows) {
      for (const cell of row) {
        for (const seg of cell) if (seg.type === 'blank') block.questions.push({ qno: seg.qno! });
      }
    }
    block.questions.sort((a, b) => a.qno - b.qno);
    return finish(block, warn);
  }

  // (c) mcq-single / mcq-multi
  if (kind === 'mcq-single' || kind === 'mcq-multi') {
    let cur: Question | null = null;
    for (const line of body) {
      const multi = line.match(/^\*\*(\d+)\s*[–—-]\s*(\d+)\.\*\*\s+(.*)$/);
      const single = line.match(/^\*\*(\d+)\.\*\*\s+(.*)$/);
      const opt = line.match(/^-\s+\*\*([A-Z])\*\*\s+(.*)$/);
      if (multi) {
        const from = Number(multi[1]);
        const to = Number(multi[2]);
        const qnos = Array.from({ length: to - from + 1 }, (_, k) => from + k);
        // "Choose **TWO** letters" → selectCount; suy từ dải số câu, không hardcode
        cur = { qno: from, qnos, prompt: multi[3]!.trim(), options: [], selectCount: qnos.length };
        block.questions.push(cur);
      } else if (single) {
        cur = { qno: Number(single[1]), prompt: single[2]!.trim(), options: [] };
        block.questions.push(cur);
      } else if (opt && cur) {
        cur.options!.push({ letter: opt[1]!, text: opt[2]!.trim() });
      }
    }
    return finish(block, warn);
  }

  // (d) các dạng còn lại: item đánh số, options cấp block, caption, summary
  const optionLines: Option[] = [];
  const segLines: { segs: Segment[]; indent: number }[] = [];

  for (let k = 0; k < body.length; k++) {
    const line = body[k] ?? '';
    const t = line.trim();
    if (t === '' || t === '---') continue;

    // dòng khai báo options cố định TRUE/FALSE/NOT GIVEN — không phải caption (#34)
    if (FIXED_OPTION_LINE.test(t)) continue;

    // bảng roman của Matching Headings: `| **i** | text |`
    const roman = t.match(/^\|\s*\*\*([ivxIVX]+)\*\*\s*\|\s*(.+?)\s*\|$/);
    if (roman) {
      optionLines.push({ letter: roman[1]!.toLowerCase(), text: roman[2]!.trim() });
      continue;
    }
    if (/^\|(\s*:?-{2,}:?\s*\|)+$/.test(t) || /^\|\s*\|\s*$/.test(t)) continue;

    // options mỗi dòng một cái (sau N08): `**A** Ashoka`
    const opt = t.match(/^\*\*([A-Z])\*\*\s+(.*)$/);
    if (opt) {
      optionLines.push({ letter: opt[1]!, text: opt[2]!.trim() });
      continue;
    }

    // caption in đậm độc lập của Note Completion (N07 giữ)
    const cap = t.match(/^\*\*([^*]+)\*\*$/);
    if (cap && !block.caption && !segHasBlank(toSegments(t, false, rb.range))) {
      block.caption = cap[1]!.trim();
      continue;
    }

    // item đánh số: `1. Paragraph **A** ______`
    const item = t.match(/^(\d+)\.\s+(.*)$/);
    if (item && Number(item[1]) >= rb.range[0] && Number(item[1]) <= rb.range[1]) {
      const qno = Number(item[1]);
      const text = item[2]!.replace(BLANK, '').replace(/\s+/g, ' ').trim();
      block.questions.push({ qno, prompt: text });
      continue;
    }

    // dòng mang chỗ trống: summary, note bullet
    const inFence = bodyFence[k] ?? false;
    const segs = toSegments(line, inFence, rb.range);
    if (segHasBlank(segs)) {
      const indent = (line.match(/^(\s*)/)?.[1]?.length ?? 0);
      segLines.push({ segs, indent });
    }
  }

  if (optionLines.length) block.options = optionLines;

  if (segLines.length) {
    // gap-text / gap-select: mỗi dòng thân là một Question mang segments
    for (const { segs, indent } of segLines) {
      const first = segs.find((s) => s.type === 'blank');
      block.questions.push({ qno: first!.qno!, segments: segs, indent });
    }
  }

  block.questions.sort((a, b) => a.qno - b.qno);
  return finish(block, warn);
}

/** Dạng nào bắt buộc phải có danh sách lựa chọn ở cấp khối. */
const NEEDS_BLOCK_OPTIONS = new Set<QuestionKind>([
  'matching-headings',
  'matching-features',
  'matching-endings',
  'gap-select',
]);

function finish(block: QuestionBlock, warn: (s: string) => void): QuestionBlock {
  const covered = new Set<number>();
  for (const q of block.questions) {
    if (q.qnos) q.qnos.forEach((n) => covered.add(n));
    else if (q.segments) q.segments.forEach((s) => s.type === 'blank' && covered.add(s.qno!));
    else covered.add(q.qno);
  }
  for (let n = block.range[0]; n <= block.range[1]; n++) {
    if (!covered.has(n)) warn(`Dạng ${block.typeIndex}: thiếu câu ${n}`);
  }

  /* Khối không có lựa chọn thì người làm không có gì để chọn — câu hỏi hiện ra
     nhưng vô dụng. Đã lọt một lần: 12 heading viết dạng `**i** text` thay vì
     hàng bảng `| **i** | text |`, parser bỏ hết, mọi cổng kiểm vẫn báo xanh. */
  if (NEEDS_BLOCK_OPTIONS.has(block.kind) && !block.options?.length) {
    warn(
      `Dạng ${block.typeIndex} (${block.kind}): không parse ra lựa chọn nào — ` +
        `${block.range[1] - block.range[0] + 1} câu sẽ không có gì để chọn`
    );
  }

  /* mcq: lựa chọn nằm ở từng câu, không ở cấp khối. */
  if (block.kind === 'mcq-single' || block.kind === 'mcq-multi') {
    for (const q of block.questions) {
      if (!q.options?.length) {
        warn(`Dạng ${block.typeIndex}: câu ${q.qno} không parse ra phương án nào`);
      }
    }
  }

  return block;
}
