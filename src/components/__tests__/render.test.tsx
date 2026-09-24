/**
 * Smoke test giao diện: render thật cây React bằng `react-dom/server` và soi
 * HTML sinh ra. Không cần trình duyệt, không thêm thư viện nào.
 *
 * Mục tiêu: bắt lỗi runtime (undefined, sai kiểu, vỡ vòng lặp) mà `tsc` không
 * thấy — chứ không phải test pixel.
 */

import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { tests } from '../../lib/tests';
import { grade } from '../../lib/grading';
import type { SessionState } from '../../lib/storage';
import ExamShell from '../ExamShell';
import QuestionPane from '../QuestionPane';
import ReviewScreen from '../ReviewScreen';
import TestPicker from '../TestPicker';

const noop = (): void => {};
const t0 = tests[0]!;

const session = (over: Partial<SessionState> = {}): SessionState => ({
  testId: t0.id,
  mode: 'practice',
  candidate: 'Thí sinh Kiểm Thử',
  answers: {},
  flagged: [],
  highlights: [],
  seconds: 0,
  submitted: false,
  updatedAt: 0,
  ...over,
});

describe('nạp đề', () => {
  it('import.meta.glob nhặt được mọi file trong test/', () => {
    expect(tests.length).toBeGreaterThanOrEqual(5);
    expect(tests.every((t) => t.totalQuestions > 0)).toBe(true);
  });

  it('sắp xếp theo workbook_id', () => {
    const ids = tests.map((t) => t.frontmatter!.workbook_id);
    expect([...ids].sort((a, b) => a - b)).toEqual(ids);
  });

  it('đề không có bảng riêng thì rơi về bảng chẩn đoán dùng chung', () => {
    const w1 = tests.find((t) => t.id === 'buddhism-transmission-asia')!;
    const w2 = tests.find((t) => t.id === 'tibetan-buddhism-today')!;
    expect(w1.diagnosticsSource).toBe('file');
    expect(w2.diagnosticsSource).toBe('default');
    expect(w2.diagnostics.length).toBe(5);
  });
});

describe('TestPicker', () => {
  it('liệt kê mọi đề, không có banner lỗi parse', () => {
    const html = renderToStaticMarkup(<TestPicker tests={tests} onStart={noop} onResume={noop} />);
    for (const t of tests) expect(html).toContain(t.title);
    expect(html).not.toContain('Có đề chưa parse sạch');
    // mỗi đề có đúng một nút mở đề (tiêu đề thẻ chính là nút)
    for (const t of tests) expect(html).toContain(`>${t.title}</button>`);
  });
});

describe('QuestionPane — mọi dạng render được', () => {
  it.each(tests.map((t) => [t.id, t] as const))('%s: đủ 16 khối, đủ input cho mọi câu', (_id, t) => {
    const html = renderToStaticMarkup(
      <QuestionPane
        blocks={t.blocks}
        values={{}}
        flagged={new Set()}
        onChange={noop}
        onFlag={noop}
        showStrategy
      />
    );
    // mỗi khối có tiêu đề dải câu
    for (const b of t.blocks) expect(html).toContain(`Questions ${b.range[0]}–${b.range[1]}`);
    // mỗi số câu có đúng một ô nhập / chọn mang data-qno
    for (let n = 1; n <= t.totalQuestions; n++) {
      const hits = html.split(`data-qno="${n}"`).length - 1;
      expect(hits, `câu ${n} phải có đúng 1 ô điều khiển, đang có ${hits}`).toBe(1);
    }
  });

  it('chế độ Thi KHÔNG hiện chiến thuật; chế độ Luyện thì có', () => {
    const exam = renderToStaticMarkup(
      <QuestionPane blocks={t0.blocks} values={{}} flagged={new Set()} onChange={noop} onFlag={noop}
        showStrategy={false} />
    );
    const practice = renderToStaticMarkup(
      <QuestionPane blocks={t0.blocks} values={{}} flagged={new Set()} onChange={noop} onFlag={noop}
        showStrategy />
    );
    expect(exam).not.toContain('Chiến thuật');
    expect(practice).toContain('Chiến thuật');
  });

  it('khung ASCII của gap-flow/gap-diagram giữ nguyên trong <pre>', () => {
    const html = renderToStaticMarkup(
      <QuestionPane blocks={t0.blocks} values={{}} flagged={new Set()} onChange={noop} onFlag={noop}
        showStrategy={false} />
    );
    expect(html).toContain('<pre');
    expect(html).toContain('│'); // viền khung phải còn nguyên
  });
});

describe('ExamShell', () => {
  it('header hiện tên thí sinh, tên đề và đồng hồ', () => {
    const html = renderToStaticMarkup(
      <ExamShell test={t0} session={session()} setSession={noop} onSubmit={noop} onExit={noop}
        fontSize={1} setFontSize={noop} paper="white" setPaper={noop} />
    );
    expect(html).toContain('Thí sinh Kiểm Thử');
    expect(html).toContain(t0.title);
    expect(html).toContain('00:00');
    expect(html).toContain('Nộp bài');
  });

  it('chế độ Thi đếm ngược từ đúng số phút đã chọn', () => {
    const html = renderToStaticMarkup(
      <ExamShell test={t0} session={session({ mode: 'exam', seconds: 120 * 60, limitSeconds: 120 * 60 })}
        setSession={noop} onSubmit={noop} onExit={noop}
        fontSize={1} setFontSize={noop} paper="white" setPaper={noop} />
    );
    expect(html).toContain('2:00:00');
    expect(html).toContain('Còn lại');
    // chế độ Thi không được lộ bất cứ dấu vết nào của chế độ Luyện
    expect(html).not.toContain('Chiến thuật');
  });

  it('thanh điều hướng dưới có đủ ô số cho mọi câu', () => {
    const html = renderToStaticMarkup(
      <ExamShell test={t0} session={session()} setSession={noop} onSubmit={noop} onExit={noop}
        fontSize={1} setFontSize={noop} paper="white" setPaper={noop} />
    );
    for (const n of [1, 45, t0.totalQuestions]) expect(html).toContain(`Câu ${n}`);
  });

  it('onlyTypes chỉ hiện các khối được chọn (làm lại dạng sai)', () => {
    const html = renderToStaticMarkup(
      <ExamShell test={t0} session={session({ onlyTypes: [3] })} setSession={noop} onSubmit={noop} onExit={noop}
        fontSize={1} setFontSize={noop} paper="white" setPaper={noop} />
    );
    const d3 = t0.blocks.find((b) => b.typeIndex === 3)!;
    const d1 = t0.blocks.find((b) => b.typeIndex === 1)!;
    expect(html).toContain(`Questions ${d3.range[0]}–${d3.range[1]}`);
    expect(html).not.toContain(`Questions ${d1.range[0]}–${d1.range[1]}`);
  });
});

describe('ReviewScreen', () => {
  const perfect = (): Record<number, string> => {
    const a: Record<number, string> = {};
    for (const [k, v] of Object.entries(t0.answers)) a[Number(k)] = v.accepted[0]!;
    return a;
  };

  it('bài trống: hiện 0 điểm, chẩn đoán bật, và trả lại chiến thuật', () => {
    const score = grade(t0, {});
    const html = renderToStaticMarkup(
      <ReviewScreen test={t0} score={score} onRetryTypes={noop} onExit={noop} />
    );
    expect(html).toContain('Điểm thô');
    expect(html).toContain(`/${t0.totalQuestions}`);
    // phải nói rõ đây chỉ là ước lượng, cả ở nhãn lẫn ở phần giải thích
    expect(html).toContain('Band ước lượng');
    expect(html).toContain('<b>ước lượng</b>');
    expect(html).toContain('Chiến thuật cho những dạng bạn vừa sai');
    expect(html).toContain('Làm lại');
    // sai hết ⇒ mọi nhóm chẩn đoán đều vượt ngưỡng
    expect(html).toContain('Chẩn đoán');
  });

  it('bài đúng hết: không còn câu sai, không nhắc lại chiến thuật', () => {
    const score = grade(t0, perfect());
    expect(score.raw).toBe(t0.totalQuestions);
    const html = renderToStaticMarkup(
      <ReviewScreen test={t0} score={score} onRetryTypes={noop} onExit={noop} />
    );
    expect(html).toContain('Câu sai (0)');
    expect(html).toContain('Không dạng nào dưới 80%');
  });

  it('có tab Vocabulary và Paraphrase Pairs khi file có hai mục đó', () => {
    const html = renderToStaticMarkup(
      <ReviewScreen test={t0} score={grade(t0, {})} onRetryTypes={noop} onExit={noop} />
    );
    expect(html).toContain('Vocabulary');
    expect(html).toContain('Paraphrase Pairs');
  });

  it('nguồn chẩn đoán "default" được nói rõ trên UI', () => {
    const w2 = tests.find((t) => t.id === 'tibetan-buddhism-today')!;
    const html = renderToStaticMarkup(
      <ReviewScreen test={w2} score={grade(w2, {})} onRetryTypes={noop} onExit={noop} />
    );
    expect(html).toContain('lời khuyên chung cho mọi đề');
  });
});
