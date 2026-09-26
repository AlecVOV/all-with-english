/**
 * Cột trái: bài đọc, cuộn độc lập.
 * Bôi đen chữ → menu nhỏ "Highlight / Note / Clear" (CLAUDE.md §6.2) —
 * chức năng này có thật trong đề thi máy nên không phải trang trí.
 *
 * Kiểu chữ theo CLAUDE.md §13.5: serif, căn trái, `--lh-read`, giới hạn
 * `--measure`. Cỡ chữ và nền giấy thừa hưởng từ token do `ExamShell` đặt,
 * pane không tự quản hai thứ đó nữa.
 */

import { useEffect, useRef, useState } from 'react';
import type { Highlight } from '../lib/storage';

interface Props {
  title: string;
  /** mã ngôn ngữ bài đọc, từ frontmatter.passage_language */
  lang: string;
  paragraphs: { label: string; text: string }[];
  highlights: Highlight[];
  onHighlights: (h: Highlight[]) => void;
}

/** Bọc mọi lần xuất hiện của các đoạn đã bôi vàng trong một paragraph. */
function renderMarked(text: string, marks: Highlight[]): (string | JSX.Element)[] {
  if (!marks.length) return [text];
  // dài trước ngắn sau, tránh cắt lồng nhau
  const sorted = [...marks].sort((a, b) => b.text.length - a.text.length);
  let parts: (string | JSX.Element)[] = [text];
  for (const m of sorted) {
    if (!m.text.trim()) continue;
    const next: (string | JSX.Element)[] = [];
    for (const p of parts) {
      if (typeof p !== 'string') {
        next.push(p);
        continue;
      }
      let rest = p;
      let idx = rest.indexOf(m.text);
      let guard = 0;
      while (idx >= 0 && guard++ < 50) {
        if (idx > 0) next.push(rest.slice(0, idx));
        next.push(
          <mark key={`${m.text}-${next.length}`} className="hl" {...(m.note ? { 'data-note': m.note, title: m.note } : {})}>
            {m.text}
          </mark>
        );
        rest = rest.slice(idx + m.text.length);
        idx = rest.indexOf(m.text);
      }
      if (rest) next.push(rest);
    }
    parts = next;
  }
  return parts;
}

type Menu = { x: number; y: number; text: string; para: string };

export default function PassagePane({ title, lang, paragraphs, highlights, onHighlights }: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const onUp = (): void => {
      const sel = window.getSelection();
      const text = sel?.toString() ?? '';
      if (!sel || !text.trim() || text.length > 400) {
        setMenu(null);
        setNoting(false);
        return;
      }
      const node = sel.anchorNode;
      if (!node || !ref.current?.contains(node)) {
        setMenu(null);
        setNoting(false);
        return;
      }
      const el = (node.nodeType === 3 ? node.parentElement : (node as HTMLElement))?.closest('[data-para]');
      const para = el?.getAttribute('data-para') ?? '';
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const box = ref.current.getBoundingClientRect();
      setMenu({ x: r.left - box.left + r.width / 2, y: r.top - box.top - 8 + ref.current.scrollTop, text, para });
      setNoting(false);
      setNote('');
    };
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, []);

  const close = (): void => {
    setMenu(null);
    setNoting(false);
    setNote('');
    window.getSelection()?.removeAllRanges();
  };

  const add = (withNote?: string): void => {
    if (!menu) return;
    const next = highlights.filter((h) => h.text !== menu.text);
    onHighlights([...next, { paragraph: menu.para, text: menu.text, ...(withNote ? { note: withNote } : {}) }]);
    close();
  };

  const clear = (): void => {
    if (!menu) return;
    onHighlights(highlights.filter((h) => !menu.text.includes(h.text) && !h.text.includes(menu.text)));
    close();
  };

  return (
    <div ref={ref} className="relative h-full overflow-y-auto bg-paper px-6 py-5">
      {/* Trang khai báo lang="vi" còn bài đọc là tiếng khác → phải đánh dấu,
          nếu không screen reader đọc tiếng Anh bằng giọng tiếng Việt (WCAG 3.1.2). */}
      <div lang={lang} className="mx-auto max-w-measure">
        <h2 className="mb-4 font-serif text-xl font-bold">{title}</h2>

        {paragraphs.map((p) => (
          <div key={p.label} data-para={p.label} className="mb-5">
            <div className="mb-1 font-sans text-base font-bold text-ink-2">{p.label}</div>
            {/* Căn trái, không justify: cột hẹp + từ dài sinh "sông" trắng (audit D1). */}
            <p className="whitespace-pre-wrap font-serif text-read [text-wrap:pretty]">
              {renderMarked(p.text, highlights.filter((h) => h.paragraph === p.label))}
            </p>
          </div>
        ))}
      </div>

      {menu && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full rounded-md border border-line-strong bg-surface p-1 shadow-pop"
          style={{ left: menu.x, top: menu.y }}
        >
          {noting ? (
            // Ghi chú nhập ngay tại chỗ, không dùng window.prompt (audit F6)
            <form
              className="flex items-center gap-1 p-1"
              onSubmit={(e) => {
                e.preventDefault();
                add(note.trim() || undefined);
              }}
            >
              <input
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setNoting(false)}
                placeholder="Ghi chú…"
                aria-label="Ghi chú cho đoạn đã chọn"
                className="field w-48 text-base"
              />
              <button type="submit" className="btn btn-primary px-2 py-1 text-sm">
                Lưu
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-0.5">
              {/* Nhãn giữ nguyên tiếng Anh theo CLAUDE.md §6.2 (đề thi máy dùng
                  đúng ba chữ này); title tiếng Việt để không phải đoán nghĩa. */}
              <button
                title="Bôi vàng đoạn đã chọn"
                className="rounded px-2 py-1 text-base hover:bg-surface-3"
                onClick={() => add()}
              >
                Highlight
              </button>
              <button
                title="Bôi vàng kèm ghi chú"
                className="rounded px-2 py-1 text-base hover:bg-surface-3"
                onClick={() => setNoting(true)}
              >
                Note
              </button>
              <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-line" />
              <button
                title="Bỏ bôi vàng ở đoạn đã chọn"
                className="rounded px-2 py-1 text-base text-ink-2 hover:bg-surface-3"
                onClick={clear}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
