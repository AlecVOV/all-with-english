/** Chẩn đoán tự động từ bảng Diagnostic (CLAUDE.md §6.3.3). */

import type { Diagnostic } from '../parser/types';
import type { QuestionResult } from './grading';

export interface DiagnosisRow {
  diagnostic: Diagnostic;
  wrong: number;
  total: number;
  ratio: number;
  triggered: boolean;
}

export function diagnose(diagnostics: Diagnostic[], results: QuestionResult[]): DiagnosisRow[] {
  return diagnostics.map((d) => {
    const inRange = results.filter((r) => r.qno >= d.range[0] && r.qno <= d.range[1]);
    const wrong = inRange.filter((r) => r.verdict !== 'correct').length;
    const total = inRange.length || d.count;
    const ratio = total ? wrong / total : 0;
    return { diagnostic: d, wrong, total, ratio, triggered: ratio >= d.threshold };
  });
}
