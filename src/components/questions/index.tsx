/**
 * Mỗi dạng câu hỏi một component, cùng interface
 * `{ block, question, value, onChange, disabled }` (CLAUDE.md §8).
 *
 * `value` là chuỗi. Với mcq-multi, nhiều lựa chọn nối bằng dấu phẩy —
 * chấm điểm không xét thứ tự nên biểu diễn phẳng là đủ.
 */

import type { Option, Question, QuestionBlock, Segment } from '../../parser/types';

export interface QProps {
  block: QuestionBlock;
  question: Question;
  value: string;
  onChange: (qno: number, value: string) => void;
  disabled?: boolean;
  /** đánh dấu ô đang được chọn ở thanh điều hướng */
  activeQno?: number;
}

/* ------------------------------------------------------------------ */
const inputCls =
  'inline-block min-w-[7rem] rounded border border-slate-400 bg-white px-2 py-0.5 ' +
  'focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100';

export function Blank({
  qno,
  value,
  onChange,
  disabled,
  width = 'min-w-[7rem]',
  mono,
}: {
  qno: number;
  value: string;
  onChange: (qno: number, v: string) => void;
  disabled?: boolean;
  width?: string;
  mono?: boolean;
}): JSX.Element {
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs font-bold text-white">{qno}</span>
      <input
        id={`q-${qno}`}
        data-qno={qno}
        type="text"
        autoComplete="off"
        spellCheck={false}
        className={`${inputCls} ${width} ${mono ? 'font-mono' : ''}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(qno, e.target.value)}
      />
    </span>
  );
}

/** Render mảng Segment: text xen kẽ input đúng vị trí. */
export function Segments({
  segments,
  values,
  onChange,
  disabled,
}: {
  segments: Segment[];
  values: Record<number, string>;
  onChange: (qno: number, v: string) => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <>
      {segments.map((s, i) =>
        s.type === 'blank' ? (
          <Blank
            key={i}
            qno={s.qno!}
            value={values[s.qno!] ?? ''}
            onChange={onChange}
            disabled={disabled}
          />
        ) : (
          <span key={i}>{s.value}</span>
        )
      )}
    </>
  );
}

/* ---- chọn một chữ cái từ danh sách (matching / tfng / ynng) -------- */
export function LetterSelect({
  qno,
  options,
  value,
  onChange,
  disabled,
}: {
  qno: number;
  options: Option[];
  value: string;
  onChange: (qno: number, v: string) => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <select
      id={`q-${qno}`}
      data-qno={qno}
      className={`${inputCls} min-w-[6rem]`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(qno, e.target.value)}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.letter} value={o.letter}>
          {o.letter}
        </option>
      ))}
    </select>
  );
}

/* ================================================================== *
 * Các dạng
 * ================================================================== */

/** matching-headings · matching-information · matching-features · matching-endings */
export function MatchingQuestion({ block, question, value, onChange, disabled }: QProps): JSX.Element {
  const opts = question.options ?? block.options ?? [];
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-7 shrink-0 text-right font-semibold text-slate-500">{question.qno}</span>
      <span className="flex-1">{question.prompt}</span>
      <LetterSelect
        qno={question.qno}
        options={opts}
        value={value}
        onChange={onChange}
        {...(disabled ? { disabled } : {})}
      />
    </div>
  );
}

/** tfng · ynng — nút bấm cho nhanh, vẫn là ba lựa chọn cố định */
export function TrueFalseQuestion({ block, question, value, onChange, disabled }: QProps): JSX.Element {
  const opts = block.options ?? [];
  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <span className="w-7 shrink-0 text-right font-semibold text-slate-500">{question.qno}</span>
      <span className="min-w-[16rem] flex-1">{question.prompt}</span>
      <span id={`q-${question.qno}`} data-qno={question.qno} className="flex shrink-0 gap-1">
        {opts.map((o) => (
          <button
            key={o.letter}
            type="button"
            disabled={disabled}
            onClick={() => onChange(question.qno, value === o.letter ? '' : o.letter)}
            className={
              'rounded border px-2 py-0.5 text-xs font-semibold transition ' +
              (value === o.letter
                ? 'border-sky-700 bg-sky-700 text-white'
                : 'border-slate-400 bg-white text-slate-700 hover:bg-slate-100 disabled:hover:bg-white')
            }
          >
            {o.letter}
          </button>
        ))}
      </span>
    </div>
  );
}

/** short-answer — ô nhập text tự do */
export function ShortAnswerQuestion({ question, value, onChange, disabled }: QProps): JSX.Element {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-7 shrink-0 text-right font-semibold text-slate-500">{question.qno}</span>
      <span className="flex-1">{question.prompt}</span>
      <input
        id={`q-${question.qno}`}
        data-qno={question.qno}
        type="text"
        autoComplete="off"
        spellCheck={false}
        className={`${inputCls} w-56`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(question.qno, e.target.value)}
      />
    </div>
  );
}

/** gap-text (Sentence / Summary / Note Completion) */
export function GapTextQuestion({
  question,
  values,
  onChange,
  disabled,
}: Omit<QProps, 'value'> & { values: Record<number, string> }): JSX.Element {
  if (!question.segments) {
    return (
      <div className="flex items-baseline gap-3">
        <span className="w-7 shrink-0 text-right font-semibold text-slate-500">{question.qno}</span>
        <span className="flex-1">{question.prompt}</span>
        <Blank
          qno={question.qno}
          value={values[question.qno] ?? ''}
          onChange={onChange}
          {...(disabled ? { disabled } : {})}
        />
      </div>
    );
  }
  // Giữ nguyên số space thụt lề gốc của bullet Note Completion (#15 KEEP)
  const indent = question.indent ?? 0;
  return (
    <div className="leading-loose" style={{ paddingLeft: `${indent * 0.6}rem` }}>
      <Segments
        segments={question.segments}
        values={values}
        onChange={onChange}
        {...(disabled ? { disabled } : {})}
      />
    </div>
  );
}

/** gap-select — như gap-text nhưng ô trống là dropdown */
export function GapSelectQuestion({
  block,
  question,
  values,
  onChange,
  disabled,
}: Omit<QProps, 'value'> & { values: Record<number, string> }): JSX.Element {
  const opts = block.options ?? [];
  const segs = question.segments ?? [];
  return (
    <div className="leading-loose">
      {segs.map((s, i) =>
        s.type === 'blank' ? (
          <span key={i} className="inline-flex items-baseline gap-1">
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs font-bold text-white">{s.qno}</span>
            <select
              id={`q-${s.qno}`}
              data-qno={s.qno}
              className={`${inputCls} min-w-[9rem]`}
              value={values[s.qno!] ?? ''}
              disabled={disabled}
              onChange={(e) => onChange(s.qno!, e.target.value)}
            >
              <option value="">—</option>
              {opts.map((o) => (
                <option key={o.letter} value={o.letter}>
                  {o.letter} — {o.text}
                </option>
              ))}
            </select>
          </span>
        ) : (
          <span key={i}>{s.value}</span>
        )
      )}
    </div>
  );
}

/** gap-table — dựng lại <table>, ô nào có chỗ trống thì nhúng input */
export function GapTableQuestion({
  block,
  values,
  onChange,
  disabled,
}: {
  block: QuestionBlock;
  values: Record<number, string>;
  onChange: (qno: number, v: string) => void;
  disabled?: boolean;
}): JSX.Element {
  const t = block.table;
  if (!t) return <p className="text-red-600">Không dựng được bảng.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {t.header.map((cell, i) => (
              <th key={i} className="border border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold">
                <Segments segments={cell} values={values} onChange={onChange} {...(disabled ? { disabled } : {})} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-slate-300 px-2 py-1 align-top">
                  <Segments segments={cell} values={values} onChange={onChange} {...(disabled ? { disabled } : {})} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * gap-flow · gap-diagram — giữ nguyên khoảng trắng, render <pre> font mono,
 * thay `66 ______` bằng input inline **cùng chiều rộng ký tự** để không vỡ
 * khung ASCII (CLAUDE.md §4.4, canonical-format §6). Không vẽ lại bằng div.
 */
export function AsciiQuestion({
  block,
  values,
  onChange,
  disabled,
}: {
  block: QuestionBlock;
  values: Record<number, string>;
  onChange: (qno: number, v: string) => void;
  disabled?: boolean;
}): JSX.Element {
  if (!block.raw) return <p className="text-red-600">Không tìm thấy khối sơ đồ.</p>;
  const lines = block.raw.split('\n');
  return (
    <div className="overflow-x-auto">
      <pre className="whitespace-pre font-mono text-[13px] leading-6 text-slate-800">
        {lines.map((line, i) => {
          const segs = splitAscii(line, block.range);
          return (
            <div key={i}>
              {segs.map((s, k) =>
                s.type === 'blank' ? (
                  <input
                    key={k}
                    id={`q-${s.qno}`}
                    data-qno={s.qno}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    /* 6 ký tự = đúng độ rộng của `______`, nên khung không lệch */
                    className="inline-block w-[6ch] border-b-2 border-sky-600 bg-sky-50 px-0 text-center font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:bg-slate-100"
                    value={values[s.qno!] ?? ''}
                    disabled={disabled}
                    onChange={(e) => onChange(s.qno!, e.target.value)}
                    title={`Câu ${s.qno}`}
                  />
                ) : (
                  <span key={k}>{s.value}</span>
                )
              )}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

/** Trong fence: số trần `66 ______`; chỉ hợp lệ khi số nằm trong range (#31). */
function splitAscii(line: string, range: [number, number]): Segment[] {
  const re = /(\d+)(\s*)(_{3,})/g;
  const out: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const qno = Number(m[1]);
    if (qno < range[0] || qno > range[1]) continue;
    // giữ lại số + khoảng trắng như văn bản, chỉ thay dãy gạch bằng input
    const keepTo = m.index + m[1]!.length + m[2]!.length;
    if (keepTo > last) out.push({ type: 'text', value: line.slice(last, keepTo) });
    out.push({ type: 'blank', qno });
    last = m.index + m[0].length;
  }
  if (!out.length) return [{ type: 'text', value: line }];
  if (last < line.length) out.push({ type: 'text', value: line.slice(last) });
  return out;
}

/** mcq-single */
export function McqSingleQuestion({ question, value, onChange, disabled }: QProps): JSX.Element {
  return (
    <div id={`q-${question.qno}`} data-qno={question.qno} className="space-y-1">
      <p className="font-medium">
        <span className="mr-2 font-semibold text-slate-500">{question.qno}.</span>
        {question.prompt}
      </p>
      <div className="space-y-1 pl-7">
        {(question.options ?? []).map((o) => (
          <label
            key={o.letter}
            className={
              'flex cursor-pointer items-start gap-2 rounded px-2 py-1 ' +
              (value === o.letter ? 'bg-sky-50 ring-1 ring-sky-300' : 'hover:bg-slate-50')
            }
          >
            <input
              type="radio"
              className="mt-1"
              name={`q${question.qno}`}
              checked={value === o.letter}
              disabled={disabled}
              onChange={() => onChange(question.qno, o.letter)}
            />
            <span>
              <b className="mr-1">{o.letter}</b>
              {o.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * mcq-multi — một item chiếm nhiều số câu. Chặn không cho chọn quá số lượng
 * ghi trong đề (CLAUDE.md §4.4).
 */
export function McqMultiQuestion({ question, value, onChange, disabled }: QProps): JSX.Element {
  const limit = question.selectCount ?? question.qnos?.length ?? 2;
  const picked = value ? value.split(',').filter(Boolean) : [];
  const full = picked.length >= limit;

  const toggle = (letter: string): void => {
    const next = picked.includes(letter)
      ? picked.filter((x) => x !== letter)
      : full
        ? picked
        : [...picked, letter];
    onChange(question.qno, next.sort().join(','));
  };

  // Một item chiếm nhiều số câu → phải có mỏ neo cho TỪNG số, nếu không
  // bấm "80" ở thanh điều hướng dưới sẽ không nhảy đi đâu cả.
  const anchors = question.qnos ?? [question.qno];

  return (
    <div className="space-y-1">
      {anchors.map((n) => (
        <span key={n} id={`q-${n}`} data-qno={n} className="block h-0" />
      ))}
      <p className="font-medium">
        <span className="mr-2 font-semibold text-slate-500">
          {question.qnos ? `${question.qnos[0]}–${question.qnos[question.qnos.length - 1]}.` : `${question.qno}.`}
        </span>
        {question.prompt}
      </p>
      <p className="pl-7 text-xs text-slate-500">
        Chọn {limit} phương án · đã chọn {picked.length}/{limit}
      </p>
      <div className="space-y-1 pl-7">
        {(question.options ?? []).map((o) => {
          const on = picked.includes(o.letter);
          return (
            <label
              key={o.letter}
              className={
                'flex items-start gap-2 rounded px-2 py-1 ' +
                (on ? 'bg-sky-50 ring-1 ring-sky-300' : full ? 'opacity-60' : 'hover:bg-slate-50') +
                (disabled || (full && !on) ? ' cursor-not-allowed' : ' cursor-pointer')
              }
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={on}
                disabled={disabled || (full && !on)}
                onChange={() => toggle(o.letter)}
              />
              <span>
                <b className="mr-1">{o.letter}</b>
                {o.text}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** Dạng lạ → vẫn hiện, ô nhập text, kèm cảnh báo (CLAUDE.md §4.3). */
export function UnknownQuestion(props: QProps): JSX.Element {
  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-2">
      <p className="mb-1 text-xs font-semibold text-amber-800">
        Dạng chưa nhận diện được — hiển thị dạng ô nhập text.
      </p>
      <ShortAnswerQuestion {...props} />
    </div>
  );
}
