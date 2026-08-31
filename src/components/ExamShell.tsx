/**
 * Khung thi: header + split pane kéo được + thanh điều hướng dưới
 * (CLAUDE.md §6.2).
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

const fmt = (s: number): string => {
  const m = Math.max(0, Math.floor(s / 60));
  const sec = Math.max(0, s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
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
  const [confirm, setConfirm] = useState(false);
  const dragging = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const blocks = useMemo(
    () => (session.onlyTypes ? test.blocks.filter((b) => session.onlyTypes!.includes(b.typeIndex)) : test.blocks),
    [test.blocks, session.onlyTypes]
  );

  const present = useMemo(() => {
    const s = new Set<number>();
    for (const b of blocks) for (let n = b.range[0]; n <= b.range[1]; n++) s.add(n);
    return s;
  }, [blocks]);

  const answered = useMemo(() => {
    const s = new Set<number>();
    for (const [k, v] of Object.entries(session.answers)) {
      if (!v.trim()) continue;
      const n = Number(k);
      s.add(n);
      // mcq-multi: một ô trả lời phủ nhiều số câu
      const b = blocks.find((x) => x.range[0] <= n && n <= x.range[1]);
      const q = b?.questions.find((x) => x.qno === n);
      if (q?.qnos && v.split(',').filter(Boolean).length === q.qnos.length) q.qnos.forEach((x) => s.add(x));
    }
    return s;
  }, [session.answers, blocks]);

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

  const setAnswer = useCallback(
    (qno: number, value: string) => {
      setSession({ ...session, answers: { ...session.answers, [qno]: value } });
      setCurrent(qno);
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
    <div className="flex h-screen flex-col bg-slate-200">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-slate-400 bg-slate-800 px-4 py-2 text-white">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{session.candidate}</div>
          <div className="truncate text-xs text-slate-300">{test.title}</div>
        </div>

        <div
          className={
            'mx-auto rounded px-4 py-1 font-mono text-2xl tabular-nums transition-colors ' +
            (danger ? 'bg-red-600' : warn ? 'bg-amber-500 text-slate-900' : 'bg-slate-700')
          }
          title={exam ? 'Thời gian còn lại' : 'Thời gian đã làm'}
        >
          {fmt(session.seconds)}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex overflow-hidden rounded border border-slate-500">
            {([0, 1, 2] as const).map((n) => (
              <button
                key={n}
                onClick={() => setFontSize(n)}
                className={`px-2 py-1 ${fontSize === n ? 'bg-slate-600' : 'hover:bg-slate-700'}`}
                title="Cỡ chữ"
              >
                {['A', 'A', 'A'][n]}
                <span className={n === 0 ? 'text-[9px]' : n === 1 ? 'text-[11px]' : 'text-[13px]'} />
              </button>
            ))}
          </div>
          <button
            onClick={() => setPaper(paper === 'white' ? 'cream' : 'white')}
            className="rounded border border-slate-500 px-2 py-1 hover:bg-slate-700"
            title="Nền trắng / vàng nhạt"
          >
            {paper === 'white' ? 'Nền trắng' : 'Nền vàng'}
          </button>
          <button onClick={onExit} className="rounded border border-slate-500 px-2 py-1 hover:bg-slate-700">
            Thoát
          </button>
          <button
            onClick={() => setConfirm(true)}
            className="rounded bg-emerald-600 px-3 py-1 font-semibold hover:bg-emerald-500"
          >
            Nộp bài
          </button>
        </div>
      </header>

      {!exam && (
        <div className="bg-emerald-700 px-4 py-1 text-xs text-white">
          Chế độ Luyện — đồng hồ đếm lên, không ép giờ. Khối “Chiến thuật” của mỗi dạng hiện ngay trên câu hỏi.
        </div>
      )}

      {/* Split pane */}
      <div ref={wrapRef} className="flex min-h-0 flex-1">
        <div style={{ width: `${split}%` }} className="min-w-0 border-r border-slate-300">
          <PassagePane
            title={test.passageTitle}
            paragraphs={test.paragraphs}
            highlights={session.highlights}
            onHighlights={(h: Highlight[]) => setSession({ ...session, highlights: h })}
            fontSize={fontSize}
            paper={paper}
          />
        </div>
        <div
          onMouseDown={() => {
            dragging.current = true;
            document.body.style.userSelect = 'none';
          }}
          className="w-1.5 shrink-0 cursor-col-resize bg-slate-300 transition hover:bg-sky-400"
          title="Kéo để chỉnh tỉ lệ"
        />
        <div style={{ width: `${100 - split}%` }} className="min-w-0">
          <QuestionPane
            blocks={blocks}
            values={session.answers}
            flagged={new Set(session.flagged)}
            onChange={setAnswer}
            onFlag={toggleFlag}
            showStrategy={!exam}
            fontSize={fontSize}
            paper={paper}
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

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-lg font-bold">Nộp bài?</h3>
            <p className="mb-4 text-sm text-slate-700">
              {unanswered > 0 ? (
                <>
                  Còn <b className="text-red-600">{unanswered}</b> câu chưa trả lời.
                </>
              ) : (
                'Bạn đã trả lời tất cả các câu.'
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(false)} className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
                Quay lại
              </button>
              <button
                onClick={() => {
                  setConfirm(false);
                  onSubmit();
                }}
                className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
