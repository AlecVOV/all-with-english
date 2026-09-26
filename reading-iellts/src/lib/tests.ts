/**
 * Nạp đề từ thư mục test/.
 *
 * Vite tự quét thư mục, nên **thả một file .md mới vào test/ rồi refresh là
 * có thêm đề** — không manifest, không hardcode tên file (CLAUDE.md §3).
 */

import { parseTest, parseDiagnostics, coversExactly } from '../parser';
import type { Diagnostic, DiagnosticsSource, ParsedTest } from '../parser/types';

export interface LoadedTest extends Omit<ParsedTest, 'diagnosticsSource'> {
  diagnosticsSource: DiagnosticsSource;
}

const files = import.meta.glob('/test/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const defaultDiagRaw = import.meta.glob('/config/diagnostics-default.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Bảng chẩn đoán dùng chung, parse đúng một lần (canonical-format §N26). */
const defaultDiagnostics: Diagnostic[] = (() => {
  const raw = Object.values(defaultDiagRaw)[0];
  return raw ? parseDiagnostics(raw.split('\n')) : [];
})();

function resolveDiagnostics(t: ParsedTest): { diagnostics: Diagnostic[]; source: DiagnosticsSource } {
  if (t.diagnosticsSource === 'file' && t.diagnostics.length) {
    return { diagnostics: t.diagnostics, source: 'file' };
  }
  // Chỉ thay bằng bảng mặc định khi dải câu phủ khít 1..total — đề có cấu
  // trúc khác sẽ KHÔNG bị gán nhầm lời khuyên của cấu trúc cũ.
  if (defaultDiagnostics.length && coversExactly(defaultDiagnostics, t.totalQuestions)) {
    return { diagnostics: defaultDiagnostics, source: 'default' };
  }
  return { diagnostics: [], source: 'none' };
}

export const tests: LoadedTest[] = Object.entries(files)
  .map(([path, raw]) => {
    const name = path.split('/').pop() ?? path;
    const parsed = parseTest(raw, name);
    const { diagnostics, source } = resolveDiagnostics(parsed);
    return { ...parsed, diagnostics, diagnosticsSource: source };
  })
  // workbook_id là khoá sắp xếp; thiếu frontmatter thì lùi về tên file
  .sort((a, b) => {
    const wa = a.frontmatter?.workbook_id ?? Number.MAX_SAFE_INTEGER;
    const wb = b.frontmatter?.workbook_id ?? Number.MAX_SAFE_INTEGER;
    return wa !== wb ? wa - wb : a.sourceFile.localeCompare(b.sourceFile);
  });

export function findTest(id: string): LoadedTest | undefined {
  return tests.find((t) => t.id === id);
}
