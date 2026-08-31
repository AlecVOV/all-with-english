/**
 * Thanh điều hướng dưới (CLAUDE.md §6.2):
 * ô 1…n, đã trả lời tô đậm, đang xem có viền, đánh dấu Review có chấm.
 * Bấm số là nhảy tới và cuộn tới đúng câu.
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
  return (
    <div className="flex flex-wrap gap-1 overflow-y-auto border-t border-slate-300 bg-slate-50 px-3 py-2">
      {nums.map((n) => {
        const on = answered.has(n);
        const flag = flagged.has(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onJump(n)}
            title={`Câu ${n}${flag ? ' · đã đánh dấu' : ''}`}
            className={
              'relative h-7 w-7 rounded text-xs transition ' +
              (on ? 'bg-slate-800 font-bold text-white ' : 'bg-white text-slate-600 hover:bg-slate-200 ') +
              (current === n ? 'ring-2 ring-sky-500 ring-offset-1 ' : 'border border-slate-300 ')
            }
          >
            {n}
            {flag && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />}
          </button>
        );
      })}
    </div>
  );
}
