/**
 * Mỗi dạng câu hỏi một component, cùng interface
 * `{ block, question, value, onChange, disabled }` (CLAUDE.md §8).
 *
 * `value` là chuỗi. Với mcq-multi, nhiều lựa chọn nối bằng dấu phẩy —
 * chấm điểm không xét thứ tự nên biểu diễn phẳng là đủ.
 *
 * Mọi chuỗi đến từ file đề (`prompt`, `Option.text`, `caption`) đều đi qua
 * `mdInline`: canonical format cố ý giữ `**…**` trong đó, render là việc của
 * tầng hiển thị (CLAUDE.md §13.4).
 */

import type { Option, Question, QuestionBlock, Segment } from '../../parser/types';
import { mdInline } from '../../lib/markdown';

export interface QProps {
  block: QuestionBlock;
  question: Question;
  value: string;
  onChange: (qno: number, value: string) => void;
  disabled?: boolean;
  /** đánh dấu ô đang được chọn ở thanh điều hướng */
  activeQno?: number;
}

/** Chuỗi một dòng từ file đề → HTML inline. */
function Inline({ text, className }: { text: string | undefined; className?: string }): JSX.Element {
  return <span {...(className ? { className } : {})} dangerouslySetInnerHTML={{ __html: mdInline(text) }} />;
}

/** Số câu — mỏ neo điều hướng chính, nên đậm bằng nội dung chứ không nhạt hơn. */
function Qno({ n }: { n: string | number }): JSX.Element {
  return <span className="w-7 shrink-0 text-right font-semibold tabular-nums text-ink">{n}</span>;
}

/* ------------------------------------------------------------------ */

export function Blank({
  qno,
  value,
  onChange,
  disabled,
  width = 'w-40',
}: {
  qno: number;
  value: string;
  onChange: (qno: number, v: string) => void;
  disabled?: boolean;
  width?: string;
}): JSX.Element {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 whitespace-nowrap align-baseline">
      <span className="qbadge">{qno}</span>
      <input
        id={`q-${qno}`}
        data-qno={qno}
        type="text"
        autoComplete="off"
        spellCheck={false}
        aria-label={`Câu ${qno}`}
        className={`field py-0.5 ${width}`}
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
  width,
}: {
  segments: Segment[];
  values: Record<number, string>;
  onChange: (qno: number, v: string) => void;
  disabled?: boolean;
  width?: string;
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
            {...(width ? { width } : {})}
          />
        ) : (
          <Inline key={i} text={s.value} />
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
  // Không có badge số ở đây: dạng matching đã hiện số câu ở đầu dòng rồi,
  // thêm badge nữa là số câu hiện hai lần trên cùng một dòng.
  return (
    <select
      id={`q-${qno}`}
      data-qno={qno}
      aria-label={`Câu ${qno}`}
      className="field w-20 shrink-0 py-0.5"
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
    <div className="flex items-center gap-3">
      <Qno n={question.qno} />
      <Inline text={question.prompt} className="flex-1 text-read" />
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Qno n={question.qno} />
      <Inline text={question.prompt} className="min-w-[14rem] flex-1 text-read" />
      <span
        id={`q-${question.qno}`}
        data-qno={question.qno}
        role="radiogroup"
        aria-label={`Câu ${question.qno}`}
        className="flex shrink-0 overflow-hidden rounded border border-line-field"
      >
        {opts.map((o, i) => (
          <button
            key={o.letter}
            type="button"
            role="radio"
            aria-checked={value === o.letter}
            disabled={disabled}
            onClick={() => onChange(question.qno, value === o.letter ? '' : o.letter)}
            className={
              'px-2.5 py-1 text-sm font-semibold transition-colors ' +
              (i > 0 ? 'border-l border-line-field ' : '') +
              (value === o.letter
                ? 'bg-accent text-white'
                : 'bg-surface text-ink-2 hover:bg-surface-3 disabled:hover:bg-surface')
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
    <div className="flex items-center gap-3">
      <Qno n={question.qno} />
      <Inline text={question.prompt} className="flex-1 text-read" />
      <input
        id={`q-${question.qno}`}
        data-qno={question.qno}
        type="text"
        autoComplete="off"
        spellCheck={false}
        aria-label={`Câu ${question.qno}`}
        className="field w-52 shrink-0 py-0.5"
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
      <div className="flex items-center gap-3">
        <Qno n={question.qno} />
        <Inline text={question.prompt} className="flex-1 text-read" />
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
    <div className="text-read leading-loose" style={{ paddingLeft: `${indent * 0.75}rem` }}>
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
    <div className="text-read leading-loose">
      {segs.map((s, i) =>
        s.type === 'blank' ? (
          <span key={i} className="mx-0.5 inline-flex items-center gap-1 align-baseline">
            <span className="qbadge">{s.qno}</span>
            <select
              id={`q-${s.qno}`}
              data-qno={s.qno}
              aria-label={`Câu ${s.qno}`}
              className="field w-44 py-0.5"
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
          <Inline key={i} text={s.value} />
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
  if (!t) return <p className="text-bad">Không dựng được bảng.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-base">
        <thead>
          <tr>
            {t.header.map((cell, i) => (
              <th key={i} className="border border-line bg-surface-3 px-2 py-1.5 text-left font-semibold">
                {/* ô trong bảng hẹp → input ngắn hơn mặc định, đỡ đẩy chữ xuống dòng */}
                <Segments segments={cell} values={values} onChange={onChange} width="w-28" {...(disabled ? { disabled } : {})} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((row, r) => (
            <tr key={r} className="even:bg-surface-3/40">
              {row.map((cell, c) => (
                <td key={c} className="border border-line px-2 py-1.5 align-top">
                  <Segments segments={cell} values={values} onChange={onChange} width="w-28" {...(disabled ? { disabled } : {})} />
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
  if (!block.raw) return <p className="text-bad">Không tìm thấy khối sơ đồ.</p>;
  const lines = block.raw.split('\n');
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface-3/50 p-3">
      <pre className="whitespace-pre font-mono text-sm leading-6 text-ink">
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
                    aria-label={`Câu ${s.qno}`}
                    /* 6 ký tự = đúng độ rộng của `______`, nên khung không lệch.
                       Đây là ngoại lệ duy nhất được phép dùng giá trị thô
                       (CLAUDE.md §13.1) vì nó là ràng buộc hình học. */
                    className="inline-block w-[6ch] border-0 border-b-2 border-accent bg-accent-soft px-0 text-center font-mono text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-surface-3"
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

/** Lựa chọn của mcq-single / mcq-multi — cùng một hình dạng, khác nhau ở input. */
function ChoiceList({
  qno,
  options,
  kind,
  isOn,
  isLocked,
  onPick,
  disabled,
}: {
  qno: number;
  options: Option[];
  kind: 'radio' | 'checkbox';
  isOn: (letter: string) => boolean;
  isLocked: (letter: string) => boolean;
  onPick: (letter: string) => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <ul className="mt-1.5 space-y-0.5 pl-10">
      {options.map((o) => {
        const on = isOn(o.letter);
        const locked = isLocked(o.letter);
        return (
          <li key={o.letter}>
            <label
              className={
                'flex items-start gap-2 rounded px-2 py-1 text-read transition-colors ' +
                (on ? 'bg-accent-soft ring-1 ring-accent-line ' : locked ? 'opacity-55 ' : 'hover:bg-surface-3 ') +
                (disabled || locked ? 'cursor-not-allowed' : 'cursor-pointer')
              }
            >
              <input
                type={kind}
                className="mt-1.5 shrink-0 accent-accent"
                {...(kind === 'radio' ? { name: `q${qno}` } : {})}
                checked={on}
                disabled={disabled || locked}
                onChange={() => onPick(o.letter)}
              />
              <span>
                <b className="mr-1.5">{o.letter}</b>
                <Inline text={o.text} />
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** mcq-single */
export function McqSingleQuestion({ question, value, onChange, disabled }: QProps): JSX.Element {
  return (
    <div id={`q-${question.qno}`} data-qno={question.qno}>
      <p className="flex gap-3 font-medium">
        <Qno n={`${question.qno}.`} />
        <Inline text={question.prompt} className="flex-1 text-read" />
      </p>
      <ChoiceList
        qno={question.qno}
        options={question.options ?? []}
        kind="radio"
        isOn={(l) => value === l}
        isLocked={() => false}
        onPick={(l) => onChange(question.qno, l)}
        {...(disabled ? { disabled } : {})}
      />
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
  const label = question.qnos
    ? `${question.qnos[0]}–${question.qnos[question.qnos.length - 1]}.`
    : `${question.qno}.`;

  return (
    <div>
      {anchors.map((n) => (
        <span key={n} id={`q-${n}`} data-qno={n} className="block h-0" />
      ))}
      <p className="flex gap-3 font-medium">
        <span className="shrink-0 font-semibold tabular-nums text-ink">{label}</span>
        <Inline text={question.prompt} className="flex-1 text-read" />
      </p>
      <p className="mt-0.5 pl-10 text-sm text-ink-2">
        Chọn {limit} phương án — đã chọn {picked.length}/{limit}
      </p>
      <ChoiceList
        qno={question.qno}
        options={question.options ?? []}
        kind="checkbox"
        isOn={(l) => picked.includes(l)}
        isLocked={(l) => full && !picked.includes(l)}
        onPick={toggle}
        {...(disabled ? { disabled } : {})}
      />
    </div>
  );
}

/** Dạng lạ → vẫn hiện, ô nhập text, kèm cảnh báo (CLAUDE.md §4.3). */
export function UnknownQuestion(props: QProps): JSX.Element {
  return (
    <div className="rounded-md border border-warn-line bg-warn-soft p-2">
      <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-warn">
        <span aria-hidden="true">⚠</span>
        Dạng chưa nhận diện được — hiển thị dạng ô nhập text.
      </p>
      <ShortAnswerQuestion {...props} />
    </div>
  );
}
