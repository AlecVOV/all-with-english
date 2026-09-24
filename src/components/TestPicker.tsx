/**
 * Màn chọn đề + màn bắt đầu (CLAUDE.md §6.1).
 * Đề nào có parseWarnings → banner cảnh báo, ghi rõ file nào thiếu câu nào.
 */

import { useState } from 'react';
import type { LoadedTest } from '../lib/tests';
import { mdIntro } from '../lib/markdown';
import { loadSession } from '../lib/storage';

interface Props {
  tests: LoadedTest[];
  onStart: (test: LoadedTest, mode: 'exam' | 'practice', minutes: number, candidate: string) => void;
  onResume: (test: LoadedTest) => void;
}

export default function TestPicker({ tests, onStart, onResume }: Props): JSX.Element {
  const [picked, setPicked] = useState<LoadedTest | null>(null);
  const [mode, setMode] = useState<'exam' | 'practice'>('practice'); // mặc định Luyện
  const [minutes, setMinutes] = useState(120);
  const [custom, setCustom] = useState('');
  const [candidate, setCandidate] = useState('Candidate');

  if (!picked) return <PickList tests={tests} onPick={setPicked} onResume={onResume} />;

  const mins = custom ? Math.max(1, Number(custom) || 0) : minutes;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <button onClick={() => setPicked(null)} className="mb-4 text-base text-accent hover:underline">
        ← Chọn đề khác
      </button>

      <h1 className="text-xl font-bold">{picked.title}</h1>
      <p className="mt-0.5 text-md text-ink-2">{picked.passageTitle}</p>

      {picked.intro && (
        <div
          className="prose-md card mt-5 p-4 text-base text-ink-2"
          dangerouslySetInnerHTML={{ __html: mdIntro(picked.intro) }}
        />
      )}

      <div className="card mt-4 divide-y divide-line">
        <Row label="Tên thí sinh" htmlFor="candidate">
          <input
            id="candidate"
            className="field w-full max-w-xs"
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
          />
        </Row>

        <Row label="Chế độ">
          <div role="radiogroup" aria-label="Chế độ làm bài" className="grid gap-2 sm:grid-cols-2">
            <ModeCard
              on={mode === 'practice'}
              onClick={() => setMode('practice')}
              title="Luyện"
              hint="mặc định"
              desc="Hiện khối Chiến thuật của dạng đang làm. Đồng hồ đếm lên, không ép giờ. Đáp án vẫn ẩn cho tới khi nộp."
            />
            <ModeCard
              on={mode === 'exam'}
              onClick={() => setMode('exam')}
              title="Thi"
              desc="Mô phỏng CD-IELTS: không chiến thuật, đồng hồ đếm ngược, hết giờ tự nộp."
            />
          </div>
        </Row>

        {mode === 'exam' && (
          <Row label="Thời gian">
            <div className="flex flex-wrap items-center gap-2">
              {[60, 120].map((m) => {
                const on = !custom && minutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setMinutes(m);
                      setCustom('');
                    }}
                    className={'btn ' + (on ? 'btn-primary' : 'btn-quiet')}
                  >
                    {m} phút
                  </button>
                );
              })}
              <span className="flex items-center gap-1.5">
                <input
                  id="custom-minutes"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="—"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="field w-20 text-center tabular-nums"
                  aria-label="Thời gian tự nhập, tính bằng phút"
                />
                <label htmlFor="custom-minutes" className="text-base text-ink-2">
                  phút
                </label>
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-2">
              Đề này có {picked.totalQuestions} câu — nhiều hơn một passage thi thật, nên hãy chọn giờ rộng tay.
            </p>
          </Row>
        )}
      </div>

      <button
        onClick={() => onStart(picked, mode, mins, candidate.trim() || 'Candidate')}
        className="btn btn-primary mt-5 px-6 py-2.5 text-md"
      >
        Vào làm bài
      </button>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function PickList({
  tests,
  onPick,
  onResume,
}: {
  tests: LoadedTest[];
  onPick: (t: LoadedTest) => void;
  onResume: (t: LoadedTest) => void;
}): JSX.Element {
  const broken = tests.filter((t) => t.parseWarnings.length);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-bold">IELTS Academic Reading</h1>
      <p className="mt-1 text-base text-ink-2">
        {tests.length} đề đang có trong <code className="rounded bg-surface-3 px-1">test/</code>. Thả thêm một file{' '}
        <code className="rounded bg-surface-3 px-1">.md</code> vào đó rồi tải lại trang là có thêm đề.
      </p>

      {broken.length > 0 && (
        <section className="mt-5 rounded-md border border-warn-line bg-warn-soft p-3 text-base">
          <h2 className="font-semibold text-warn">Có đề chưa parse sạch</h2>
          <p className="mt-1 text-ink-2">
            Đề vẫn làm được, nhưng có thể thiếu câu hoặc thiếu đáp án. Chạy{' '}
            <code className="rounded bg-surface-3 px-1">npm run validate</code> để xem đầy đủ.
          </p>
          <ul className="mt-2 space-y-2">
            {broken.map((t) => (
              <li key={t.id}>
                <code className="font-semibold">{t.sourceFile}</code>
                <ul className="ml-4 mt-0.5 list-disc space-y-0.5 text-ink-2">
                  {t.parseWarnings.slice(0, 8).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                  {t.parseWarnings.length > 8 && <li>… và {t.parseWarnings.length - 8} cảnh báo nữa</li>}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="mt-5 space-y-2">
        {tests.map((t) => {
          const saved = loadSession(t.id);
          const inProgress = saved && !saved.submitted;
          const done = inProgress ? Object.values(saved.answers).filter((v) => v.trim()).length : 0;
          return (
            <li
              key={t.id}
              className="card relative flex items-center gap-4 px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-3/60"
            >
              <div className="min-w-0 flex-1">
                <h2 className="flex items-baseline gap-2 text-lg font-semibold">
                  {t.frontmatter && (
                    <span className="shrink-0 text-base font-normal tabular-nums text-ink-3">
                      {t.frontmatter.workbook_id}
                    </span>
                  )}
                  {/* Cả thẻ là vùng bấm: ::after phủ kín thẻ, nhưng vẫn là <button> thật
                      nên Tab / Enter vẫn dùng được. */}
                  <button
                    onClick={() => onPick(t)}
                    className="truncate text-left after:absolute after:inset-0 after:content-[''] hover:text-accent"
                  >
                    {t.title}
                  </button>
                </h2>
                <p className="mt-0.5 truncate text-base text-ink-2">{t.passageTitle}</p>
                <p className="mt-1 flex flex-wrap gap-x-4 text-sm tabular-nums text-ink-3">
                  <span>{t.totalQuestions} câu</span>
                  <span>{t.blocks.length} dạng</span>
                  {t.frontmatter && <span>{t.frontmatter.passage_word_count} từ</span>}
                  {t.parseWarnings.length > 0 && (
                    <span className="font-medium text-warn">{t.parseWarnings.length} cảnh báo</span>
                  )}
                </p>
              </div>

              {inProgress && (
                <button onClick={() => onResume(t)} className="btn btn-quiet relative z-10 shrink-0">
                  Làm tiếp
                  <span className="text-sm font-normal tabular-nums text-ink-2">
                    {done}/{t.totalQuestions}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}): JSX.Element {
  const Label = htmlFor ? 'label' : 'span';
  return (
    <div className="p-4">
      <Label
        {...(htmlFor ? { htmlFor } : {})}
        className="mb-2 block text-base font-semibold text-ink"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function ModeCard({
  on,
  onClick,
  title,
  hint,
  desc,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
  desc: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={
        'flex h-full flex-col rounded-md border p-3 text-left transition-colors ' +
        (on ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong hover:bg-surface-3/60')
      }
    >
      <span className="flex items-center gap-1.5 font-semibold">
        <span
          aria-hidden="true"
          className={
            'grid h-4 w-4 shrink-0 place-items-center rounded-full border ' +
            (on ? 'border-accent bg-accent' : 'border-line-field')
          }
        >
          {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        {title}
        {hint && <span className="text-sm font-normal text-ink-3">({hint})</span>}
      </span>
      <span className="mt-1.5 text-base leading-snug text-ink-2">{desc}</span>
    </button>
  );
}
