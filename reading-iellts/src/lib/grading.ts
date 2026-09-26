/**
 * Chấm điểm (CLAUDE.md §7).
 *
 * Chuẩn hoá trước khi so: bỏ khoảng trắng thừa, về chữ thường, bỏ dấu câu
 * đầu/cuối, coi mọi loại gạch nối như nhau, bỏ dấu phân cách nghìn (#22 KEEP).
 * **Giữ dấu tiếng Việt**, nhưng so thêm một lượt sau khi bỏ dấu vì gõ
 * `Luy Lau` thay cho `Luy Lâu` là chuyện thường.
 */

import type { AnswerKey, ParsedTest, QuestionBlock } from '../parser/types';

export type Verdict = 'correct' | 'wrong' | 'blank' | 'over-limit';

export interface QuestionResult {
  qno: number;
  typeIndex: number;
  typeName: string;
  given: string;
  verdict: Verdict;
  /** lý do hiển thị ở màn review, vd "quá số từ cho phép" */
  reason?: string;
  key?: AnswerKey;
}

export interface TypeScore {
  typeIndex: number;
  typeName: string;
  correct: number;
  total: number;
  ratio: number;
}

export interface Score {
  raw: number;
  total: number;
  percent: number;
  band: string;
  byQuestion: QuestionResult[];
  byType: TypeScore[];
}

/** Bỏ dấu tiếng Việt để so lượt thứ hai. */
export function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function normalize(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      // mọi loại gạch nối coi như nhau
      .replace(/[‐-―−]/g, '-')
      // dấu phân cách nghìn: 130,000 → 130000 (#22)
      .replace(/(\d),(?=\d{3}\b)/g, '$1')
      // bỏ dấu câu ở hai đầu
      .replace(/^[\s"'“”‘’.,;:!?()[\]]+/, '')
      .replace(/[\s"'“”‘’.,;:!?()[\]]+$/, '')
      .replace(/\s+/g, ' ')
  );
}

const eq = (a: string, b: string): boolean => {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  return stripDiacritics(na) === stripDiacritics(nb);
};

export function countWords(s: string): number {
  const t = normalize(s);
  return t ? t.split(/[\s-]+/).filter(Boolean).length : 0;
}

/** So một câu trả lời với đáp án. Không xét thứ tự với đáp án nhiều phần. */
export function checkOne(given: string, key: AnswerKey | undefined, block: QuestionBlock | undefined): {
  verdict: Verdict;
  reason?: string;
} {
  if (!given || !given.trim()) return { verdict: 'blank' };
  if (!key) return { verdict: 'wrong', reason: 'không tìm thấy đáp án cho câu này' };

  const isCorrect = key.accepted.some((a) => eq(a, given));

  // Vượt wordLimit → sai, và phải ghi rõ lý do ở màn review (CLAUDE.md §7)
  const limit = block?.wordLimitCount;
  if (limit && countWords(given) > limit) {
    return {
      verdict: 'over-limit',
      reason: `quá số từ cho phép (${countWords(given)}/${limit} từ)${isCorrect ? ' — nội dung đúng nhưng vẫn 0 điểm' : ''}`,
    };
  }
  return isCorrect ? { verdict: 'correct' } : { verdict: 'wrong' };
}

/**
 * Band ước lượng: quy về phần trăm rồi mới tra bảng thang 40 câu
 * (CLAUDE.md §7). UI phải ghi rõ đây là "band ước lượng".
 */
export function bandFromPercent(p: number): string {
  const table: [number, string][] = [
    [0.975, '9.0'],
    [0.925, '8.5'],
    [0.875, '8.0'],
    [0.825, '7.5'],
    [0.75, '7.0'],
    [0.65, '6.5'],
    [0.575, '6.0'],
    [0.5, '5.5'],
    [0.4, '5.0'],
    [0.3, '4.5'],
    [0.23, '4.0'],
    [0.15, '3.5'],
    [0.1, '3.0'],
  ];
  for (const [floor, band] of table) if (p >= floor) return band;
  return '< 3.0';
}

/** Chỉ cần ba trường này — nhận cả ParsedTest lẫn LoadedTest. */
export type Gradable = Pick<ParsedTest, 'blocks' | 'answers' | 'totalQuestions'>;

export function grade(test: Gradable, answers: Record<number, string>): Score {
  const blockOf = new Map<number, QuestionBlock>();
  for (const b of test.blocks) {
    for (let n = b.range[0]; n <= b.range[1]; n++) blockOf.set(n, b);
  }

  const byQuestion: QuestionResult[] = [];
  for (let n = 1; n <= test.totalQuestions; n++) {
    const block = blockOf.get(n);
    const key = test.answers[n];
    const given = answers[n] ?? '';
    const { verdict, reason } = checkOne(given, key, block);
    byQuestion.push({
      qno: n,
      typeIndex: block?.typeIndex ?? 0,
      typeName: block?.typeName ?? '',
      given,
      verdict,
      ...(reason ? { reason } : {}),
      ...(key ? { key } : {}),
    });
  }

  const byType: TypeScore[] = test.blocks.map((b) => {
    const rs = byQuestion.filter((r) => r.typeIndex === b.typeIndex);
    const correct = rs.filter((r) => r.verdict === 'correct').length;
    return {
      typeIndex: b.typeIndex,
      typeName: b.typeName,
      correct,
      total: rs.length,
      ratio: rs.length ? correct / rs.length : 0,
    };
  });

  const raw = byQuestion.filter((r) => r.verdict === 'correct').length;
  const total = test.totalQuestions;
  const percent = total ? raw / total : 0;
  return { raw, total, percent, band: bandFromPercent(percent), byQuestion, byType };
}
