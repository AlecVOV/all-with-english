/**
 * Mọi màu / cỡ chữ / radius / shadow ở đây đều trỏ về biến CSS trong
 * `src/styles/tokens.css`. Không thêm giá trị thô vào file này — thêm token
 * mới thì thêm ở tokens.css trước, rồi ánh xạ xuống đây.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        /* Phải phủ Latin mở rộng: Đinh Liễn, Uṣṇīṣavijaya, Kumārajīva, dhāraṇī */
        sans: ['"Segoe UI"', 'Inter', 'Charis SIL', 'Gentium Plus', 'Noto Sans', 'system-ui', 'sans-serif'],
        serif: ['Georgia', '"Charis SIL"', '"Gentium Plus"', '"Noto Serif"', 'serif'],
        mono: ['"Cascadia Mono"', 'Consolas', '"DejaVu Sans Mono"', '"Noto Sans Mono"', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: 'var(--c-ink)',
          2: 'var(--c-ink-2)',
          3: 'var(--c-ink-3)',
        },
        surface: {
          DEFAULT: 'var(--c-surface)',
          2: 'var(--c-surface-2)',
          3: 'var(--c-surface-3)',
        },
        line: {
          DEFAULT: 'var(--c-line)',
          strong: 'var(--c-line-strong)',
          field: 'var(--c-field)',
        },
        chrome: {
          DEFAULT: 'var(--c-chrome)',
          2: 'var(--c-chrome-2)',
          line: 'var(--c-chrome-line)',
          fg: 'var(--c-on-chrome)',
          'fg-2': 'var(--c-on-chrome-2)',
        },
        accent: {
          DEFAULT: 'var(--c-accent)',
          dk: 'var(--c-accent-dk)',
          soft: 'var(--c-accent-soft)',
          line: 'var(--c-accent-line)',
        },
        study: {
          DEFAULT: 'var(--c-study)',
          soft: 'var(--c-study-soft)',
          line: 'var(--c-study-line)',
        },
        ok: {
          DEFAULT: 'var(--c-ok)',
          soft: 'var(--c-ok-soft)',
          line: 'var(--c-ok-line)',
        },
        bad: {
          DEFAULT: 'var(--c-bad)',
          soft: 'var(--c-bad-soft)',
          line: 'var(--c-bad-line)',
        },
        warn: {
          DEFAULT: 'var(--c-warn)',
          soft: 'var(--c-warn-soft)',
          line: 'var(--c-warn-line)',
        },
        paper: 'var(--paper)',
      },
      fontSize: {
        xs: 'var(--fs-xs)',
        sm: 'var(--fs-sm)',
        base: 'var(--fs-base)',
        md: 'var(--fs-md)',
        lg: 'var(--fs-lg)',
        xl: 'var(--fs-xl)',
        '2xl': 'var(--fs-2xl)',
        '3xl': 'var(--fs-3xl)',
        read: ['var(--fs-read)', { lineHeight: 'var(--lh-read)' }],
      },
      borderRadius: {
        DEFAULT: 'var(--r-sm)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-md)',
      },
      boxShadow: {
        pop: 'var(--sh-pop)',
        dialog: 'var(--sh-dialog)',
      },
      maxWidth: {
        measure: 'var(--measure)',
      },
    },
  },
  plugins: [],
};
