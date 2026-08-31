/** @type {import('tailwindcss').Config} */
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
    },
  },
  plugins: [],
};
