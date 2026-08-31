/**
 * Màn chọn đề + màn bắt đầu (CLAUDE.md §6.1).
 * Đề nào có parseWarnings → banner đỏ, ghi rõ file nào thiếu câu nào.
 */

import { useState } from 'react';
import type { LoadedTest } from '../lib/tests';
import { md } from '../lib/markdown';
import { loadSession } from '../lib/storage';

interface Props {
  tests: LoadedTest[];
  onStart: (test: LoadedTest, mode: 'exam' | 'practice', minutes: number, candidate: string) => void;
  onResume: (test: LoadedTest) => void;
}

export default function TestPicker({ tests, onStart, onResume }: Props): JSX.Element {
  const [picked, setPicked] = useState<LoadedTest | null>(null);
  const [mode, setMode] = useState<'exam' | 'practice'>('practice'); // mặc định Luyện
  const [minutes, setMinutes] = useState(120);
  const [custom, setCustom] = useState('');
  const [candidate, setCandidate] = useState('Candidate');

  const broken = tests.filter((t) => t.parseWarnings.length);

  if (!picked) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-1 text-2xl font-bold">IELTS Academic Reading</h1>
        <p className="mb-6 text-sm text-slate-600">
          {tests.length} đề trong thư mục <code className="rounded bg-slate-200 px-1">test/</code>. Thả thêm một file
          <code className="mx-1 rounded bg-slate-200 px-1">.md</code> vào đó rồi refresh là có thêm đề.
        </p>

        {broken.length > 0 && (
          <div className="mb-5 rounded border border-red-300 bg-red-50 p-3 text-sm">
            <p className="font-semibold text-red-800">Có đề parse lỗi:</p>
            <ul className="mt-1 space-y-1">
              {broken.map((t) => (
                <li key={t.id}>
                  <code className="font-semibold">{t.sourceFile}</code>
                  <ul className="ml-4 list-disc text-red-700">
                    {t.parseWarnings.slice(0, 8).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {t.parseWarnings.length > 8 && <li>… và {t.parseWarnings.length - 8} cảnh báo nữa</li>}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {tests.map((t) => {
            const saved = loadSession(t.id);
            return (
              <div key={t.id} className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {t.frontmatter && (
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">
                          #{t.frontmatter.workbook_id}
                        </span>
                      )}
                      <h2 className="truncate text-lg font-semibold">{t.title}</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{t.passageTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.totalQuestions} câu · {t.blocks.length} dạng · {t.paragraphs.length} đoạn
                      {t.frontmatter ? ` · ${t.frontmatter.passage_word_count} từ` : ''}
                      {t.parseWarnings.length ? ` · ⚠ ${t.parseWarnings.length} cảnh báo` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {saved && !saved.submitted && (
                      <button
                        onClick={() => onResume(t)}
                        className="rounded border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
                      >
                        Làm tiếp
                      </button>
                    )}
                    <button
                      onClick={() => setPicked(t)}
                      className="rounded bg-sky-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-600"
                    >
                      Bắt đầu
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const mins = custom ? Math.max(1, Number(custom) || 0) : minutes;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <button onClick={() => setPicked(null)} className="mb-3 text-sm text-sky-700 hover:underline">
        ← Chọn đề khác
      </button>
      <h1 className="text-2xl font-bold">{picked.title}</h1>
      <p className="mb-4 text-slate-600">{picked.passageTitle}</p>

      {picked.intro && (
        <div
          className="prose-md mb-5 rounded border border-slate-300 bg-white p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: md(picked.intro.replace(/^>\s?/gm, '')) }}
        />
      )}

      <div className="mb-4 rounded border border-slate-300 bg-white p-4">
        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-semibold">Tên thí sinh</span>
          <input
            className="w-full rounded border border-slate-300 px-2 py-1"
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
          />
        </label>

        <div className="mb-3">
          <span className="mb-1 block text-sm font-semibold">Chế độ</span>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => setMode('practice')}
              className={
                'rounded border p-3 text-left text-sm ' +
                (mode === 'practice' ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-400' : 'border-slate-300 hover:bg-slate-50')
              }
            >
              <b>Luyện</b> <span className="text-xs text-slate-500">(mặc định)</span>
              <p className="mt-1 text-xs text-slate-600">
                Hiện khối “Chiến thuật” của dạng đang làm. Đồng hồ đếm lên, không ép giờ. Vẫn không hiện đáp án cho tới khi nộp.
              </p>
            </button>
            <button
              onClick={() => setMode('exam')}
              className={
                'rounded border p-3 text-left text-sm ' +
                (mode === 'exam' ? 'border-sky-600 bg-sky-50 ring-1 ring-sky-400' : 'border-slate-300 hover:bg-slate-50')
              }
            >
              <b>Thi</b>
              <p className="mt-1 text-xs text-slate-600">
                Mô phỏng CD-IELTS nghiêm ngặt: không chiến thuật, đồng hồ đếm ngược, hết giờ tự nộp.
              </p>
            </button>
          </div>
        </div>

        {mode === 'exam' && (
          <div>
            <span className="mb-1 block text-sm font-semibold">Thời gian</span>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[60, 120].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMinutes(m);
                    setCustom('');
                  }}
                  className={
                    'rounded border px-3 py-1 ' +
                    (!custom && minutes === m ? 'border-sky-600 bg-sky-50' : 'border-slate-300 hover:bg-slate-50')
                  }
                >
                  {m} phút
                </button>
              ))}
              <input
                type="number"
                min={1}
                placeholder="tự nhập"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="w-28 rounded border border-slate-300 px-2 py-1"
              />
              <span className="text-xs text-slate-500">
                {picked.totalQuestions} câu — 60 phút thường không đủ.
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onStart(picked, mode, mins, candidate.trim() || 'Candidate')}
        className="rounded bg-sky-700 px-6 py-2 font-semibold text-white hover:bg-sky-600"
      >
        Vào làm bài
      </button>
    </div>
  );
}
