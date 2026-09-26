/**
 * Nạp corpus cho bài kiểm đầu-cuối.
 *
 * App nạp đề bằng `import.meta.glob('/test/*.md')`; Playwright chạy ở Node nên
 * đọc thẳng thư mục — vẫn là **quét thư mục lúc chạy**, không manifest, không
 * tên file nào viết cứng (CLAUDE.md §3, §10). Thả thêm một `.md` vào `test/`
 * là bài kiểm này tự có thêm một case.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseTest } from '../../src/parser/index';
import type { AnswerKey, ParsedTest, QuestionBlock } from '../../src/parser/types';
import { countWords, normalize } from '../../src/lib/grading';

const TEST_DIR = path.resolve(process.cwd(), 'test');

export function loadCorpus(): ParsedTest[] {
  const files = fs
    .readdirSync(TEST_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
  if (!files.length) throw new Error(`${TEST_DIR} không có file .md nào để kiểm.`);
  return files.map((f) => parseTest(fs.readFileSync(path.join(TEST_DIR, f), 'utf8'), f));
}

export const same = (a: string, b: string): boolean => normalize(a) === normalize(b);

/**
 * Chuỗi sẽ gõ vào ô nhập: biến thể **ngắn nhất còn nằm trong `wordLimit` của
 * chính khối đó**.
 *
 * Gõ nguyên `display` là sai cách kiểm: `grade()` chấm một câu trả lời đúng
 * nội dung nhưng dài hơn `wordLimit` thành `over-limit` (CLAUDE.md §7) — đúng
 * như thí sinh thật bị trừ. Thí sinh biết luật sẽ viết bản ngắn, nên bài kiểm
 * cũng phải viết bản ngắn; ca thật: W7 câu 66, `wordLimit` 2 từ, đáp án hiển
 * thị 3 từ, biến thể `Nagtso` 1 từ.
 *
 * Không có biến thể nào vừa giới hạn thì vẫn trả về bản ngắn nhất để bài kiểm
 * **fail cho thấy**, chứ không im lặng bỏ câu đó.
 */
export function typedAnswer(key: AnswerKey, block: QuestionBlock | undefined): string {
  const limit = block?.wordLimitCount;
  const fits = limit ? key.accepted.filter((a) => countWords(a) <= limit) : key.accepted;
  const pool = fits.length ? fits : key.accepted;
  return [...pool].sort((a, b) => countWords(a) - countWords(b) || a.length - b.length)[0] ?? '';
}

/** Những biến thể là **một chữ cái lựa chọn** của khối (A, C, vi, TRUE…). */
export function acceptedLetters(key: AnswerKey, letters: string[]): string[] {
  return letters.filter((l) => key.accepted.some((a) => same(a, l)));
}

export const blockOfQuestion = (t: ParsedTest, qno: number): QuestionBlock | undefined =>
  t.blocks.find((b) => qno >= b.range[0] && qno <= b.range[1]);
