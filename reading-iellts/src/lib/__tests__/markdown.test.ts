/**
 * Tầng hiển thị markdown (CLAUDE.md §13.4).
 *
 * Hai việc phải đồng thời đúng:
 *  1. `**…**` trong dữ liệu đề vẫn phải render — canonical format cố ý giữ
 *     nó lại trong `display`, `prompt`, `instruction` (#38 KEEP);
 *  2. nhưng `<`, `>`, `&` thì phải ra **chữ**, không ra thẻ — đề là file người
 *     dùng tự thả vào `test/`, và mọi chỗ gọi đều đổ vào `dangerouslySetInnerHTML`.
 */

import { describe, expect, it } from 'vitest';
import { md, mdInline, mdIntro } from '../markdown';

describe('mdInline — vẫn render markdown', () => {
  it('bung `**…**` thành <strong>', () => {
    expect(mdInline('Paragraph **A**')).toBe('Paragraph <strong>A</strong>');
  });

  it('không bọc <p> — nhúng được vào giữa một dòng chữ', () => {
    expect(mdInline('**C** founded')).not.toContain('<p>');
  });

  it('giữ nguyên ký hiệu của ô giải thích (#37 KEEP)', () => {
    expect(mdInline('⚠️ ≥ → ↔ ≠')).toBe('⚠️ ≥ → ↔ ≠');
  });

  it('giữ nguyên Latin mở rộng', () => {
    expect(mdInline('**Uṣṇīṣavijaya** · Đinh Liễn')).toContain('Uṣṇīṣavijaya');
  });
});

describe('mdInline — HTML trong đề là chữ, không phải markup', () => {
  it('escape ký tự lẻ < > &', () => {
    expect(mdInline('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d');
  });

  it('thẻ trông-như-thật không lọt xuống DOM', () => {
    const out = mdInline('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });

  it('script trong câu hỏi không chạy được', () => {
    const out = mdInline('Which **TWO** <script>alert(1)</script> functions?');
    expect(out).not.toContain('<script');
    expect(out).toContain('<strong>TWO</strong>');
  });

  it('thẻ đóng cũng escape', () => {
    expect(mdInline('</b>')).toBe('&lt;/b&gt;');
  });
});

describe('md — khối văn bản', () => {
  it('vẫn dựng danh sách và in đậm', () => {
    const out = md('- Đọc **câu đầu** mỗi đoạn\n- Heading là ý bao trùm');
    expect(out).toContain('<li>');
    expect(out).toContain('<strong>câu đầu</strong>');
  });

  it('khối HTML nguyên đoạn cũng thành chữ', () => {
    const out = md('<div onclick="alert(1)">xin chào</div>');
    expect(out).not.toContain('<div');
    expect(out).toContain('&lt;div');
  });
});

describe('mdIntro', () => {
  it('bỏ `> ` và tách dòng nhãn in đậm thành đoạn riêng (audit A2)', () => {
    const out = mdIntro('> **Cách dùng file này**\n> Đây **không** phải một đề thi.');
    expect(out).not.toContain('&gt;');
    expect(out.match(/<p>/g) ?? []).toHaveLength(2);
  });
});
