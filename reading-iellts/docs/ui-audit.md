# UI Audit — trạng thái trước khi dọn

Ảnh "trước": `docs/screenshots/before/`. Chụp bằng Playwright ở 1440×900, corpus
thật trong `test/`, đi qua đủ mọi dạng câu hỏi có trong đề.

Phân mức:
- 🔴 **Critical** — sai nội dung hiển thị, hoặc cản trở việc làm bài / đọc kết quả.
- 🟡 **Moderate** — đọc được nhưng mệt, thiếu nhất quán, khó dùng lâu.
- 🟢 **Minor** — đánh bóng.

---

## A. Lỗi cắt ngang mọi màn

### A1 🔴 Markdown thô lọt ra giao diện

Nhìn thấy ở **mọi** khối câu hỏi và cả màn kết quả:

| Chỗ | Hiện ra màn hình | Đáng lẽ |
|---|---|---|
| `instruction` | `Choose **NO MORE THAN TWO WORDS** from the passage.` | **NO MORE THAN TWO WORDS** in đậm |
| `question.prompt` (matching) | `Paragraph **A**` | Paragraph **A** |
| `question.prompt` (mcq-multi) | `Which **TWO** functions…` | Which **TWO** functions… |
| `AnswerKey.display` (màn kết quả) | `**vi**` | **vi** |
| `Option.text` | dấu `**` còn sót ở vài lựa chọn | in đậm |

Nguyên nhân: các chuỗi này được đổ thẳng vào JSX như text thuần. Canonical format
**cố ý** giữ `**` trong `display` (`canonical-format.md` §5 #38 KEEP) và trong text
câu hỏi — nghĩa là **tầng hiển thị có trách nhiệm render nó**, không phải parser.

Ảnh: `04-exam-top.png`, `07-15-block-15.png`, `10-review-wrong.png`.

### A2 🔴 `intro` bị bẹp thành một khối chữ liền

`TestPicker` làm `picked.intro.replace(/^>\s?/gm, '')` rồi ném vào `marked`. Bỏ dấu
`>` xong, dòng nhãn `**Cách dùng file này**` dính liền vào câu sau nó thành
*"Cách dùng file này Đây không phải một đề thi…"*. Markdown coi hai dòng liền nhau
là một đoạn.

Ảnh: `03-start-exam.png`.

### A3 🟡 Không có thang token nào

Màu, cỡ chữ, spacing, radius, shadow đều là utility Tailwind rải rác. Hệ quả đo được:

- **9 sắc xám** dùng lẫn cho viền: `slate-200/300/400/500`.
- **3 kiểu "khối nhấn xanh lá"** khác nhau cho cùng ý "chiến thuật": `border-emerald-300 bg-emerald-50`, `bg-emerald-700`, `bg-emerald-600`.
- **4 giá trị radius**: `rounded`, `rounded-md`, `rounded-lg`, `rounded-t`.
- Cỡ chữ nhỏ có tới 5 mốc: `text-[9px] text-[11px] text-xs text-[13px] text-sm`.

Không thể giữ nhất quán khi mỗi component tự chọn.

### A4 🟡 Nền trắng/vàng chỉ áp cho 2 pane

`paper` đổi nền `PassagePane` và `QuestionPane`, nhưng header, BottomNav, dialog và
toàn bộ màn kết quả vẫn trắng/xám. Bật "Nền vàng" ra kết quả nửa vời.

### A5 🟡 Cỡ chữ 3 mức chỉ ảnh hưởng 2 pane, và nút chọn cỡ bị hỏng

`ExamShell` dựng 3 nút `A A A` nhưng cả ba render **cùng một cỡ**: phần tử phân biệt
cỡ là `<span className="text-[9px]…" />` — một span **rỗng**, không có nội dung. Người
dùng thấy ba chữ A giống hệt nhau, không đoán được nút nào là nhỏ/vừa/lớn.

Ảnh: `04-exam-top.png` (góc phải header).

---

## B. Màn chọn đề

### B1 🟡 Thẻ đề dày mà thưa thông tin
Mỗi thẻ cao ~96px cho 3 dòng chữ. 8 đề đẩy trang xuống 1060px, phải cuộn để thấy đề cuối.

### B2 🟡 Nút "Bắt đầu" lặp 8 lần, cùng màu đậm
8 nút primary xanh đậm cạnh nhau → không nút nào là "chính". Thẻ đề tự nó nên là
vùng bấm được.

### B3 🟢 Badge `#n` và tiêu đề tranh nhau
`#1` nền đen đặc cạnh tiêu đề 18px in đậm; badge hút mắt trước tên đề.

### B4 🟢 Banner cảnh báo parse chưa bao giờ thấy được
Corpus hiện sạch nên nhánh `broken.length > 0` không có ảnh. Giữ nguyên logic, chỉ
đưa về token màu chung.

---

## C. Màn bắt đầu (chọn chế độ / thời gian)

### C1 🟡 Hai thẻ chế độ lệch chiều cao
Thẻ "Luyện" 4 dòng, thẻ "Thi" 3 dòng → đáy so le. Ảnh `03-start-exam.png`.

### C2 🟡 Trạng thái chọn yếu
`ring-1` + đổi viền, trên nền sáng gần như không thấy. Không có dấu chọn rõ ràng
(checkmark / radio), cũng không có `aria-pressed` → người dùng bàn phím và screen
reader không biết cái nào đang chọn.

### C3 🟡 Ô "tự nhập" thời gian không có đơn vị và không loại trừ preset
Gõ số vào ô là preset 60/120 mất trạng thái chọn nhưng không có phản hồi nào; ô không
ghi "phút".

### C4 🟢 Nút CTA trôi dưới cùng, cách khối form 1 khoảng lớn, dưới nó là ~250px trắng.

---

## D. Khung thi (ExamShell)

### D1 🔴 Bài đọc căn đều hai bên → "sông" trắng
`PassagePane` dùng `text-justify` không kèm `hyphens`. Với cột hẹp và từ dài
(`Siddhartha`, `subcontinent`) khoảng cách chữ giãn rất rõ. Đây là **app luyện đọc**,
đọc 900+ từ liên tục — căn đều là lựa chọn sai.

Ảnh: `08-passage-highlight-menu.png`, đoạn A và B.

### D2 🟡 Độ dài dòng vượt ngưỡng dễ đọc
Pane trái ở tỉ lệ 50/50 trên 1440px rộng ~660px ≈ **95 ký tự/dòng**. Khuyến nghị
đọc dài là 60–75. Không có `max-width` cho phần chữ.

### D3 🟡 Nhãn "Review" lặp 86 lần
Mỗi câu một checkbox + chữ "Review" 11px màu `slate-400`. Cột phải bị viền phải là
một hàng chữ xám lặp lại. Vừa ồn vừa **trượt tương phản** (xem F1).

### D4 🟡 Dải băng "Chế độ Luyện" chiếm hẳn một hàng vĩnh viễn
Một câu giải thích dài, đọc một lần là đủ, nhưng chiếm ~28px chiều cao suốt buổi làm
bài — phần cao quý nhất của màn hình.

### D5 🟡 Thanh điều hướng dưới chật và tương phản thấp
86 ô `28×28px` xếp 2 hàng. Ô chưa trả lời: nền trắng trên nền `slate-50` — gần như
không phân biệt được với nền thanh. Ô đã trả lời nền đen đặc → tương phản nhảy vọt,
không có mức trung gian.

### D6 🟡 Không có mốc phân cách giữa các khối câu hỏi
`section` cách nhau `mb-8` và tiêu đề có viền dưới mảnh. Cuộn nhanh rất dễ trôi qua
ranh giới dạng mà không nhận ra.

### D7 🟡 Hai item mcq-multi dính vào nhau
79–80 và 81–82 nằm sát, không đường kẻ, đọc thành một câu dài. Ảnh `07-15-block-15.png`.

### D8 🟡 Thanh kéo chia pane không dùng được bằng bàn phím
`<div onMouseDown>` — không focus được, không có `role="separator"`, không phím mũi tên.

### D9 🟢 Đồng hồ `120:00` mơ hồ
Định dạng `mm:ss` nhưng 120 phút hiện ra `120:00`, dễ đọc nhầm là 120 giờ. Không có
nhãn "còn lại / đã làm" nhìn thấy được (chỉ có `title`).

### D10 🟢 Menu bôi vàng đơn sơ
Ba nút text trần, không icon, không phân tách; nút "Clear" phá cùng nhóm với hai nút
tạo mới.

---

## E. Các dạng câu hỏi

### E1 🔴 `gap-select` không hiện danh sách từ
Dạng "Summary Completion (with a word list)" parse ra `block.options` nhưng
`QuestionPane` chỉ render danh sách lựa chọn cho `matching-headings / -features /
-endings`. Người làm **không thấy danh sách từ A–J**, phải mở từng dropdown mới biết
có gì. Trong đề thật danh sách luôn hiện. Ảnh `07-09-block-9.png`.

### E2 🟡 Ô nhập trong bảng giãn hết chiều rộng ô
`min-w-[7rem]` + input block trong `<td>` hẹp → chữ trong ô bị đẩy xuống dòng, "…teaching
in the / [60][____] basin". Ảnh `07-11-block-11.png`.

### E3 🟡 Ba kiểu ô trả lời khác nhau cho cùng một việc
- ngoài fence: badge số đen + input viền đầy đủ
- trong fence (ASCII): input gạch chân xanh, **không** badge số
- matching: `<select>` không badge

Cùng là "chỗ điền câu n" mà ba diện mạo.

### E4 🟡 Số câu của matching/short-answer nhạt hơn nội dung
`text-slate-500` cho số câu, chữ đen cho nội dung — số câu là mỏ neo điều hướng
chính, đang bị chìm.

### E5 🟢 `UnknownQuestion` viền vàng chỉ là màu, không có icon cảnh báo.

---

## F. Accessibility

### F1 🔴 Tương phản trượt chuẩn ở 4 chỗ
| Chỗ | Màu | Nền | Tỉ lệ | AA |
|---|---|---|---|---|
| nhãn "Review" | `slate-400` #94a3b8 | trắng | **2.6:1** | ✗ |
| `/{total}` cạnh điểm thô | `slate-400` | trắng | **2.6:1** | ✗ |
| nhãn `D{n}` bảng theo dạng | `slate-400` | trắng | **2.6:1** | ✗ |
| placeholder "tự nhập" | mặc định `slate-400` | trắng | **2.6:1** | ✗ |

### F2 🔴 Không có `:focus-visible` nhất quán
Nút ở header, thẻ chế độ, tab màn kết quả, ô BottomNav đều chỉ có `hover:`. Đi bằng
Tab qua 86 ô điều hướng mà không thấy ô nào đang focus.

### F3 🟡 Cỡ chữ 11px ở nhiều nhãn
`text-[11px]` (Review, ghi chú band, nhãn chẩn đoán) dưới ngưỡng 12px tối thiểu.

### F4 🟡 Thiếu ngữ nghĩa cho nhóm điều khiển
- Nút chọn chế độ: không `aria-pressed`, không `role="radiogroup"`.
- Nút TRUE/FALSE/NOT GIVEN: `<button>` rời, không nhóm, không `aria-pressed`.
- Tab màn kết quả: không `role="tablist"` / `aria-selected`.
- Ô BottomNav: không `aria-label` mô tả trạng thái (đã trả lời / đã đánh dấu).

### F5 🟡 Dialog nộp bài không phải dialog
Không `role="dialog"`, không `aria-modal`, không bẫy focus, **không đóng bằng Esc**.

### F6 🟡 `window.prompt` cho ghi chú
Chặn luồng, không style được, không đọc được bằng screen reader theo ngữ cảnh.

### F7 🟢 `<pre>` ASCII không có nhãn mô tả cho screen reader.

---

## G. Màn kết quả

### G1 🔴 `blockNote` lặp lại ở mọi câu sai cùng dạng
Ghi chú "Heading thừa: v, vii, xi, xii." in lại dưới **từng** câu sai của Dạng 1 — 8 lần
liên tiếp. Ảnh `10-review-wrong.png`.

### G2 🔴 Tab "Câu sai" là một cuộn dài vô tận
Sai nhiều → 86 thẻ, mỗi thẻ ~150px = **12.900px** cuộn, không nhóm, không lọc, không
mục lục. Không dùng được đúng lúc cần dùng nhất.

### G3 🟡 Khối "Chiến thuật cho những dạng bạn vừa sai" đổ hết 16 dạng
Tất cả mở sẵn, cùng một sắc xanh lá, không phân cấp → tường chữ 2.500px.
Ảnh `09-review-result.png`.

### G4 🟡 Thanh tỉ lệ theo dạng biến mất khi = 0%
`width: 0%` → không vẽ gì. Cả bảng thành các rãnh xám trống, không đọc được là
"làm sai hết" hay "chưa có dữ liệu".

### G5 🟡 Tên dạng bị cắt
`w-56 truncate` → "Summary Completion (words from…". Hai dạng D8/D9 chỉ khác nhau ở
phần bị cắt mất.

### G6 🟡 Ghi chú band 11px, 4 dòng, chen cạnh số 4xl
Phần giải thích quan trọng nhất (đây chỉ là **ước lượng**) lại là chữ nhỏ nhất màn hình.

### G7 🟡 Câu bỏ trống hiện y như câu sai
Ô "Bạn trả lời" viền đỏ với `(để trống)` — `CLAUDE.md` §7 nói rõ `blank` ≠ `wrong` và
"hai thứ này hiện khác nhau ở màn review". Hiện tại chỉ khác ở một badge xám nhỏ.

### G8 🟢 Câu chữ trong ghi chú band khẳng định về nội dung đề
"…bài này gồm toàn dạng Passage 3 nên khó hơn mặt bằng" — một nhận định về corpus
viết cứng trong UI, trong khi `CLAUDE.md` §10 cấm gắn giả định nội dung đề vào code.

### G9 🟢 Tab bar mảnh, vùng bấm thấp, trạng thái chọn chỉ là viền trắng chồng viền.

---

## H. Điểm đang làm tốt — giữ nguyên

- **Split pane kéo được + hai bên cuộn độc lập** đúng tinh thần CD-IELTS.
- **ASCII flow-chart / diagram giữ nguyên `<pre>` + input `w-[6ch]`** — đúng ràng buộc
  khó nhất của `canonical-format.md` §6, không được đụng vào.
- **Badge số câu nền đen trong đoạn điền từ** rất dễ quét mắt.
- **Cặp đỏ/xanh "Bạn trả lời" / "Đáp án"** là mô hình đúng, chỉ cần tinh lại.
- **Bôi vàng + ghi chú** hoạt động thật, giữ được qua reload.
- **mcq-multi chặn chọn quá số lượng** và có mỏ neo cho từng số câu — đúng và tinh tế.

---

## Thứ tự ưu tiên xử lý

1. **A1** render markdown inline — sai nội dung hiển thị, chạm mọi màn.
2. **F1 + F2** tương phản và focus — nền tảng, càng sửa muộn càng phải sửa lại nhiều chỗ.
3. **A3** tokens — mọi việc sau đó dựa vào.
4. **G1 + G2 + G3** màn kết quả — đây là nơi giá trị học tập của file được trả lại.
5. **D1 + D2** chất lượng đọc của passage.
6. **E1** danh sách từ của `gap-select` — đang thiếu chức năng nhìn thấy được.
7. Phần còn lại.
