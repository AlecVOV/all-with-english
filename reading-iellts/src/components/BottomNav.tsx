/**
 * Thanh điều hướng dưới (CLAUDE.md §6.2):
 * ô 1…n, đã trả lời tô đậm, đang xem có viền, đánh dấu Review có chấm.
 * Bấm số là nhảy tới và cuộn tới đúng câu.
 *
 * Ba trạng thái phải phân biệt được **bằng hình dạng chứ không chỉ bằng màu**:
 *   chưa làm  → viền mảnh, nền giấy
 *   đã làm    → nền đặc, chữ trắng
 *   đánh dấu  → thêm chấm ở góc trên phải
 */

interface Props {
  total: number;
  /** những số câu thực sự có trong phiên này (chế độ làm lại dạng sai) */
  present: Set<number>;
  answered: Set<number>;
  flagged: Set<number>;
  current: number | null;
  onJump: (qno: number) => void;
}

export default function BottomNav({ total, present, answered, flagged, current, onJump }: Props): JSX.Element {
  const nums = Array.from({ length: total }, (_, i) => i + 1).filter((n) => present.has(n));
  const done = nums.filter((n) => answered.has(n)).length;

  return (
    <nav
      aria-label="Điều hướng câu hỏi"
      className="flex max-h-28 items-start gap-3 overflow-y-auto border-t border-line bg-surface-3 px-3 py-2"
    >
      <p className="sticky top-0 shrink-0 pt-1 text-sm tabular-nums text-ink-2">
        <span className="font-semibold text-ink">{done}</span>
        <span aria-hidden="true">/</span>
        <span className="sr-only"> trên </span>
        {nums.length}
      </p>

      <ul className="flex flex-wrap gap-1">
        {nums.map((n) => {
          const on = answered.has(n);
          const flag = flagged.has(n);
          const here = current === n;
          return (
            <li key={n}>
              <button
                type="button"
                onClick={() => onJump(n)}
                aria-label={`Câu ${n}${on ? ', đã trả lời' : ', chưa trả lời'}${flag ? ', đã đánh dấu' : ''}`}
                aria-current={here ? 'true' : undefined}
                className={
                  'relative h-7 w-7 rounded border text-sm tabular-nums transition-colors ' +
                  (on
                    ? 'border-ink bg-ink font-semibold text-white'
                    : 'border-line-field bg-surface text-ink-2 hover:border-ink hover:bg-surface') +
                  (here ? ' outline outline-2 outline-offset-1 outline-accent' : '')
                }
              >
                {n}
                {flag && (
                  <span
                    aria-hidden="true"
                    className={
                      'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-surface-3 ' +
                      (on ? 'bg-warn-line' : 'bg-warn')
                    }
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
