# Khảo sát format file đề — `test/*.md`

Trạng thái: **khảo sát, chưa viết code.** Tài liệu này là bản đối chiếu format thật, dùng làm căn cứ để sửa mục 4 và mục 9 của `CLAUDE.md` trước khi bắt đầu implement parser.

Mọi dòng markdown trong tài liệu này là **copy nguyên văn** từ file thật, kèm số dòng.

---

## 0. Phạm vi & ba phát hiện phải xử lý trước khi code

### 0.1 Thư mục `test/` có **5 file**, không phải 2

`CLAUDE.md` mục 3 chỉ liệt kê 2 file. Thực tế:

| ID dùng trong tài liệu này | File | H1 dòng 1 | Dòng | Bytes |
|---|---|---|---|---|
| **W1** | `ielts_reading_buddhism_full.md` | `# IELTS Academic Reading — Full Question-Type Workbook` (không có số) | 661 | 37 149 |
| **W2** | `ielts_reading_tibetan_buddhism.md` | `... Workbook #2` | 603 | 33 981 |
| **W3** | `ielts_reading_vietnam_buddhism.md` | `... Workbook #3` | 598 | 31 962 |
| **W4** | `ielts_reading_theravada_vietnam.md` | `... Workbook #4` | 558 | 28 941 |
| **W5** | `ielts_reading_mahayana_vietnam.md` | `... Workbook #5` | 569 | 30 270 |

Hệ quả: mọi câu "chạy validate trên **cả hai** file" trong `CLAUDE.md` (mục 9.1, mục 10) phải đọc là **cả năm file**. Và vì thứ tự alphabet của tên file (`buddhism_full`, `mahayana`(#5), `theravada`(#4), `tibetan`(#2), `vietnam`(#3)) **không** trùng thứ tự workbook, xem mục 3 câu hỏi Q4.

### 0.2 `strategy` **không** có ở 16/16 khối trong mọi file — mục 9.2 của `CLAUDE.md` sai

Đếm thật số khối `## Dạng` có blockquote chiến thuật:

| File | Số khối có `strategy` | Nhãn dùng | Khối nào |
|---|---|---|---|
| W1 | **16 / 16** | `**Chiến thuật**`, một chỗ `**Chiến thuật (dạng bạn hay mất điểm)**` | tất cả |
| W2 | **16 / 16** | `**Nhắc lại chiến thuật:**` (D1), `**Nhắc lại:**` (D2–D16) | tất cả |
| W3 | **5 / 16** | `**Nhắc lại:**` | D1, D3, D4, D5, D6 |
| W4 | **0 / 16** | — | không có khối nào |
| W5 | **0 / 16** | — | không có khối nào |

`CLAUDE.md` mục 9.2 viết *"Workbook #3 parse ra 16 khối `strategy` (dạng `Nhắc lại`, ngắn hơn)"* — thực tế là **5**. W4 và W5 không có một khối chiến thuật nào.

Đây không phải lỗi format, mà là thực tế: hai file mới hơn đã bỏ hẳn phần chiến thuật lặp lại. Hệ quả thiết kế nằm ở mục 3, câu hỏi Q1 và Q2.

### 0.3 Thân bài của Summary Completion **cũng là blockquote** — bẫy lớn nhất của tài liệu này

Ở **cả 5 file**, khối Dạng 8 và Dạng 9 có thân summary viết dưới dạng blockquote:

```
> Buddhism began as a movement of wandering **45** ______ who relied entirely on lay support. …
```
*(W1:225)*

Nghĩa là quy tắc "blockquote ngay sau heading = chiến thuật" (mục 4.3a của `CLAUDE.md`) sẽ **lấy thân summary làm chiến thuật** ở W3/W4/W5 — nơi khối D8/D9 không có chiến thuật nên blockquote đầu tiên chính là summary. Đã kiểm chứng: script khảo sát báo `bq=Y "> Buddhism is thought to have reac…"` cho W3 D8 và `bq=Y "> The Vietnamese term *Tiểu thừa* …"` cho W4 D8.

**Quy tắc duy nhất chịu được cả 5 file:** phân loại blockquote theo **nội dung**, không theo vị trí —
- blockquote **có chứa `_{3,}`** → thân đề (summary body), đưa vào `segments`;
- blockquote **không chứa `_{3,}`** → `strategy`.

Đã kiểm: không có blockquote chiến thuật nào trong 5 file chứa dấu gạch dưới. Quy tắc này an toàn.

---

## 1. Bảng khảo sát 16 dạng

Ký hiệu: `D<n>` = khối `## Dạng n`. Số sau tên file là số dòng.

Số câu mỗi khối **giống hệt nhau ở cả 5 file**: 8 · 6 · 7 · 7 · 6 · 5 · 5 · 5 · 5 · 5 · 6 · 5 · 4 · 4 · (2 item = 4 câu) · 4 = **86**.

---

### D1 — Matching Headings → `matching-headings`

**Heading** (giống ở cả 5 file, chỉ khác dải câu là không đổi):
```
## Dạng 1 — Matching Headings (Questions 1–8)
```
*(W1:49, W2:44, W3:51, W4:48, W5:47)*

**Chiến thuật** — biến thể bullet (W1:51–55):
```
> **Chiến thuật**
> - Đọc **câu đầu và câu cuối** mỗi đoạn trước; ý chính thường nằm ở đó.
> - Heading là **ý bao trùm**, không phải một chi tiết. Nếu heading chỉ đúng với một câu trong đoạn → sai.
> - Luôn thừa 3–4 heading. Đừng hoảng khi thấy 2 heading "na ná" — chọn cái khớp *phạm vi* của đoạn.
> - Làm dạng này **trước tiên** nếu nó xuất hiện, vì nó bắt bạn nắm bố cục.
```
biến thể inline (W2:46):
```
> **Nhắc lại chiến thuật:** đọc câu đầu + câu cuối mỗi đoạn. Heading là **ý bao trùm**, không phải một chi tiết. Luôn thừa 3–4 heading.
```
biến thể inline ngắn hơn (W3:53):
```
> **Nhắc lại:** đọc câu đầu + câu cuối mỗi đoạn. Heading = ý bao trùm, không phải chi tiết.
```
W4, W5: **không có**.

**Instruction** — ba cách viết khác nhau:
```
*The passage has eight paragraphs, **A–H**. Choose the correct heading for each paragraph from the list of headings below.*
```
*(W1:57)*
```
*Choose the correct heading for each paragraph, **A–H**, from the list below.*
```
*(W2:48)*
```
*Choose the correct heading for each paragraph, **A–H**.*
```
*(W3:55, W4:50, W5:49)*

**`optionsLabel`** — chỉ W1 có:
```
**List of Headings**
```
*(W1:59)*

**Options** — bảng 2 cột với **header rỗng**, 12 dòng roman `i`–`xii` ở cả 5 file:
```
| | |
|---|---|
| **i** | A technology shaped by religious demand |
| **ii** | The commercial partnership that carried a faith |
```
*(W1:61–64)*
```
| **i** | Datable objects settle the question |
```
*(W3:59)*

**Item** (cả 5 file):
```
1. Paragraph **A** ______
```
*(W1:76, W3:72, W5:66)*

**Đáp án** — 4 cột ở W1/W2/W3, 3 cột ở W4/W5:
```
| Q | Đ.án | Vì sao | Bẫy |
|---|---|---|---|
| 1 | **vi** | Đoạn A: một phong trào khiêm tốn (robe, begging bowl) nhưng sau đó lan khắp châu Á. | — |
```
*(W1:425–427)*
```
| Q | Đ.án | Vì sao |
|---|---|---|
| 1 | **ii** | Đoạn A dựng thẳng vấn đề: tên gọi ≠ thực hành. |
```
*(W5:333–335)*

**`blockNote`** (cả 5 file có, W5 dài hơn):
```
*Heading thừa: v, vii, xi, xii.*
```
*(W1:436)*
```
*Heading thừa: ix, x, xi, xii. Lưu ý **xi** ("Why Pure Land practice declined") là bẫy đảo ngược — bài nói Tịnh độ **chiếm ưu thế**, không hề suy giảm.*
```
*(W5:344)*

---

### D2 — Matching Information → `matching-information`

```
## Dạng 2 — Matching Information (Questions 9–14)
```
*(W1:87)*

**Chiến thuật**: W1 (4 bullet, W1:89–93), W2 inline (W2:78). **W3 không có** — đây là khối duy nhất trong W3 thiếu chiến thuật giữa D1–D6. W4/W5 không có.
```
> **Nhắc lại:** tìm **chi tiết**, không phải ý chính. Gạch chân danh từ cụ thể rồi scan. Làm dạng này sau cùng nếu đang thi thật.
```
*(W2:78)*

**Instruction — 2 dòng in nghiêng liên tiếp**, cả 5 file:
```
*Which paragraph contains the following information? Write the correct letter, **A–H**.*
*NB You may use any letter more than once.*
```
*(W1:95–96)*

**Item**:
```
9. an explanation of why a religious institution's finances made it vulnerable ______
```
*(W1:98)*

**Item chứa bẫy số năm** (xem mục 2, hàng #31):
```
12. reference to a set of state regulations issued in 2007 ______
```
*(W2:86)*

**Đáp án** (3 cột, cả 5 file):
```
| Q | Đ.án | Căn cứ |
|---|---|---|
| 9 | **G** | "depended on external donation … more fragile once their patrons vanished" |
```
*(W1:440–442)*

---

### D3 — True / False / Not Given → `tfng`

```
## Dạng 3 — True / False / Not Given (Questions 15–21)
```
*(W1:107)*

**Chiến thuật** — biến thể **tiêu đề có ngoặc**:
```
> **Chiến thuật (dạng bạn hay mất điểm)**
> - **TRUE** = bài xác nhận. **FALSE** = bài nói ngược lại. **NOT GIVEN** = bài **không đề cập**.
> - Quy tắc vàng: nếu bạn phải **suy luận** để chọn TRUE → gần như chắc chắn là NOT GIVEN.
```
*(W1:109–112, trích 3 dòng đầu)*

**Instruction — chỉ W1 có**:
```
*Do the following statements agree with the information given in the passage?*
```
*(W1:115)*
W2, W3, W4, W5: **không có dòng instruction in nghiêng nào.**

**Options** — dòng in đậm cố định, **cả 5 file**:
```
**TRUE** / **FALSE** / **NOT GIVEN**
```
*(W1:116, W2:96, W3:101, W4:94, W5:93)*

**Item**:
```
15. Buddhist monasteries had been established in Japan within a thousand years of the Buddha's teaching. ______
```
*(W1:118)*

**Đáp án**:
```
| Q | Đ.án | Giải thích |
|---|---|---|
| 15 | **TRUE** | "within a thousand years Buddhist monasteries stood in … Korea and Japan". |
```
*(W1:451–453)*

**`blockNote` dạng in đậm, không in nghiêng** — biến thể `CLAUDE.md` chưa nêu:
```
**Tổng kết bẫy dạng này:** câu 18 và 20 đều là **NOT GIVEN kiểu "thêm thông tin"** — đề thêm một chi tiết (phí, so sánh) mà bài im lặng. Đây đúng là kiểu bạn hay mất điểm. Quy tắc: *bài im lặng ≠ bài phủ định.*
```
*(W1:461)*

---

### D4 — Yes / No / Not Given → `ynng`

```
## Dạng 4 — Yes / No / Not Given (Questions 22–28)
```
*(W1:128)*

**Chiến thuật** (W1:130–133 bullet; W2:110 và W3:115 inline; W4/W5 không có).

**Instruction — chỉ W1**:
```
*Do the following statements agree with the claims of the writer?*
```
*(W1:135)*

**Options** (cả 5 file):
```
**YES** / **NO** / **NOT GIVEN**
```
*(W1:136, W2:112, W3:117, W4:108, W5:107)*

**Item**:
```
22. The early Buddhist community was an obvious candidate for rapid expansion. ______
```
*(W1:138)*

**Đáp án**:
```
| 22 | **NO** | Tác giả viết "seems an **improbable** candidate for continental expansion". |
```
*(W1:467)*

---

### D5 — Matching Features → `matching-features`

```
## Dạng 5 — Matching Features (Questions 29–34)
```
*(W1:150)*

**Chiến thuật**: W1:152–155 bullet; W2:128 và W3:133 inline; W4/W5 không có.

**Instruction — danh từ và dải chữ cái đều đổi**, 2 dòng ở cả 5 file:
```
*Match each statement with the correct person, **A–D**.*
*NB You may use any letter more than once.*
```
*(W1:157–158)*
```
*Match each statement with the correct organisation, **A–D**.*
```
*(W2:130)*
```
*Match each statement with the correct person, **A–E**.*
```
*(W3:135, W5:123)*
```
*Match each statement with the correct person or group, **A–D**.*
```
*(W4:124)*

**`optionsLabel`** — chỉ W1:
```
**List of People**
```
*(W1:160)*

**Options — ba layout khác nhau.** Một dòng (W1:161, W3:138, W4:127):
```
**A** Ashoka  **B** Kumārajīva  **C** Xuanzang  **D** Wang Jie
```
```
**A** Mâu Tử  **B** Khương Tăng Hội  **C** Vinītaruci  **D** Đinh Liễn  **E** Trần Nhân Tông
```
Hai dòng (W5:126–127):
```
**A** Thông Biện  **B** Trần Văn Giáp  **C** Cuong Tu Nguyen
**D** Trần Nhân Tông  **E** Thích Nhất Hạnh
```
Bốn dòng, mỗi option một dòng (W2:133–136):
```
**A** the Gaden Phodrang Trust
**B** the monastic science programme
**C** the Buddhist Digital Resource Center
**D** the Chinese government
```
Dấu ngăn giữa các option trên cùng dòng là **hai space** (đã kiểm bằng `cat -A`).

**Item**:
```
29. was held in captivity for many years ______
```
*(W1:163)*
```
31. arrived at a temple in Luy Lâu in 580 ______
```
*(W3:142 — item kết thúc bằng số năm rồi mới tới `______`, xem mục 2 hàng #31)*

**Đáp án** — 3 cột (W1, W2) hoặc 2 cột (W3, W4, W5):
```
| Q | Đ.án | Căn cứ |
|---|---|---|
| 29 | **B** | Kumārajīva: "after nearly two decades of captivity" |
```
*(W1:477–479)*
```
| Q | Đ.án |
|---|---|
| 29 | **B** |
```
*(W3:399–401)*

---

### D6 — Matching Sentence Endings → `matching-endings`

```
## Dạng 6 — Matching Sentence Endings (Questions 35–39)
```
*(W1:172)*

**Chiến thuật**: W1:174–177 bullet; W2:149 và W3:151 inline; W4/W5 không có.

**Instruction** (giống hệt ở cả 5 file):
```
*Complete each sentence with the correct ending, **A–G**.*
```
*(W1:179, W2:151, W3:153, W4:141, W5:140)*

**Item** (options nằm **sau** danh sách item ở cả 5 file):
```
35. Monasteries at oasis towns were valuable to merchants because ______
```
*(W1:181)*

**Options — 7 dòng, mỗi option một dòng**, ở cả 5 file:
```
**A** copying scripture was believed to bring spiritual benefit.
**B** Chinese possessed no equivalents for Buddhist concepts.
**C** they provided lodging and a community that would respect agreements.
**D** they depended on support from outside the household.
**E** he was dissatisfied with the translations he had access to.
**F** royal patrons had begun to prefer Hindu devotional movements.
**G** printing was cheaper than copying texts by hand.
```
*(W1:187–193)*

**Đáp án**:
```
| 35 | **C** | "merchants required safe lodging and a moral community that would honour contracts" |
```
*(W1:490)*
```
| 35 | **A** |
```
*(W3:412)*

**`blockNote`** (cả 5 file có):
```
*Đuôi thừa: **F** (bài có nhắc Hindu nhưng là "absorption", không phải patron đổi ý), **G** (bài không so sánh chi phí in vs chép tay — đây là bẫy "nghe rất hợp lý nhưng bài không nói").*
```
*(W1:496)*

---

### D7 — Sentence Completion → `gap-text`

```
## Dạng 7 — Sentence Completion (Questions 40–44)
```
*(W1:199)*

**Chiến thuật**: W1:201–204 bullet; W2:173 inline; **W3/W4/W5 không có**.

**Instruction — hai biến thể tiền tố và hai `wordLimit` khác nhau**:
```
*Complete the sentences below. Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*
```
*(W1:206 — có tiền tố "Complete the sentences below.")*
```
*Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*
```
*(W2:175)*
```
*Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*
```
*(W3:175, W4:162, W5:162)*

**Item — chỗ trống KHÔNG có số, số câu lấy từ số thứ tự của list**:
```
40. Apart from a robe, early followers owned little more than a ______.
```
*(W1:208 — trống ở cuối, trước dấu chấm)*
```
41. The first Vietnamese-language Theravāda temple was ______, at Gò Dưa.
```
*(W4:165 — trống ở **giữa** câu → buộc phải dùng `segments`, không được nối chuỗi ở cuối)*

**Đáp án**:
```
| Q | Đ.án |
|---|---|
| 40 | **begging bowl** |
```
*(W1:500–502)*
```
| 40 | **Luy Lâu** |
```
*(W3:424)*
```
| 40 | **1.3 million** |
```
*(W4:405 — có dấu chấm thập phân)*

---

### D8 — Summary Completion (words from the passage) → `gap-text`

```
## Dạng 8 — Summary Completion (words from the passage) (Questions 45–49)
```
*(W1:216)*

**Chiến thuật**: W1:218–221 bullet; W2:187 inline; W3/W4/W5 không có.

**Instruction — `wordLimit` khác nhau giữa các file**:
```
*Complete the summary below. Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*
```
*(W1:223)*
```
*Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*
```
*(W2:189, W4:174)*
```
*Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*
```
*(W3:187, W5:174)*

**Thân đề — blockquote MỘT dòng, chỗ trống có số in đậm** (cả 5 file):
```
> Buddhism began as a movement of wandering **45** ______ who relied entirely on lay support. Its expansion depended less on conquest than on commerce: monasteries built at **46** ______ towns served as banks, warehouses and rest houses. Merchants gained lodging and a community that would honour **47** ______ far from home, while monks gained donors. Surviving **48** ______ inscriptions in western India show that traders gave far more often than **49** ______ did.
```
*(W1:225)*

**Đáp án** — 3 cột (W1, W2) hoặc 2 cột (W3, W4, W5); W2 có **ô cuối rỗng**:
```
| Q | Đ.án | Ghi chú |
|---|---|---|
| 45 | **renunciants** | phải số nhiều (sau "wandering", trước "who relied") |
```
*(W1:510–512)*
```
| 45 | **130,000** | |
```
*(W2:451 — dấu phẩy trong số + ô ghi chú rỗng)*
```
| 45 | **Thiền** (chấp nhận *Zen*) |
```
*(W5:418)*

**`blockNote`**:
```
*Câu 48: bài dùng "Protective spells, known as dhāraṇī". Chỗ trống đứng sau "protective" nên phải điền **spells**, không phải *dhāraṇī*.*
```
*(W3:440)*

---

### D9 — Summary Completion (with a word list) → `gap-select`

```
## Dạng 9 — Summary Completion (with a word list) (Questions 50–54)
```
*(W1:229)*

**Chiến thuật**: W1:231–234 bullet; W2:197 inline; W3/W4/W5 không có.

**Instruction** (giống hệt ở cả 5 file, **không** có `NO MORE THAN`):
```
*Complete the summary using the list of words, **A–J**, below.*
```
*(W1:236, W2:199, W3:195, W4:182, W5:182)*

**Thân đề** — blockquote một dòng như D8 (W1:238).

**Options — 2 dòng × 5 từ, nằm SAU thân đề**, ở cả 5 file:
```
**A** condemned  **B** philosophical  **C** productive  **D** displaced  **E** demand
**F** elegance  **G** praised  **H** captivity  **I** commercial  **J** permission
```
*(W1:240–241)*

**Đáp án — dạng "chữ cái + nhãn"**, ở cả 5 file:
```
| Q | Đ.án | Ghi chú |
|---|---|---|
| 50 | **B** philosophical | "a philosophical vocabulary" |
```
*(W1:520–522)*
```
| 50 | **C** founded |
```
*(W3:446)*

**`blockNote`** (cả 5 file có):
```
*Từ thừa: F elegance, G praised, H captivity, I commercial, J permission — tất cả đều **có mặt trong bài**, đó chính là bẫy. Có từ trong bài ≠ điền được vào chỗ trống.*
```
*(W1:528)*

---

### D10 — Note Completion → `gap-text`

```
## Dạng 10 — Note Completion (Questions 55–59)
```
*(W1:245)*

**Chiến thuật**: W1:247–250 bullet; W2:210 inline; W3/W4/W5 không có.

**Instruction**:
```
*Complete the notes below. Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*
```
*(W1:252; W2:212, W3:206, W4:193 cùng `wordLimit`, không tiền tố)*
```
*Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*
```
*(W5:193 — **chỉ W5** bỏ "AND/OR A NUMBER")*

**`caption`** — dòng in đậm độc lập, có ở **cả 5 file**:
```
**The decline of Buddhism in India**
```
*(W1:254)*
```
**The succession question**
```
*(W2:214)*
```
**Buddhism in Vietnam: the modern period**
```
*(W3:208)*
```
**Khmer Theravāda in the Mekong Delta**
```
*(W4:195)*
```
**Practice in a Vietnamese Mahāyāna temple**
```
*(W5:195)*

**Item — bullet lồng 2 cấp (thụt 2 space)** ở W1 và W3:
```
- By the **55** ______ century, the monastic universities of the Ganges plain were in ruins.
- The tradition nevertheless flourished from Tibet to **56** ______.
- Contested explanations:
  - the withdrawal of **57** ______ patronage
  - absorption into an expanding **58** ______ landscape
  - the destruction of Nalanda in the **59** ______
```
*(W1:256–261)*

**Item — bullet phẳng 1 cấp** ở W2, W4, W5:
```
- 2011: political authority transferred to an **55** ______ leadership; the Trust registered in Dharamshala.
```
*(W2:216)*
```
- Principal activity: recitation of the name of **55** ______ Buddha.
```
*(W5:197)*

**Đáp án**:
```
| 55 | **thirteenth** (chấp nhận *13th*) |
```
*(W1:534)*
```
| 55 | **1.3** |
| 56 | **8,500** |
```
*(W4:437–438)*

---

### D11 — Table Completion → `gap-table`

```
## Dạng 11 — Table Completion (Questions 60–65)
```
*(W1:265)*

**Chiến thuật**: W1:267–270 bullet; W2:226 inline; W3/W4/W5 không có.

**Instruction — `wordLimit` khác: W1 dùng TWO, bốn file kia dùng THREE**:
```
*Complete the table below. Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*
```
*(W1:272)*
```
*Choose **NO MORE THAN THREE WORDS AND/OR A NUMBER** from the passage for each answer.*
```
*(W2:228, W3:220, W4:207, W5:207)*

**Bảng — chỗ trống có thể ở cột 1 hoặc cột 2**, ở cả 5 file:
```
| Date | Event |
|---|---|
| c. 5th century BCE | Siddhartha Gautama begins teaching in the **60** ______ basin |
| 3rd century BCE | Ashoka rules much of the Indian subcontinent |
| 401 CE | Kumārajīva is brought to the capital, **61** ______ |
| late 620s | Xuanzang leaves China without **62** ______ |
| **63** ______ | Xuanzang returns with hundreds of manuscripts |
| 868 CE | The **64** ______ Sutra is printed in China |
| **65** ______ | The printed book is recovered at Dunhuang |
```
*(W1:274–282)*

Lưu ý ô ngày có dải en-dash **không phải** số câu:
```
| 1949–50 | **62** ______ temple is built in Saigon |
```
*(W4:213)*

**Đáp án**:
```
| 61 | **Chang'an** |
```
*(W1:545)*
```
| 61 | **E. Gene Smith** |
```
*(W2:484 — có dấu chấm trong đáp án)*
```
| 64 | **two hundred** (chấp nhận *200*) |
```
*(W3:472)*

**`blockNote`**:
```
*Câu 65 là bẫy tinh: đoạn G có **hai** mốc gần nhau — 1293 (thoái vị) và 1299 (thọ giới). Đề hỏi *ordained* → 1299.*
```
*(W3:475)*

---

### D12 — Flow-chart Completion → `gap-flow`

```
## Dạng 12 — Flow-chart Completion (Questions 66–70)
```
*(W1:286)*

**Chiến thuật**: W1:288–291 bullet; W2:243 inline; W3/W4/W5 không có.

**Instruction** — `NO MORE THAN TWO WORDS` ở **cả 5 file** (W1:293, W2:245, W3:235, W4:222, W5:222).

**Thân đề — code fence không có language tag, chỗ trống là `<số> ______` (số KHÔNG in đậm)**:

````
```
        Buddhist texts arrive in China
                     |
                     v
   Chinese has no  66 ______  for key concepts
                     |
                     v
   Translators adopt geyi, borrowing terms from  67 ______
                     |
                     v
   Results are frequently  68 ______  and are later condemned
                     |
                     v
      69 ______  produces elegant new versions after 401 CE
                     |
                     v
   Modern scholars re-evaluate the early work as  70 ______
```
````
*(W1:295–312)*

**Đáp án**:
```
| 66 | **equivalents** |
```
*(W1:555)*
```
| 68 | **spells** (chấp nhận *dhāraṇī*) |
| 69 | **973** (chấp nhận *Đinh Liễn*) |
```
*(W3:483–484)*

**`blockNote`**:
```
*Câu 70 không có sẵn nguyên văn ở một chỗ — bạn phải rút từ "chronologically impossible" và "divided by roughly eight centuries". Trong đề thật, dạng này luôn lấy được từ nguyên văn; ở đây mình để hơi khó hơn một bậc có chủ ý.*
```
*(W3:487)*

---

### D13 — Diagram Label Completion → `gap-diagram`

```
## Dạng 13 — Diagram Label Completion (Questions 71–74)
```
*(W1:316)*

**Chiến thuật**: W1:318–321 bullet; W2:270 inline; W3/W4/W5 không có.

**Instruction — cả 5 file có tiền tố "Label the diagram below.", `wordLimit` khác nhau**:
```
*Label the diagram below. Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*
```
*(W1:323, W2:272, W3:261)*
```
*Label the diagram below. Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*
```
*(W4:244, W5:247)*

**Thân đề — bốn kiểu ASCII khác nhau, đều trong code fence.** Một khung (W1:325–338):

````
```
   ┌─────────────────────────────────────────────┐
   │   THE DUNHUANG PRINTED SCROLL               │
   │                                             │
   │   Text: the Diamond Sutra                   │
   │                                             │
   │   Year of production ......  71 ______      │
   │                                             │
   │   ── colophon ──────────────────────────    │
   │   Commissioned by .........  72 ______      │
   │   Made on behalf of his ...  73 ______      │
   │   Intended for free .......  74 ______      │
   └─────────────────────────────────────────────┘
```
````

Hai khung cạnh nhau + **gạch dưới dài 12 ký tự** (W2:274–290, trích):

````
```
  ┌──────────────────────────┐   ┌──────────────────────────┐
  │  THE GADEN PHODRANG      │   │  THE CHINESE             │
  │  TRUST                   │   │  GOVERNMENT              │
  │                          │   │                          │
  │  Registered in           │   │  Legal basis:            │
  │    71 ____________       │   │    regulations of        │
  │                          │   │    73 ____________       │
```
````

Cây thư mục (W4:246–259, trích):

````
```
   ┌────────────────────────────────────────────────┐
   │      FUNCTIONS OF A KHMER PAGODA               │
   │                                                │
   │   ├── place of worship                         │
   │                                                │
   │   ├── teaching of the  71 ______  script       │
```
````

Khung có đơn vị đo **nằm ngoài** chỗ trống (W3:263–279, trích):

````
```
   │   Height ..................  71 ______ m     │
   │                                              │
   │   Material ................  72 ______       │
```
````

**Đáp án**:
```
| 71 | **868 (CE)** |
```
*(W1:565)*
```
| 71 | **1.4** |
```
*(W3:493)*

---

### D14 — Multiple Choice, one answer → `mcq-single`

```
## Dạng 14 — Multiple Choice, one answer (Questions 75–78)
```
*(W1:344)*

**Chiến thuật**: W1:346–349 bullet; W2:298 inline; W3/W4/W5 không có.

**Instruction — CHỈ W1 có**:
```
*Choose the correct letter, **A**, **B**, **C** or **D**.*
```
*(W1:351)*
W2, W3, W4, W5: **không có instruction** ở khối này.

**Item — số câu in đậm kèm dấu chấm trong cặp `**`**:
```
**75.** What point does the writer make about early Buddhism in paragraph A?
```
*(W1:353)*

**Options — bullet `- **X** …`, 4 option mỗi câu**, ở cả 5 file:
```
- **A** It was deliberately organised for missionary work.
- **B** Its way of life made large-scale expansion appear unlikely.
- **C** It attracted wealthy followers from the beginning.
- **D** It was confined to the Ganges basin for a thousand years.
```
*(W1:354–357)*

**Đáp án** (3 cột ở cả 5 file):
```
| Q | Đ.án | Vì sao các phương án khác sai |
|---|---|---|
| 75 | **B** | A: bài nói ngược. C: không đề cập người giàu. D: "reach the Pacific" — không hề bị giới hạn ở Ganges. |
```
*(W1:572–574)*

---

### D15 — Multiple Choice, more than one answer → `mcq-multi`

```
## Dạng 15 — Multiple Choice, more than one answer (Questions 79–82)
```
*(W1:379)*

**Chiến thuật**: W1:381–384 bullet; W2:328 inline; W3/W4/W5 không có.

**Instruction** (giống hệt ở cả 5 file):
```
*Choose **TWO** letters, **A–E**.*
```
*(W1:386, W2:330, W3:315, W4:296, W5:299)*

**Item — một item chiếm hai số câu, 5 option**:
```
**79–80.** According to paragraph C, which **TWO** functions did monasteries at oasis towns perform?
- **A** minting coins for local rulers
- **B** storing goods
- **C** training merchants in foreign languages
- **D** providing accommodation for caravans
- **E** issuing licences to trade
```
*(W1:388–393)*

**Đáp án — hai biến thể: có và không có phần bình luận trong ngoặc**:
```
| Q | Đ.án |
|---|---|
| 79–80 | **B** và **D** ("warehouses" = storing goods; "rest houses for caravans" = accommodation) |
| 81–82 | **B** và **D** ("withdrawal of royal patronage"; "military campaigns that destroyed Nalanda") |
```
*(W1:581–584)*
```
| 79–80 | **B** và **D** (physics, neuroscience) |
| 81–82 | **B** và **C** (full ordination unavailable; excluded from ritual and administrative roles) |
```
*(W2:522–523)*
```
| 79–80 | **A** và **C** |
| 81–82 | **A** và **C** |
```
*(W3:511–512, W4:486–487, W5:489–490)*

**`blockNote`** (W1, W2, W3 có; W4, W5 không):
```
*E ở câu 81–82 là bẫy hay: bài **có** nhắc Tibet ("flourished from Tibet to Japan") nhưng không nói tăng sĩ **di cư** sang đó.*
```
*(W1:586)*

---

### D16 — Short-answer Questions → `short-answer`

```
## Dạng 16 — Short-answer Questions (Questions 83–86)
```
*(W1:404)*

**Chiến thuật**: W1:406–409 bullet; W2:350 inline; W3/W4/W5 không có.

**Instruction**:
```
*Answer the questions below. Choose **NO MORE THAN THREE WORDS** from the passage for each answer.*
```
*(W1:411)*
```
*Choose **NO MORE THAN THREE WORDS** from the passage for each answer.*
```
*(W2:352, W3:335, W4:316, W5:319)*

**Item**:
```
83. Where were most of the Buddhist chronicles about Ashoka written? ______
```
*(W1:413)*

**Đáp án — nơi tập trung nhiều biến thể ngoặc/`chấp nhận` nhất**:
```
| Q | Đ.án |
|---|---|
| 83 | **(in) Sri Lanka** |
| 84 | **lay communities** |
| 85 | **merit** |
| 86 | **(at) Dunhuang** — chấp nhận *a sealed chamber* |
```
*(W1:590–595)*
```
| 83 | **(the) Red River delta** |
| 84 | **(a) maritime route** |
| 85 | **Đinh Liễn** |
| 86 | **(the) seventh (century)** |
```
*(W3:520–523 — dòng 86 có **hai** nhóm ngoặc tùy chọn)*
```
| 84 | **(a) veterinary officer** |
| 85 | **the Pali collections** |
```
*(W4:494–495)*
```
| 85 | **twenty** (chấp nhận *20*) |
```
*(W2:533)*

---

## 2. Bảng lệch format — mọi chỗ 5 file khác nhau

Cột **Trong `CLAUDE.md`?** cho biết mục 4 đã nêu chưa. `MỚI` = tài liệu này phát hiện thêm.

| # | Chỗ lệch | Bằng chứng | Trong `CLAUDE.md`? | Quy tắc parse duy nhất |
|---|---|---|---|---|
| 1 | Số file trong `test/` | 5 file, không phải 2 | MỚI | `import.meta.glob` vốn đã quét động; chỉ cần sửa mục 3/9/10 của `CLAUDE.md` và cho validate chạy trên toàn thư mục |
| 2 | Có/không khối `strategy` | W1 16/16, W2 16/16, W3 5/16, W4 0/16, W5 0/16 | Nêu nhưng **sai số liệu** (§9.2) | `strategy` là **optional**. Thiếu → ghi vào danh sách *ghi chú mềm*, **không** vào `parseWarnings` (xem Q1) |
| 3 | Blockquote vừa là chiến thuật vừa là thân summary | D8/D9 ở cả 5 file có `> Buddhism began as a movement…` | MỚI — **rủi ro cao nhất** | Phân loại theo nội dung: blockquote **chứa `_{3,}`** → thân đề; ngược lại → `strategy`. Không dùng vị trí "ngay sau heading" |
| 4 | Nhãn mở đầu chiến thuật | `**Chiến thuật**` / `**Chiến thuật (dạng bạn hay mất điểm)**` / `**Nhắc lại chiến thuật:**` / `**Nhắc lại:**` | Nêu 2 trong 4 | Không khớp nhãn. Dùng quy tắc #3, rồi bỏ tiền tố `> ` và giữ nguyên phần còn lại làm markdown |
| 5 | Dòng instruction có thể **không có** | D3, D4, D14 ở W2/W3/W4/W5 đều `instr=0` | MỚI | `instruction?: string` — vắng là hợp lệ, không warning |
| 6 | Số dòng instruction: 1 hoặc 2 | D2 và D5 có thêm `*NB You may use any letter more than once.*` | Có (§4.3b) | Gom mọi dòng in nghiêng **liên tiếp** trước item đầu tiên, nối bằng `\n` |
| 7 | `optionsLabel` chỉ có ở W1 | `**List of Headings**` (W1:59), `**List of People**` (W1:160) | Có (§4.3c) | Dòng in đậm độc lập mà **nội dung không phải một chữ cái/số roman đơn** → `optionsLabel` (nếu đứng trước options) hoặc `caption` (nếu đứng trước items) |
| 8 | Layout options của Matching Features | 1 dòng (W1, W3, W4), 2 dòng (W5), 4 dòng (W2) | Nêu 1 layout | Gom **mọi dòng liên tiếp** khớp `^\*\*[A-Z]\*\*\s`, ghép lại rồi tách theo `\*\*([A-Z])\*\*`. Áp dụng chung cho `matching-features`, `matching-endings`, `gap-select` |
| 9 | Dải chữ cái options | A–D (W1, W2, W4) và A–E (W3, W5) | Có (§4.4) | Suy ra từ options parse được, không đọc từ instruction, không hardcode |
| 10 | Danh từ trong instruction Matching Features | `person` / `organisation` / `person or group` | MỚI | Không dùng danh từ này để nhận dạng gì cả; `kind` lấy từ tên dạng ở heading |
| 11 | `wordLimit` của **cùng một dạng** khác nhau giữa các file | D7: TWO (W1,W2) vs TWO+NUMBER (W3,W4,W5) · D8: TWO (W1,W3,W5) vs TWO+NUMBER (W2,W4) · D10: TWO+NUMBER (W1–W4) vs TWO (W5) · D11: TWO+NUMBER (W1) vs THREE+NUMBER (W2–W5) · D13: TWO+NUMBER (W1,W2,W3) vs TWO (W4,W5) | MỚI | `wordLimit` **luôn** đọc từ instruction của khối đó. Tuyệt đối không suy từ `kind` |
| 12 | Tiền tố instruction | `Complete the sentences below. Choose …` (W1) vs `Choose …` (các file khác); `Label the diagram below. Choose …` (cả 5) | MỚI | Regex `wordLimit` phải là `search` trên toàn dòng, không `match` từ đầu dòng. Bỏ `*` và `**` trước khi khớp |
| 13 | Độ dài dãy gạch dưới | `______` (6) ở W1/W3/W4/W5; `____________` (12) ở W2 diagram; `___` (3) ở bảng so sánh cuối file | Nêu "3 dấu trở lên" | Dùng `_{3,}`. **Nhưng** chỉ áp dụng trong vùng câu hỏi — vùng sau `ĐÁP ÁN` có 82 chỗ `___ /14` không phải chỗ trống |
| 14 | Kiểu ASCII của diagram | 1 khung (W1, W3), 2 khung cạnh nhau (W2), cây `├──`/`└──` (W4), 1 khung có đơn vị `m` ngoài chỗ trống (W3) | Nêu chung | Giữ `raw` nguyên xi, render `<pre>` mono, chỉ thay `_{3,}` bằng input **cùng chiều rộng ký tự**. Không dựng lại layout |
| 15 | Bullet Note Completion lồng nhau | 2 cấp ở W1, W3; phẳng ở W2, W4, W5 | Nêu (chỉ 1 biến thể) | Giữ số space thụt lề gốc, render theo mức thụt lề đọc được từ file |
| 16 | Số cột bảng đáp án | 2, 3 hoặc 4 — đổi theo **cả dạng và file**. VD D1: 4 cột (W1,W2,W3) vs 3 (W4,W5); D5: 3 (W1,W2) vs 2 (W3,W4,W5). W2:451 còn có ô cuối rỗng `\| 45 \| **130,000** \| \|` | Có (§4.5) | Cột 1 = số câu, cột 2 = đáp án, **gộp mọi cột còn lại** thành `explanation` bằng ` · `; bỏ ô rỗng |
| 17 | Kiểu `blockNote` | in nghiêng (đa số) **và** in đậm dẫn đầu: `**Tổng kết bẫy dạng này:** …` (W1:461) | Nêu chỉ kiểu in nghiêng | Trong khối đáp án: mọi dòng **không** bắt đầu bằng `\|`, **không** rỗng, **không** phải `---`/`***` → nối vào `blockNote`. (Khối D16 của cả 5 file kết thúc bằng `---`, phải loại) |
| 18 | Cú pháp `chấp nhận` | `(chấp nhận *X*)` — W1:534, W2:533, W3:472/483/484, W5:418/461/471 · `— chấp nhận *X*` — **chỉ** W1:595 | Có (§4.5) | Một regex bắt cả hai: `(?:\(|[-–—]\s*)chấp nhận\s+(.+?)(?:\)|$)`, rồi tách biến thể theo `,` `/` `hoặc` |
| 19 | `chấp nhận` xuất hiện trong **ô giải thích** | W2:515 `… không phải lý do tu viện chấp nhận về mặt thực tế.` | MỚI — **bẫy thật** | Chỉ quét `chấp nhận` trong **cột 2** của bảng đáp án, không quét cả dòng |
| 20 | Ngoặc đơn **trong** `**…**` = từ tùy chọn | `**868 (CE)**`, `**(in) Sri Lanka**`, `**(at) Dunhuang**`, `**(a) veterinary officer**`, `**(the) Red River delta**`, `**(a) maritime route**`, `**(the) seventh (century)**` (2 nhóm) | Có (§4.5, chưa nêu ca 2 nhóm) | Sinh **tập** đáp án chấp nhận bằng tổ hợp mọi nhóm ngoặc có/không (2 nhóm → 4 biến thể) |
| 21 | Ngoặc đơn **ngoài** `**…**` **không** phải biến thể | `\| 79–80 \| **B** và **D** (physics, neuroscience) \|` (W2:522), W1:583–584 | MỚI — **bẫy thật** | Ngoặc ngoài bold chỉ tính là biến thể **khi** nội dung bắt đầu bằng `chấp nhận`; còn lại → dồn vào `explanation` |
| 22 | Dấu phẩy/chấm **trong** đáp án | `**130,000**` (W2:451, 483), `**8,500**` (W4:438), `**1.3 million**` (W4:405), `**1.3**`, `**1.4**`, `**E. Gene Smith**` (W2:484) | MỚI — **bẫy thật** | **Không** được tách biến thể bằng `,` ở mức đáp án chính. Chỉ tách `,`/`/` **bên trong** phần `chấp nhận …`. Khi chuẩn hoá để chấm: bỏ `,` phân cách nghìn để `130000` = `130,000` |
| 23 | Đáp án "chữ cái + nhãn" | `**B** philosophical`, `**C** founded`, `**A** genre`, `**A** indirect`, `**B** approved` — chỉ ở D9, cả 5 file | Có (§4.5) | Đáp án chính = chữ cái; phần chữ còn lại là nhãn hiển thị, **cũng nên chấp nhận** khi người dùng gõ chữ |
| 24 | Từ nối trong `mcq-multi` | chỉ `và` ở cả 5 file (10/10 dòng) | Có (§4.5) | Tách theo `\*\*([A-Z])\*\*`, lấy hết chữ cái tìm được → so sánh **theo tập hợp** |
| 25 | Tên `## Dạng n` ở khu đáp án **khác** tên ở khu câu hỏi | `Summary (words from passage)` ↔ `Summary Completion (words from the passage) (Questions 45–49)`; `Flow-chart` ↔ `Flow-chart Completion`; `Short Answer` ↔ `Short-answer Questions`; `Multiple Choice (two answers)` ↔ `Multiple Choice, more than one answer` | MỚI | Ghép khối câu hỏi ↔ khối đáp án **chỉ bằng `typeIndex`** (số sau chữ "Dạng"). Không so tên |
| 26 | Heading cấp 1 gần cuối file | `BẢNG TỰ CHẨN ĐOÁN` (chỉ W1) · `BẢNG SO SÁNH VỚI WORKBOOK #1` (W2) · `BẢNG SO SÁNH BA WORKBOOK` (W3) · `BẢNG SO SÁNH BỐN WORKBOOK` (W4) · `BẢNG SO SÁNH NĂM WORKBOOK` (W5) | Nêu 2 tên | `diagnostics` chỉ đọc từ heading chứa `CHẨN ĐOÁN`. Heading chứa `SO SÁNH` → bỏ qua im lặng |
| 27 | Bảng "so sánh" **trông giống** bảng chẩn đoán | Header `\| Nhóm dạng \| Câu \| … \|` giống nhau, ô `___ /14` | MỚI — **bẫy thật** | Không nhận diện diagnostics bằng header bảng. Chỉ nhận theo heading (#26). Đồng thời không quét `_{3,}` ngoài vùng câu hỏi (#13) |
| 28 | W3 có thêm bảng quy đổi band | `\| Tỉ lệ đúng \| Band tương đương \|` (W3:540–546) | MỚI | Bỏ qua ở v1 (mục 7 của `CLAUDE.md` đã định thang riêng). Xem Q5 nếu muốn dùng |
| 29 | Số blockquote intro | 1 nhóm (W1) vs 2 nhóm (W2, W3, W4, W5) | Nêu | Gom **mọi** blockquote trước `# READING PASSAGE` thành `intro`, giữ nguyên markdown, cách nhau bằng dòng trống |
| 30 | Nhãn blockquote intro | `Cách dùng file này` · `Ghi chú về nội dung` + `Cách dùng` · `Lưu ý về niên đại — đọc trước khi làm` + `Cách dùng:` · `Về chữ "Tiểu thừa" — đọc trước khi làm` + `Cách dùng:` · `Về chủ đề` + `Cách dùng:` | Nêu 3 nhãn | Không khớp nhãn nào. Quy tắc thuần vị trí (#29) |
| 31 | `<số> ______` với số **không phải** số câu | `12. reference to a set of state regulations issued in 2007 ______` (W2:86) · `33. was registered in Dharamshala in 2011 ______` (W2:142) · `34. issued regulations in 2007 ______` (W2:143) · `31. arrived at a temple in Luy Lâu in 580 ______` (W3:142) | MỚI — **bẫy thật** | Chỉ coi `<số> ______` là chỗ trống **khi** (a) đang ở trong code fence, **và** (b) số nằm trong `range` của khối. Ngoài fence, chỗ trống có số **luôn** ở dạng `**<số>** ______` |
| 32 | `**71** ______` trong code fence **không tồn tại** | 4/4 fence diagram và 5/5 fence flow-chart đều dùng số **không in đậm** | `CLAUDE.md` §4.4 nêu biến thể này — không có bằng chứng | Bỏ mô tả `**71** ______` khỏi §4.4, hoặc giữ như "chấp nhận thêm nếu file sau dùng" |
| 33 | Dòng in đậm phụ đề đầu file | `**86 questions · all 16 IELTS Academic Reading question types · one passage**` (dòng 4, cả 5 file) | MỚI | Nằm ngoài vùng câu hỏi nên vô hại, nhưng nếu muốn hiện ở màn chọn đề thì lưu thành `subtitle`. Không được coi là `caption` |
| 34 | Dòng `**TRUE** / **FALSE** / **NOT GIVEN**` là dòng in đậm độc lập | cả 5 file, D3 và D4 | MỚI — dễ bị bắt nhầm thành `caption` (#7) | Nhận riêng pattern `^\*\*\w+\*\*(\s*/\s*\*\*[\w ]+\*\*)+$` → khai báo options cố định, bỏ khỏi text hiển thị |
| 35 | Chuỗi `"NB You may use any letter more than once."` nằm **trong** chiến thuật | W1:92 | MỚI | Đếm/parse dòng `NB` chỉ trong phần instruction, sau khi đã tách blockquote ra |
| 36 | Chuỗi `"NO MORE THAN TWO WORDS"` nằm **trong** chiến thuật | W1:203 | MỚI — **bẫy thật** | Rút `wordLimit` **chỉ** từ `instruction`, sau khi đã loại blockquote khỏi thân khối |
| 37 | Ký tự đặc biệt trong ô giải thích | `⚠️` (W1:455, W4:362, W5:364), `≥ → ↔ ≠ … ‑` | MỚI | Giữ nguyên, render bằng `marked`. Font UI phải cover Latin mở rộng + emoji (mục 6.2 đã yêu cầu) |
| 38 | Nhấn mạnh markdown trong ô đáp án | `**X**`, `*Y*` lẫn nhau | Có | `display` giữ raw; `accepted` phải strip `**`/`*` trước khi chuẩn hoá |
| 39 | Hai `---` liên tiếp trước `# ĐÁP ÁN` | cả 5 file | MỚI | Bỏ mọi dòng chỉ gồm `-`/`*`/`_` ≥3 khi cắt section |

---

## 3. Bất biến đã kiểm chứng (dùng làm assertion cho `npm run validate`)

Đã kiểm bằng script trên **cả 5 file**, kết quả giống nhau tuyệt đối:

| Bất biến | Giá trị | Ghi chú |
|---|---|---|
| Heading cấp 1 | 10 mỗi file | `<title>`, `READING PASSAGE`, `PHẦN 1–4`, `ĐÁP ÁN & GIẢI THÍCH`, bảng cuối, `VOCABULARY`, `PARAPHRASE PAIRS` |
| Đoạn passage | 8, nhãn `A`–`H` | dòng chỉ chứa `**X**` |
| Khối `## Dạng` vùng câu hỏi | 16 | typeIndex 1–16, không trùng |
| Khối `## Dạng` vùng đáp án | 16 | typeIndex 1–16, khớp 1–1 |
| Tổng số câu | **86**, liên tục 1–86, không trùng | 8·6·7·7·6·5·5·5·5·5·6·5·4·4·(2×2)·4 |
| Số đáp án | **86**, liên tục 1–86, không trùng | kể cả sau khi bung `79–80` và `81–82` |
| Options D1 (roman) | 12 (`i`–`xii`) | |
| Options D6 (endings) | 7 (`A`–`G`) | |
| Options D9 (word list) | 10 (`A`–`J`), 2 dòng × 5 | |
| Options D14 | 4 item × 4 option | |
| Options D15 | 2 item × 5 option, `selectCount = 2` | |
| Code fence | 4 mỗi file (2 mở + 2 đóng: flow + diagram) | không có language tag |
| `caption` (D10) | có ở **cả 5** file | |
| `optionsLabel` | chỉ W1 (2 chỗ) | |
| `diagnostics` | W1: **5 dòng**; W2–W5: **0** | |
| Hình dạng ô đáp án | chỉ **5 kiểu** trong toàn corpus | `**X**` · `**X** nhãn` · `**X** (chấp nhận *Y*)` · `**X** — chấp nhận *Y*` · `**X** và **Y**` (± ngoặc bình luận) |

Bảng chẩn đoán của W1 (nguyên văn, W1:603–609) — `threshold` lấy từ header `Sai ≥ 30%`:
```
| Nhóm dạng | Câu | Sai ≥ 30% nghĩa là |
|---|---|---|
| Headings + Matching Info (1–14) | 14 | Bạn đang **đọc từng chữ** thay vì nắm ý đoạn. Luyện skimming: đọc câu đầu/cuối mỗi đoạn rồi tự viết 1 câu tóm tắt. |
| T/F/NG + Y/N/NG (15–28) | 14 | Bạn **suy diễn ngoài văn bản**. Ép mình chỉ ra *dòng cụ thể* trước khi chọn TRUE/YES; không chỉ ra được → NG. |
| Matching Features/Endings (29–39) | 11 | Bạn chưa dùng **tên riêng làm mỏ neo** khi scan. |
| Điền từ (40–74) | 35 | Nếu sai vì **nghĩa** → vốn từ. Nếu sai vì **số từ / dạng từ** → lỗi kỹ thuật, sửa được ngay bằng thói quen đếm chữ. |
| MCQ + Short answer (75–86) | 12 | Bạn đang bị hút vào phương án **chứa từ giống bài**. Che phương án, tự trả lời trước. |
```
Lưu ý `range` nằm trong ngoặc ở **cột 1** (`(1–14)`), còn ở bảng SO SÁNH của W2–W5 thì dải câu nằm ở **cột 2** (`| … | 1–14 | …`) — thêm một lý do phải khoá theo heading (#26).

---

## 4. Cần bạn quyết trước khi tôi code

**Q1 — `strategy` thiếu thì xử lý sao?** `CLAUDE.md` §4.8 nói "thiếu → warning nhẹ", nhưng §9.1 lại đòi `parseWarnings` **rỗng**. Với W4/W5 (0/16 khối có chiến thuật) hai điều này loại trừ nhau: sẽ ra 16 warning mỗi file.
Đề xuất: tách hai kênh — `parseWarnings` (chỉ lỗi cấu trúc: thiếu câu, thiếu đáp án, dạng lạ → banner đỏ) và `parseNotes` (thiếu chiến thuật, thiếu instruction → không hiện banner, chỉ log). `npm run validate` chỉ fail trên `parseWarnings`.

**Q2 — Chế độ Luyện với file không có chiến thuật.** W4/W5 sẽ có `StrategyPanel` trống hoàn toàn, và mục 6.3.5 ("hiện lại khối `strategy` cạnh dạng sai") sẽ không có gì để hiện.
Đề xuất: khi đề không có `strategy` nào thì ẩn hẳn panel và cột đó ở màn review, thay bằng `blockNote` (cả 5 file đều có `blockNote` ở D1, D6, D9). Không hiện khung rỗng.

**Q3 — `wordLimit` mâu thuẫn giữa các file cho cùng một dạng** (hàng #11). Tôi sẽ luôn đọc từ instruction của từng khối. Chỉ xác nhận: bạn **không** muốn tôi "chuẩn hoá" về một giá trị chung cho dễ chấm, đúng không?

**Q4 — Thứ tự đề ở màn chọn đề.** Alphabet theo tên file cho ra: W1, W5, W4, W2, W3. Trong tiêu đề H1 thì W2–W5 có `#2`…`#5` còn W1 **không có số**.
Đề xuất: sort theo số `#N` rút từ tiêu đề, file không có số coi như `#1`; fallback về alphabet nếu không rút được. Việc này không hardcode tên file nào.

**Q5 — Bảng quy đổi band trong W3** (hàng #28): dùng bảng có sẵn trong file khi file có, hay luôn dùng thang cố định ở §7? Tôi nghiêng về **luôn dùng §7** cho nhất quán giữa 5 đề, và bỏ qua bảng trong file.

**Q6 — Sửa `CLAUDE.md`.** Các chỗ cần cập nhật: §3 (danh sách file), §4.4 (bỏ `**71** ______` — hàng #32), §4.5 (thêm hàng #19, #21, #22), §9.1 (2 file → 5 file), §9.2 (số liệu strategy/diagnostics sai). Bạn muốn tôi sửa luôn `CLAUDE.md` trong lượt sau, hay giữ nguyên và chỉ code theo tài liệu này?

---

## 5. Chốt lại: 8 quy tắc parser sinh ra từ khảo sát

1. **Cắt section theo heading cấp 1 + từ khoá**, không khớp chuỗi chính xác. Mốc: `READING PASSAGE`, `ĐÁP ÁN`. `CHẨN ĐOÁN` → diagnostics; `SO SÁNH` → bỏ qua; `VOCABULARY` / `PARAPHRASE` → `extras`.
2. **Ghép khối câu hỏi ↔ khối đáp án bằng `typeIndex`**, tuyệt đối không bằng tên dạng.
3. **Blockquote phân loại theo nội dung**: có `_{3,}` → thân đề; không có → `strategy`.
4. **Chỗ trống có số**: ngoài code fence luôn là `**<số>** _{3,}`; trong code fence là `<số> _{3,}` và **phải** nằm trong `range` của khối. Chỗ trống không số (Sentence Completion, Short-answer) lấy số từ số thứ tự item.
5. **Options gom bằng "dãy dòng liên tiếp khớp `^\*\*[A-Z]\*\*\s`"**, ghép rồi tách theo `\*\*([A-Z])\*\*`. Dùng chung cho features / endings / word list, bất kể 1 hay 4 dòng, bất kể trước hay sau item.
6. **Ô đáp án chỉ có 5 hình dạng** (mục 3). Phân tích theo thứ tự: tách `**…**` → tách nhiều chữ cái nối bằng `và` → bắt `chấp nhận` **chỉ trong cột 2** → bung tổ hợp ngoặc tùy chọn **bên trong** bold → mọi thứ còn lại đổ vào `explanation`.
7. **`wordLimit` chỉ đọc từ `instruction`** của chính khối đó, sau khi đã loại blockquote; `search` cả dòng, đã strip `*`/`**`.
8. **Mọi số lượng suy ra từ file**: số đoạn, số options, số câu, `selectCount`, dải chữ cái, `threshold`. Không hardcode 86 / 16 / A–H / A–E / 0.3 ở bất kỳ đâu ngoài giá trị mặc định của `threshold`.
