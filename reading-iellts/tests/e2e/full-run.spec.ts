/**
 * Làm trọn một đề qua giao diện thật rồi đòi điểm tuyệt đối.
 *
 * Đây là bản cố định của script kiểm tay đã dùng ở đợt dọn UI — chính nó tìm ra
 * hai lỗi chặn trả lời (dropdown Matching Information rỗng, mcq-multi ghi đè lẫn
 * nhau) mà test đơn vị không thấy, vì test đơn vị chỉ hỏi "có đủ ô điều khiển
 * không", không hỏi "điền vào có ăn điểm không".
 *
 * Luật của bài kiểm:
 *  - một case cho **mỗi** file trong `test/`, tên case suy từ file lúc chạy;
 *  - giá trị điền lấy từ bảng `ĐÁP ÁN & GIẢI THÍCH` của chính đề, không viết tay;
 *  - hình dạng ô điều khiển suy từ `kind` đã parse, giá trị hợp lệ đọc từ DOM;
 *  - đích đến là **điểm tối đa**: sai một câu là hỏng, vì mọi câu đều điền đúng.
 */

import { expect, test, type Locator, type Page } from '@playwright/test';
import type { ParsedTest, QuestionBlock } from '../../src/parser/types';
import { acceptedLetters, blockOfQuestion, loadCorpus, same, typedAnswer } from './corpus';

const corpus = loadCorpus();

/** Dạng nào trả lời bằng `<select>` một chữ cái. */
const SELECT_KINDS: QuestionBlock['kind'][] = [
  'matching-headings',
  'matching-information',
  'matching-features',
  'matching-endings',
  'gap-select',
];

/* ------------------------------------------------------------------ */

async function openTest(page: Page, t: ParsedTest): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: t.title, exact: true }).click();
  await expect(page.getByRole('heading', { name: t.title, level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Vào làm bài' }).click();
  // Khối câu hỏi đầu tiên dựng xong thì mới bắt đầu điền
  await expect(page.locator(`#block-${t.blocks[0]!.typeIndex}`)).toBeVisible();
}

/** `<select>`: chọn đúng `value` mà đề chấm là đúng, lấy từ chính danh sách option. */
async function answerSelect(page: Page, t: ParsedTest, qno: number): Promise<void> {
  const sel = page.locator(`select[data-qno="${qno}"]`);
  const values = (
    await sel.locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value))
  ).filter(Boolean);
  expect(values, `câu ${qno}: dropdown không có lựa chọn nào`).not.toHaveLength(0);

  const key = t.answers[qno]!;
  const hit = values.find((v) => key.accepted.some((a) => same(a, v)));
  expect(
    hit,
    `câu ${qno}: không lựa chọn nào khớp đáp án "${key.display}" (có: ${values.join(', ')})`
  ).toBeTruthy();
  await sel.selectOption(hit!);
}

/** tfng / ynng: ba nút cố định, tên nút chính là đáp án (`TRUE`, `NOT GIVEN`…). */
async function answerTrueFalse(
  page: Page,
  t: ParsedTest,
  block: QuestionBlock,
  qno: number
): Promise<void> {
  const key = t.answers[qno]!;
  const letters = acceptedLetters(
    key,
    (block.options ?? []).map((o) => o.letter)
  );
  expect(
    letters[0],
    `câu ${qno}: đáp án "${key.display}" không nằm trong lựa chọn cố định của khối`
  ).toBeTruthy();
  await page
    .locator(`[data-qno="${qno}"][role="radiogroup"]`)
    .getByRole('radio', { name: letters[0]!, exact: true })
    .click();
}

/** Ô nhập text — mọi dạng điền từ, kể cả ô trong bảng và ô trong khung ASCII. */
async function answerInput(
  page: Page,
  t: ParsedTest,
  block: QuestionBlock,
  qno: number
): Promise<void> {
  const value = typedAnswer(t.answers[qno]!, block);
  expect(value, `câu ${qno}: bảng đáp án không cho biến thể nào để gõ`).toBeTruthy();
  await page.locator(`input[data-qno="${qno}"]`).fill(value);
}

/** Bấm ô thứ `index` trong danh sách lựa chọn của một câu mcq. */
async function pickChoice(list: Locator, index: number, kind: 'radio' | 'checkbox'): Promise<void> {
  expect(index, 'không tìm thấy vị trí của lựa chọn đúng').toBeGreaterThanOrEqual(0);
  await list.locator(`input[type="${kind}"]`).nth(index).check();
}

/* ------------------------------------------------------------------ */

for (const t of corpus) {
  test(`${t.sourceFile} — điền đúng toàn bộ thì được điểm tối đa`, async ({ page }) => {
    // Đề lệch canonical thì dừng ngay: điểm có tối đa cũng không nói lên gì.
    expect(t.parseWarnings, `${t.sourceFile} parse không sạch`).toEqual([]);

    await openTest(page, t);

    for (const block of t.blocks) {
      if (block.kind === 'mcq-single' || block.kind === 'mcq-multi') {
        for (const q of block.questions) {
          const qnos = q.qnos ?? [q.qno];
          const opts = (q.options ?? []).map((o) => o.letter);
          const key = t.answers[qnos[0]!]!;
          const letters = acceptedLetters(key, opts);
          expect(
            letters.length,
            `câu ${qnos.join('–')}: đáp án "${key.display}" không khớp lựa chọn nào`
          ).toBeGreaterThan(0);

          if (block.kind === 'mcq-single') {
            const list = page.locator(`div[data-qno="${q.qno}"]`);
            await pickChoice(list, opts.indexOf(letters[0]!), 'radio');
          } else {
            // mcq-multi: một item chiếm nhiều số câu, mỏ neo là các span cao 0
            const list = page.locator(`span[data-qno="${qnos[0]}"]`).locator('xpath=..');
            for (const letter of letters.slice(0, qnos.length)) {
              await pickChoice(list, opts.indexOf(letter), 'checkbox');
            }
          }
        }
        continue;
      }

      for (let qno = block.range[0]; qno <= block.range[1]; qno++) {
        if (SELECT_KINDS.includes(block.kind)) await answerSelect(page, t, qno);
        else if (block.kind === 'tfng' || block.kind === 'ynng')
          await answerTrueFalse(page, t, block, qno);
        else await answerInput(page, t, block, qno);
      }
    }

    /* ---- nộp bài ------------------------------------------------- */
    await page.getByRole('button', { name: 'Nộp bài', exact: true }).first().click();
    const dialog = page.locator('dialog[open]');
    // Không còn câu nào trống ⇒ mọi số câu đều có ô điều khiển và ghi được giá trị
    await expect(dialog).toContainText(`Đã trả lời đủ ${t.totalQuestions} câu`);
    await dialog.getByRole('button', { name: 'Nộp bài' }).click();

    /* ---- màn kết quả --------------------------------------------- */
    const wrongTab = page.getByRole('tab', { name: /^Câu sai/ });
    await expect(wrongTab).toBeVisible();

    // Tên tab là số câu chưa đúng; kèm danh sách câu vào thông báo cho dễ sửa.
    const label = (await wrongTab.textContent()) ?? '';
    if (label.trim() !== 'Câu sai (0)') {
      await wrongTab.click();
      const listed = await page
        .locator('[data-wrong-qno]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-wrong-qno')).join(', '));
      throw new Error(
        `${t.sourceFile}: điền đúng toàn bộ mà vẫn bị chấm sai — tab hiện "${label.trim()}"` +
          (listed ? `\ncâu chưa đúng: ${listed}` : '')
      );
    }

    await expect(page.getByText(`/${t.totalQuestions}`, { exact: true })).toBeVisible();
  });
}

/* Dải câu của các khối phải phủ khít đề — nếu hở, vòng lặp điền ở trên bỏ sót
   câu mà bài kiểm vẫn xanh. Kiểm một lần, không cần mở trình duyệt. */
test('mỗi đề: các khối phủ khít 1..totalQuestions', () => {
  for (const t of corpus) {
    const covered = new Set<number>();
    for (const b of t.blocks) for (let n = b.range[0]; n <= b.range[1]; n++) covered.add(n);
    const missing: number[] = [];
    for (let n = 1; n <= t.totalQuestions; n++) if (!covered.has(n)) missing.push(n);
    expect(missing, `${t.sourceFile} hở câu`).toEqual([]);
    expect(covered.size, `${t.sourceFile} có câu ngoài 1..${t.totalQuestions}`).toBe(
      t.totalQuestions
    );
  }
});

test('mỗi đề: mọi số câu đều có đáp án và thuộc một khối', () => {
  for (const t of corpus) {
    for (let n = 1; n <= t.totalQuestions; n++) {
      expect(t.answers[n], `${t.sourceFile} câu ${n} không có đáp án`).toBeTruthy();
      expect(blockOfQuestion(t, n), `${t.sourceFile} câu ${n} không thuộc khối nào`).toBeTruthy();
    }
  }
});
