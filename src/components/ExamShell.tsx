/**
 * Khung thi: header + split pane kéo được + thanh điều hướng dưới
 * (CLAUDE.md §6.2).
 *
 * `data-read-size` và `data-paper` đặt ở phần tử gốc của khung, nên cỡ chữ vùng
 * đọc và nền giấy áp cho **toàn khung** — header, dialog, thanh dưới — chứ không
 * chỉ hai pane (CLAUDE.md §13.5).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LoadedTest } from '../lib/tests';
import type { Highlight, SessionState } from '../lib/storage';
import { saveSession } from '../lib/storage';
import BottomNav from './BottomNav';
import PassagePane from './PassagePane';
import QuestionPane from './QuestionPane';

interface Props {
  test: LoadedTest;
  session: SessionState;
  setSession: (s: SessionState) => void;
  onSubmit: () => void;
  onExit: () => void;
  fontSize: 0 | 1 | 2;
  setFontSize: (n: 0 | 1 | 2) => void;
  paper: 'white' | 'cream';
  setPaper: (p: 'white' | 'cream') => void;
}

/** `mm:ss`, đổi sang `h:mm:ss` khi từ một tiếng trở lên — 120 phút đọc thành
 *  `2:00:00` chứ không phải `120:00` (audit D9). */
const fmt = (s: number): string => {
  const t = Math.max(0, s);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function ExamShell({
  test,
  session,
  setSession,
  onSubmit,
  onExit,
  fontSize,
  setFontSize,
  paper,
  setPaper,
}: Props): JSX.Element {
  const [split, setSplit] = useState(50);
  const [current, setCurrent] = useState<number | null>(null);
  const dragging = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const blocks = useMemo(
    () => (session.onlyTypes ? test.blocks.filter((b) => session.onlyTypes!.includes(b.typeIndex)) : test.blocks),
    [test.blocks, session.onlyTypes]
  );

  const present = useMemo(() => {
    const s = new Set<number>();
    for (const b of blocks) for (let n = b.range[0]; n <= b.range[1]; n++) s.add(n);
    return s;
  }, [blocks]);

  // Mọi dạng, kể cả mcq-multi, đều ghi MỘT giá trị cho MỘT số câu
  // (xem McqMultiQuestion), nên không cần tách chuỗi gì ở đây nữa.
  const answered = useMemo(() => {
    const s = new Set<number>();
    for (const [k, v] of Object.entries(session.answers)) if (v.trim()) s.add(Number(k));
    return s;
  }, [session.answers]);

  const unanswered = [...present].filter((n) => !answered.has(n)).length;

  /* ---- đồng hồ ---------------------------------------------------- */
  useEffect(() => {
    if (session.submitted) return;
    const id = window.setInterval(() => {
      setSession({
        ...session,
        seconds: session.mode === 'exam' ? session.seconds - 1 : session.seconds + 1,
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [session, setSession]);

  // Hết giờ tự nộp
  useEffect(() => {
    if (session.mode === 'exam' && session.seconds <= 0 && !session.submitted) onSubmit();
  }, [session.mode, session.seconds, session.submitted, onSubmit]);

  /* ---- tự lưu ----------------------------------------------------- */
  useEffect(() => {
    saveSession(session);
  }, [session]);

  /* ---- kéo thanh chia -------------------------------------------- */
  useEffect(() => {
    const move = (e: MouseEvent): void => {
      if (!dragging.current || !wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      setSplit(Math.min(80, Math.max(20, pct)));
    };
    const up = (): void => {
      dragging.current = false;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  /** Mũi tên trái/phải chỉnh tỉ lệ, Home/End về 20/80 — thanh chia phải dùng
   *  được bằng bàn phím như mọi điều khiển khác (audit D8). */
  const onSplitKey = useCallback((e: React.KeyboardEvent): void => {
    const step = e.shiftKey ? 10 : 2;
    const map: Record<string, (v: number) => number> = {
      ArrowLeft: (v) => v - step,
      ArrowRight: (v) => v + step,
      Home: () => 20,
      End: () => 80,
    };
    const f = map[e.key];
    if (!f) return;
    e.preventDefault();
    setSplit((v) => Math.min(80, Math.max(20, f(v))));
  }, []);

  const setAnswer = useCallback(
    (qno: number, value: string) => {
      setSession({ ...session, answers: { ...session.answers, [qno]: value } });
      setCurrent(qno);
    },
    [session, setSession]
  );

  /**
   * Ghi nhiều số câu trong MỘT lần cập nhật.
   *
   * mcq-multi phải đặt một chữ cái cho mỗi số câu nó chiếm. Gọi `setAnswer` hai
   * lần liên tiếp thì lần sau dựng từ `session` cũ trong closure và xoá mất lần
   * trước — nên phải gộp lại thành một lần.
   */
  const setAnswers = useCallback(
    (updates: Record<number, string>) => {
      setSession({ ...session, answers: { ...session.answers, ...updates } });
      const first = Object.keys(updates)[0];
      if (first !== undefined) setCurrent(Number(first));
    },
    [session, setSession]
  );

  const toggleFlag = useCallback(
    (qno: number) => {
      const has = session.flagged.includes(qno);
      setSession({
        ...session,
        flagged: has ? session.flagged.filter((x) => x !== qno) : [...session.flagged, qno],
      });
    },
    [session, setSession]
  );

  const jump = useCallback((qno: number) => {
    setCurrent(qno);
    const el = document.getElementById(`q-${qno}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true });
    }
  }, []);

  const exam = session.mode === 'exam';
  const warn = exam && session.seconds <= 600;
  const danger = exam && session.seconds <= 300;

  return (
    <div
      data-read-size={fontSize}
      data-paper={paper}
      className="flex h-screen flex-col bg-surface-2 text-ink"
    >
      {/* ---- Header ---------------------------------------------- */}
      <header className="on-chrome flex items-center gap-4 bg-chrome px-4 py-2 text-chrome-fg">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{session.candidate}</div>
          <div className="flex items-center gap-2 truncate text-sm text-chrome-fg-2">
            <span className="truncate">{test.title}</span>
            {!exam && (
              <span className="shrink-0 rounded bg-study px-1.5 py-0.5 text-xs font-semibold text-white">
                Luyện
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center">
          <span className="text-xs text-chrome-fg-2">{exam ? 'Còn lại' : 'Đã làm'}</span>
          <span
            role="timer"
            aria-live="off"
            className={
              'rounded px-3 py-0.5 font-mono text-2xl font-semibold tabular-nums transition-colors ' +
              (danger ? 'bg-bad text-white' : warn ? 'bg-warn text-white' : 'bg-chrome-2 text-chrome-fg')
            }
          >
            {fmt(session.seconds)}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div
            role="radiogroup"
            aria-label="Cỡ chữ"
            className="flex overflow-hidden rounded border border-chrome-line"
          >
            {([0, 1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={fontSize === n}
                aria-label={['Cỡ chữ nhỏ', 'Cỡ chữ vừa', 'Cỡ chữ lớn'][n]}
                onClick={() => setFontSize(n)}
                className={
                  'w-8 py-1 font-serif leading-none ' +
                  (['text-xs', 'text-base', 'text-lg'][n] ?? '') +
                  (fontSize === n ? ' bg-chrome-2 font-bold' : ' hover:bg-chrome-2/60')
                }
              >
                A
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-pressed={paper === 'cream'}
            onClick={() => setPaper(paper === 'white' ? 'cream' : 'white')}
            className="rounded border border-chrome-line px-2 py-1 text-base hover:bg-chrome-2"
          >
            {paper === 'white' ? 'Nền trắng' : 'Nền vàng'}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded border border-chrome-line px-2 py-1 text-base hover:bg-chrome-2"
          >
            Thoát
          </button>
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="rounded bg-ok px-3 py-1 text-base font-semibold text-white hover:brightness-110"
          >
            Nộp bài
          </button>
        </div>
      </header>

      {/* ---- Split pane ------------------------------------------ */}
      <div ref={wrapRef} className="flex min-h-0 flex-1">
        <div style={{ width: `${split}%` }} className="min-w-0">
          <PassagePane
            title={test.passageTitle}
            lang={test.frontmatter?.passage_language ?? 'en'}
            paragraphs={test.paragraphs}
            highlights={session.highlights}
            onHighlights={(h: Highlight[]) => setSession({ ...session, highlights: h })}
          />
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Tỉ lệ chia bài đọc và câu hỏi"
          aria-valuenow={Math.round(split)}
          aria-valuemin={20}
          aria-valuemax={80}
          tabIndex={0}
          onKeyDown={onSplitKey}
          onMouseDown={() => {
            dragging.current = true;
            document.body.style.userSelect = 'none';
          }}
          className="w-1.5 shrink-0 cursor-col-resize bg-line transition-colors hover:bg-accent"
          title="Kéo, hoặc dùng mũi tên trái/phải, để chỉnh tỉ lệ"
        />

        <div style={{ width: `${100 - split}%` }} className="min-w-0">
          <QuestionPane
            blocks={blocks}
            values={session.answers}
            flagged={new Set(session.flagged)}
            onChange={setAnswer}
            onChangeMany={setAnswers}
            onFlag={toggleFlag}
            showStrategy={!exam}
            paragraphLabels={test.paragraphs.map((p) => p.label)}
          />
        </div>
      </div>

      <BottomNav
        total={test.totalQuestions}
        present={present}
        answered={answered}
        flagged={new Set(session.flagged)}
        current={current}
        onJump={jump}
      />

      {/* ---- Xác nhận nộp bài ------------------------------------ */}
      <SubmitDialog
        dialogRef={dialogRef}
        unanswered={unanswered}
        total={present.size}
        onConfirm={() => {
          dialogRef.current?.close();
          onSubmit();
        }}
      />
    </div>
  );
}

/**
 * `<dialog>` mở bằng `showModal()`: trình duyệt lo sẵn bẫy focus, đóng bằng Esc
 * và lớp phủ `::backdrop` (audit F5). `closedby="any"` thêm light-dismiss ở
 * trình duyệt hỗ trợ; nơi chưa hỗ trợ thì thuộc tính bị bỏ qua, Esc vẫn chạy.
 */
function SubmitDialog({
  dialogRef,
  unanswered,
  total,
  onConfirm,
}: {
  dialogRef: React.RefObject<HTMLDialogElement>;
  unanswered: number;
  total: number;
  onConfirm: () => void;
}): JSX.Element {
  return (
    <dialog
      ref={dialogRef}
      /* `closedby="any"` thêm light-dismiss ở trình duyệt hỗ trợ; nơi chưa hỗ trợ
         thì thuộc tính bị bỏ qua và Esc vẫn đóng được. */
      closedby="any"
      aria-labelledby="submit-title"
      className="card m-auto w-full max-w-sm p-5 text-ink shadow-dialog backdrop:bg-black/45"
    >
      <h2 id="submit-title" className="text-lg font-bold">
        Nộp bài?
      </h2>
      <p className="mt-2 text-base text-ink-2">
        {unanswered > 0 ? (
          <>
            Còn <b className="font-semibold text-bad">{unanswered}</b> trên {total} câu chưa trả lời. Nộp rồi thì
            không quay lại sửa được.
          </>
        ) : (
          <>Đã trả lời đủ {total} câu.</>
        )}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => dialogRef.current?.close()} className="btn btn-quiet">
          Quay lại làm tiếp
        </button>
        <button type="button" onClick={onConfirm} className="btn btn-go">
          Nộp bài
        </button>
      </div>
    </dialog>
  );
}
