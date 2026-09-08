#!/usr/bin/env node
/**
 * scripts/make-prompt.mjs — sinh file prompt sẵn-dùng từ prompts/workbook-generator.md.
 *
 * Vì sao cần script này: khối prompt nằm giữa `=== BEGIN PROMPT ===` và
 * `=== END PROMPT ===` trong spec. Copy tay ra file READY-* rồi sau đó sửa spec
 * là các file READY-* thành **bản cũ nằm lại** — đã cắn thật một lần: workbook #6
 * được sinh bằng bản prompt thiếu hẳn đặc tả frontmatter, ra 74 lỗi validate.
 *
 * Chạy:
 *   node scripts/make-prompt.mjs --id 7 --topic "the life of Atiśa"
 *   node scripts/make-prompt.mjs --refresh        # sinh lại MỌI file READY-* đang có,
 *                                                 # giữ nguyên TOPIC/ID/L1 của từng file
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = path.join(ROOT, 'prompts', 'workbook-generator.md');
const PROMPTS = path.join(ROOT, 'prompts');
const TEST_DIR = path.join(ROOT, 'test');

const argv = process.argv.slice(2);
const arg = (k) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const REFRESH = argv.includes('--refresh');

/* ------------------------------------------------------------------ *
 * Bóc khối prompt ra khỏi spec
 * ------------------------------------------------------------------ */
function promptBlock() {
  const lines = fs.readFileSync(SPEC, 'utf8').split('\n');
  const a = lines.findIndex((l) => l.trim() === '=== BEGIN PROMPT ===');
  const b = lines.findIndex((l) => l.trim() === '=== END PROMPT ===');
  if (a < 0 || b < 0 || b < a) {
    throw new Error('không tìm thấy cặp === BEGIN PROMPT === / === END PROMPT === trong spec');
  }
  return lines.slice(a, b + 1).join('\n');
}

/* Phiên bản spec, in vào file READY để biết nó có cũ hay không. */
function specVersion() {
  const m = fs.readFileSync(SPEC, 'utf8').match(/^# IELTS Reading Workbook Generator — Prompt Spec (v[\d.]+)/m);
  return m ? m[1] : 'v?';
}

/* ------------------------------------------------------------------ *
 * Những gì đã dùng rồi — cảnh báo trùng trước khi sinh, không phải sau
 * ------------------------------------------------------------------ */
function taken() {
  const ids = new Map();
  const slugs = new Map();
  if (!fs.existsSync(TEST_DIR)) return { ids, slugs };
  for (const f of fs.readdirSync(TEST_DIR).filter((x) => x.endsWith('.md'))) {
    const raw = fs.readFileSync(path.join(TEST_DIR, f), 'utf8');
    const id = raw.match(/^workbook_id:\s*(\d+)\s*$/m)?.[1];
    const slug = raw.match(/^topic_slug:\s*(.+?)\s*$/m)?.[1];
    if (id) ids.set(Number(id), f);
    if (slug) slugs.set(slug.replace(/^["']|["']$/g, ''), f);
  }
  return { ids, slugs };
}

function build(id, topic, l1) {
  const block = promptBlock()
    .replaceAll('{{TOPIC}}', topic)
    .replaceAll('{{WORKBOOK_ID}}', String(id))
    .replaceAll('{{L1}}', l1);
  const left = block.match(/\{\{[^}]*\}\}/g);
  if (left) throw new Error(`còn biến chưa thay: ${[...new Set(left)].join(', ')}`);

  const header =
    `<!-- Sinh bởi scripts/make-prompt.mjs từ prompts/workbook-generator.md ${specVersion()}\n` +
    `     KHÔNG sửa tay file này. Spec đổi thì chạy: node scripts/make-prompt.mjs --refresh -->\n\n`;

  const out = path.join(PROMPTS, `READY-workbook-${String(id).padStart(2, '0')}.md`);
  fs.writeFileSync(out, header + block + '\n', 'utf8');
  return { out, lines: block.split('\n').length };
}

/* ------------------------------------------------------------------ *
 * Chạy
 * ------------------------------------------------------------------ */
const jobs = [];

if (REFRESH) {
  for (const f of fs.readdirSync(PROMPTS).filter((x) => /^READY-workbook-\d+\.md$/.test(x)).sort()) {
    const raw = fs.readFileSync(path.join(PROMPTS, f), 'utf8');
    const topic = raw.match(/^TOPIC\s*=\s*(.+)$/m)?.[1]?.trim();
    const id = raw.match(/^WORKBOOK_ID\s*=\s*(\d+)$/m)?.[1];
    const l1 = raw.match(/^L1\s*=\s*(.+)$/m)?.[1]?.trim();
    if (!topic || !id || !l1) {
      console.error(`  bỏ qua ${f}: không đọc được TOPIC / WORKBOOK_ID / L1`);
      continue;
    }
    jobs.push({ id: Number(id), topic, l1 });
  }
  if (!jobs.length) {
    console.error('Không có file READY-workbook-*.md nào để sinh lại.');
    process.exit(1);
  }
} else {
  const id = Number(arg('id'));
  const topic = arg('topic');
  const l1 = arg('l1') ?? 'Vietnamese';
  if (!Number.isInteger(id) || id < 1 || !topic) {
    console.error('Dùng: node scripts/make-prompt.mjs --id <số> --topic "<chủ đề>" [--l1 Vietnamese]');
    console.error('      node scripts/make-prompt.mjs --refresh');
    process.exit(1);
  }
  jobs.push({ id, topic, l1 });
}

const { ids, slugs } = taken();
console.log(`\nSpec: ${specVersion()}\n`);

for (const j of jobs) {
  const { out, lines } = build(j.id, j.topic, j.l1);
  console.log(`  ✓ ${path.relative(ROOT, out)}  (${lines} dòng)`);
  console.log(`      TOPIC = ${j.topic}`);
  if (ids.has(j.id)) {
    console.log(`      ⚠ workbook_id ${j.id} ĐÃ DÙNG ở ${ids.get(j.id)} — đổi --id trước khi sinh đề`);
  }
}

if (slugs.size) {
  console.log(`\n  topic_slug đã dùng: ${[...slugs.keys()].join(', ')}`);
  console.log('  (model tự đặt slug từ TOPIC — trùng thì validate chặn)');
}
console.log('');
