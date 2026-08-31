/**
 * Cột trái: bài đọc, cuộn độc lập.
 * Bôi đen chữ → menu nhỏ "Highlight / Note / Clear" (CLAUDE.md §6.2) —
 * chức năng này có thật trong đề thi máy nên không phải trang trí.
 */

import { useEffect, useRef, useState } from 'react';
import type { Highlight } from '../lib/storage';

interface Props {
  title: string;
  paragraphs: { label: string; text: string }[];
  highlights: Highlight[];
  onHighlights: (h: Highlight[]) => void;
  fontSize: 0 | 1 | 2;
  paper: 'white' | 'cream';
}

const SIZES = ['text-[13px]', 'text-[15px]', 'text-[17px]'] as const;

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

export default function PassagePane({
  title,
  paragraphs,
  highlights,
  onHighlights,
  fontSize,
  paper,
}: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; text: string; para: string } | null>(null);

  useEffect(() => {
    const onUp = (): void => {
      const sel = window.getSelection();
      const text = sel?.toString() ?? '';
      if (!sel || !text.trim() || text.length > 400) {
        setMenu(null);
        return;
      }
      const node = sel.anchorNode;
      if (!node || !ref.current?.contains(node)) {
        setMenu(null);
        return;
      }
      const el = (node.nodeType === 3 ? node.parentElement : (node as HTMLElement))?.closest('[data-para]');
      const para = el?.getAttribute('data-para') ?? '';
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const box = ref.current.getBoundingClientRect();
      setMenu({ x: r.left - box.left + r.width / 2, y: r.top - box.top - 8, text, para });
    };
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, []);

  const add = (note?: string): void => {
    if (!menu) return;
    const next = highlights.filter((h) => h.text !== menu.text);
    onHighlights([...next, { paragraph: menu.para, text: menu.text, ...(note ? { note } : {}) }]);
    setMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const clear = (): void => {
    if (!menu) return;
    onHighlights(highlights.filter((h) => !menu.text.includes(h.text) && !h.text.includes(menu.text)));
    setMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div
      ref={ref}
      className={`relative h-full overflow-y-auto px-5 py-4 ${SIZES[fontSize]} ${
        paper === 'cream' ? 'bg-amber-50' : 'bg-white'
      }`}
    >
      <h2 className="mb-3 font-serif text-lg font-bold">{title}</h2>
      {paragraphs.map((p) => (
        <div key={p.label} data-para={p.label} className="mb-4">
          <div className="mb-1 font-bold">{p.label}</div>
          <p className="whitespace-pre-wrap text-justify leading-relaxed">
            {renderMarked(p.text, highlights.filter((h) => h.paragraph === p.label))}
          </p>
        </div>
      ))}

      {menu && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full rounded-md border border-slate-300 bg-white p-1 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
        >
          <button className="rounded px-2 py-1 text-xs hover:bg-yellow-100" onClick={() => add()}>
            Highlight
          </button>
          <button
            className="rounded px-2 py-1 text-xs hover:bg-amber-100"
            onClick={() => {
              const note = window.prompt('Ghi chú cho đoạn đã chọn:');
              if (note !== null) add(note || undefined);
            }}
          >
            Note
          </button>
          <button className="rounded px-2 py-1 text-xs hover:bg-slate-100" onClick={clear}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
