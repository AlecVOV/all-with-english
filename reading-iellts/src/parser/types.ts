/**
 * Kiểu dữ liệu của parser đề thi.
 * Nguồn: CLAUDE.md §5, có hai sửa đổi do docs/canonical-format.md chốt:
 *   - §9.6  `ParsedTest.id` = `topic_slug` trong frontmatter, không phải tên file
 *   - §N26  thêm `diagnosticsSource`; `optionsLabel` bị bỏ (N07)
 */

export type QuestionKind =
  | 'matching-headings'
  | 'matching-information'
  | 'tfng'
  | 'ynng'
  | 'matching-features'
  | 'matching-endings'
  | 'gap-text'
  | 'gap-select'
  | 'gap-table'
  | 'gap-flow'
  | 'gap-diagram'
  | 'mcq-single'
  | 'mcq-multi'
  | 'short-answer'
  | 'unknown';

export interface Option {
  letter: string;
  text: string;
}

export interface Segment {
  type: 'text' | 'blank';
  value?: string;
  qno?: number;
}

export interface Question {
  qno: number;
  /** mcq-multi chiếm nhiều số câu, vd [79, 80] */
  qnos?: number[];
  prompt?: string;
  /** ghi đè options cấp block (mcq) */
  options?: Option[];
  /** các dạng điền từ: văn bản xen kẽ chỗ trống */
  segments?: Segment[];
  /** thụt lề gốc của bullet Note Completion (#15 KEEP) */
  indent?: number;
  /** mcq-multi: số lựa chọn phải chọn */
  selectCount?: number;
}

export interface QuestionBlock {
  typeIndex: number;
  typeName: string;
  kind: QuestionKind;
  range: [number, number];
  /** markdown thô của khối `> **Chiến thuật**` */
  strategy?: string;
  instruction?: string;
  /** vd "NO MORE THAN TWO WORDS AND/OR A NUMBER" */
  wordLimit?: string;
  /** số từ tối đa suy từ wordLimit */
  wordLimitCount?: number;
  options?: Option[];
  /** tiêu đề in đậm của Note Completion (N07 giữ lại) */
  caption?: string;
  /** giữ nguyên byte khối ASCII cho gap-flow / gap-diagram */
  raw?: string;
  /** ghi chú in nghiêng ở khu đáp án */
  blockNote?: string;
  questions: Question[];
  /** hàng của bảng gap-table, mỗi ô là mảng Segment */
  table?: { header: Segment[][]; rows: Segment[][][] };
}

export interface AnswerKey {
  qno: number;
  /** đã chuẩn hoá, so khớp không phân biệt hoa thường */
  accepted: string[];
  /** đáp án hiển thị nguyên bản */
  display: string;
  explanation?: string;
}

export interface Diagnostic {
  label: string;
  range: [number, number];
  count: number;
  /** vd 0.3 */
  threshold: number;
  /** markdown */
  advice: string;
}

export interface Frontmatter {
  workbook_id: number;
  title: string;
  topic_slug: string;
  passage_word_count: number;
  question_count: number;
  question_types: string[];
  answer_language: string[];
  passage_language: string;
  created: string;
}

export type DiagnosticsSource = 'file' | 'default' | 'none';

export interface ParsedTest {
  /** = frontmatter.topic_slug (canonical-format §9.6) */
  id: string;
  title: string;
  passageTitle: string;
  /** markdown các blockquote đầu file */
  intro?: string;
  paragraphs: { label: string; text: string }[];
  blocks: QuestionBlock[];
  answers: Record<number, AnswerKey>;
  diagnostics: Diagnostic[];
  /** parser thuần chỉ trả được hai giá trị này */
  diagnosticsSource: 'file' | 'none';
  extras: { vocabulary?: string; paraphrases?: string; comparison?: string };
  totalQuestions: number;
  parseWarnings: string[];
  frontmatter?: Frontmatter;
  /** tên file, giữ để báo lỗi cho người dùng */
  sourceFile: string;
}
