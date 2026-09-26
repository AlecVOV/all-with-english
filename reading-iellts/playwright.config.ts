/**
 * Playwright — bài kiểm đầu-cuối duy nhất của dự án (`npm run test:e2e`).
 *
 * `npm test` (vitest) chạy parser / chấm điểm / component ở tầng đơn vị; bài
 * kiểm này chạy **trọn một đề qua giao diện thật**, đúng cách người dùng làm:
 * mở app → chọn đề → điền từng ô → nộp bài → đọc điểm trên màn kết quả.
 *
 * Số đề không viết ở đây: spec tự quét `test/` lúc chạy (CLAUDE.md §10).
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 5174; // cổng riêng, không giành với `npm run dev` đang mở

export default defineConfig({
  testDir: './tests/e2e',
  // Một đề là ~86 thao tác điền; chậm nhưng không được phép "gần đúng".
  timeout: 180_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'line' : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
  },
});
