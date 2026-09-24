/** Render markdown bằng `marked` — chỉ dùng cho phần văn bản, không dùng để bóc câu hỏi. */
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export function md(src: string | undefined): string {
  if (!src) return '';
  return marked.parse(src, { async: false }) as string;
}

/**
 * Render khối `intro` (các blockquote đầu file) thành markdown đọc được.
 *
 * Hai việc, cả hai đều thuần hiển thị:
 *  1. bỏ dấu `> ` — đã hiện ở màn riêng rồi, không cần khung trích dẫn nữa;
 *  2. chèn dòng trống sau một dòng **chỉ gồm chữ in đậm**.
 *
 * Việc (2) là bắt buộc: trong file thật dòng nhãn và câu đầu tiên nằm sát nhau
 *
 *     > **Cách dùng file này**
 *     > Đây **không** phải một đề thi…
 *
 * nên sau khi bỏ `> `, markdown gộp hai dòng thành **một đoạn** và ra chuỗi dính
 * liền "Cách dùng file này Đây không phải một đề thi…" (audit A2).
 */
export function mdIntro(src: string | undefined): string {
  if (!src) return '';
  return md(
    src
      .replace(/^>\s?/gm, '')
      // dòng chỉ có `**…**` → tách thành đoạn riêng
      .replace(/^(\*\*[^*\n]+\*\*)[ \t]*$/gm, '$1\n')
  );
}

/**
 * Render markdown **inline** — cho những chuỗi một dòng nằm lọt trong câu:
 * `prompt`, `instruction`, `Option.text`, `AnswerKey.display`.
 *
 * Canonical format cố ý giữ nguyên `**…**` ở những chỗ này: `display` phải raw
 * để hiển thị đúng bản gốc (canonical-format §5 #38 KEEP), còn `accepted` mới là
 * bản đã strip emphasis. Nên việc bung `**` thành `<strong>` là trách nhiệm của
 * tầng hiển thị, không phải của parser (CLAUDE.md §13.4).
 *
 * Ví dụ thật:
 *   `Paragraph **A**`                    (workbook-01, Dạng 1)
 *   `Which **TWO** functions did…`       (workbook-01, Dạng 15)
 *   `Choose **NO MORE THAN TWO WORDS**…` (workbook-01, instruction Dạng 12)
 *   `**vi**`                             (workbook-01, ô Đ.án của Dạng 1)
 *
 * Khác `md()` ở chỗ không bọc `<p>`, nên nhúng được vào giữa một dòng chữ.
 */
export function mdInline(src: string | undefined): string {
  if (!src) return '';
  return marked.parseInline(src, { async: false }) as string;
}
