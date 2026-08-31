/** Render markdown bằng `marked` — chỉ dùng cho phần văn bản, không dùng để bóc câu hỏi. */
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export function md(src: string | undefined): string {
  if (!src) return '';
  return marked.parse(src, { async: false }) as string;
}
