#!/usr/bin/env node
/**
 * scripts/backfill-instructions.mjs — N05, phần máy móc của C3.
 *
 * Thêm dòng instruction còn thiếu ở D3 / D4 / D14. Nội dung là chuỗi canonical
 * cố định của docs/canonical-format.md §3.1, không phải văn tự chế:
 *
 *   tfng        *Do the following statements agree with the information given in the passage?*
 *   ynng        *Do the following statements agree with the claims of the writer?*
 *   mcq-single  *Choose the correct letter, **A**, **B**, **C** or **D**.*
 *
 * Chèn ngay trên dòng đầu tiên của thân khối (dòng options cố định
 * `**TRUE** / **FALSE** / **NOT GIVEN**` với D3/D4, hoặc item `**75.**` với D14),
 * và luôn cách một dòng trống — đúng bố cục ở §3.
 *
 * Chỉ chèn khi khối THẬT SỰ thiếu; chạy lại nhiều lần không sinh trùng.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DIR = path.join(ROOT, 'test');
const DRY = process.argv.includes('--dry-run');

/** kind → instruction canonical. Khoá theo TÊN DẠNG, không theo số thứ tự. */
const CANONICAL = [
  { needle: 'True / False / Not Given', line: '*Do the following statements agree with the information given in the passage?*' },
  { needle: 'Yes / No / Not Given', line: '*Do the following statements agree with the claims of the writer?*' },
  { needle: 'Multiple Choice, one answer', line: '*Choose the correct letter, **A**, **B**, **C** or **D**.*' },
];

let total = 0;
for (const name of fs.readdirSync(TEST_DIR).filter((f) => f.endsWith('.md')).sort()) {
  const file = path.join(TEST_DIR, name);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const added = [];

  for (let i = lines.length - 1; i >= 0; i--) {
    const head = (lines[i] ?? '').match(/^##\s+Dạng\s+(\d+)\s*[–—-]\s*(.+?)\s*\(Questions/);
    if (!head) continue;
    const rule = CANONICAL.find((c) => head[2].includes(c.needle));
    if (!rule) continue;

    // quét thân khối tới heading kế tiếp
    let end = i + 1;
    while (end < lines.length && !/^##?\s/.test(lines[end] ?? '')) end++;
    const body = lines.slice(i + 1, end);

    // đã có instruction (dòng in nghiêng ngoài blockquote) → bỏ qua
    const hasInstr = body.some((l) => /^\*[^*].*\*$/.test(l.trim()) && !/^>/.test(l));
    if (hasInstr) continue;

    // điểm chèn: dòng nội dung đầu tiên sau khối chiến thuật
    let k = i + 1;
    while (k < end && (lines[k] ?? '').trim() === '') k++;
    while (k < end && /^>/.test(lines[k] ?? '')) k++;
    while (k < end && (lines[k] ?? '').trim() === '') k++;

    lines.splice(k, 0, rule.line, '');
    added.push(`Dạng ${head[1]} (${head[2]}) → ${rule.line}`);
  }

  if (added.length) {
    if (!DRY) fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log(`\n  ${name}`);
    for (const a of added.reverse()) console.log(`     + ${a}`);
    total += added.length;
  }
}
console.log(`\n  N05 — đã thêm ${total} dòng instruction.${DRY ? ' (DRY RUN)' : ''}\n`);
