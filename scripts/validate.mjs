#!/usr/bin/env node
/**
 * scripts/validate.mjs — chạy parser trên MỌI file trong test/ và kiểm
 * bảng bất biến ở docs/canonical-format.md §8.
 *
 * Hai loại kết quả tách bạch:
 *   LỖI  — vi phạm thật, exit 1
 *   NỢ   — hạng mục backfill nội dung còn thiếu (C3). Liệt kê, không chặn,
 *          trừ khi chạy với --strict.
 *
 * Không nêu con số nào về số file / số câu / số dạng — mọi thứ suy từ file
 * (canonical-format §7 luật 1).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DIR = path.join(ROOT, 'test');
const CONFIG_DIAG = path.join(ROOT, 'config', 'diagnostics-default.md');
const STRICT = process.argv.includes('--strict');

/* Nạp parser TypeScript bằng chính Vite — cùng một module resolution với app,
   nên validate không thể "đúng" trong khi app lại vỡ. */
const vite = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
const { parseTest, parseDiagnostics, coversExactly } = await vite.ssrLoadModule('/src/parser/index.ts');

/* ------------------------------------------------------------------ */
const errors = [];
const debts = [];
const files = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith('.md')).sort();

if (!files.length) {
  console.error('test/ không có file .md nào.');
  process.exit(1);
}

/* Bảng chẩn đoán dùng chung */
let defaultDiags = [];
if (fs.existsSync(CONFIG_DIAG)) {
  defaultDiags = parseDiagnostics(fs.readFileSync(CONFIG_DIAG, 'utf8').split('\n'));
  if (!defaultDiags.length) errors.push(['config/diagnostics-default.md', 'không parse ra dòng chẩn đoán nào']);
} else {
  debts.push(['config/diagnostics-default.md', 'chưa tạo (canonical-format §N26)']);
}

const slugs = new Map();
const ids = new Map();
const rows = [];

for (const name of files) {
  const raw = fs.readFileSync(path.join(TEST_DIR, name), 'utf8');
  const lines = raw.split('\n');
  const t = parseTest(raw, name);
  const err = (m) => errors.push([name, m]);
  const debt = (m) => debts.push([name, m]);

  /* --- cảnh báo từ chính parser --------------------------------- */
  for (const w of t.parseWarnings) {
    // "thiếu Chiến thuật / instruction" là nợ C3, không phải lỗi format
    if (/thiếu khối `> \*\*Chiến thuật\*\*`|thiếu dòng instruction/.test(w)) debt(w);
    else err(w);
  }

  /* --- frontmatter ---------------------------------------------- */
  const fm = t.frontmatter;
  if (!fm) err('không có frontmatter');
  else {
    if (!Number.isInteger(fm.workbook_id) || fm.workbook_id < 1) err('workbook_id phải là số nguyên ≥ 1');
    if (ids.has(fm.workbook_id)) err(`workbook_id ${fm.workbook_id} trùng với ${ids.get(fm.workbook_id)}`);
    ids.set(fm.workbook_id, name);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.topic_slug)) err(`topic_slug "${fm.topic_slug}" không phải kebab-case`);
    if (slugs.has(fm.topic_slug)) err(`topic_slug "${fm.topic_slug}" trùng với ${slugs.get(fm.topic_slug)}`);
    slugs.set(fm.topic_slug, name);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.created)) err(`created "${fm.created}" không đúng YYYY-MM-DD`);
    if (fm.passage_language !== 'en') err(`passage_language = "${fm.passage_language}"`);

    // passage_word_count: sai lệch ≤2% VÀ trong 850–1050
    const words = t.paragraphs.map((p) => p.text).join(' ').split(/\s+/).filter(Boolean).length;
    const drift = Math.abs(fm.passage_word_count - words) / Math.max(1, words);
    if (drift > 0.02) err(`passage_word_count=${fm.passage_word_count} lệch ${(drift * 100).toFixed(1)}% so với ${words} từ đếm thật`);
    if (fm.passage_word_count < 850 || fm.passage_word_count > 1050) {
      err(`passage_word_count=${fm.passage_word_count} ngoài khoảng 850–1050`);
    }
  }

  /* --- H1 === title (lệch một ký tự là FAIL) --------------------- */
  const h1 = (lines.find((l) => /^# /.test(l)) ?? '').replace(/^#\s+/, '').trim();
  if (fm && h1 !== fm.title) err(`H1 "${h1}" ≠ frontmatter.title "${fm.title}"`);

  /* --- cấu trúc ------------------------------------------------- */
  if (t.paragraphs.length < 2) err(`chỉ parse ra ${t.paragraphs.length} đoạn passage`);
  const labels = t.paragraphs.map((p) => p.label).join('');
  const expect = t.paragraphs.map((_, i) => String.fromCharCode(65 + i)).join('');
  if (labels !== expect) err(`nhãn đoạn không liên tục A..: "${labels}"`);

  const idx = t.blocks.map((b) => b.typeIndex);
  if (idx.some((v, i) => v !== i + 1)) err(`typeIndex các khối không liên tục 1..n: ${idx.join(',')}`);
  if (t.blocks.some((b) => b.kind === 'unknown')) err('có khối kind = unknown');

  /* tên dạng khu đáp án trùng khít khu câu hỏi (N25) */
  const qNames = new Map();
  const aNames = new Map();
  let region = '';
  for (const l of lines) {
    if (/^#\s+PHẦN/.test(l)) region = 'q';
    else if (/^#\s.*ĐÁP\s*ÁN/.test(l)) region = 'a';
    else if (/^#\s/.test(l) && region === 'a') region = '';
    const m = l.match(/^##\s+Dạng\s+(\d+)\s*[–—-]\s*(.+?)(?:\s+\(Questions[^)]*\))?\s*$/);
    if (!m) continue;
    if (region === 'q') qNames.set(m[1], m[2].trim());
    if (region === 'a') aNames.set(m[1], m[2].trim());
  }
  for (const [k, v] of qNames) {
    if (aNames.has(k) && aNames.get(k) !== v) err(`Dạng ${k}: tên khu đáp án "${aNames.get(k)}" ≠ khu câu hỏi "${v}"`);
  }

  /* --- các bất biến hình thức ------------------------------------ */
  const dbl = lines.filter((l, i) => l === '---' && lines[i + 1] === '---').length;
  if (dbl) err(`còn ${dbl} chỗ hai dòng "---" liên tiếp (N39)`);

  const optLabel = lines.filter((l) => /^\*\*List of /.test(l)).length;
  if (optLabel) err(`còn ${optLabel} dòng optionsLabel (N07)`);

  for (const l of lines) {
    if (/^# BẢNG /.test(l) && !/^# BẢNG (TỰ CHẨN ĐOÁN|SO SÁNH)$/.test(l)) {
      err(`heading cuối file không đúng tên cố định: "${l}" (N26)`);
    }
  }

  /* gạch dưới trong vùng câu hỏi luôn đúng 6; ngoài vùng đó không có `_{3,}` */
  {
    let qa = -1, qb = -1;
    lines.forEach((l, i) => {
      if (qa < 0 && /^#\s+PHẦN/.test(l)) qa = i;
      if (qb < 0 && /^#\s.*ĐÁP\s*ÁN/.test(l)) qb = i;
    });
    lines.forEach((l, i) => {
      const runs = l.match(/_{3,}/g) ?? [];
      if (!runs.length) return;
      if (i >= qa && i < qb) {
        if (runs.some((r) => r.length !== 6)) err(`dòng ${i + 1}: dãy gạch dưới ≠ 6 ký tự (N13)`);
      } else {
        err(`dòng ${i + 1}: có "_{3,}" ngoài vùng câu hỏi (N-B)`);
      }
    });
  }

  /* bảng đáp án luôn 3 cột */
  {
    let inA = false;
    lines.forEach((l, i) => {
      if (/^#\s.*ĐÁP\s*ÁN/.test(l)) inA = true;
      else if (/^#\s/.test(l)) inA = false;
      if (!inA) return;
      if (/^\|/.test(l) && /^\|(\s*:?-{2,}:?\s*\|)+$/.test(lines[i + 1] ?? '')) {
        const w = l.trim().slice(1, -1).split('|').length;
        if (w !== 3) err(`dòng ${i + 1}: bảng đáp án ${w} cột, phải 3 (N16)`);
      }
    });
  }

  /* Code fence (canonical-format §6, #14 KEEP).
   *
   * CỐ Ý KHÔNG kiểm căn cột ở đây. Đã thử hai bản và cả hai đều báo nhầm
   * trên sơ đồ hợp lệ: bản 1 coi đường nối dọc giữa hai hộp (`      │`) là
   * viền lệch; bản 2 vấp tiếp ở nhánh `┌───┴───┐` và hai hộp nằm cạnh nhau
   * trên cùng một dòng. Sơ đồ vẽ tay có quá nhiều hình dạng hợp lệ để kiểm
   * bằng hình học — mà #14 vốn là KEEP: "giữ raw, render <pre>, không dựng
   * lại layout".
   *
   * Bất biến thật sự cần bảo vệ là "sửa trong fence phải giữ nguyên số ký tự
   * của dòng", và nó đã được **assert cứng ngay trong scripts/normalize.mjs**
   * — nơi duy nhất có code sửa fence. Canh ở chỗ sửa đúng hơn canh ở đây.
   *
   * Chỗ này chỉ kiểm hai thứ máy phán được chắc chắn. */
  {
    let fence = false;
    let buf = [];
    let opened = 0;
    lines.forEach((l, i) => {
      if (/^```/.test(l)) {
        if (fence) {
          // blank số trần trong fence phải nằm trong range của khối nào đó
          for (const s of buf) {
            for (const mm of s.matchAll(/(\d+)\s+_{3,}/g)) {
              const n = Number(mm[1]);
              if (!t.blocks.some((b) => n >= b.range[0] && n <= b.range[1])) {
                err(`code fence: "${n} ______" không nằm trong dải câu của khối nào`);
              }
            }
            if (/\*\*\d+\*\*\s+_{3,}/.test(s)) {
              err(`code fence dòng ${i}: chỗ trống trong fence phải là số TRẦN, không in đậm (§3.3)`);
            }
          }
          buf = [];
        } else opened++;
        fence = !fence;
        return;
      }
      if (fence) buf.push(l);
    });
    if (fence) err('code fence mở mà không đóng');
    if (opened === 0 && t.blocks.some((b) => b.kind === 'gap-flow' || b.kind === 'gap-diagram')) {
      err('có khối gap-flow/gap-diagram nhưng không tìm thấy code fence nào');
    }
  }

  /* --- nợ nội dung (C3) ------------------------------------------ */
  const noStrategy = t.blocks.filter((b) => !b.strategy).map((b) => b.typeIndex);
  const noInstr = t.blocks.filter((b) => !b.instruction).map((b) => b.typeIndex);
  const REQUIRE_EXPLAIN = new Set(['matching-headings', 'tfng', 'ynng', 'mcq-single', 'mcq-multi']);
  const missingExplain = [];
  for (const b of t.blocks) {
    if (!REQUIRE_EXPLAIN.has(b.kind)) continue;
    for (let n = b.range[0]; n <= b.range[1]; n++) {
      if (!t.answers[n]?.explanation) missingExplain.push(n);
    }
  }
  if (missingExplain.length) debt(`ô "Giải thích" bắt buộc còn trống ở câu: ${compact(missingExplain)}`);

  /* --- đáp án chính thức phải nằm trong wordLimit của chính khối nó ---
     Mâu thuẫn nội tại: đề tự ra một đáp án mà chính đề chấm là sai.
     Đã bắt được một ca thật (W5 D11 câu 62, nhan đề 4 từ / limit 3 từ). */
  {
    const words = (s) =>
      s.trim().toLowerCase().replace(/[‐-―−]/g, '-').replace(/\s+/g, ' ')
        .split(/[\s-]+/).filter(Boolean).length;
    for (const b of t.blocks) {
      const limit = b.wordLimitCount;
      if (!limit) continue;
      for (let n = b.range[0]; n <= b.range[1]; n++) {
        const k = t.answers[n];
        if (!k) continue;
        if (!k.accepted.some((a) => words(a) <= limit)) {
          err(`Dạng ${b.typeIndex} câu ${n}: đáp án "${k.display}" vượt wordLimit ${limit} từ của chính khối`);
        }
      }
    }
  }

  /* --- chẩn đoán -------------------------------------------------- */
  let diagSource = t.diagnosticsSource;
  if (diagSource === 'none' && defaultDiags.length) {
    diagSource = coversExactly(defaultDiags, t.totalQuestions) ? 'default' : 'none';
  }
  if (t.diagnosticsSource === 'file' && !coversExactly(t.diagnostics, t.totalQuestions)) {
    err('bảng chẩn đoán trong file không phủ khít 1..' + t.totalQuestions);
  }

  rows.push({
    name,
    id: t.id,
    wb: fm?.workbook_id ?? '?',
    paras: t.paragraphs.length,
    blocks: t.blocks.length,
    q: t.totalQuestions,
    a: Object.keys(t.answers).length,
    strat: `${t.blocks.length - noStrategy.length}/${t.blocks.length}`,
    instr: `${t.blocks.length - noInstr.length}/${t.blocks.length}`,
    notes: t.blocks.filter((b) => b.blockNote).length,
    diag: diagSource,
    vocab: t.extras.vocabulary ? '✓' : '—',
    para: t.extras.paraphrases ? '✓' : '—',
  });
}

function compact(ns) {
  const out = [];
  let a = ns[0], b = ns[0];
  for (const n of ns.slice(1)) {
    if (n === b + 1) { b = n; continue; }
    out.push(a === b ? `${a}` : `${a}–${b}`);
    a = b = n;
  }
  out.push(a === b ? `${a}` : `${a}–${b}`);
  return out.join(', ');
}

/* ------------------------------------------------------------------ */
const pad = (s, n) => String(s).padEnd(n);
console.log('\n=== validate — ' + files.length + ' file trong test/ ===\n');
console.log(
  '  ' + pad('id', 28) + pad('wb', 4) + pad('đoạn', 6) + pad('khối', 6) +
  pad('câu', 5) + pad('đ.án', 6) + pad('strategy', 10) + pad('instr', 8) +
  pad('note', 6) + pad('chẩn đoán', 11) + pad('vocab', 7) + 'paraphrase'
);
console.log('  ' + '-'.repeat(104));
for (const r of rows) {
  console.log(
    '  ' + pad(r.id, 28) + pad(r.wb, 4) + pad(r.paras, 6) + pad(r.blocks, 6) +
    pad(r.q, 5) + pad(r.a, 6) + pad(r.strat, 10) + pad(r.instr, 8) +
    pad(r.notes, 6) + pad(r.diag, 11) + pad(r.vocab, 7) + r.para
  );
}

if (debts.length) {
  console.log(`\n  NỢ NỘI DUNG (C3) — ${debts.length} mục, không chặn:\n  ` + '-'.repeat(70));
  const byFile = {};
  for (const [f, m] of debts) (byFile[f] ??= []).push(m);
  for (const [f, ms] of Object.entries(byFile)) {
    console.log(`  ${f}`);
    for (const m of ms) console.log(`     · ${m}`);
  }
}

if (errors.length) {
  console.error(`\n  LỖI — ${errors.length}:\n  ` + '-'.repeat(70));
  const byFile = {};
  for (const [f, m] of errors) (byFile[f] ??= []).push(m);
  for (const [f, ms] of Object.entries(byFile)) {
    console.error(`  ${f}`);
    for (const m of ms.slice(0, 40)) console.error(`     ✗ ${m}`);
    if (ms.length > 40) console.error(`     … và ${ms.length - 40} lỗi nữa`);
  }
  console.error('');
  await vite.close();
  process.exit(1);
}

console.log(`\n  ✓ Không lỗi format.${debts.length ? `  (còn ${debts.length} mục nợ nội dung)` : ''}\n`);
await vite.close();
process.exit(STRICT && debts.length ? 1 : 0);
