/** Cột phải: các khối câu hỏi, cuộn độc lập. */

import type { QuestionBlock } from '../parser/types';
import { md } from '../lib/markdown';
import {
  AsciiQuestion,
  GapSelectQuestion,
  GapTableQuestion,
  GapTextQuestion,
  MatchingQuestion,
  McqMultiQuestion,
  McqSingleQuestion,
  ShortAnswerQuestion,
  TrueFalseQuestion,
  UnknownQuestion,
} from './questions';

interface Props {
  blocks: QuestionBlock[];
  values: Record<number, string>;
  flagged: Set<number>;
  onChange: (qno: number, v: string) => void;
  onFlag: (qno: number) => void;
  disabled?: boolean;
  /** Chế độ Thi: KHÔNG hiện chiến thuật, không hiện instruction tiếng Việt */
  showStrategy: boolean;
  fontSize: 0 | 1 | 2;
  paper: 'white' | 'cream';
}

const SIZES = ['text-[13px]', 'text-[15px]', 'text-[17px]'] as const;

export default function QuestionPane({
  blocks,
  values,
  flagged,
  onChange,
  onFlag,
  disabled,
  showStrategy,
  fontSize,
  paper,
}: Props): JSX.Element {
  return (
    <div
      className={`h-full overflow-y-auto px-5 py-4 ${SIZES[fontSize]} ${
        paper === 'cream' ? 'bg-amber-50' : 'bg-white'
      }`}
    >
      {blocks.map((b) => (
        <section key={b.typeIndex} id={`block-${b.typeIndex}`} className="mb-8">
          <h3 className="mb-1 border-b border-slate-300 pb-1 text-base font-bold">
            Questions {b.range[0]}–{b.range[1]}
            <span className="ml-2 text-sm font-normal text-slate-500">{b.typeName}</span>
          </h3>

          {b.instruction && <p className="my-2 italic text-slate-700">{b.instruction}</p>}

          {showStrategy && b.strategy && (
            <details open className="my-2 rounded border border-emerald-300 bg-emerald-50 px-3 py-2">
              <summary className="cursor-pointer text-sm font-semibold text-emerald-900">
                Chiến thuật
              </summary>
              <div
                className="prose-md mt-1 text-sm text-emerald-950"
                dangerouslySetInnerHTML={{ __html: md(stripLabel(b.strategy)) }}
              />
            </details>
          )}

          {b.caption && <p className="my-2 font-semibold">{b.caption}</p>}

          {b.kind === 'tfng' && <FixedOptions labels={['TRUE', 'FALSE', 'NOT GIVEN']} />}
          {b.kind === 'ynng' && <FixedOptions labels={['YES', 'NO', 'NOT GIVEN']} />}

          {/* Danh sách lựa chọn dùng chung */}
          {b.options && ['matching-headings', 'matching-features', 'matching-endings'].includes(b.kind) && (
            <ul className="my-2 space-y-0.5 rounded border border-slate-300 bg-slate-50 p-3 text-sm">
              {b.options.map((o) => (
                <li key={o.letter}>
                  <b className="mr-2">{o.letter}</b>
                  {o.text}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            {b.kind === 'gap-table' ? (
              <GapTableQuestion block={b} values={values} onChange={onChange} {...(disabled ? { disabled } : {})} />
            ) : b.kind === 'gap-flow' || b.kind === 'gap-diagram' ? (
              <AsciiQuestion block={b} values={values} onChange={onChange} {...(disabled ? { disabled } : {})} />
            ) : (
              b.questions.map((q) => (
                <div key={q.qno} className="group flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <Renderer
                      block={b}
                      question={q}
                      values={values}
                      onChange={onChange}
                      {...(disabled ? { disabled } : {})}
                    />
                  </div>
                  <label
                    title="Đánh dấu để xem lại"
                    className="mt-0.5 flex shrink-0 cursor-pointer items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={flagged.has(q.qno)}
                      onChange={() => onFlag(q.qno)}
                      className="h-3 w-3"
                    />
                    Review
                  </label>
                </div>
              ))
            )}
          </div>

          {/* Với bảng/sơ đồ, checkbox Review đặt gọn ở cuối khối */}
          {['gap-table', 'gap-flow', 'gap-diagram'].includes(b.kind) && (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              {b.questions.map((q) => (
                <label key={q.qno} className="flex cursor-pointer items-center gap-1 hover:text-slate-800">
                  <input
                    type="checkbox"
                    checked={flagged.has(q.qno)}
                    onChange={() => onFlag(q.qno)}
                    className="h-3 w-3"
                  />
                  Review {q.qno}
                </label>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function FixedOptions({ labels }: { labels: string[] }): JSX.Element {
  return (
    <p className="my-2 text-sm font-semibold tracking-wide text-slate-700">{labels.join('  /  ')}</p>
  );
}

/** Bỏ dòng nhãn `**Chiến thuật**` — tiêu đề đã có ở <summary>. */
function stripLabel(s: string): string {
  return s.replace(/^\*\*Chiến thuật\*\*\s*\n?/, '').trim();
}

function Renderer(props: {
  block: QuestionBlock;
  question: QuestionBlock['questions'][number];
  values: Record<number, string>;
  onChange: (qno: number, v: string) => void;
  disabled?: boolean;
}): JSX.Element {
  const { block, question, values, onChange, disabled } = props;
  const one = {
    block,
    question,
    value: values[question.qno] ?? '',
    onChange,
    ...(disabled ? { disabled } : {}),
  };
  switch (block.kind) {
    case 'matching-headings':
    case 'matching-information':
    case 'matching-features':
    case 'matching-endings':
      return <MatchingQuestion {...one} />;
    case 'tfng':
    case 'ynng':
      return <TrueFalseQuestion {...one} />;
    case 'short-answer':
      return <ShortAnswerQuestion {...one} />;
    case 'gap-text':
      return <GapTextQuestion {...one} values={values} />;
    case 'gap-select':
      return <GapSelectQuestion {...one} values={values} />;
    case 'mcq-single':
      return <McqSingleQuestion {...one} />;
    case 'mcq-multi':
      return <McqMultiQuestion {...one} />;
    default:
      return <UnknownQuestion {...one} />;
  }
}
