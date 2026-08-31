/**
 * Parse `# BẢNG TỰ CHẨN ĐOÁN` (CLAUDE.md §4.7).
 *
 * Cùng một hàm phục vụ hai nguồn (canonical-format §N26):
 *   - bảng riêng nằm trong file đề (override)
 *   - config/diagnostics-default.md (dùng chung)
 *
 * Vắng mục này ⇒ trả `[]`, không báo lỗi.
 */

import type { Diagnostic } from './types';

/** `Sai ≥ 30%` → 0.3. Không bắt được thì mặc định 0.3. */
export function parseThreshold(header: string): number {
  const m = header.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!m) return 0.3;
  return Number(m[1]!.replace(',', '.')) / 100;
}

export function parseDiagnostics(lines: string[]): Diagnostic[] {
  const rows = lines.map((l) => l.trim()).filter((l) => /^\|/.test(l));
  if (!rows.length) return [];

  const cellsOf = (l: string): string[] => l.slice(1, -1).split('|').map((c) => c.trim());
  const headerRow = rows[0] ?? '';
  const threshold = parseThreshold(cellsOf(headerRow).slice(-1)[0] ?? '');

  const out: Diagnostic[] = [];
  for (const row of rows.slice(1)) {
    if (/^\|(\s*:?-{2,}:?\s*\|)+$/.test(row)) continue;
    const cells = cellsOf(row);
    if (cells.length < 3) continue;
    const label = cells[0] ?? '';
    // dải câu nằm trong ngoặc ở cột đầu: `Headings + Matching Info (1–14)`
    const r = label.match(/\((\d+)\s*[–—-]\s*(\d+)\)/);
    if (!r) continue;
    const count = Number(cells[1]);
    out.push({
      label: label.replace(/\s*\(\d+\s*[–—-]\s*\d+\)\s*$/, '').trim(),
      range: [Number(r[1]), Number(r[2])],
      count: Number.isFinite(count) ? count : Number(r[2]) - Number(r[1]) + 1,
      threshold,
      advice: cells.slice(2).join(' · '),
    });
  }
  return out;
}

/** Dải của bảng có phủ khít `1..total` không (§N26 bước 3). */
export function coversExactly(diags: Diagnostic[], total: number): boolean {
  if (!diags.length) return false;
  const sorted = [...diags].sort((a, b) => a.range[0] - b.range[0]);
  if (sorted[0]!.range[0] !== 1) return false;
  if (sorted[sorted.length - 1]!.range[1] !== total) return false;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.range[0] !== sorted[i - 1]!.range[1] + 1) return false;
  }
  return true;
}
