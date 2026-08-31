/**
 * Parse khu `# ĐÁP ÁN & GIẢI THÍCH`.
 *
 * Sau N16 bảng luôn 3 cột `| Q | Đ.án | Giải thích |`, nhưng vẫn gộp mọi cột
 * từ thứ 3 trở đi thành `explanation` — không giả định số cột cố định
 * (CLAUDE.md §4.5), để file cũ chưa chuẩn hoá vẫn đọc được.
 *
 * Hình dạng ô đáp án sau chuẩn hoá còn đúng 3 kiểu (canonical-format §8):
 *   `**X**`  ·  `**X** nhãn`  ·  `**X** và **Y**`
 * mỗi kiểu có thể kèm `(chấp nhận *Z*)`.
 */

import type { AnswerKey } from './types';

/** Bung ngoặc tuỳ chọn: `(the) Red River delta` → cả có lẫn không (#20 KEEP). */
export function expandOptionalParens(s: string): string[] {
  const m = s.match(/\(([^()]+)\)/);
  if (!m) return [s];
  const before = s.slice(0, m.index);
  const after = s.slice(m.index! + m[0].length);
  const withIt = expandOptionalParens(`${before}${m[1]}${after}`);
  const without = expandOptionalParens(`${before}${after}`);
  return [...new Set([...withIt, ...without].map((x) => x.replace(/\s+/g, ' ').trim()))];
}

const stripEmphasis = (s: string): string => s.replace(/\*\*/g, '').replace(/\*/g, '').trim();

/**
 * Bóc một ô đáp án (cột 2) thành danh sách chuỗi được chấp nhận.
 * Ví dụ thật:
 *   `**Luy Lâu**`                         → ["Luy Lâu"]
 *   `**C** founded`                       → ["C", "founded", "C founded"]
 *   `**two hundred** (chấp nhận *200*)`   → ["two hundred", "200"]
 *   `**(at) Dunhuang** (chấp nhận *a sealed chamber*)`
 *                                         → ["at Dunhuang", "Dunhuang", "a sealed chamber"]
 *   `**A** và **C**`                      → ["A", "C"]  (tập, không xét thứ tự)
 */
export function parseAnswerCell(cell: string): { accepted: string[]; display: string } {
  const display = cell.trim();
  const accepted: string[] = [];

  // (1) biến thể chấp nhận thêm — sau N18 luôn nằm trong ngoặc
  let core = display;
  const acceptRe = /\(\s*chấp nhận\s+([^)]+)\)/i;
  const acc = core.match(acceptRe);
  if (acc) {
    core = core.replace(acceptRe, '').trim();
    for (const alt of acc[1]!.split(/[,/]/)) {
      const v = stripEmphasis(alt);
      if (v) accepted.push(...expandOptionalParens(v));
    }
  }

  const bolds = [...core.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]!.trim());

  // (2) `**A** và **C**` — hai đáp án, không xét thứ tự
  if (bolds.length > 1) {
    for (const b of bolds) accepted.push(...expandOptionalParens(b));
    return { accepted: dedupe(accepted), display };
  }

  // (3) `**C** founded` — chữ cái để chấm + nhãn để hiển thị (#23 KEEP)
  if (bolds.length === 1) {
    const label = stripEmphasis(core.replace(/\*\*[^*]+\*\*/, '')).trim();
    accepted.push(...expandOptionalParens(bolds[0]!));
    if (label) {
      accepted.push(...expandOptionalParens(label));
      accepted.push(...expandOptionalParens(`${bolds[0]} ${label}`));
    }
    return { accepted: dedupe(accepted), display };
  }

  // (4) không in đậm — vẫn nhận nguyên văn
  const plain = stripEmphasis(core);
  if (plain) accepted.push(...expandOptionalParens(plain));
  return { accepted: dedupe(accepted), display };
}

const dedupe = (xs: string[]): string[] => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];

export interface AnswerSection {
  answers: Record<number, AnswerKey>;
  /** typeIndex → blockNote (dòng in nghiêng ngoài bảng) */
  blockNotes: Record<number, string>;
}

export function parseAnswers(lines: string[], warn: (s: string) => void): AnswerSection {
  const answers: Record<number, AnswerKey> = {};
  const blockNotes: Record<number, string> = {};
  let typeIndex = 0;

  for (const raw of lines) {
    const line = raw.trim();
    const head = line.match(/^##\s+Dạng\s+(\d+)\s*[–—-]\s*(.+)$/);
    if (head) {
      typeIndex = Number(head[1]);
      continue;
    }

    if (/^\|/.test(line)) {
      if (/^\|(\s*:?-{2,}:?\s*\|)+$/.test(line)) continue;
      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      const qcell = cells[0] ?? '';
      if (!/^\d+(\s*[–—-]\s*\d+)?$/.test(qcell)) continue; // dòng header

      const explanation = cells.slice(2).filter(Boolean).join(' · ') || undefined;
      const { accepted, display } = parseAnswerCell(cells[1] ?? '');

      const rangeM = qcell.match(/^(\d+)\s*[–—-]\s*(\d+)$/);
      if (rangeM) {
        // mcq-multi: hai số câu chia nhau cùng tập đáp án
        const from = Number(rangeM[1]);
        const to = Number(rangeM[2]);
        for (let n = from; n <= to; n++) {
          answers[n] = { qno: n, accepted, display, ...(explanation ? { explanation } : {}) };
        }
      } else {
        const n = Number(qcell);
        answers[n] = { qno: n, accepted, display, ...(explanation ? { explanation } : {}) };
      }
      continue;
    }

    // Sau N17: mọi dòng không phải bảng / rỗng / `---` là blockNote
    if (line === '' || line === '---' || /^#/.test(line)) continue;
    if (typeIndex) {
      const text = line.replace(/^\*|\*$/g, '').trim();
      blockNotes[typeIndex] = blockNotes[typeIndex] ? `${blockNotes[typeIndex]}\n\n${text}` : text;
      if (!/^\*.*\*$/.test(line)) {
        warn(`Dạng ${typeIndex}: blockNote không in nghiêng một dòng (N17): ${line.slice(0, 60)}`);
      }
    }
  }

  return { answers, blockNotes };
}
