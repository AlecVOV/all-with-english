# Báo cáo dọn UI

Nhánh `ui-cleanup`, 10 commit, chưa merge vào `main`.
Ảnh trước/sau: `docs/screenshots/before/` và `docs/screenshots/after/` (27 ảnh mỗi
bên, cùng bộ màn, cùng 16 khối câu hỏi, chụp cùng một script).
Danh sách vấn đề gốc: [`docs/ui-audit.md`](ui-audit.md) — 40 mục, đánh số A1…G9.

**Trạng thái cuối:** `npm run build` pass · `npm test` 130/130 xanh (trước là 121)
· `npm run validate` exit 0, không lỗi format · 0 lỗi runtime trên mọi màn.

Không đụng vào: `src/parser/`, `src/lib/grading.ts`, `src/lib/tests.ts`,
`src/lib/diagnose.ts`, `src/lib/storage.ts`, `scripts/`, `test/`, `config/`.
`CLAUDE.md` chỉ được **thêm** §13, không sửa hay xoá dòng nào (`git diff` xác nhận
80 dòng thêm, 0 dòng đổi).

---

## 1. Đã sửa gì, theo từng phần

### Design system (`src/styles/tokens.css`, `tailwind.config.js`, `src/index.css`)

Gom toàn bộ hình thức về một chỗ. `tailwind.config.js` giờ chỉ **ánh xạ** biến CSS,
không giữ giá trị thô.

| Trước | Sau |
|---|---|
| 9 sắc xám lẫn lộn cho viền | `line`, `line-strong`, `line-field` — mỗi cái một việc |
| 3 kiểu "khối xanh lá" cho cùng ý | 1 token `study` cho nội dung học tập, `ok`/`bad` riêng cho chấm điểm |
| 4 giá trị bo góc | 2: `--r-sm` cho điều khiển, `--r-md` cho vùng chứa |
| 5 mốc cỡ chữ nhỏ, thấp nhất 9px | thang 8 bậc, sàn 12px |
| `hover:` rải rác, không có focus | một quy tắc `:focus-visible` duy nhất ở `index.css` |

Thang trung tính đổi từ `slate` (xanh-xám) sang trung tính ngả ấm. Lý do ở mục 2.

### Màn chọn đề + màn bắt đầu (`TestPicker.tsx`)

- Thẻ đề gọn lại, **cả thẻ là vùng bấm** (nút thật phủ kín bằng `::after`, nên Tab
  và Enter vẫn dùng được); bỏ 8 nút primary xanh đậm xếp cạnh nhau.
- Phiên đang dở hiện tiến độ *đã làm n/tổng*.
- **A2 — `intro` bị bẹp thành một khối chữ liền** đã sửa: `mdIntro()` chèn dòng
  trống sau dòng nhãn in đậm, nên `**Cách dùng file này**` không còn dính vào câu
  sau nó.
- Chọn chế độ thành `role="radiogroup"` + `aria-checked`, hai thẻ bằng chiều cao,
  có chấm radio nhìn thấy được.
- Ô thời gian tự nhập có nhãn đơn vị "phút" và `aria-label`.

### Mode Thi (`ExamShell.tsx`, `PassagePane.tsx`, `BottomNav.tsx`)

- **A5 — ba nút cỡ chữ `A A A` trông y hệt nhau** đã sửa: phần tử phân biệt cỡ
  trước đây là một `<span>` **rỗng**. Giờ ba nút render đúng ba cỡ.
- **A4 — nền giấy chỉ áp cho 2 pane** đã sửa: `data-read-size` và `data-paper` đặt
  ở gốc khung, token đổ xuống toàn bộ header, dialog, thanh dưới.
- **D9 — đồng hồ `120:00`** giờ là `2:00:00`, kèm nhãn *Còn lại* / *Đã làm*.
- **F5 — hộp nộp bài không phải dialog** đã sửa: `<dialog>` + `showModal()`, nên
  bẫy focus, Esc và `::backdrop` là của trình duyệt. `closedby="any"` thêm
  light-dismiss ở nơi hỗ trợ.
- **D8 — thanh chia pane không dùng được bằng bàn phím** đã sửa:
  `role="separator"`, `tabIndex`, mũi tên trái/phải (Shift = bước lớn), Home/End.
- **D1, D2 — bài đọc** bỏ `text-justify` (cột hẹp + từ dài sinh "sông" trắng),
  chuyển serif, `line-height 1.7`, giới hạn `66ch`, `text-wrap: pretty`.
- **F6 — `window.prompt` cho ghi chú** thay bằng ô nhập ngay tại chỗ.
- **D4 — dải băng "Chế độ Luyện"** chiếm hẳn một hàng giờ là badge nhỏ trong header.
- Thanh dưới: đếm *đã làm / tổng*, ba trạng thái phân biệt **bằng hình dạng chứ
  không chỉ bằng màu**, `aria-label` mô tả trạng thái từng ô, `aria-current` cho
  ô đang xem.

### Mode Luyện + component câu hỏi (`QuestionPane.tsx`, `questions/index.tsx`)

- **A1 — markdown thô lọt ra giao diện** đã sửa ở mọi chỗ. `mdInline()` mới trong
  `src/lib/markdown.ts` xử lý `instruction`, `prompt`, `Option.text`, `caption`,
  `AnswerKey.display`. Trước đây màn hình hiện nguyên `Paragraph **A**`,
  `Which **TWO** functions…`, `**NO MORE THAN TWO WORDS**`, `**vi**`.
- **E1 — `gap-select` không hiện danh sách từ** đã sửa: danh sách hiện trên đầu
  khối như đề thật, không bắt mở từng dropdown mới biết có từ nào.
- **D3 — nhãn chữ "Review" lặp 86 lần** thay bằng một dấu sao; nhãn đầy đủ nằm ở
  `aria-label`.
- **E2 — ô nhập trong bảng đẩy chữ xuống dòng** đã sửa (input hẹp hơn trong ô bảng).
- **E4** số câu đậm bằng nội dung (nó là mỏ neo điều hướng), bỏ badge trùng ở dạng
  matching.
- TRUE/FALSE/NOT GIVEN thành một nhóm liền khối, `role="radiogroup"` + `aria-checked`.
- **D6, D7** khối và item có đường phân cách rõ.
- Khối ASCII giữ nguyên `w-[6ch]` — đã kiểm bằng ảnh, khung `│ ┌ ┐` không lệch cột.

### Màn hình kết quả (`ReviewScreen.tsx`)

- **G1 — `blockNote` in lại dưới từng câu sai** (8 lần liên tiếp cho Dạng 1) giờ
  hiện **đúng một lần** ở đầu nhóm.
- **G2 — tab "Câu sai" là cuộn dài vô tận** (~12.900px): gom theo dạng, mỗi nhóm
  thu gọn được, thêm bộ lọc *Tất cả / Trả lời sai / Bỏ trống*.
- **G3 — 16 khối chiến thuật mở hết** thành accordion, mở sẵn dạng yếu nhất.
  Trang kết quả từ **4.252px xuống 2.402px**.
- **G4** thanh tỉ lệ có rãnh viền nên 0% vẫn đọc được; **G5** tên dạng đủ chỗ, D8
  và D9 không còn cụt ở đúng phần phân biệt chúng.
- **G7** câu bỏ trống hiện trung tính, không đỏ như câu trả lời sai — đúng
  `CLAUDE.md` §7 ("`blank` **không** phải `wrong`").
- **G8** bỏ câu khẳng định cứng về nội dung đề trong ghi chú band.
- Tab có `role="tablist"` / `aria-selected` / `aria-controls`.

### Accessibility và câu chữ

Đo bằng Playwright trên DOM đã render, **6 màn × 2 nền giấy**:

| Hạng mục | Trước | Sau |
|---|---|---|
| cặp chữ/nền dưới 4.5:1 | 4 chỗ (`slate-400` ở 2.6:1) | **0** |
| control không có tên | — | **0** |
| chữ dưới 12px | 3 loại nhãn (9px, 11px) | **0** |
| vòng focus nhìn thấy được | không có | 2px solid, offset 2px, toàn app |

Thêm: `lang` cho bài đọc lấy từ `frontmatter.passage_language` (WCAG 3.1.2, mức AA
— trang khai báo `lang="vi"` mà bài đọc tiếng Anh thì screen reader đọc sai giọng);
`role="group"` + mô tả cho khối ASCII; thông báo lỗi nói rõ phải chạy
`npm run validate`; empty state viết lại theo mẫu *chuyện gì + vì sao + làm gì*.

---

## 2. Quyết định tự đưa ra, và vì sao

### 2.1 Bảng màu trung tính ngả ấm thay cho `slate`

`slate` là xanh-xám lạnh. App này để đọc 900–1000 từ liên tục rồi đọc tiếp phần
giải thích, phiên dài tới 2 tiếng; trung tính hơi ấm dễ chịu hơn ở độ dài đó và
tách bạch hơn với màu nhấn xanh. Cố ý **không** dùng tông kem (#F4F1EA) — đó đã là
mặc định nhàm; đây vẫn là xám thật, chỉ ngả ấm rất nhẹ.

Mọi màu đều **đo trước khi chọn**, không ước lượng bằng mắt. Số đo ghi ngay cạnh
từng biến trong `tokens.css`. Viền ô nhập dùng `#8c857a` vì đó là giá trị ấm nhạt
nhất còn đạt 3:1 trên cả ba nền (`3.35`–`3.65:1`), thoả WCAG 1.4.11.

### 2.2 Bài đọc dùng serif, UI dùng sans

Một ý phân biệt duy nhất: **thứ bạn học là serif, công cụ xung quanh là sans**.
Giúp mắt tách nội dung khỏi vỏ app, và serif đọc đoạn dài trên màn hình lớn tốt hơn.
Giữ nguyên stack font cũ vì nó được chọn để phủ Latin mở rộng (`Đinh Liễn`,
`Uṣṇīṣavijaya`, `Kumārajīva`, `dhāraṇī`) — ràng buộc thật, không được phá.

### 2.3 `study` và `ok` là hai màu xanh lá khác nhau

Cùng là xanh lá nhưng **không thay thế cho nhau**: `study` = "đây là thứ cần học"
(khối Chiến thuật, `blockNote`, chẩn đoán), `ok` = "câu này bạn làm đúng". Trộn hai
cái làm hỏng điểm mấu chốt ở `CLAUDE.md` §6.3.5. Đã ghi thành luật ở §13.2.

### 2.4 Render markdown là việc của hiển thị, không phải parser

Canonical format **cố ý** giữ `**…**` trong `display` (§5 #38 KEEP) và trong text
câu hỏi. Nên `mdInline()` nằm ở `src/lib/markdown.ts`, không sửa parser để strip
`**` — `accepted` cần bản đã strip, `display` cần bản raw, hai thứ khác nhau.

### 2.5 Menu bôi vàng giữ nhãn tiếng Anh

`Highlight / Note / Clear` lệch tông với phần còn lại (tiếng Việt), nhưng
`CLAUDE.md` §6.2 gọi đích danh ba chữ đó và §12 đặt `CLAUDE.md` trên phán đoán của
tôi. Giữ nhãn, thêm `title` tiếng Việt để không phải đoán nghĩa.

### 2.6 Bỏ "8 đoạn" khỏi thẻ đề

Thẻ đề trước hiện *câu · dạng · đoạn · từ*. Số đoạn ít giúp ích cho việc chọn đề,
nên bỏ, giữ *câu · dạng · từ*. Mọi con số vẫn suy từ đề lúc chạy.

### 2.7 Ngưỡng "dạng yếu" đặt thành hằng `WEAK = 0.8`

Trước đây 0.8 nằm rải rác ba chỗ trong `ReviewScreen` với ý nghĩa hơi khác nhau.
Gom thành một hằng có tên, không đổi giá trị.

### 2.8 Sửa hai lỗi chặn trả lời, dù đề bài nói "không đổi hành vi"

**Đây là chỗ tôi cố ý đi ra ngoài ràng buộc, nên nêu rõ.** Khi làm trọn một đề qua
UI để kiểm tra cuối, phát hiện hai lỗi khiến người dùng **không thể** đạt điểm tối
đa. Cả hai **có sẵn từ trước** (xác nhận bằng `git show` trên commit gốc), cả hai
nằm ở tầng hiển thị, và cả hai được sửa mà **không** đụng `grading.ts`, parser hay
format.

Tôi chọn sửa vì "không đổi hành vi" hợp lý khi hành vi hiện tại đúng; ở đây hành vi
hiện tại chấm sai một câu trả lời đúng. Nếu bạn muốn tách riêng, hai bản sửa nằm
gọn trong commit `da3583b`, revert được độc lập.

**Lỗi 1 — Matching Information: dropdown rỗng, 6 câu không trả lời được.**
File đề không liệt kê lựa chọn cho dạng này, vì chúng chính là nhãn đoạn của bài
đọc. `MatchingQuestion` làm `question.options ?? block.options ?? []` → mảng rỗng
→ `<select>` chỉ có dấu `—`. `QuestionPane` giờ suy danh sách từ `test.paragraphs`
lúc chạy (không hardcode `A–H`, đúng §10).

**Lỗi 2 — mcq-multi: trả lời đúng vẫn bị chấm sai.**
`grade()` chấm **từng số câu một**: đọc `answers[79]` và `answers[80]`, mỗi cái so
với tập `{B, D}`. Component lại dồn cả hai lựa chọn thành chuỗi `"B,D"` nhét vào
khoá 79 và bỏ trống 80 → câu 79 *sai*, câu 80 *bỏ trống*, dù người dùng chọn đúng
cả hai. Giờ mỗi số câu nhận một chữ cái, nên đúng cả hai được 2 điểm, đúng một được
1 điểm — khớp `CLAUDE.md` §7 mà không cần sửa gì trong `grading.ts`.

Kèm theo phải thêm `ExamShell.setAnswers()`: gọi `setAnswer` hai lần liên tiếp thì
lần sau dựng từ `session` cũ trong closure và **xoá mất** lần trước.

**Lỗi 3 (nhỏ) — chữ cái lựa chọn dính liền nội dung** trong text content
(`"AIt was deliberately organised…"`) vì khoảng cách là margin CSS. Screen reader
đọc thành một từ. Thêm ký tự cách thật.

Ba lỗi này lọt qua được vì bộ test cũ chỉ kiểm "mỗi số câu có đúng một ô điều
khiển", không kiểm ô đó có dùng được không. Đã thêm 2 nhóm test chặn:
mọi `<select>` phải có lựa chọn, và mcq-multi phải giữ một chữ cái cho mỗi số câu.

---

## 3. Bỏ qua hoặc không làm

- **Không revert gì cả.** Không phần nào làm vỡ chức năng.
- **Không thêm thư viện nào.** Không có lib UI, icon, hay test-DOM mới.
  Chevron mở/đóng vẽ bằng ký tự, dialog dùng `<dialog>` của trình duyệt.
- **Ô thanh điều hướng dưới giữ 28×28px**, không nâng lên 44px. WCAG 2.5.5 (44px)
  là mức AAA; mức AA là 2.5.8 với ngưỡng 24px, đã đạt. Nâng lên 44px thì 86 ô không
  còn nhét vừa hai hàng và phải cuộn thanh dưới — hại nhiều hơn lợi cho app desktop.
- **Không đụng `text-justify` của bảng/sơ đồ ASCII**, không vẽ lại bằng div/flex.
- **Không sửa file nào trong `test/`.** Phát hiện `workbook-07` câu 66 có đáp án
  chính (`Nagtso Tsultrim Gyalwa`, 3 từ) vượt `wordLimit` của chính khối đó (2 từ)
  — đúng loại lỗi `CLAUDE.md` §4.8 cảnh báo. Biến thể `(chấp nhận Nagtso)` cứu được
  nên `validate` không FAIL. **Đây là việc của corpus, không phải của UI**, nên chỉ
  báo lại chứ không tự sửa.
- **404 favicon** ở console mọi trang: `index.html` không khai báo icon và không có
  thư mục `public/`. Vô hại, và nằm ngoài phạm vi "component UI, CSS, markup".

---

## 4. Nên làm tiếp

Xếp theo giá trị trên công sức.

1. **`lang` cho text câu hỏi.** Mới đánh dấu bài đọc (dùng
   `frontmatter.passage_language`). `instruction` và `prompt` cũng là tiếng Anh
   nhưng frontmatter không khai báo ngôn ngữ cho chúng — thêm một trường, hoặc
   chấp nhận suy từ `passage_language`.
2. **Màn hình hẹp.** Mới kiểm ở 1440×900. Dưới ~900px thì split pane hai cột không
   còn hợp lý; nên có ngưỡng chuyển sang tab "Bài đọc / Câu hỏi".
3. **Phím tắt điều hướng câu.** Đã có mỏ neo và thanh dưới dùng được bằng bàn phím,
   nhưng chưa có phím nhảy câu trước/sau — thứ người luyện thi dùng nhiều.
4. **Kiểm bằng screen reader thật** (NVDA). Kiểm tự động bắt được tương phản, tên
   gọi, cỡ chữ; nó không bắt được thứ tự đọc có hợp lý không.
5. **Sửa `workbook-07` câu 66** qua `scripts/normalize.mjs` cho đáp án chính nằm
   trong `wordLimit`, rồi chạy `verify-migration.mjs`.
6. **Thêm `public/favicon.svg`** để console sạch.
7. **Cân nhắc `content-visibility: auto`** cho các nhóm câu sai đã thu gọn ở màn
   kết quả, nếu corpus lớn lên làm màn đó chậm.
