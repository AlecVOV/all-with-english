/**
 * Test chấm điểm — các ca ở CLAUDE.md §9.4, dữ liệu lấy từ file thật.
 */

import { describe, expect, it } from 'vitest';
import { parseTest } from '../../parser';
import type { AnswerKey, ParsedTest } from '../../parser/types';
import { bandFromPercent, checkOne, countWords, grade, normalize, stripDiacritics } from '../grading';

/* Nạp corpus bằng đúng cơ chế app dùng — không cần @types/node. */
const RAW = import.meta.glob('/test/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const all: ParsedTest[] = Object.entries(RAW).map(([p, raw]) => parseTest(raw, p.split('/').pop()!));
const byId = (id: string) => all.find((t) => t.id === id)!;

const W1 = byId('buddhism-transmission-asia');
const W3 = byId('vietnam-esoteric-buddhism');

const blockFor = (t: ParsedTest, qno: number) => t.blocks.find((b) => b.range[0] <= qno && qno <= b.range[1]);
const check = (t: ParsedTest, qno: number, given: string) => checkOne(given, t.answers[qno], blockFor(t, qno));

describe('chuẩn hoá', () => {
  it('bỏ hoa/thường, khoảng trắng thừa, dấu câu hai đầu', () => {
    expect(normalize('  The  Ganges. ')).toBe('the ganges');
    expect(normalize('"begging bowl"')).toBe('begging bowl');
  });

  it('coi mọi loại gạch nối như nhau', () => {
    expect(normalize('non–action')).toBe(normalize('non-action'));
    expect(normalize('non—action')).toBe(normalize('non-action'));
  });

  it('bỏ dấu phân cách nghìn nhưng giữ số', () => {
    expect(normalize('130,000')).toBe('130000');
  });

  it('stripDiacritics xử lý đ/Đ', () => {
    expect(stripDiacritics('Đinh Liễn')).toBe('Dinh Lien');
  });

  it('countWords coi gạch nối là ranh giới từ', () => {
    expect(countWords('flow-chart completion')).toBe(3);
    expect(countWords('  ')).toBe(0);
  });
});

describe('các ca bắt buộc ở §9.4', () => {
  it('câu 64 (#3) nhận cả "two hundred" lẫn "200"', () => {
    expect(W3.answers[64]!.display).toContain('two hundred');
    expect(check(W3, 64, 'two hundred').verdict).toBe('correct');
    expect(check(W3, 64, '200').verdict).toBe('correct');
    expect(check(W3, 64, 'three hundred').verdict).toBe('wrong');
  });

  it('câu 86 (#1) nhận Dunhuang / at Dunhuang / a sealed chamber', () => {
    expect(check(W1, 86, 'Dunhuang').verdict).toBe('correct');
    expect(check(W1, 86, 'at Dunhuang').verdict).toBe('correct');
    expect(check(W1, 86, 'a sealed chamber').verdict).toBe('correct');
    expect(check(W1, 86, 'Chang’an').verdict).toBe('wrong');
  });

  it('câu 79–80 không xét thứ tự', () => {
    const key = W1.answers[79]!;
    expect(key.accepted.sort()).toEqual(['B', 'D']);
    expect(W1.answers[80]!.accepted.sort()).toEqual(['B', 'D']);
    // hai số câu chia nhau cùng tập đáp án, chọn cái nào trước cũng được
    expect(check(W1, 79, 'B').verdict).toBe('correct');
    expect(check(W1, 79, 'D').verdict).toBe('correct');
    expect(check(W1, 80, 'D').verdict).toBe('correct');
  });

  it('gõ không dấu "Luy Lau" vẫn đúng', () => {
    const q = (Object.values(W3.answers) as AnswerKey[]).find((a) => a.display.includes('Luy Lâu'));
    expect(q, 'phải có một câu đáp án Luy Lâu').toBeDefined();
    expect(check(W3, q!.qno, 'Luy Lau').verdict).toBe('correct');
    expect(check(W3, q!.qno, 'luy lâu').verdict).toBe('correct');
  });

  it('đáp án "chữ cái + nhãn" nhận cả hai (D9)', () => {
    // W1 câu 50: `**B** philosophical`
    expect(check(W1, 50, 'B').verdict).toBe('correct');
    expect(check(W1, 50, 'philosophical').verdict).toBe('correct');
    expect(check(W1, 50, 'A').verdict).toBe('wrong');
  });

  it('ngoặc tuỳ chọn: chấp nhận cả có lẫn không', () => {
    // W1 câu 83: `**(in) Sri Lanka**`
    expect(check(W1, 83, 'Sri Lanka').verdict).toBe('correct');
    expect(check(W1, 83, 'in Sri Lanka').verdict).toBe('correct');
  });
});

describe('wordLimit', () => {
  it('vượt số từ → sai, và ghi rõ lý do', () => {
    const r = check(W1, 40, 'a very old begging bowl'); // giới hạn 2 từ
    expect(r.verdict).toBe('over-limit');
    expect(r.reason).toContain('quá số từ cho phép');
  });

  it('đúng nội dung nhưng quá số từ vẫn 0 điểm, và nói rõ điều đó', () => {
    const r = check(W1, 40, 'the begging bowl of a monk');
    expect(r.verdict).toBe('over-limit');
    expect(r.reason).toContain('quá số từ');
  });

  it('bỏ trống là "blank", không phải "wrong"', () => {
    expect(check(W1, 40, '').verdict).toBe('blank');
    expect(check(W1, 40, '   ').verdict).toBe('blank');
  });
});

describe('band ước lượng', () => {
  it('quy về phần trăm rồi mới tra bảng', () => {
    expect(bandFromPercent(1)).toBe('9.0');
    expect(bandFromPercent(0.875)).toBe('8.0');
    expect(bandFromPercent(0.75)).toBe('7.0');
    expect(bandFromPercent(0.5)).toBe('5.5');
    expect(bandFromPercent(0.05)).toBe('< 3.0');
  });
});

describe('grade tổng thể', () => {
  it('bài trống → 0 điểm, mọi câu là blank, đủ số dạng', () => {
    const s = grade(W1, {});
    expect(s.raw).toBe(0);
    expect(s.total).toBe(W1.totalQuestions);
    expect(s.byQuestion).toHaveLength(W1.totalQuestions);
    expect(s.byQuestion.every((r) => r.verdict === 'blank')).toBe(true);
    expect(s.byType).toHaveLength(W1.blocks.length);
  });

  it('điền toàn bộ đáp án đúng → điểm tuyệt đối trên mọi file', () => {
    for (const t of all) {
      const answers: Record<number, string> = {};
      for (const [k, v] of Object.entries(t.answers) as [string, AnswerKey][]) {
        const qno = Number(k);
        const limit = blockFor(t, qno)?.wordLimitCount;
        // Thí sinh thật sẽ viết biến thể ngắn nhất hợp lệ. `(the) Red River delta`
        // bung ra cả "the Red River delta" (4 từ) lẫn "Red River delta" (3 từ);
        // với giới hạn 3 từ thì chỉ biến thể sau mới ăn điểm.
        answers[qno] = (limit ? v.accepted.find((a) => countWords(a) <= limit) : undefined) ?? v.accepted[0]!;
      }
      const s = grade(t, answers);
      expect(s.raw, `${t.id}: ${s.byQuestion.filter((r) => r.verdict !== 'correct').map((r) => r.qno).join(',')}`).toBe(
        t.totalQuestions
      );
      expect(s.percent).toBe(1);
      expect(s.band).toBe('9.0');
    }
  });

  it('byType xếp được dạng yếu nhất lên đầu', () => {
    const answers: Record<number, string> = {};
    for (const [k, v] of Object.entries(W1.answers) as [string, AnswerKey][]) answers[Number(k)] = v.accepted[0]!;
    // cố tình làm sai toàn bộ dạng 1
    for (let n = 1; n <= 8; n++) answers[n] = 'sai hết';
    const s = grade(W1, answers);
    const weakest = [...s.byType].sort((a, b) => a.ratio - b.ratio)[0]!;
    expect(weakest.typeIndex).toBe(1);
    expect(weakest.correct).toBe(0);
  });
});
