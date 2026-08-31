#!/usr/bin/env node
/**
 * scripts/normalize.mjs — áp dụng các mục NORMALIZE của docs/canonical-format.md
 * lên toàn bộ file trong test/.
 *
 * PHẠM VI PASS NÀY (C2 — chuẩn hoá máy móc):
 *   N-A, N03, N04a, N07, N08, N12, N13, N16, N17, N18, N21, N25, N26, N28,
 *   N33, N39, N-B.
 *
 * CỐ Ý KHÔNG LÀM (để dành C3 — viết nội dung):
 *   N02  backfill 43 khối `strategy`
 *   N04b viết lại 5 khối `Nhắc lại` của W3
 *   N05  thêm 12 dòng instruction còn thiếu (D3/D4/D14 của W2–W5)
 *   N16  backfill 6 ô `Giải thích` bắt buộc ở D15 của W3/W4/W5
 *        (pass này chỉ dựng đủ 3 cột, không viết chữ vào ô)
 *   N26  tạo config/diagnostics-default.md
 *
 * BẤT BIẾN CỦA PASS NÀY — script không bao giờ ghi vào:
 *   - vùng passage (giữa `# READING PASSAGE` và `# PHẦN 1`)
 *   - phần text của item câu hỏi (mọi ký tự sau số thứ tự)
 *   - giá trị đáp án ở cột 2 của bảng đáp án, trừ N18 và N21 (xem verify-migration.mjs)
 *
 * Chạy:  node scripts/normalize.mjs            → ghi đè test/*.md
 *        node scripts/normalize.mjs --dry-run  → chỉ in báo cáo
 *        node scripts/normalize.mjs --drop-dash-placeholders
 *              → khi gộp cột, coi ô chỉ chứa `—` là ô rỗng (mặc định: giữ nguyên,
 *                vì ràng buộc "không xoá chữ nào" của pass này)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DIR = path.join(ROOT, 'test');
const BASELINE_DIR = path.join(ROOT, '.baseline', 'test');
const DRY = process.argv.includes('--dry-run');
const DROP_DASH = process.argv.includes('--drop-dash-placeholders');

/* ------------------------------------------------------------------ *
 * Dữ liệu không suy được từ thân file — lấy từ bảng trong
 * docs/canonical-format.md §N-A ("Giá trị cho 5 file").
 * Mọi trường khác của frontmatter đều tính từ nội dung file.
 * ------------------------------------------------------------------ */
const FRONTMATTER_DATA = {
  'ielts_reading_buddhism_full.md':    { topic_slug: 'buddhism-transmission-asia', answer_language: ['en'] },
  'ielts_reading_tibetan_buddhism.md': { topic_slug: 'tibetan-buddhism-today',     answer_language: ['en'] },
  'ielts_reading_vietnam_buddhism.md': { topic_slug: 'vietnam-esoteric-buddhism',  answer_language: ['en', 'vi'] },
  'ielts_reading_theravada_vietnam.md':{ topic_slug: 'vietnam-theravada',          answer_language: ['en', 'vi'] },
  'ielts_reading_mahayana_vietnam.md': { topic_slug: 'vietnam-mahayana',           answer_language: ['en', 'vi'] },
};
const CREATED = '2026-08-17'; // docs/canonical-format.md §N-A: mtime của cả 5 file

/* Tên dạng → kind (CLAUDE.md §4.3). Thứ tự quan trọng: chuỗi dài / cụ thể trước. */
const KIND_RULES = [
  ['Matching Sentence Endings', 'matching-endings'],
  ['Matching Headings', 'matching-headings'],
  ['Matching Information', 'matching-information'],
  ['Matching Features', 'matching-features'],
  ['True / False / Not Given', 'tfng'],
  ['Yes / No / Not Given', 'ynng'],
  ['Summary Completion (with a word list)', 'gap-select'],
  ['Summary Completion (words from the passage)', 'gap-text'],
  ['Sentence Completion', 'gap-text'],
  ['Note Completion', 'gap-text'],
  ['Table Completion', 'gap-table'],
  ['Flow-chart Completion', 'gap-flow'],
  ['Diagram Label Completion', 'gap-diagram'],
  ['Multiple Choice, more than one answer', 'mcq-multi'],
  ['Multiple Choice, one answer', 'mcq-single'],
  ['Short-answer', 'short-answer'],
];

/* ------------------------------------------------------------------ *
 * Bộ đệm dòng: giữ số dòng gốc để báo cáo trỏ đúng chỗ dù đã chèn/xoá.
 * ------------------------------------------------------------------ */
const mk = (text, orig = null) => ({ text, orig });

function load(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return raw.split('\n').map((t, i) => mk(t, i + 1));
}

/* ------------------------------------------------------------------ *
 * Mốc vùng. Heading cấp 1 nằm trong code fence không được tính.
 * ------------------------------------------------------------------ */
function marks(L) {
  const h1 = [];
  let fence = false;
  L.forEach((l, i) => {
    if (/^```/.test(l.text)) fence = !fence;
    else if (!fence && /^# /.test(l.text)) h1.push(i);
  });
  const at = (re) => h1.find((i) => re.test(L[i].text));
  const iPassage = at(/READING PASSAGE/);
  const iAnswers = at(/ĐÁP ÁN/);
  const iFirstPart = h1.find((i) => i > iPassage && /^# PHẦN/.test(L[i].text));
  const iTail = h1.find((i) => i > iAnswers);
  return {
    h1,
    head: [0, iPassage],
    passage: [iPassage, iFirstPart],
    questions: [iFirstPart, iAnswers],
    answers: [iAnswers, iTail === undefined ? L.length : iTail],
    tail: [iTail === undefined ? L.length : iTail, L.length],
  };
}

const inRange = (i, [a, b]) => i >= a && i < b;

/* Đánh dấu dòng nào nằm trong code fence (` ``` `). */
function fenceMap(L) {
  const m = new Array(L.length).fill(false);
  let fence = false;
  for (let i = 0; i < L.length; i++) {
    if (/^```/.test(L[i].text)) { fence = !fence; continue; }
    m[i] = fence;
  }
  return m;
}

/* Tách một dòng bảng markdown thành mảng ô (đã trim). */
function cells(line) {
  const t = line.trim();
  return t.slice(1, -1).split('|').map((c) => c.trim());
}
/* Ô rỗng viết `| |` (một space), đúng dạng đã có sẵn ở W1 D8: `| 46 | **oasis** | |` */
const row = (cs) => '|' + cs.map((c) => (c === '' ? ' ' : ` ${c} `)).join('|') + '|';
const isTableRow = (s) => /^\s*\|.*\|\s*$/.test(s);
const isSepRow = (s) => /^\s*\|(\s*:?-{2,}:?\s*\|)+\s*$/.test(s);

/* ================================================================== *
 * Chương trình chính
 * ================================================================== */
const report = [];

fs.mkdirSync(BASELINE_DIR, { recursive: true });

for (const name of fs.readdirSync(TEST_DIR).filter((f) => f.endsWith('.md')).sort()) {
  const file = path.join(TEST_DIR, name);

  /* Ảnh chụp bản gốc cho verify-migration.mjs.
     Chỉ ghi lần đầu — chạy lại normalize không được đè lên bản gốc. */
  const snapshot = path.join(BASELINE_DIR, name);
  if (!fs.existsSync(snapshot)) fs.copyFileSync(file, snapshot);

  const L = load(file);
  const log = [];
  let dashCells = 0; // ô placeholder `—` gặp khi gộp cột (xem --drop-dash-placeholders)
  const note = (rule, orig, before, after) => log.push({ rule, orig, before, after });

  /* ---------------------------------------------------------------- *
   * Đọc trước các giá trị cần cho frontmatter, trước khi N33 xoá dòng.
   * ---------------------------------------------------------------- */
  const idxH1 = L.findIndex((l) => /^# /.test(l.text));
  const idxPassageLine = L.findIndex((l) => /^## Passage:/.test(l.text));
  const idxCountLine = L.findIndex((l) => /^\*\*\d+ questions .*one passage\*\*$/.test(l.text));

  if (idxH1 !== 0 || idxPassageLine < 0 || idxCountLine < 0) {
    throw new Error(`${name}: không tìm thấy đủ 3 dòng đầu file mà N33 mô tả`);
  }

  const title = L[idxPassageLine].text.replace(/^## Passage:\s*/, '').trim();
  // `#N` ở cuối H1 boilerplate → workbook_id. W1 không có số ⇒ 1.
  const wbMatch = L[idxH1].text.match(/#(\d+)\s*$/);
  const workbookId = wbMatch ? Number(wbMatch[1]) : 1;

  {
    const m = marks(L);
    const body = L.slice(m.passage[0] + 1, m.passage[1])
      .map((l) => l.text)
      .filter((t) => t.trim() && !/^#{1,6} /.test(t) && !/^\*\*[A-H]\*\*$/.test(t) && t !== '---');
    var passageWordCount = body.join(' ').split(/\s+/).filter(Boolean).length;
  }

  /* Danh sách kind theo thứ tự khối, đọc từ heading vùng câu hỏi. */
  const questionTypeNames = [];
  {
    const m = marks(L);
    for (let i = m.questions[0]; i < m.questions[1]; i++) {
      const mm = L[i].text.match(/^## Dạng (\d+)\s+—\s+(.+?)\s+\(Questions/);
      if (mm) questionTypeNames.push({ idx: Number(mm[1]), typeName: mm[2] });
    }
  }
  const questionTypes = questionTypeNames.map(({ typeName }) => {
    const hit = KIND_RULES.find(([needle]) => typeName.includes(needle));
    if (!hit) throw new Error(`${name}: không map được tên dạng "${typeName}" sang kind`);
    return hit[1];
  });

  /* Số câu lớn nhất trong vùng câu hỏi (không hardcode 86). */
  let questionCount = 0;
  {
    const m = marks(L);
    for (let i = m.questions[0]; i < m.questions[1]; i++) {
      const mm = L[i].text.match(/^## Dạng \d+\s+—\s+.+\(Questions\s+(\d+)\s*[–—-]\s*(\d+)\)/);
      if (mm) questionCount = Math.max(questionCount, Number(mm[2]));
    }
  }

  /* ================================================================ *
   * N33 — H1 là render target của `title`; xoá 2 dòng metadata văn bản
   * ================================================================ */
  note('N33', L[idxH1].orig, L[idxH1].text, `# ${title}`);
  L[idxH1].text = `# ${title}`;
  note('N33', L[idxPassageLine].orig, L[idxPassageLine].text, null);
  note('N33', L[idxCountLine].orig, L[idxCountLine].text, null);
  L[idxPassageLine].text = ' DELETE';
  L[idxCountLine].text = ' DELETE';

  /* ================================================================ *
   * N28 — xoá bảng quy đổi band (chỉ W3)
   * Gồm dòng tiêu đề in đậm, bảng, và dòng ghi chú in nghiêng ngay sau
   * — ghi chú nói về chính bảng này nên không thể để lại mồ côi.
   * ================================================================ */
  {
    const start = L.findIndex((l) => /^\*\*Quy đổi tham khảo/.test(l.text));
    if (start >= 0) {
      let end = start;
      // ăn tới hết bảng
      while (end + 1 < L.length && (L[end + 1].text.trim() === '' || isTableRow(L[end + 1].text))) end++;
      // ăn thêm dòng ghi chú in nghiêng bám ngay sau bảng
      let j = end + 1;
      while (j < L.length && L[j].text.trim() === '') j++;
      if (j < L.length && /^\*[^*].*\*$/.test(L[j].text) && /quy đổi/i.test(L[j].text)) end = j;
      for (let i = start; i <= end; i++) {
        if (L[i].text.trim() === '') continue;
        note('N28', L[i].orig, L[i].text, null);
        L[i].text = ' DELETE';
      }
    }
  }

  /* ================================================================ *
   * N26 — heading cuối file cố định
   * ================================================================ */
  for (const l of L) {
    if (/^# BẢNG SO SÁNH/.test(l.text) && l.text !== '# BẢNG SO SÁNH') {
      note('N26', l.orig, l.text, '# BẢNG SO SÁNH');
      l.text = '# BẢNG SO SÁNH';
    }
  }

  /* ================================================================ *
   * N-B — bảng so sánh dùng 2 gạch (`___ /14` → `__ /14`)
   * Chỉ trong vùng tail; vùng câu hỏi do N13 lo.
   * Ví dụ thật (W5:507): `| Headings + Matching Info | 1–14 | ___ /14 | …`
   * ================================================================ */
  {
    const m = marks(L);
    for (let i = m.tail[0]; i < m.tail[1]; i++) {
      const before = L[i].text;
      const after = before.replace(/_{3}(?= *\/\s*\d)/g, '__');
      if (after !== before) { note('N-B', L[i].orig, before, after); L[i].text = after; }
    }
  }

  /* ================================================================ *
   * N25 — tên `## Dạng n` khu đáp án trùng khít khu câu hỏi
   * Tên chuẩn lấy từ chính heading vùng câu hỏi (bỏ ` (Questions a–b)`),
   * không hardcode danh sách 16 tên.
   * ================================================================ */
  {
    const canonical = new Map(questionTypeNames.map((q) => [q.idx, q.typeName]));
    const m = marks(L);
    for (let i = m.answers[0]; i < m.answers[1]; i++) {
      const mm = L[i].text.match(/^## Dạng (\d+)\s+—\s+(.+?)\s*$/);
      if (!mm) continue;
      const want = canonical.get(Number(mm[1]));
      if (want && mm[2] !== want) {
        const after = `## Dạng ${mm[1]} — ${want}`;
        note('N25', L[i].orig, L[i].text, after);
        L[i].text = after;
      }
    }
  }

  /* ================================================================ *
   * N16 — bảng đáp án luôn 3 cột `| Q | Đ.án | Giải thích |`
   * 4 cột  → nối cột thừa bằng ` · ` (ô rỗng thì bỏ, không sinh · thừa)
   * 2 cột  → thêm ô thứ ba rỗng
   * Header cột 3 luôn là `Giải thích` (canonical §N16).
   * ================================================================ */
  {
    const m = marks(L);
    let i = m.answers[0];
    while (i < m.answers[1]) {
      if (!isTableRow(L[i].text) || !isSepRow(L[i + 1]?.text ?? '')) { i++; continue; }
      const head = i;
      let end = i + 2;
      while (end < m.answers[1] && isTableRow(L[end].text)) end++;

      const width = cells(L[head].text).length;
      if (width !== 3) {
        for (let r = head; r < end; r++) {
          if (r === head + 1) {
            const after = '|---|---|---|';
            if (L[r].text !== after) { note('N16', L[r].orig, L[r].text, after); L[r].text = after; }
            continue;
          }
          const cs = cells(L[r].text);
          let out;
          if (cs.length > 3) {
            const empty = (c) => c === '' || (DROP_DASH && /^[—–-]$/.test(c));
            const merged = cs.slice(2).filter((c) => !empty(c)).join(' · ');
            if (cs.slice(2).some((c) => /^[—–-]$/.test(c))) dashCells++;
            out = row([cs[0], cs[1], merged]);
          } else {
            out = row([cs[0], cs[1] ?? '', cs[2] ?? '']);
          }
          if (r === head) out = row([cs[0], cs[1], 'Giải thích']);
          if (out !== L[r].text) { note('N16', L[r].orig, L[r].text, out); L[r].text = out; }
        }
      } else {
        const cs = cells(L[head].text);
        if (cs[2] !== 'Giải thích') {
          const after = row([cs[0], cs[1], 'Giải thích']);
          note('N16', L[head].orig, L[head].text, after);
          L[head].text = after;
        }
      }
      i = end;
    }
  }

  /* ================================================================ *
   * N21 — ngoặc bình luận của mcq-multi dời sang cột Giải thích
   * Chỉ khớp ngoặc nằm NGOÀI `**…**` và KHÔNG mở đầu bằng `chấp nhận`
   * (cái đó là N18). Ví dụ thật (W1:583):
   *   | 79–80 | **B** và **D** ("warehouses" = storing goods; …) |
   * ================================================================ */
  {
    const m = marks(L);
    for (let i = m.answers[0]; i < m.answers[1]; i++) {
      if (!isTableRow(L[i].text) || isSepRow(L[i].text)) continue;
      const cs = cells(L[i].text);
      if (cs.length !== 3) continue;
      if (!/^\d+\s*[–—-]\s*\d+$/.test(cs[0])) continue; // chỉ hàng gộp 2 số câu
      const mm = cs[1].match(/^(.*\*\*)\s*\((?!chấp nhận)(.+)\)\s*$/);
      if (!mm) continue;
      const answerPart = mm[1].trim();
      const comment = mm[2].trim();
      const explain = cs[2] ? `${comment} · ${cs[2]}` : comment;
      const after = row([cs[0], answerPart, explain]);
      note('N21', L[i].orig, L[i].text, after);
      L[i].text = after;
    }
  }

  /* ================================================================ *
   * N18 — luôn `(chấp nhận *X*)` trong ngoặc
   * Biến thể em dash, ví dụ thật (W1:595):
   *   | 86 | **(at) Dunhuang** — chấp nhận *a sealed chamber* |
   * ================================================================ */
  {
    const m = marks(L);
    for (let i = m.answers[0]; i < m.answers[1]; i++) {
      if (!isTableRow(L[i].text) || isSepRow(L[i].text)) continue;
      const cs = cells(L[i].text);
      if (cs.length < 2) continue;
      const mm = cs[1].match(/^(.*?)\s*[—–-]\s*(chấp nhận\s+.+?)\s*$/);
      if (!mm) continue;
      const rebuilt = `${mm[1]} (${mm[2]})`;
      const after = row([cs[0], rebuilt, ...cs.slice(2)]);
      note('N18', L[i].orig, L[i].text, after);
      L[i].text = after;
    }
  }

  /* ================================================================ *
   * N17 — blockNote luôn in nghiêng, một dòng
   * Ví dụ thật (W1:461): `**Tổng kết bẫy dạng này:** câu 18 và 20 …`
   * Bọc cả câu bằng `*…*`, gỡ nhãn in đậm dẫn đầu, và gỡ cặp `*…*`
   * lồng bên trong (không được lồng in nghiêng trong in nghiêng).
   * ================================================================ */
  {
    const m = marks(L);
    for (let i = m.answers[0]; i < m.answers[1]; i++) {
      const t = L[i].text;
      if (!/^\*\*[^*]+:\*\*\s/.test(t)) continue;
      let body = t.replace(/^\*\*([^*]+):\*\*\s*/, '$1: ');
      // gỡ in nghiêng đơn lồng bên trong, giữ nguyên in đậm `**…**`
      body = body.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, '$1');
      const after = `*${body}*`;
      note('N17', L[i].orig, t, after);
      L[i].text = after;
    }
  }

  /* ================================================================ *
   * N12 — bỏ tiền tố instruction + đưa D1 về instruction canonical §3.1
   * ================================================================ */
  {
    const m = marks(L);
    for (let i = m.questions[0]; i < m.questions[1]; i++) {
      const t = L[i].text;
      if (!/^\*[A-Z].*\*$/.test(t)) continue;
      let after = t;

      // (a) rubric dẫn đầu trước `Choose **NO MORE THAN …**`
      //     W1:206 `*Complete the sentences below. Choose **NO MORE THAN TWO WORDS** …*`
      //     W1:411 `*Answer the questions below. Choose …*`
      //     W1:323 / W2:272 / W3:261 / W4:244 / W5:247 `*Label the diagram below. Choose …*`
      after = after.replace(/^\*[^*]*?\.\s+(Choose \*\*NO MORE THAN)/, '*$1');

      // (b) D1 về canonical `*Choose the correct heading for each paragraph, **A–H**.*`
      //     W1:57 `*The passage has eight paragraphs, **A–H**. Choose … from the list of headings below.*`
      //     W2:48 `*Choose the correct heading for each paragraph, **A–H**, from the list below.*`
      if (/Choose the correct heading for each paragraph/.test(after)) {
        const letters = after.match(/\*\*([A-Z]–[A-Z])\*\*/);
        if (letters) after = `*Choose the correct heading for each paragraph, **${letters[1]}**.*`;
      }

      if (after !== t) { note('N12', L[i].orig, t, after); L[i].text = after; }
    }
  }

  /* ================================================================ *
   * N08 — mỗi option một dòng
   * Ví dụ thật (W1:161): `**A** Ashoka  **B** Kumārajīva  **C** Xuanzang …`
   * Dấu ngăn giữa hai option là ≥2 space.
   * ================================================================ */
  {
    const m = marks(L);
    const fm = fenceMap(L);
    for (let i = m.questions[0]; i < m.questions[1]; i++) {
      if (fm[i]) continue;
      const t = L[i].text;
      if (!/^\*\*[A-Z]\*\*\s/.test(t)) continue;
      const parts = t.split(/ {2,}(?=\*\*[A-Z]\*\*\s)/);
      if (parts.length < 2) continue;
      note('N08', L[i].orig, t, parts.join('\n'));
      L[i].text = parts.map((p) => p.trimEnd()).join('\n'); //  = mốc tách dòng
    }
  }

  /* ================================================================ *
   * N07 — bỏ `optionsLabel` (`**List of Headings**`, `**List of People**`)
   * ================================================================ */
  {
    const m = marks(L);
    for (let i = m.questions[0]; i < m.questions[1]; i++) {
      if (!/^\*\*List of [^*]+\*\*$/.test(L[i].text)) continue;
      note('N07', L[i].orig, L[i].text, null);
      L[i].text = ' DELETE';
    }
  }

  /* ================================================================ *
   * N04a — một nhãn chiến thuật duy nhất
   *   W2 ×16 / W3 ×5: `> **Nhắc lại:** <thân>`      → `> **Chiến thuật**` + `> <thân>`
   *   W2:46         : `> **Nhắc lại chiến thuật:** …`
   *   W1:109        : `> **Chiến thuật (dạng bạn hay mất điểm)**`
   *                   → nhãn sạch + chuyển chữ trong ngoặc thành bullet đầu thân
   * ================================================================ */
  {
    const m = marks(L);
    for (let i = m.questions[0]; i < m.questions[1]; i++) {
      const t = L[i].text;

      const inline = t.match(/^> \*\*Nhắc lại(?: chiến thuật)?:\*\*\s*(.*)$/);
      if (inline) {
        const after = `> **Chiến thuật**\n> ${inline[1]}`;
        note('N04a', L[i].orig, t, after);
        L[i].text = `> **Chiến thuật**\n> ${inline[1]}`;
        continue;
      }

      const paren = t.match(/^> \*\*Chiến thuật \(([^)]+)\)\*\*$/);
      if (paren) {
        const after = `> **Chiến thuật**\n> - ${paren[1].charAt(0).toUpperCase()}${paren[1].slice(1)}.`;
        note('N04a', L[i].orig, t, after);
        L[i].text = `> **Chiến thuật**\n> - ${paren[1].charAt(0).toUpperCase()}${paren[1].slice(1)}.`;
      }
    }
  }

  /* ================================================================ *
   * N03 — thân summary thôi là blockquote
   * Nhận diện theo nội dung: dòng blockquote trong vùng câu hỏi có
   * chứa chỗ trống `**45** ______`. Khối chiến thuật không bao giờ có.
   * ================================================================ */
  {
    const m = marks(L);
    for (let i = m.questions[0]; i < m.questions[1]; i++) {
      const t = L[i].text;
      if (!/^> /.test(t)) continue;
      if (!/\*\*\d+\*\*\s+_{3,}/.test(t)) continue;
      const after = t.replace(/^> /, '');
      note('N03', L[i].orig, t, after);
      L[i].text = after;
    }
  }

  /* ================================================================ *
   * N13 — gạch dưới luôn 6 ký tự
   * Trong code fence phải giữ nguyên số ký tự của dòng (§6):
   * rút n gạch xuống 6 thì bù đúng (n-6) space ngay sau.
   * Ví dụ thật (W2:282): `  │    71 ____________       │`
   * ================================================================ */
  {
    const m = marks(L);
    const fm = fenceMap(L);
    for (let i = m.questions[0]; i < m.questions[1]; i++) {
      const t = L[i].text;
      if (!/_{3,}/.test(t)) continue;
      const after = t.replace(/_{3,}/g, (run) =>
        run.length === 6 ? run : fm[i] ? '_'.repeat(6) + ' '.repeat(Math.max(0, run.length - 6)) : '_'.repeat(6)
      );
      if (after === t) continue;
      if (fm[i] && after.length !== t.length) {
        throw new Error(`${name}:${L[i].orig} N13 làm đổi độ dài dòng trong code fence`);
      }
      note('N13', L[i].orig, t, after);
      L[i].text = after;
    }
  }

  /* ================================================================ *
   * N39 — không bao giờ hai dòng `---` liên tiếp
   * ================================================================ */
  {
    for (let i = 0; i + 1 < L.length; i++) {
      if (L[i].text === '---' && L[i + 1].text === '---') {
        note('N39', L[i + 1].orig, L[i + 1].text, null);
        L[i + 1].text = ' DELETE';
      }
    }
  }

  /* ================================================================ *
   * Hiện thực hoá xoá / tách dòng
   * ================================================================ */
  let out = [];
  for (const l of L) {
    if (l.text === ' DELETE') continue;
    if (l.text.includes('\n')) {
      const parts = l.text.split('\n');
      parts.forEach((p, k) => out.push(mk(p, k === 0 ? l.orig : null)));
    } else out.push(l);
  }

  /* Gộp dòng trống liên tiếp do xoá sinh ra.
     File gốc không có chỗ nào 2 dòng trống liền nhau nên bước này chỉ
     chạm đúng các vị trí vừa xoá. */
  const collapsed = [];
  for (const l of out) {
    if (l.text.trim() === '' && collapsed.length && collapsed[collapsed.length - 1].text.trim() === '') continue;
    collapsed.push(l);
  }
  out = collapsed;

  /* ================================================================ *
   * N-A — YAML frontmatter bắt buộc, ở dòng 1
   * ================================================================ */
  {
    const meta = FRONTMATTER_DATA[name];
    if (!meta) throw new Error(`${name}: thiếu topic_slug / answer_language trong bảng §N-A`);
    const fmLines = [
      '---',
      `workbook_id: ${workbookId}`,
      `title: ${title}`,
      `topic_slug: ${meta.topic_slug}`,
      `passage_word_count: ${passageWordCount}`,
      `question_count: ${questionCount}`,
      'question_types:',
      ...questionTypes.map((k) => `  - ${k}`),
      `answer_language: [${meta.answer_language.join(', ')}]`,
      'passage_language: en',
      `created: ${CREATED}`,
      '---',
      '',
    ];
    note('N-A', 1, '(không có frontmatter)', `${fmLines.length} dòng frontmatter`);
    out = [...fmLines.map((t) => mk(t, null)), ...out];
  }

  const text = out.map((l) => l.text).join('\n');
  if (!DRY) fs.writeFileSync(file, text, 'utf8');
  report.push({ name, log, title, workbookId, passageWordCount, questionCount, dashCells });
}

/* ================================================================== *
 * Báo cáo
 * ================================================================== */
const RULES = ['N-A', 'N03', 'N04a', 'N07', 'N08', 'N12', 'N13', 'N16', 'N17', 'N18', 'N21', 'N25', 'N26', 'N28', 'N33', 'N39', 'N-B'];

console.log(`\n=== normalize.mjs ${DRY ? '(DRY RUN — không ghi file)' : '— đã ghi test/*.md'} ===\n`);

const head = ['NORMALIZE', ...report.map((r) => r.name.replace(/^ielts_reading_|\.md$/g, '').slice(0, 10)), 'Σ'];
const w = [10, ...report.map(() => 11), 5];
const line = (cs) => cs.map((c, i) => String(c).padEnd(w[i])).join(' ');
console.log(line(head));
console.log(w.map((n) => '-'.repeat(n)).join(' '));
let grand = 0;
for (const rule of RULES) {
  const counts = report.map((r) => r.log.filter((e) => e.rule === rule).length);
  const sum = counts.reduce((a, b) => a + b, 0);
  grand += sum;
  console.log(line([rule, ...counts, sum]));
}
console.log(w.map((n) => '-'.repeat(n)).join(' '));
console.log(line(['Σ', ...report.map((r) => r.log.length), grand]));

const totalDash = report.reduce((a, r) => a + r.dashCells, 0);
console.log(
  `\nÔ placeholder "—" gặp khi gộp cột 4→3: ${totalDash}` +
    (DROP_DASH ? '  → đã bỏ (--drop-dash-placeholders)' : '  → GIỮ NGUYÊN (mặc định: không xoá ký tự nào)')
);

console.log('\n--- Frontmatter sinh ra ---');
for (const r of report) {
  console.log(`  ${r.name}\n    workbook_id=${r.workbookId}  question_count=${r.questionCount}  passage_word_count=${r.passageWordCount}\n    title="${r.title}"`);
}

console.log('\n--- Chi tiết từng thay đổi ---');
for (const r of report) {
  console.log(`\n### ${r.name}`);
  for (const e of r.log) {
    if (e.rule === 'N-A') { console.log(`  [N-A ] +${e.after}`); continue; }
    const cut = (s, n = 96) => (s === null ? '(xoá dòng)' : s.length > n ? s.slice(0, n) + '…' : s);
    console.log(`  [${e.rule.padEnd(4)}] L${String(e.orig ?? '?').padStart(3)}`);
    console.log(`         − ${cut(e.before)}`);
    console.log(`         + ${cut(e.after).replace(/\n/g, '\n           ')}`);
  }
}
console.log('');
