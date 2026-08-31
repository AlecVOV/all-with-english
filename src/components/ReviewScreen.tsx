/**
 * Màn hình kết quả (CLAUDE.md §6.3) — nơi toàn bộ nội dung học tập trong file
 * được trả lại cho người dùng.
 */

import { useMemo, useState } from 'react';
import type { LoadedTest } from '../lib/tests';
import type { Score } from '../lib/grading';
import { diagnose } from '../lib/diagnose';
import { md } from '../lib/markdown';

interface Props {
  test: LoadedTest;
  score: Score;
  onRetryTypes: (typeIndexes: number[]) => void;
  onExit: () => void;
}

type Tab = 'result' | 'wrong' | 'vocab' | 'paraphrase';

export default function ReviewScreen({ test, score, onRetryTypes, onExit }: Props): JSX.Element {
  const [tab, setTab] = useState<Tab>('result');

  const weakest = useMemo(() => [...score.byType].sort((a, b) => a.ratio - b.ratio), [score.byType]);
  const rows = useMemo(() => diagnose(test.diagnostics, score.byQuestion), [test.diagnostics, score.byQuestion]);
  const wrong = score.byQuestion.filter((r) => r.verdict !== 'correct');
  const weakTypes = weakest.filter((t) => t.ratio < 1).map((t) => t.typeIndex);
  const blockOf = (i: number) => test.blocks.find((b) => b.typeIndex === i);

  const tabs: [Tab, string][] = [
    ['result', 'Kết quả'],
    ['wrong', `Câu sai (${wrong.length})`],
    ...(test.extras.vocabulary ? ([['vocab', 'Vocabulary']] as [Tab, string][]) : []),
    ...(test.extras.paraphrases ? ([['paraphrase', 'Paraphrase Pairs']] as [Tab, string][]) : []),
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-300 bg-white px-5 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{test.title}</h1>
            <p className="text-sm text-slate-600">{test.passageTitle}</p>
          </div>
          <button onClick={onExit} className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
            Về danh sách đề
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-5">
        {/* 1. Điểm thô + band ước lượng */}
        <div className="mb-5 flex flex-wrap items-end gap-6 rounded-lg border border-slate-300 bg-white p-5">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Điểm thô</div>
            <div className="text-4xl font-bold tabular-nums">
              {score.raw}
              <span className="text-2xl text-slate-400">/{score.total}</span>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Tỉ lệ đúng</div>
            <div className="text-4xl font-bold tabular-nums">{Math.round(score.percent * 100)}%</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Band ước lượng</div>
            <div className="text-4xl font-bold text-sky-700 tabular-nums">{score.band}</div>
            <div className="mt-1 max-w-xs text-[11px] leading-tight text-slate-500">
              Quy về phần trăm rồi tra thang 40 câu. Đây là <b>band ước lượng</b>, không phải điểm thi thật — bài này
              gồm toàn dạng Passage 3 nên khó hơn mặt bằng.
            </div>
          </div>
        </div>

        <nav className="mb-4 flex flex-wrap gap-1 border-b border-slate-300">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                'rounded-t px-4 py-2 text-sm font-medium ' +
                (tab === k ? 'border border-b-white border-slate-300 bg-white' : 'text-slate-600 hover:bg-slate-200')
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'result' && (
          <div className="space-y-5">
            {/* 2. Bảng theo dạng, yếu nhất lên đầu */}
            <section className="rounded-lg border border-slate-300 bg-white p-4">
              <h2 className="mb-3 font-bold">Theo dạng câu hỏi — yếu nhất lên đầu</h2>
              <div className="space-y-1.5">
                {weakest.map((t) => (
                  <div key={t.typeIndex} className="flex items-center gap-3 text-sm">
                    <span className="w-8 shrink-0 text-right text-xs text-slate-400">D{t.typeIndex}</span>
                    <span className="w-56 shrink-0 truncate" title={t.typeName}>
                      {t.typeName}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded bg-slate-200">
                      <div
                        className={
                          'h-full ' + (t.ratio >= 0.8 ? 'bg-emerald-500' : t.ratio >= 0.5 ? 'bg-amber-500' : 'bg-red-500')
                        }
                        style={{ width: `${t.ratio * 100}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right tabular-nums">
                      {t.correct}/{t.total}
                    </span>
                    <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-500">
                      {Math.round(t.ratio * 100)}%
                    </span>
                  </div>
                ))}
              </div>
              {weakTypes.length > 0 && (
                <button
                  onClick={() => onRetryTypes(weakTypes)}
                  className="mt-4 rounded bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
                >
                  Làm lại chỉ những dạng sai ({weakTypes.length} dạng)
                </button>
              )}
            </section>

            {/* 3. Chẩn đoán tự động */}
            {rows.length > 0 && (
              <section className="rounded-lg border border-slate-300 bg-white p-4">
                <h2 className="mb-1 font-bold">Chẩn đoán</h2>
                <p className="mb-3 text-xs text-slate-500">
                  {test.diagnosticsSource === 'default'
                    ? 'Đây là lời khuyên chung cho mọi đề, không riêng đề này (đề không có bảng chẩn đoán riêng).'
                    : 'Bảng chẩn đoán riêng của đề này.'}
                </p>
                <div className="space-y-2">
                  {rows
                    .slice()
                    .sort((a, b) => Number(b.triggered) - Number(a.triggered) || b.ratio - a.ratio)
                    .map((r, i) =>
                      r.triggered ? (
                        <div key={i} className="rounded border-l-4 border-red-500 bg-red-50 p-3">
                          <div className="mb-1 flex items-baseline justify-between gap-2">
                            <b className="text-sm">{r.diagnostic.label}</b>
                            <span className="shrink-0 text-xs tabular-nums text-red-700">
                              sai {r.wrong}/{r.total} ({Math.round(r.ratio * 100)}% ≥{' '}
                              {Math.round(r.diagnostic.threshold * 100)}%)
                            </span>
                          </div>
                          <div className="prose-md text-sm" dangerouslySetInnerHTML={{ __html: md(r.diagnostic.advice) }} />
                        </div>
                      ) : (
                        <details key={i} className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                          <summary className="cursor-pointer text-sm">
                            <b>{r.diagnostic.label}</b>{' '}
                            <span className="text-xs text-emerald-700">
                              — đạt (sai {r.wrong}/{r.total})
                            </span>
                          </summary>
                          <div className="prose-md mt-1 text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: md(r.diagnostic.advice) }} />
                        </details>
                      )
                    )}
                </div>
              </section>
            )}

            {/* 5. Chiến thuật của những dạng sai nhiều */}
            <section className="rounded-lg border border-slate-300 bg-white p-4">
              <h2 className="mb-1 font-bold">Chiến thuật cho những dạng bạn vừa sai</h2>
              <p className="mb-3 text-xs text-slate-500">
                Bạn vừa thấy mình sai ở đâu — đây là chiến thuật đáng lẽ phải dùng.
              </p>
              <div className="space-y-3">
                {weakest
                  .filter((t) => t.ratio < 0.8)
                  .map((t) => {
                    const b = blockOf(t.typeIndex);
                    if (!b?.strategy) return null;
                    return (
                      <div key={t.typeIndex} className="rounded border border-emerald-300 bg-emerald-50 p-3">
                        <div className="mb-1 flex items-baseline justify-between">
                          <b className="text-sm text-emerald-900">
                            Dạng {t.typeIndex} — {t.typeName}
                          </b>
                          <span className="text-xs tabular-nums text-emerald-800">
                            {t.correct}/{t.total}
                          </span>
                        </div>
                        <div
                          className="prose-md text-sm text-emerald-950"
                          dangerouslySetInnerHTML={{ __html: md(b.strategy.replace(/^\*\*Chiến thuật\*\*\s*\n?/, '')) }}
                        />
                        {b.blockNote && (
                          <div
                            className="prose-md mt-2 border-t border-emerald-300 pt-2 text-sm italic text-emerald-900"
                            dangerouslySetInnerHTML={{ __html: md(b.blockNote) }}
                          />
                        )}
                      </div>
                    );
                  })}
                {weakest.every((t) => t.ratio >= 0.8) && (
                  <p className="text-sm text-slate-500">Không dạng nào dưới 80% — không có gì cần nhắc lại.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* 4. Danh sách câu sai */}
        {tab === 'wrong' && (
          <div className="space-y-2">
            {wrong.length === 0 && (
              <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm">Không sai câu nào.</p>
            )}
            {wrong.map((r) => {
              const b = blockOf(r.typeIndex);
              return (
                <div key={r.qno} className="rounded-lg border border-slate-300 bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-baseline gap-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">{r.qno}</span>
                    <span className="text-xs text-slate-500">
                      Dạng {r.typeIndex} — {r.typeName}
                    </span>
                    {r.verdict === 'blank' && (
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">bỏ trống</span>
                    )}
                    {r.verdict === 'over-limit' && (
                      <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
                        {r.reason}
                      </span>
                    )}
                  </div>

                  <PromptOf test={test} qno={r.qno} />

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="rounded border border-red-300 bg-red-50 p-2 text-sm">
                      <div className="text-xs font-semibold text-red-800">Bạn trả lời</div>
                      <div className="break-words">{r.given || <i className="text-slate-400">(để trống)</i>}</div>
                    </div>
                    <div className="rounded border border-emerald-300 bg-emerald-50 p-2 text-sm">
                      <div className="text-xs font-semibold text-emerald-800">Đáp án</div>
                      <div className="break-words">{r.key?.display ?? '—'}</div>
                    </div>
                  </div>

                  {r.key?.explanation && (
                    <div
                      className="prose-md mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-sm"
                      dangerouslySetInnerHTML={{ __html: md(r.key.explanation) }}
                    />
                  )}
                  {b?.blockNote && (
                    <div
                      className="prose-md mt-2 text-xs italic text-slate-600"
                      dangerouslySetInnerHTML={{ __html: md(b.blockNote) }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'vocab' && (
          <div
            className="prose-md rounded-lg border border-slate-300 bg-white p-4"
            dangerouslySetInnerHTML={{ __html: md(test.extras.vocabulary) }}
          />
        )}
        {tab === 'paraphrase' && (
          <div
            className="prose-md rounded-lg border border-slate-300 bg-white p-4"
            dangerouslySetInnerHTML={{ __html: md(test.extras.paraphrases) }}
          />
        )}
      </div>
    </div>
  );
}

/** Hiện lại nội dung câu hỏi ở màn review. */
function PromptOf({ test, qno }: { test: LoadedTest; qno: number }): JSX.Element | null {
  for (const b of test.blocks) {
    if (qno < b.range[0] || qno > b.range[1]) continue;
    const q =
      b.questions.find((x) => x.qno === qno || x.qnos?.includes(qno)) ??
      b.questions.find((x) => x.segments?.some((s) => s.qno === qno));
    if (!q) return null;
    if (q.prompt) {
      return (
        <p className="text-sm">
          {q.prompt}
          {q.options && (
            <span className="mt-1 block text-xs text-slate-600">
              {q.options.map((o) => `${o.letter}. ${o.text}`).join('  ·  ')}
            </span>
          )}
        </p>
      );
    }
    if (q.segments) {
      return (
        <p className="text-sm">
          {q.segments.map((s, i) =>
            s.type === 'blank' ? (
              <b key={i} className={s.qno === qno ? 'rounded bg-yellow-200 px-1' : ''}>
                [{s.qno}]
              </b>
            ) : (
              <span key={i}>{s.value}</span>
            )
          )}
        </p>
      );
    }
    return <p className="text-sm text-slate-500">(câu trong bảng / sơ đồ)</p>;
  }
  return null;
}
