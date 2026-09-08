/**
 * Test parser. Dữ liệu cắt từ file thật trong test/ (CLAUDE.md §9.3):
 * mỗi dạng trong 16 dạng ít nhất một test, và mỗi biến thể format ở
 * docs/canonical-format.md có ít nhất một test riêng.
 */

import { describe, expect, it } from 'vitest';
import { parseTest } from '../index';
import { parseAnswerCell, expandOptionalParens } from '../answers';
import { parseDiagnostics, coversExactly, parseThreshold } from '../diagnostics';
import { extractWordLimit, kindFromTypeName, toSegments } from '../questions';

/* Nạp corpus bằng đúng cơ chế mà app dùng (import.meta.glob) — test đi qua
   cùng một đường với runtime, và không cần @types/node. */
const RAW = import.meta.glob('/test/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const DIAG_RAW = import.meta.glob('/config/diagnostics-default.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const files = Object.keys(RAW)
  .map((p) => p.split('/').pop()!)
  .sort();
const load = (f: string) => parseTest(RAW[`/test/${f}`]!, f);
const all = files.map(load);
const byId = (id: string) => all.find((t) => t.id === id)!;

const W1 = () => byId('buddhism-transmission-asia');
const W2 = () => byId('tibetan-buddhism-today');
const W3 = () => byId('vietnam-esoteric-buddhism');

/* ================================================================== *
 * Bất biến toàn corpus — chạy trên MỌI file, không hardcode con số nào
 * ================================================================== */
describe('bất biến toàn corpus', () => {
  it('có ít nhất một đề', () => {
    expect(all.length).toBeGreaterThan(0);
  });

  for (const f of files) {
    it(`${f}: parse sạch, không cảnh báo`, () => {
      expect(load(f).parseWarnings).toEqual([]);
    });
  }

  for (const f of files) {
    it(`${f}: số câu liên tục, không trùng, mỗi câu đúng một đáp án`, () => {
    const t = load(f);
    const covered = new Set<number>();
    for (const b of t.blocks) {
      for (let n = b.range[0]; n <= b.range[1]; n++) {
        expect(covered.has(n)).toBe(false);
        covered.add(n);
      }
    }
    for (let n = 1; n <= t.totalQuestions; n++) {
      expect(covered.has(n)).toBe(true);
      expect(t.answers[n]).toBeDefined();
    }
    expect(Object.keys(t.answers).length).toBe(t.totalQuestions);
    });
  }

  for (const f of files) {
    it(`${f}: mỗi khối có strategy và instruction`, () => {
    const t = load(f);
    for (const b of t.blocks) {
      expect(b.strategy, `Dạng ${b.typeIndex}`).toBeTruthy();
      expect(b.instruction, `Dạng ${b.typeIndex}`).toBeTruthy();
    }
    });
  }

  for (const f of files) {
    it(`${f}: không khối nào rơi về kind unknown`, () => {
      expect(load(f).blocks.filter((b) => b.kind === 'unknown')).toEqual([]);
    });
  }

  for (const f of files) {
    it(`${f}: frontmatter khớp thân file`, () => {
    const t = load(f);
    const fm = t.frontmatter!;
    expect(fm).toBeDefined();
    expect(fm.question_count).toBe(t.totalQuestions);
    expect(fm.question_types).toEqual(t.blocks.map((b) => b.kind));
    expect(t.id).toBe(fm.topic_slug);
    });
  }

  it('workbook_id và topic_slug không trùng nhau giữa các đề', () => {
    const ids = all.map((t) => t.frontmatter!.workbook_id);
    const slugs = all.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

/* ================================================================== *
 * 16 dạng — mỗi dạng một test
 * ================================================================== */
describe('16 dạng câu hỏi', () => {
  const block = (t: ReturnType<typeof load>, idx: number) => t.blocks.find((b) => b.typeIndex === idx)!;

  it('D1 matching-headings — options roman, item "Paragraph **A** ______"', () => {
    const b = block(W1(), 1);
    expect(b.kind).toBe('matching-headings');
    expect(b.options!.map((o) => o.letter)).toContain('i');
    expect(b.options!.length).toBeGreaterThan(b.questions.length); // luôn thừa heading
    expect(b.questions[0]!.prompt).toBe('Paragraph **A**');
    expect(b.questions).toHaveLength(8);
  });

  it('D2 matching-information — nối được 2 dòng instruction (dòng NB)', () => {
    const b = block(W1(), 2);
    expect(b.kind).toBe('matching-information');
    expect(b.instruction).toContain('Which paragraph contains');
    expect(b.instruction).toContain('NB You may use any letter more than once');
  });

  it('D3 tfng — options cố định TRUE/FALSE/NOT GIVEN', () => {
    const b = block(W1(), 3);
    expect(b.kind).toBe('tfng');
    expect(b.options!.map((o) => o.letter)).toEqual(['TRUE', 'FALSE', 'NOT GIVEN']);
    expect(b.questions[0]!.prompt).not.toContain('___');
  });

  it('D4 ynng — options cố định YES/NO/NOT GIVEN', () => {
    const b = block(W1(), 4);
    expect(b.kind).toBe('ynng');
    expect(b.options!.map((o) => o.letter)).toEqual(['YES', 'NO', 'NOT GIVEN']);
  });

  it('D5 matching-features — số option khác nhau giữa file, không hardcode', () => {
    expect(block(W1(), 5).options).toHaveLength(4); // A–D
    expect(block(W3(), 5).options).toHaveLength(5); // A–E
    expect(block(W1(), 5).kind).toBe('matching-features');
  });

  it('D6 matching-endings — options nằm SAU danh sách item', () => {
    const b = block(W1(), 6);
    expect(b.kind).toBe('matching-endings');
    expect(b.options!.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(b.questions).toHaveLength(5); // 7 đuôi cho 5 câu → thừa 2
  });

  it('D7 gap-text (Sentence Completion) — rút được wordLimit', () => {
    const b = block(W1(), 7);
    expect(b.kind).toBe('gap-text');
    expect(b.wordLimit).toBe('NO MORE THAN TWO WORDS');
    expect(b.wordLimitCount).toBe(2);
  });

  it('D8 gap-text (Summary) — thân là đoạn văn thường, tách đúng segments', () => {
    const b = block(W1(), 8);
    expect(b.kind).toBe('gap-text');
    const segs = b.questions[0]!.segments!;
    expect(segs.filter((s) => s.type === 'blank').map((s) => s.qno)).toEqual([45, 46, 47, 48, 49]);
    expect(segs[0]!.value).toContain('Buddhism began as a movement');
  });

  it('D9 gap-select — word list 10 từ A–J, mỗi option một dòng', () => {
    const b = block(W1(), 9);
    expect(b.kind).toBe('gap-select');
    expect(b.options!.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
    expect(b.options![0]).toEqual({ letter: 'A', text: 'condemned' });
  });

  it('D10 gap-text (Note Completion) — có caption, giữ thụt lề bullet lồng', () => {
    const b = block(W1(), 10);
    expect(b.caption).toBe('The decline of Buddhism in India');
    const indents = b.questions.map((q) => q.indent ?? 0);
    expect(Math.max(...indents)).toBeGreaterThan(0); // W1 có bullet 2 cấp
  });

  it('D11 gap-table — dựng lại bảng, ô có chỗ trống thành segments', () => {
    const b = block(W1(), 11);
    expect(b.kind).toBe('gap-table');
    expect(b.table!.header.length).toBe(2);
    const blanks = b.table!.rows.flat(2).filter((s) => s.type === 'blank');
    expect(blanks.map((s) => s.qno).sort((x, y) => x! - y!)).toEqual([60, 61, 62, 63, 64, 65]);
  });

  it('D12 gap-flow — giữ raw byte-exact, blank là số trần trong fence', () => {
    const b = block(W1(), 12);
    expect(b.kind).toBe('gap-flow');
    expect(b.raw).toContain('Buddhist texts arrive in China');
    expect(b.questions.map((q) => q.qno)).toEqual([66, 67, 68, 69, 70]);
  });

  it('D13 gap-diagram — khung ASCII giữ nguyên khoảng trắng', () => {
    const b = block(W1(), 13);
    expect(b.kind).toBe('gap-diagram');
    expect(b.raw).toContain('│');
    expect(b.questions.map((q) => q.qno)).toEqual([71, 72, 73, 74]);
  });

  it('D14 mcq-single — thân câu **75.** + bullet - **A**', () => {
    const b = block(W1(), 14);
    expect(b.kind).toBe('mcq-single');
    expect(b.questions).toHaveLength(4);
    expect(b.questions[0]!.qno).toBe(75);
    expect(b.questions[0]!.options).toHaveLength(4);
    expect(b.questions[0]!.prompt).toContain('early Buddhism in paragraph A');
  });

  it('D15 mcq-multi — một item chiếm hai số câu, selectCount = 2', () => {
    const b = block(W1(), 15);
    expect(b.kind).toBe('mcq-multi');
    expect(b.questions).toHaveLength(2);
    expect(b.questions[0]!.qnos).toEqual([79, 80]);
    expect(b.questions[0]!.selectCount).toBe(2);
    expect(b.questions[0]!.options).toHaveLength(5);
  });

  it('D16 short-answer — ô nhập text tự do, wordLimit riêng của khối', () => {
    const b = block(W1(), 16);
    expect(b.kind).toBe('short-answer');
    expect(b.wordLimitCount).toBe(3); // khác D7 (=2) trong cùng file — #11 KEEP
    expect(b.questions[0]!.prompt).toBe('Where were most of the Buddhist chronicles about Ashoka written?');
  });
});

/* ================================================================== *
 * Biến thể format — canonical-format.md
 * ================================================================== */
describe('biến thể format', () => {
  it('N04 — chiến thuật kiểu bullet (W1) và kiểu đoạn văn inline (W2) đều hợp lệ', () => {
    const w1 = W1().blocks[0]!.strategy!;
    const w2 = W2().blocks[0]!.strategy!;
    expect(w1).toMatch(/^\*\*Chiến thuật\*\*/);
    expect(w2).toMatch(/^\*\*Chiến thuật\*\*/);
    expect(w1).toContain('\n- '); // bullet
    expect(w2.split('\n')[1]).not.toMatch(/^- /); // đoạn văn
  });

  it('N07 — không file nào còn optionsLabel, nhưng caption của D10 vẫn giữ', () => {
    for (const t of all) {
      for (const b of t.blocks) {
        expect(b.caption ?? '').not.toMatch(/^List of /);
      }
      const d10 = t.blocks.find((b) => b.typeName.includes('Note Completion'))!;
      expect(d10.caption, t.id).toBeTruthy();
    }
  });

  it('N18 — `(chấp nhận *X*)` bung ra biến thể chấp nhận thêm', () => {
    const a = parseAnswerCell('**(at) Dunhuang** (chấp nhận *a sealed chamber*)');
    expect(a.accepted).toContain('at Dunhuang');
    expect(a.accepted).toContain('Dunhuang');
    expect(a.accepted).toContain('a sealed chamber');
  });

  it('N21 — ngoặc bình luận đã rời khỏi ô đáp án, chỉ còn 3 hình dạng ô', () => {
    for (const t of all) {
      for (const key of Object.values(t.answers) as import('../types').AnswerKey[]) {
        const outside = key.display.replace(/\*\*[^*]*\*\*/g, '');
        const paren = outside.match(/\(([^)]*)\)/);
        if (paren) expect(paren[1]!.trim(), `${t.id} câu ${key.qno}`).toMatch(/^chấp nhận/);
      }
    }
  });

  it('N16 — cột giải thích gộp lại, bắt buộc có ở D1/D3/D4/D14/D15', () => {
    const need = new Set(['matching-headings', 'tfng', 'ynng', 'mcq-single', 'mcq-multi']);
    for (const t of all) {
      for (const b of t.blocks) {
        if (!need.has(b.kind)) continue;
        for (let n = b.range[0]; n <= b.range[1]; n++) {
          expect(t.answers[n]!.explanation, `${t.id} câu ${n}`).toBeTruthy();
        }
      }
    }
  });

  it('N26 — W1 có bảng chẩn đoán riêng, các file khác không có và KHÔNG lỗi', () => {
    expect(W1().diagnosticsSource).toBe('file');
    expect(W1().diagnostics).toHaveLength(5);
    expect(W2().diagnosticsSource).toBe('none');
    expect(W2().diagnostics).toEqual([]);
    expect(W2().parseWarnings).toEqual([]);
  });

  it('frontmatter — giá trị bọc nháy và tiêu đề chứa dấu ":" đều đọc đúng', () => {
    // Tiêu đề có dấu hai chấm là YAML KHÔNG hợp lệ nếu không bọc nháy,
    // nên file sinh sau này chắc chắn sẽ có dạng này.
    const src = RAW[`/test/${files[0]!}`]!;
    const quoted = src
      .replace(/^title: .*$/m, 'title: "Two Arrivals: A Test Title"')
      .replace(/^topic_slug: .*$/m, "topic_slug: 'quoted-slug'")
      .replace(/^# .*$/m, '# Two Arrivals: A Test Title');
    const t = parseTest(quoted, 'quoted.md');
    expect(t.frontmatter!.title).toBe('Two Arrivals: A Test Title');
    expect(t.id).toBe('quoted-slug');
    expect(t.parseWarnings).toEqual([]);
  });

  it('N33 — H1 trùng khít frontmatter.title ở mọi file', () => {
    for (const f of files) {
      const raw = RAW[`/test/${f}`]!;
      const h1 = raw.split('\n').find((l: string) => /^# /.test(l))!.replace(/^#\s+/, '').trim();
      expect(h1, f).toBe(load(f).frontmatter!.title);
    }
  });

  /* ---- 6 cái bẫy CLAUDE.md §9.3 bắt buộc có test riêng ------------ */

  it('bẫy #3 — thân summary blockquote KHÔNG bị nhận nhầm thành strategy', () => {
    for (const t of all) {
      for (const b of t.blocks) {
        // sau N03, `>` trong vùng câu hỏi chỉ còn nghĩa "chiến thuật"
        expect(b.strategy, `${t.id} Dạng ${b.typeIndex}`).not.toMatch(/\*\*\d+\*\*\s+_{3,}/);
      }
      // và thân summary phải thực sự ra segments, không biến mất
      const d8 = t.blocks.find((b) => b.typeName.includes('Summary Completion (words from'))!;
      expect(d8.questions.some((q) => q.segments?.some((s) => s.type === 'blank')), t.id).toBe(true);
    }
  });

  it('bẫy #19 — `chấp nhận` trong ô GIẢI THÍCH không bị coi là biến thể đáp án', () => {
    // W2 Q77: "…không phải lý do tu viện chấp nhận về mặt thực tế."
    const k = W2().answers[77]!;
    expect(k.explanation).toContain('chấp nhận');
    expect(k.accepted).toEqual(['C']); // chỉ chữ cái, không nuốt chữ từ cột 3
  });

  it('bẫy #21 — ngoặc ngoài `**…**` ở mcq-multi không bị coi là biến thể', () => {
    for (const t of all) {
      for (const b of t.blocks.filter((x) => x.kind === 'mcq-multi')) {
        for (let n = b.range[0]; n <= b.range[1]; n++) {
          const k = t.answers[n]!;
          // đáp án mcq-multi chỉ được là các chữ cái đơn
          for (const a of k.accepted) expect(a, `${t.id} câu ${n}: "${a}"`).toMatch(/^[A-E]$/);
        }
      }
    }
  });

  it('bẫy #22 — dấu phẩy/chấm trong đáp án số KHÔNG dùng để tách biến thể', () => {
    const w2 = W2();
    expect(w2.answers[45]!.accepted).toEqual(['130,000']); // không phải ['130','000']
    const w4 = byId('vietnam-theravada');
    expect(w4.answers[40]!.accepted).toEqual(['1.3 million']);
    expect(w4.answers[56]!.accepted).toEqual(['8,500']);
  });

  it('bẫy #27 — bảng SO SÁNH cuối file không bị nhận nhầm thành diagnostics', () => {
    // `# BẢNG SO SÁNH` là TUỲ CHỌN (canonical §N26) — đề mới không sinh nó nữa.
    // Điều phải đúng là: có hay không thì cũng không được chui vào diagnostics.
    const withComparison = all.filter((t) => t.extras.comparison);
    expect(withComparison.length, 'phải còn ít nhất một đề có bảng so sánh để test có nghĩa').toBeGreaterThan(0);
    for (const t of all) {
      if (t.diagnosticsSource === 'file') continue;
      expect(t.diagnostics, `${t.id} không có bảng chẩn đoán riêng nên phải rỗng`).toEqual([]);
    }
    for (const t of withComparison) {
      // bảng so sánh phải nằm ở extras, và tuyệt đối không lẫn sang diagnostics
      expect(t.extras.comparison, t.id).toContain('|');
      for (const d of t.diagnostics) {
        expect(t.extras.comparison, `${t.id}: dòng chẩn đoán trùng nội dung bảng so sánh`).not.toContain(d.advice);
      }
    }
  });

  it('bẫy #31 — `<số> ______` với số không phải số câu thì không phải chỗ trống', () => {
    // ngoài fence, blank phải là số IN ĐẬM; số trần chỉ hợp lệ trong fence
    const outside = toSegments('The trust was registered in 2007 ______', false, [1, 86]);
    expect(outside.filter((s) => s.type === 'blank')).toHaveLength(0);
    // trong fence nhưng số ngoài range của khối → cũng không phải chỗ trống
    const wrongRange = toSegments('   2007 ______   ', true, [71, 74]);
    expect(wrongRange.filter((s) => s.type === 'blank')).toHaveLength(0);
    // và không đề nào parse ra số câu vượt totalQuestions
    for (const t of all) {
      for (const b of t.blocks) {
        for (const q of b.questions) {
          for (const s of q.segments ?? []) {
            if (s.type === 'blank') expect(s.qno!, t.id).toBeLessThanOrEqual(t.totalQuestions);
          }
        }
      }
    }
  });

  it('blockNote in nghiêng được gắn vào đúng khối (N17)', () => {
    const d3 = W1().blocks.find((b) => b.typeIndex === 3)!;
    expect(d3.blockNote).toContain('Tổng kết bẫy dạng này');
    expect(d3.blockNote).toContain('Đây đúng là kiểu bạn hay mất điểm');
  });
});

/* ================================================================== *
 * Hàm thuần
 * ================================================================== */
describe('hàm thuần', () => {
  it('kindFromTypeName dựa vào tên tiếng Anh, không dựa số thứ tự', () => {
    expect(kindFromTypeName('Summary Completion (with a word list)')).toBe('gap-select');
    expect(kindFromTypeName('Summary Completion (words from the passage)')).toBe('gap-text');
    expect(kindFromTypeName('Matching Sentence Endings')).toBe('matching-endings');
    expect(kindFromTypeName('Một dạng chưa từng có')).toBe('unknown');
  });

  it('extractWordLimit bắt được cả biến thể AND/OR A NUMBER', () => {
    expect(extractWordLimit('Choose **NO MORE THAN TWO WORDS** from the passage')).toEqual({
      text: 'NO MORE THAN TWO WORDS',
      count: 2,
    });
    expect(extractWordLimit('Choose **NO MORE THAN THREE WORDS AND/OR A NUMBER** from…').count).toBe(3);
    expect(extractWordLimit('Choose the correct letter').text).toBeUndefined();
  });

  it('expandOptionalParens bung mọi tổ hợp, kể cả 2 nhóm ngoặc', () => {
    expect(expandOptionalParens('(the) Red River delta').sort()).toEqual(['Red River delta', 'the Red River delta']);
    expect(expandOptionalParens('(the) seventh (century)')).toHaveLength(4);
  });

  it('parseAnswerCell — 3 hình dạng ô sau chuẩn hoá', () => {
    expect(parseAnswerCell('**Luy Lâu**').accepted).toEqual(['Luy Lâu']);
    const label = parseAnswerCell('**C** founded');
    expect(label.accepted).toEqual(expect.arrayContaining(['C', 'founded', 'C founded']));
    const two = parseAnswerCell('**A** và **C**');
    expect(two.accepted).toEqual(['A', 'C']);
  });

  it('toSegments — blank số trần chỉ hợp lệ trong fence và phải trong range', () => {
    // ngoài fence: `in 2007 ______` KHÔNG phải chỗ trống (#31 KEEP)
    const outside = toSegments('The trust was registered in 2007 ______', false, [70, 74]);
    expect(outside.filter((s) => s.type === 'blank')).toHaveLength(0);
    // trong fence: số trần hợp lệ nếu nằm trong range
    const inside = toSegments('   71 ______   ', true, [71, 74]);
    expect(inside.filter((s) => s.type === 'blank').map((s) => s.qno)).toEqual([71]);
    // trong fence nhưng ngoài range → không phải chỗ trống
    const out = toSegments('   2007 ______   ', true, [71, 74]);
    expect(out.filter((s) => s.type === 'blank')).toHaveLength(0);
  });

  it('parseThreshold — "Sai ≥ 30%" → 0.3, không bắt được thì 0.3', () => {
    expect(parseThreshold('Sai ≥ 30% nghĩa là')).toBeCloseTo(0.3);
    expect(parseThreshold('Sai ≥ 25% nghĩa là')).toBeCloseTo(0.25);
    expect(parseThreshold('không có phần trăm')).toBeCloseTo(0.3);
  });

  it('bảng chẩn đoán dùng chung phủ khít 1..86', () => {
    const raw = Object.values(DIAG_RAW)[0]!;
    const d = parseDiagnostics(raw.split('\n'));
    expect(d).toHaveLength(5);
    expect(coversExactly(d, 86)).toBe(true);
    expect(coversExactly(d, 40)).toBe(false); // đề khác cấu trúc thì KHÔNG gán bừa
  });
});

/* ================================================================== *
 * "Thêm file mới là có thêm đề" — CLAUDE.md §9.5
 * ================================================================== */
describe('thêm đề mới không cần sửa code', () => {
  it('copy một file mẫu, đổi slug/title → parse ra một đề độc lập', () => {
    const src = RAW[`/test/${files[0]!}`]!;
    const copy = src
      .replace(/^topic_slug: .*$/m, 'topic_slug: copy-2')
      .replace(/^workbook_id: .*$/m, 'workbook_id: 99')
      .replace(/^title: .*$/m, 'title: Đề nhân bản để kiểm thử')
      .replace(/^# .*$/m, '# Đề nhân bản để kiểm thử');
    const t = parseTest(copy, 'copy-2.md');
    expect(t.parseWarnings).toEqual([]);
    expect(t.id).toBe('copy-2');
    expect(t.title).toBe('Đề nhân bản để kiểm thử');
    expect(t.totalQuestions).toBe(load(files[0]!).totalQuestions);
  });
});
