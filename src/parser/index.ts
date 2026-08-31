/**
 * parseTest — hàm thuần: nhận string, trả ParsedTest.
 * Không đụng DOM, không đọc file (CLAUDE.md §8).
 */

import { parseAnswers } from './answers';
import { parseDiagnostics } from './diagnostics';
import { parseQuestionBlocks } from './questions';
import { parseParagraphs, splitSections } from './sections';
import type { ParsedTest } from './types';

export * from './types';
export { parseDiagnostics, coversExactly } from './diagnostics';
export { kindFromTypeName, extractWordLimit, toSegments } from './questions';
export { parseAnswerCell, expandOptionalParens } from './answers';

export function parseTest(raw: string, filename: string): ParsedTest {
  const parseWarnings: string[] = [];
  const warn = (s: string): void => {
    parseWarnings.push(s);
  };

  const sec = splitSections(raw);
  sec.frontmatterWarnings.forEach(warn);

  const paragraphs = parseParagraphs(sec.passageLines);
  const blocks = parseQuestionBlocks(sec.questionLines, warn);
  const { answers, blockNotes } = parseAnswers(sec.answerLines, warn);
  for (const b of blocks) {
    const note = blockNotes[b.typeIndex];
    if (note) b.blockNote = note;
  }

  const diagnostics = parseDiagnostics(sec.diagnosticsLines);

  /* ---- Bất biến CLAUDE.md §4.8 ------------------------------------- */
  const nums = new Set<number>();
  let maxQ = 0;
  for (const b of blocks) {
    for (let n = b.range[0]; n <= b.range[1]; n++) {
      if (nums.has(n)) warn(`câu ${n} xuất hiện ở nhiều khối`);
      nums.add(n);
      maxQ = Math.max(maxQ, n);
    }
  }
  for (let n = 1; n <= maxQ; n++) {
    if (!nums.has(n)) warn(`không khối nào phủ câu ${n}`);
    if (!answers[n]) warn(`câu ${n} không có đáp án`);
  }
  for (const key of Object.keys(answers)) {
    const n = Number(key);
    if (!nums.has(n)) warn(`có đáp án cho câu ${n} nhưng không khối nào hỏi câu đó`);
  }

  const fm = sec.frontmatter;
  if (fm) {
    if (sec.h1 && fm.title && sec.h1 !== fm.title) {
      warn(`H1 "${sec.h1}" không trùng khít frontmatter.title "${fm.title}" (N33)`);
    }
    if (fm.question_count && fm.question_count !== maxQ) {
      warn(`frontmatter.question_count=${fm.question_count} nhưng parse ra ${maxQ} câu`);
    }
    if (fm.question_types.length) {
      const kinds = blocks.map((b) => b.kind);
      if (fm.question_types.join(',') !== kinds.join(',')) {
        warn(`frontmatter.question_types không khớp kind của các khối`);
      }
    }
  }

  const id = fm?.topic_slug || filename.replace(/\.md$/, '');
  const title = fm?.title || sec.h1 || id;

  return {
    id,
    title,
    passageTitle: sec.passageTitle,
    ...(sec.intro ? { intro: sec.intro } : {}),
    paragraphs,
    blocks,
    answers,
    diagnostics,
    diagnosticsSource: diagnostics.length ? 'file' : 'none',
    extras: {
      ...(sec.vocabulary ? { vocabulary: sec.vocabulary } : {}),
      ...(sec.paraphrases ? { paraphrases: sec.paraphrases } : {}),
      ...(sec.comparison ? { comparison: sec.comparison } : {}),
    },
    totalQuestions: maxQ,
    parseWarnings,
    ...(fm ? { frontmatter: fm } : {}),
    sourceFile: filename,
  };
}
