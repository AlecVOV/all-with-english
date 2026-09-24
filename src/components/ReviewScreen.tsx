/**
 * Màn hình kết quả (CLAUDE.md §6.3) — nơi toàn bộ nội dung học tập trong file
 * được trả lại cho người dùng.
 */

import { useMemo, useState } from 'react';
import type { LoadedTest } from '../lib/tests';
import type { QuestionResult, Score, TypeScore } from '../lib/grading';
import { diagnose } from '../lib/diagnose';
import { md, mdInline } from '../lib/markdown';

interface Props {
  test: LoadedTest;
  score: Score;
  onRetryTypes: (typeIndexes: number[]) => void;
  onExit: () => void;
}

type Tab = 'result' | 'wrong' | 'vocab' | 'paraphrase';

/** Dưới mức này thì coi là "dạng yếu": hiện lại chiến thuật, gợi ý làm lại. */
const WEAK = 0.8;

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
    <div className="min-h-screen bg-surface-2">
      <header className="border-b border-line bg-surface px-5 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{test.title}</h1>
            <p className="truncate text-base text-ink-2">{test.passageTitle}</p>
          </div>
          <button onClick={onExit} className="btn btn-quiet">
            Về danh sách đề
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-5">
        <ScoreCard score={score} />

        <div role="tablist" aria-label="Phần kết quả" className="mt-5 flex flex-wrap gap-1 border-b border-line">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              role="tab"
              id={`tab-${k}`}
              aria-selected={tab === k}
              aria-controls={`panel-${k}`}
              onClick={() => setTab(k)}
              className={
                '-mb-px rounded-t border-b-2 px-4 py-2 text-base font-medium transition-colors ' +
                (tab === k
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-2 hover:border-line-strong hover:text-ink')
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-5">
          {tab === 'result' && (
            <div className="space-y-5">
              <ByType weakest={weakest} weakTypes={weakTypes} onRetryTypes={onRetryTypes} />

              {rows.length > 0 && (
                <section className="card p-4">
                  <h2 className="font-bold">Chẩn đoán</h2>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {test.diagnosticsSource === 'default'
                      ? 'Đề này không có bảng chẩn đoán riêng, nên đây là lời khuyên chung cho mọi đề.'
                      : 'Bảng chẩn đoán riêng của đề này.'}
                  </p>
                  <div className="mt-3 space-y-2">
                    {rows
                      .slice()
                      .sort((a, b) => Number(b.triggered) - Number(a.triggered) || b.ratio - a.ratio)
                      .map((r, i) =>
                        r.triggered ? (
                          <div key={i} className="rounded-md border border-bad-line bg-bad-soft p-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <b className="text-base">{r.diagnostic.label}</b>
                              <span className="shrink-0 text-sm tabular-nums text-bad">
                                sai {r.wrong}/{r.total} — ngưỡng {Math.round(r.diagnostic.threshold * 100)}%
                              </span>
                            </div>
                            <div
                              className="prose-md mt-1 text-base"
                              dangerouslySetInnerHTML={{ __html: md(r.diagnostic.advice) }}
                            />
                          </div>
                        ) : (
                          <details key={i} className="rounded-md border border-line bg-surface-3/60">
                            <summary className="summary-row px-3 py-2 text-base">
                              <span aria-hidden="true" className="chev">▶</span>
                              <b>{r.diagnostic.label}</b>{' '}
                              <span className="text-sm text-ok">
                                đạt — sai {r.wrong}/{r.total}
                              </span>
                            </summary>
                            <div
                              className="prose-md border-t border-line px-3 py-2 text-base text-ink-2"
                              dangerouslySetInnerHTML={{ __html: md(r.diagnostic.advice) }}
                            />
                          </details>
                        )
                      )}
                  </div>
                </section>
              )}

              <Strategies weakest={weakest} blockOf={blockOf} />
            </div>
          )}

          {tab === 'wrong' && <WrongList test={test} wrong={wrong} weakest={weakest} />}

          {tab === 'vocab' && (
            <div
              className="prose-md card p-4"
              dangerouslySetInnerHTML={{ __html: md(test.extras.vocabulary) }}
            />
          )}
          {tab === 'paraphrase' && (
            <div
              className="prose-md card p-4"
              dangerouslySetInnerHTML={{ __html: md(test.extras.paraphrases) }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ---- 1. Điểm thô + band ước lượng -------------------------------- */

function ScoreCard({ score }: { score: Score }): JSX.Element {
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <Figure label="Điểm thô">
          <span className="tabular-nums">{score.raw}</span>
          <span className="text-2xl text-ink-3">/{score.total}</span>
        </Figure>
        <Figure label="Tỉ lệ đúng">
          <span className="tabular-nums">{Math.round(score.percent * 100)}%</span>
        </Figure>
        <Figure label="Band ước lượng">
          <span className="tabular-nums text-accent">{score.band}</span>
        </Figure>
      </div>
      <p className="mt-3 max-w-2xl border-t border-line pt-3 text-base text-ink-2">
        Band quy từ tỉ lệ phần trăm sang thang 40 câu, nên chỉ là <b>ước lượng</b>, không phải điểm thi thật. Đề
        luyện khai thác cùng một bài đọc bằng mọi dạng câu hỏi, mật độ dạng khó cao hơn một passage thi.
      </p>
    </section>
  );
}

function Figure({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <div className="text-sm text-ink-2">{label}</div>
      <div className="text-3xl font-bold leading-tight">{children}</div>
    </div>
  );
}

/* ---- 2. Bảng theo dạng ------------------------------------------- */

function ByType({
  weakest,
  weakTypes,
  onRetryTypes,
}: {
  weakest: TypeScore[];
  weakTypes: number[];
  onRetryTypes: (t: number[]) => void;
}): JSX.Element {
  return (
    <section className="card p-4">
      <h2 className="font-bold">Theo dạng câu hỏi — yếu nhất lên đầu</h2>
      <ul className="mt-3 space-y-1">
        {weakest.map((t) => (
          <li key={t.typeIndex} className="flex items-center gap-3 text-base">
            <span className="w-8 shrink-0 text-right text-sm tabular-nums text-ink-2">D{t.typeIndex}</span>
            <span className="w-80 shrink-0 truncate" title={t.typeName}>
              {t.typeName}
            </span>
            {/* Rãnh luôn có viền nên 0% vẫn đọc được là "làm sai hết", không
                biến mất thành một vệt xám trống (audit G4). */}
            <span className="h-3 min-w-20 flex-1 overflow-hidden rounded-sm border border-line bg-surface-3">
              <span
                className={
                  'block h-full ' + (t.ratio >= WEAK ? 'bg-ok' : t.ratio >= 0.5 ? 'bg-warn' : 'bg-bad')
                }
                style={{ width: `${Math.max(t.ratio * 100, t.ratio > 0 ? 2 : 0)}%` }}
              />
            </span>
            <span className="w-14 shrink-0 text-right tabular-nums">
              {t.correct}/{t.total}
            </span>
            <span className="w-12 shrink-0 text-right text-sm tabular-nums text-ink-2">
              {Math.round(t.ratio * 100)}%
            </span>
          </li>
        ))}
      </ul>
      {weakTypes.length > 0 && (
        <button onClick={() => onRetryTypes(weakTypes)} className="btn btn-primary mt-4">
          Làm lại {weakTypes.length} dạng chưa đúng hết
        </button>
      )}
    </section>
  );
}

/* ---- 5. Chiến thuật của những dạng sai nhiều --------------------- */

function Strategies({
  weakest,
  blockOf,
}: {
  weakest: TypeScore[];
  blockOf: (i: number) => LoadedTest['blocks'][number] | undefined;
}): JSX.Element {
  const weak = weakest.filter((t) => t.ratio < WEAK);

  return (
    <section className="card p-4">
      <h2 className="font-bold">Chiến thuật cho những dạng bạn vừa sai</h2>
      <p className="mt-0.5 text-sm text-ink-2">
        Bạn vừa thấy mình sai ở đâu — đây là chiến thuật đáng lẽ phải dùng.
      </p>

      {weak.length === 0 ? (
        <p className="mt-3 rounded-md border border-ok-line bg-ok-soft p-3 text-base">
          Không dạng nào dưới {Math.round(WEAK * 100)}% — không có gì cần nhắc lại.
        </p>
      ) : (
        /* Mở sẵn dạng yếu nhất, còn lại thu gọn: sai nhiều dạng mà mở hết thì
           thành tường chữ vài nghìn pixel và không ai đọc (audit G3). */
        <div className="mt-3 space-y-2">
          {weak.map((t, i) => {
            const b = blockOf(t.typeIndex);
            if (!b?.strategy) return null;
            return (
              <details key={t.typeIndex} open={i === 0} className="study-box">
                <summary className="summary-row justify-between px-3 py-2">
                  <b className="flex items-center gap-2 text-base text-study">
                    <span aria-hidden="true" className="chev">▶</span>
                    Dạng {t.typeIndex} — {t.typeName}
                  </b>
                  <span className="shrink-0 text-sm tabular-nums text-ink-2">
                    {t.correct}/{t.total}
                  </span>
                </summary>
                <div className="border-t border-study-line px-3 py-2">
                  <div
                    className="prose-md text-base"
                    dangerouslySetInnerHTML={{
                      __html: md(b.strategy.replace(/^\*\*Chiến thuật\*\*\s*\n?/, '')),
                    }}
                  />
                  {b.blockNote && (
                    <div
                      className="prose-md mt-2 border-t border-study-line pt-2 text-base italic text-ink-2"
                      dangerouslySetInnerHTML={{ __html: md(b.blockNote) }}
                    />
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---- 4. Danh sách câu sai ---------------------------------------- */

/**
 * Gom theo dạng. Trước đây 86 câu sai đổ thành một cuộn dài không có mốc nào,
 * và `blockNote` của dạng in lại dưới **từng** câu (audit G1, G2). Giờ mỗi dạng
 * là một nhóm thu gọn được, `blockNote` hiện đúng một lần ở đầu nhóm.
 */
function WrongList({
  test,
  wrong,
  weakest,
}: {
  test: LoadedTest;
  wrong: QuestionResult[];
  weakest: TypeScore[];
}): JSX.Element {
  const [only, setOnly] = useState<'all' | 'wrong' | 'blank'>('all');

  const shown = wrong.filter((r) =>
    only === 'all' ? true : only === 'blank' ? r.verdict === 'blank' : r.verdict !== 'blank'
  );

  const groups = useMemo(() => {
    const byType = new Map<number, QuestionResult[]>();
    for (const r of shown) {
      const list = byType.get(r.typeIndex) ?? [];
      list.push(r);
      byType.set(r.typeIndex, list);
    }
    // cùng thứ tự với bảng "yếu nhất lên đầu" để hai khối đọc khớp nhau
    return weakest.map((t) => ({ type: t, items: byType.get(t.typeIndex) ?? [] })).filter((g) => g.items.length);
  }, [shown, weakest]);

  const blanks = wrong.filter((r) => r.verdict === 'blank').length;

  if (wrong.length === 0) {
    return (
      <p className="rounded-md border border-ok-line bg-ok-soft p-4 text-base">
        Không sai câu nào. Cả bài đúng hết — không có gì để xem lại ở tab này.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            ['all', `Tất cả (${wrong.length})`],
            ['wrong', `Trả lời sai (${wrong.length - blanks})`],
            ['blank', `Bỏ trống (${blanks})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={only === k}
            onClick={() => setOnly(k)}
            className={'btn ' + (only === k ? 'btn-primary' : 'btn-quiet')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {groups.map(({ type, items }, gi) => {
          const b = test.blocks.find((x) => x.typeIndex === type.typeIndex);
          return (
            <details key={type.typeIndex} open={gi === 0} className="card overflow-hidden">
              <summary className="summary-row flex-wrap justify-between bg-surface-3 px-4 py-2">
                <span className="flex items-center gap-2 font-semibold">
                  <span aria-hidden="true" className="chev">▶</span>
                  Dạng {type.typeIndex} — {type.typeName}
                </span>
                <span className="text-sm tabular-nums text-ink-2">
                  sai {items.length} · đúng {type.correct}/{type.total}
                </span>
              </summary>

              {/* blockNote là ghi chú của cả dạng → hiện đúng một lần (audit G1) */}
              {b?.blockNote && (
                <div
                  className="prose-md border-y border-line bg-study-soft px-4 py-2 text-base italic text-ink-2"
                  dangerouslySetInnerHTML={{ __html: md(b.blockNote) }}
                />
              )}

              <ul className="divide-y divide-line border-t border-line">
                {items.map((r) => (
                  <li key={r.qno} className="px-4 py-3">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="qbadge">{r.qno}</span>
                      {r.verdict === 'blank' && (
                        <span className="rounded border border-line bg-surface-3 px-1.5 py-0.5 text-sm text-ink-2">
                          bỏ trống
                        </span>
                      )}
                      {r.verdict === 'over-limit' && (
                        <span className="rounded border border-warn-line bg-warn-soft px-1.5 py-0.5 text-sm font-medium text-warn">
                          {r.reason}
                        </span>
                      )}
                    </div>

                    <PromptOf test={test} qno={r.qno} />

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {/* Bỏ trống ≠ trả lời sai: ô trống hiện trung tính chứ không
                          đỏ như một câu đã trả lời mà sai (CLAUDE.md §7, audit G7). */}
                      <div
                        className={
                          'rounded-md border p-2 text-base ' +
                          (r.verdict === 'blank' ? 'border-line bg-surface-3' : 'border-bad-line bg-bad-soft')
                        }
                      >
                        <div
                          className={
                            'text-sm font-semibold ' + (r.verdict === 'blank' ? 'text-ink-2' : 'text-bad')
                          }
                        >
                          Bạn trả lời
                        </div>
                        <div className="break-words">
                          {r.given || <span className="italic text-ink-3">không điền gì</span>}
                        </div>
                      </div>
                      <div className="rounded-md border border-ok-line bg-ok-soft p-2 text-base">
                        <div className="text-sm font-semibold text-ok">Đáp án</div>
                        <div
                          className="break-words"
                          dangerouslySetInnerHTML={{ __html: mdInline(r.key?.display ?? '—') }}
                        />
                      </div>
                    </div>

                    {r.key?.explanation && (
                      <div
                        className="prose-md mt-2 rounded-md border border-line bg-surface-2 p-2 text-base"
                        dangerouslySetInnerHTML={{ __html: md(r.key.explanation) }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
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
        <div className="text-base">
          <span dangerouslySetInnerHTML={{ __html: mdInline(q.prompt) }} />
          {q.options && (
            <ul className="mt-1 space-y-0.5 text-sm text-ink-2">
              {q.options.map((o) => (
                <li key={o.letter}>
                  <b className="mr-1">{o.letter}</b>
                  <span dangerouslySetInnerHTML={{ __html: mdInline(o.text) }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    if (q.segments) {
      return (
        <p className="text-base">
          {q.segments.map((s, i) =>
            s.type === 'blank' ? (
              <b
                key={i}
                className={
                  'mx-0.5 rounded px-1 ' + (s.qno === qno ? 'bg-ink text-white' : 'bg-surface-3 text-ink-2')
                }
              >
                {s.qno}
              </b>
            ) : (
              <span key={i} dangerouslySetInnerHTML={{ __html: mdInline(s.value) }} />
            )
          )}
        </p>
      );
    }
    return <p className="text-base text-ink-2">Câu này nằm trong bảng hoặc sơ đồ của dạng.</p>;
  }
  return null;
}
