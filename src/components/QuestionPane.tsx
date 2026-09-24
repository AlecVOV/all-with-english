/** Cột phải: các khối câu hỏi, cuộn độc lập. */

import type { Option, QuestionBlock } from '../parser/types';
import { md, mdInline } from '../lib/markdown';
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
  /** ghi nhiều số câu trong một lần cập nhật — mcq-multi cần (xem ExamShell) */
  onChangeMany?: (updates: Record<number, string>) => void;
  onFlag: (qno: number) => void;
  disabled?: boolean;
  /** Chế độ Thi: KHÔNG hiện chiến thuật, không hiện instruction tiếng Việt */
  showStrategy: boolean;
  /** nhãn đoạn của bài đọc — lựa chọn của Matching Information (xem fallbackOptions) */
  paragraphLabels: string[];
}

/** Dạng nào dùng chung một danh sách lựa chọn hiện trên đầu khối.
 *  `gap-select` có trong danh sách này: trong đề thật danh sách từ luôn hiện,
 *  không bắt người làm mở từng dropdown mới biết có những từ nào (audit E1). */
const SHARED_OPTIONS: QuestionBlock['kind'][] = [
  'matching-headings',
  'matching-features',
  'matching-endings',
  'gap-select',
];

/** Các dạng gom hết chỗ trống vào một khối chung (bảng / sơ đồ ASCII),
 *  nên checkbox Review xếp gọn ở cuối khối thay vì cạnh từng câu. */
const GROUPED: QuestionBlock['kind'][] = ['gap-table', 'gap-flow', 'gap-diagram'];

export default function QuestionPane({
  blocks,
  values,
  flagged,
  onChange,
  onChangeMany,
  onFlag,
  disabled,
  showStrategy,
  paragraphLabels,
}: Props): JSX.Element {
  /* Lựa chọn của Matching Information không nằm trong file đề: nó là nhãn đoạn
     của chính bài đọc. Suy lúc chạy, không hardcode A–H (CLAUDE.md §10). */
  const paragraphOptions: Option[] = paragraphLabels.map((letter) => ({ letter, text: letter }));

  return (
    <div className="h-full overflow-y-auto bg-paper px-6 py-5">
      {blocks.map((b) => (
        <section key={b.typeIndex} id={`block-${b.typeIndex}`} className="mb-10 last:mb-2">
          <h3 className="flex flex-wrap items-baseline gap-x-2 border-b-2 border-ink pb-1 text-lg font-bold">
            Questions {b.range[0]}–{b.range[1]}
            <span className="text-base font-normal text-ink-2">{b.typeName}</span>
          </h3>

          {b.instruction && (
            <p
              className="mt-2 text-read italic text-ink-2"
              dangerouslySetInnerHTML={{ __html: mdInline(b.instruction) }}
            />
          )}

          {showStrategy && b.strategy && <Strategy markdown={b.strategy} />}

          {b.caption && (
            <p
              className="mt-3 font-semibold"
              dangerouslySetInnerHTML={{ __html: mdInline(b.caption) }}
            />
          )}

          {b.kind === 'tfng' && <FixedOptions labels={['TRUE', 'FALSE', 'NOT GIVEN']} />}
          {b.kind === 'ynng' && <FixedOptions labels={['YES', 'NO', 'NOT GIVEN']} />}

          {b.options && SHARED_OPTIONS.includes(b.kind) && (
            <ul className="mt-3 space-y-1 rounded-md border border-line bg-surface-3 p-3 text-base">
              {b.options.map((o) => (
                <li key={o.letter} className="flex gap-2">
                  <b className="w-5 shrink-0 text-right">{o.letter}</b>{' '}
                  <span dangerouslySetInnerHTML={{ __html: mdInline(o.text) }} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3">
            {b.kind === 'gap-table' ? (
              <GapTableQuestion block={b} values={values} onChange={onChange} {...(disabled ? { disabled } : {})} />
            ) : b.kind === 'gap-flow' || b.kind === 'gap-diagram' ? (
              <AsciiQuestion block={b} values={values} onChange={onChange} {...(disabled ? { disabled } : {})} />
            ) : (
              <ul className="divide-y divide-line">
                {b.questions.map((q) => (
                  <li key={q.qno} className="flex items-start gap-3 py-2 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <Renderer
                        block={b}
                        question={q}
                        values={values}
                        onChange={onChange}
                        {...(onChangeMany ? { onChangeMany } : {})}
                        fallbackOptions={paragraphOptions}
                        {...(disabled ? { disabled } : {})}
                      />
                    </div>
                    <ReviewFlag qnos={q.qnos ?? [q.qno]} flagged={flagged} onFlag={onFlag} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {GROUPED.includes(b.kind) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2">
              <span className="text-sm text-ink-2">Đánh dấu xem lại:</span>
              {b.questions.map((q) => (
                <ReviewFlag key={q.qno} qnos={[q.qno]} flagged={flagged} onFlag={onFlag} showNumber />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

/**
 * Checkbox "đánh dấu xem lại".
 *
 * Nhãn chữ "Review" từng lặp lại ở cả 86 câu và làm viền phải thành một cột chữ
 * xám (audit D3). Giờ nhãn là `aria-label` — screen reader vẫn đọc đủ, mắt thì
 * chỉ thấy một dấu cờ nhỏ.
 */
function ReviewFlag({
  qnos,
  flagged,
  onFlag,
  showNumber,
}: {
  qnos: number[];
  flagged: Set<number>;
  onFlag: (qno: number) => void;
  showNumber?: boolean;
}): JSX.Element {
  const first = qnos[0]!;
  const on = flagged.has(first);
  const label = qnos.length > 1 ? `câu ${qnos[0]}–${qnos[qnos.length - 1]}` : `câu ${first}`;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={`Đánh dấu xem lại ${label}`}
      title={`Đánh dấu xem lại ${label}`}
      onClick={() => qnos.forEach(onFlag)}
      className={
        'mt-0.5 flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-sm transition-colors ' +
        (on ? 'bg-warn-soft text-warn' : 'text-ink-3 hover:bg-surface-3 hover:text-ink-2')
      }
    >
      <span aria-hidden="true" className="text-base leading-none">
        {on ? '★' : '☆'}
      </span>
      {showNumber && <span className="tabular-nums">{first}</span>}
    </button>
  );
}

/**
 * Khối Chiến thuật — chỉ hiện ở chế độ Luyện.
 *
 * Đây là nội dung học tập có giá trị nhất trong file (CLAUDE.md §4.3), nên mở
 * sẵn; người dùng thu lại được khi đã thuộc.
 */
function Strategy({ markdown }: { markdown: string }): JSX.Element {
  return (
    <details open className="study-box mt-3">
      <summary className="summary-row px-3 py-2 text-base font-semibold text-study">
        <span aria-hidden="true" className="chev">▶</span>
        Chiến thuật
      </summary>
      <div
        className="prose-md border-t border-study-line px-3 py-2 text-base text-ink"
        dangerouslySetInnerHTML={{ __html: md(stripLabel(markdown)) }}
      />
    </details>
  );
}

function FixedOptions({ labels }: { labels: string[] }): JSX.Element {
  return (
    <p className="mt-3 flex flex-wrap gap-2">
      {labels.map((l) => (
        <span key={l} className="rounded border border-line bg-surface-3 px-2 py-0.5 text-sm font-semibold">
          {l}
        </span>
      ))}
    </p>
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
  onChangeMany?: (updates: Record<number, string>) => void;
  disabled?: boolean;
  fallbackOptions: Option[];
}): JSX.Element {
  const { block, question, values, onChange, onChangeMany, disabled, fallbackOptions } = props;
  const one = {
    block,
    question,
    value: values[question.qno] ?? '',
    onChange,
    ...(onChangeMany ? { onChangeMany } : {}),
    fallbackOptions,
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
      return <McqMultiQuestion {...one} values={values} />;
    default:
      return <UnknownQuestion {...one} />;
  }
}
