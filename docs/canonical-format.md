# Canonical format — đặc tả một format duy nhất cho `test/*.md`

Trạng thái: **đặc tả. Chưa sửa file nào, chưa viết code nào.**

Đọc kèm [format-survey.md](format-survey.md) — bảng 39 hàng lệch, đánh số `#1`–`#39` được dùng lại nguyên vẹn ở đây.

---

## 1. Nguyên tắc

5 file trong `test/` là output LLM sinh lần lượt, không theo spec. Chúng **không** phải 5 nguồn dữ liệu độc lập bắt buộc phải chấp nhận. Phần lớn 39 hàng lệch là drift hình thức — sinh lại được, và rẻ hơn nhiều so với việc nuôi một parser khoan dung vĩnh viễn.

Mỗi hàng rơi vào **đúng một** nhóm:

| Nhóm | Định nghĩa | Với 5 file | Với parser |
|---|---|---|---|
| **NORMALIZE** | Drift hình thức. Nhiều cách viết cùng một thứ, không cách nào mang thêm nghĩa. | **Sửa file.** Chọn một dạng. | Chỉ nhận **một** dạng. Gặp dạng khác → `parseWarnings`. |
| **KEEP** | Biến thiên ngữ nghĩa thật. Khác nhau vì nội dung khác nhau. | **Không sửa.** | Đọc động. Không hardcode, không đoán. |
| **UPSTREAM** | 5 file hiện tại đã đúng, hoặc không có gì trong file để sửa. Rủi ro nằm ở file **sau**. | Không sửa. | Không đổi. Chốt luật vào spec + `validate`. |

Quy tắc chọn dạng canonical:

1. **Dạng giàu thông tin hơn thắng.** Chiến thuật bullet mang nội dung dạy học mà `Nhắc lại` một dòng không có → chọn bullet, backfill phần thiếu.
2. **Dạng loại bỏ được suy đoán thắng.** Nếu một biến thể buộc parser sniff nội dung để phân biệt, chọn biến thể kia.
3. **Không lưu cùng một sự thật ở hai chỗ.** Mọi trùng lặp là điểm drift tương lai.
4. **Số đếm và dải luôn suy ra từ thân file**, không bao giờ từ tiêu đề hay tên file.

---

## 2. Phân loại 39 hàng

| # | Chỗ lệch (rút gọn) | Nhóm | Quyết định |
|---|---|---|---|
| 1 | `test/` có 5 file, `CLAUDE.md` ghi 2 | **UPSTREAM** | Không có gì trong `.md` để sửa. Sửa `CLAUDE.md` §3/§9/§10 thành "toàn bộ file trong `test/`", không nêu con số. |
| 2 | `strategy` 16/16 · 16/16 · 5/16 · 0/16 · 0/16 | **NORMALIZE** | Bắt buộc 16/16 mọi file. Backfill 43 khối. → [N02](#n02--strategy-bắt-buộc-1616) |
| 3 | Thân summary D8/D9 cũng là blockquote | **NORMALIZE** | Thân summary thành **đoạn văn thường**. `>` trong vùng câu hỏi chỉ còn một nghĩa. Kèm luật generator, xem [§7](#7-upstream--luật-cho-generator). → [N03](#n03--thân-summary-thôi-là-blockquote) |
| 4 | Nhãn chiến thuật 4 biến thể | **NORMALIZE** | Chuẩn hoá **nhãn**: dòng đầu đúng `> **Chiến thuật**`. **Thân giữ nguyên** — bullet hay đoạn văn đều hợp lệ, xem [§5](#5-keep--parser-phải-đọc-động). → [N04](#n04--một-nhãn-chiến-thuật-duy-nhất) |
| 5 | Instruction có thể vắng (D3/D4/D14) | **NORMALIZE** | Bắt buộc mọi khối. Backfill 12 dòng. → [N05](#n05--instruction-bắt-buộc-ở-mọi-khối) |
| 6 | Instruction 1 hoặc 2 dòng (dòng `NB`) | **KEEP** | `NB You may use any letter more than once.` là quy tắc thi thật, chỉ đúng với một số khối. Parser nối các dòng in nghiêng liên tiếp. |
| 7 | `optionsLabel` chỉ W1 có | **NORMALIZE** | **Bỏ** `**List of Headings**` / `**List of People**`. **Giữ** `caption` của D10. → [N07](#n07--bỏ-optionslabel-giữ-caption-của-d10) |
| 8 | Options 1 dòng / 2 dòng / 4 dòng | **NORMALIZE** | Mỗi option một dòng, mọi dạng. → [N08](#n08--mỗi-option-một-dòng) |
| 9 | Dải chữ cái A–D vs A–E | **KEEP** | Số option thật sự khác nhau. Suy từ options parse được. |
| 10 | `person` / `organisation` / `person or group` | **KEEP** | Options thật sự là người ở W1, tổ chức ở W2. Parser **không** được dùng danh từ này để nhận dạng gì. |
| 11 | `wordLimit` khác nhau giữa các khối | **KEEP** | **Đúng như vậy.** W4 D7 có đáp án `1.3 million` nên buộc phải `AND/OR A NUMBER`; W1 D7 toàn đáp án chữ nên `TWO WORDS` là đúng. Đọc từ instruction của **từng khối**. |
| 12 | Tiền tố instruction (`Complete the notes below. …`) | **NORMALIZE** | Bỏ tiền tố. Rubric tái tạo được từ `kind` ở tầng UI. → [N12](#n12--bỏ-tiền-tố-instruction) |
| 13 | Gạch dưới 6 / 12 / 3 ký tự | **NORMALIZE** | 6 gạch `______` trong toàn vùng câu hỏi. **Có ràng buộc căn cột**, xem [§6](#6-ràng-buộc-căn-cột-ascii--bắt-buộc-đọc-trước-khi-sửa-n13). → [N13](#n13--gạch-dưới-luôn-6-ký-tự) |
| 14 | Kiểu ASCII diagram (1 khung / 2 khung / cây) | **KEEP** | Sơ đồ khác nhau vì nội dung khác nhau. Parser giữ `raw`, render `<pre>`, không dựng lại layout. |
| 15 | Bullet Note Completion lồng 2 cấp vs phẳng | **KEEP** | Độ sâu phản ánh cấu trúc ý thật — W1 có nhóm "Contested explanations" nên phải lồng, W2 là danh sách mốc thời gian nên phẳng. Parser giữ thụt lề gốc. |
| 16 | Bảng đáp án 2 / 3 / 4 cột | **NORMALIZE** | Luôn 3 cột `\| Q \| Đ.án \| Giải thích \|`. Ô `Giải thích` **được phép rỗng**; bắt buộc có nội dung chỉ ở **D1, D3, D4, D14, D15**. Backfill 6 ô. → [N16](#n16--bảng-đáp-án-luôn-3-cột-giải-thích-bắt-buộc-ở-5-dạng) |
| 17 | `blockNote` in nghiêng vs in đậm dẫn đầu | **NORMALIZE** | Luôn in nghiêng, một dòng. → [N17](#n17--blocknote-luôn-in-nghiêng) |
| 18 | `(chấp nhận *X*)` vs `— chấp nhận *X*` | **NORMALIZE** | Luôn `(chấp nhận *X*)`. → [N18](#n18--luôn-chấp-nhận-x-trong-ngoặc) |
| 19 | Chữ `chấp nhận` nằm trong ô giải thích | **KEEP** | Văn xuôi hợp lệ, không cấm được. N16 làm ranh giới cột rõ ràng; parser chỉ quét cột 2. |
| 20 | Ngoặc **trong** `**…**` = từ tuỳ chọn | **KEEP** | `(the) Red River delta` thật sự chấp nhận cả hai. Parser bung tổ hợp; có ca 2 nhóm `**(the) seventh (century)**`. |
| 21 | Ngoặc **ngoài** `**…**` ở `mcq-multi` = bình luận | **NORMALIZE** | Dời sang cột Giải thích. → [N21](#n21--ngoặc-bình-luận-mcq-multi-dời-sang-cột-giải-thích) |
| 22 | Dấu phẩy/chấm trong đáp án (`130,000`, `E. Gene Smith`) | **KEEP** | Đó là đáp án thật. Parser không tách biến thể bằng `,`; grading bỏ dấu phân cách nghìn khi chuẩn hoá. |
| 23 | Đáp án "chữ cái + nhãn" ở D9 | **KEEP** | Mang hai thông tin thật: chữ để chấm, từ để hiển thị và để chấp nhận khi người dùng gõ chữ. |
| 24 | Từ nối `mcq-multi` là `và` | **UPSTREAM** | Đã đồng nhất 10/10. Chốt vào spec để file sau không dùng `,` hay `/`. |
| 25 | Tên `## Dạng n` khu đáp án khác khu câu hỏi | **NORMALIZE** | Trùng khít, bỏ hậu tố `(Questions a–b)`. → [N25](#n25--tên-dạng-khu-đáp-án-trùng-khít-khu-câu-hỏi) |
| 26 | Heading bảng cuối 5 tên khác nhau | **NORMALIZE** | Hai heading cố định: `# BẢNG TỰ CHẨN ĐOÁN` (**tuỳ chọn**, dùng để override) và `# BẢNG SO SÁNH`. Nguồn dùng chung tách ra `config/diagnostics-default.md`. → [N26](#n26--heading-cuối-file-cố-định-bảng-chẩn-đoán-tuỳ-chọn) |
| 27 | Bảng SO SÁNH trông giống bảng chẩn đoán | **NORMALIZE** | Tan biến nhờ N26 + N-B. Parser khoá theo heading, không theo header bảng. |
| 28 | W3 có thêm bảng quy đổi band | **NORMALIZE** | Xoá khỏi file. Band là logic code (`CLAUDE.md` §7), không phải dữ liệu đề. → [N28](#n28--xoá-bảng-quy-đổi-band-khỏi-file) |
| 29 | Số nhóm blockquote intro: 1 vs 2 | **KEEP** | Số ghi chú đầu bài khác nhau vì nội dung khác nhau. Parser gom tất cả. |
| 30 | Nhãn blockquote intro khác nhau | **KEEP** | `Lưu ý về niên đại` và `Về chủ đề` là ghi chú thật sự khác nhau. Parser không khớp nhãn. |
| 31 | `<số> ______` với số là năm (`… in 2007 ______`) | **KEEP** | Câu hỏi hợp lệ kết thúc bằng năm. Parser: blank số trần **chỉ** hợp lệ trong code fence và phải nằm trong `range`. |
| 32 | `**71** ______` trong fence không tồn tại | **UPSTREAM** | Không file nào dùng. Xoá biến thể ma khỏi `CLAUDE.md` §4.4; chốt luật **trong fence = số trần, ngoài fence = số in đậm**. |
| 33 | Dòng `**86 questions · … · one passage**` | **NORMALIZE** | Xoá dòng này và dòng `## Passage: …`. **Giữ H1**, đặt bằng đúng `title` — H1 là render target của `title`, chống drift bằng assert chứ không bằng xoá. → [N33](#n33--h1-là-render-target-của-title) |
| 34 | Dòng `**TRUE** / **FALSE** / **NOT GIVEN**` | **UPSTREAM** | Đã đồng nhất 10/10. Chốt chuỗi chính xác + luật parser "đây là khai báo options cố định, không phải `caption`". |
| 35 | Chuỗi `NB You may use…` nằm trong chiến thuật | **KEEP** | Chiến thuật trích lại instruction là hợp lệ. N03 làm blockquote chỉ còn một nghĩa; parser đọc instruction **ngoài** blockquote. |
| 36 | Chuỗi `NO MORE THAN TWO WORDS` nằm trong chiến thuật | **KEEP** | Như #35. `wordLimit` chỉ rút từ `instruction`, sau khi đã loại blockquote. |
| 37 | `⚠️ ≥ → ↔ ≠` trong ô giải thích | **KEEP** | Văn xuôi thật. Font UI phải cover Latin mở rộng + emoji. |
| 38 | `**` / `*` bên trong ô đáp án | **KEEP** | `display` giữ raw, `accepted` strip emphasis trước khi chuẩn hoá. |
| 39 | Hai `---` liên tiếp trước `# ĐÁP ÁN` | **NORMALIZE** | Luôn đúng một `---`. Càng ít `---` mơ hồ càng tốt sau khi N-A dùng `---` làm dấu frontmatter. → [N39](#n39--không-bao-giờ-hai-dòng-gạch-ngang-liên-tiếp) |

Hai mục survey chưa nêu:

| # | Chỗ lệch | Nhóm | Quyết định |
|---|---|---|---|
| **N-A** | Không có metadata máy đọc được | **NORMALIZE** | Thêm YAML frontmatter bắt buộc vào đầu cả 5 file. → [N-A](#n-a--yaml-frontmatter-bắt-buộc) |
| **N-B** | Bảng so sánh dùng `___ /14` (3 gạch), trùng pattern chỗ trống | **NORMALIZE** | Đổi thành `__ /14` (2 gạch). Chặn ở nguồn rẻ hơn giới hạn vùng quét trong parser. → [N-B](#n-b--bảng-so-sánh-dùng-2-gạch) |

**Tổng: 20 NORMALIZE · 17 KEEP · 4 UPSTREAM.**

---

## 3. Bộ khung canonical

Thứ tự dưới đây là bắt buộc. Giữa hai section cấp 1 dùng **đúng một** dòng `---` (xem [N39](#n39--không-bao-giờ-hai-dòng-gạch-ngang-liên-tiếp)).

```
---
<YAML frontmatter — N-A>
---

# <title>              ← trùng khít frontmatter.title

> **<nhãn ghi chú tự do>**
> <nội dung>

> **Cách dùng:** <nội dung>

---

# READING PASSAGE

### <tiêu đề bài đọc>

**A**
<đoạn A>

**B**
<đoạn B>
…

---

# PHẦN 1 — DẠNG ĐỌC TỔNG THỂ

## Dạng 1 — <Tên dạng> (Questions 1–8)

> **Chiến thuật**
> - <bullet>
> - <bullet>

*<instruction>*
*<instruction phụ, nếu có>*

<options / caption / thân đề, tuỳ dạng>

<các item>

---

## Dạng 2 — …
…

# ĐÁP ÁN & GIẢI THÍCH

## Dạng 1 — <Tên dạng>          ← trùng khít heading câu hỏi, bỏ (Questions a–b)

| Q | Đ.án | Giải thích |
|---|---|---|
| 1 | **vi** | … |

*<blockNote, nếu có>*

…

---

# BẢNG TỰ CHẨN ĐOÁN     ← TUỲ CHỌN. Vắng ⇒ dùng config/diagnostics-default.md

# BẢNG SO SÁNH

# VOCABULARY

# PARAPHRASE PAIRS
```

Ghi chú kết cấu:

- Frontmatter phải nằm ở **dòng 1**. Parser chỉ đọc frontmatter khi dòng 1 đúng bằng `---`.
- Sau frontmatter, mọi blockquote **trước** `# READING PASSAGE` gom thành `intro` (#29, #30 — KEEP).
- H1 đầu file **giữ lại**, nội dung đúng bằng `frontmatter.title`. Không còn dòng `## Passage: …`, không còn dòng `**86 questions · …**` (N33). `passageTitle` là dòng `### ` trong `# READING PASSAGE`.
- Parser lấy `title` từ **frontmatter**, không từ H1. H1 tồn tại để file có tiêu đề khi frontmatter không được render (GitHub, pipeline LaTeX). `validate` kiểm hai chỗ khớp nhau.
- Trong vùng câu hỏi, ký tự `>` đầu dòng **chỉ** có nghĩa "khối chiến thuật" (N03).

### 3.1 Instruction canonical theo dạng

`{N}` = `ONE` | `TWO` | `THREE`. `{…}` = phần suy ra từ nội dung, **được phép khác nhau giữa các khối và giữa các file** (#9, #11 — KEEP).

| Dạng | `kind` | Instruction canonical |
|---|---|---|
| 1 | `matching-headings` | `*Choose the correct heading for each paragraph, **A–{H}**.*` |
| 2 | `matching-information` | `*Which paragraph contains the following information? Write the correct letter, **A–{H}**.*`<br>+ tuỳ chọn `*NB You may use any letter more than once.*` |
| 3 | `tfng` | `*Do the following statements agree with the information given in the passage?*`<br>+ dòng cố định `**TRUE** / **FALSE** / **NOT GIVEN**` |
| 4 | `ynng` | `*Do the following statements agree with the claims of the writer?*`<br>+ dòng cố định `**YES** / **NO** / **NOT GIVEN**` |
| 5 | `matching-features` | `*Match each statement with the correct {person}, **A–{E}**.*`<br>+ tuỳ chọn `*NB You may use any letter more than once.*` |
| 6 | `matching-endings` | `*Complete each sentence with the correct ending, **A–{G}**.*` |
| 7 | `gap-text` | `*Choose **NO MORE THAN {N} WORDS{ AND/OR A NUMBER}** from the passage for each answer.*` |
| 8 | `gap-text` | như dạng 7 |
| 9 | `gap-select` | `*Complete the summary using the list of words, **A–{J}**, below.*` |
| 10 | `gap-text` | như dạng 7 |
| 11 | `gap-table` | như dạng 7 |
| 12 | `gap-flow` | như dạng 7 |
| 13 | `gap-diagram` | như dạng 7 |
| 14 | `mcq-single` | `*Choose the correct letter, **A**, **B**, **C** or **D**.*` |
| 15 | `mcq-multi` | `*Choose **TWO** letters, **A–{E}**.*` |
| 16 | `short-answer` | như dạng 7 |

D12 và D13 có instruction giống hệt nhau — không sao, `kind` lấy từ tên dạng ở heading, không bao giờ từ instruction.

### 3.2 Tên dạng canonical

Dùng **nguyên văn** ở cả khu câu hỏi (kèm `(Questions a–b)`) lẫn khu đáp án (không kèm):

```
Dạng 1 — Matching Headings
Dạng 2 — Matching Information
Dạng 3 — True / False / Not Given
Dạng 4 — Yes / No / Not Given
Dạng 5 — Matching Features
Dạng 6 — Matching Sentence Endings
Dạng 7 — Sentence Completion
Dạng 8 — Summary Completion (words from the passage)
Dạng 9 — Summary Completion (with a word list)
Dạng 10 — Note Completion
Dạng 11 — Table Completion
Dạng 12 — Flow-chart Completion
Dạng 13 — Diagram Label Completion
Dạng 14 — Multiple Choice, one answer
Dạng 15 — Multiple Choice, more than one answer
Dạng 16 — Short-answer Questions
```

Dấu ngăn là **en dash `—`**. Dải câu dùng **en dash `–`**.

### 3.3 Chỗ trống

| Vị trí | Dạng canonical | Lý do |
|---|---|---|
| Ngoài code fence | `**55** ______` | Số in đậm, không nhập nhằng với năm trong câu hỏi (#31) |
| Trong code fence | `66 ______` | `**66**` sẽ chiếm thêm 4 cột và phá khung ASCII (#14 KEEP) |
| Item không có số (D7, D16) | `______` | Số câu lấy từ số thứ tự của list |

Luôn **đúng 6** dấu gạch dưới (N13). Trong code fence, một chuỗi `<số> ______` chỉ được coi là chỗ trống khi số nằm trong `range` của khối.

---

## 4. Chi tiết NORMALIZE

Mỗi mục: mẫu **ĐÚNG** (canonical) và mẫu **SAI** (đang tồn tại, kèm file + dòng).

---

### N-A — YAML frontmatter bắt buộc

**ĐÚNG** — dòng 1 của mọi file:

```yaml
---
workbook_id: 3
title: Buddhism and the Esoteric Tradition in Vietnam
topic_slug: vietnam-esoteric-buddhism
passage_word_count: 1021
question_count: 86
question_types:
  - matching-headings
  - matching-information
  - tfng
  - ynng
  - matching-features
  - matching-endings
  - gap-text
  - gap-text
  - gap-select
  - gap-text
  - gap-table
  - gap-flow
  - gap-diagram
  - mcq-single
  - mcq-multi
  - short-answer
answer_language: [en, vi]
passage_language: en
created: 2026-08-17
---
```

**SAI** — cả 5 file hiện không có frontmatter; dòng 1 là H1 boilerplate:

```
W1:1   # IELTS Academic Reading — Full Question-Type Workbook
W2:1   # IELTS Academic Reading — Full Question-Type Workbook #2
W3:1   # IELTS Academic Reading — Full Question-Type Workbook #3
W4:1   # IELTS Academic Reading — Full Question-Type Workbook #4
W5:1   # IELTS Academic Reading — Full Question-Type Workbook #5
```

Đặc tả từng trường:

| Trường | Kiểu | Bắt buộc | Ngữ nghĩa |
|---|---|---|---|
| `workbook_id` | integer ≥ 1, duy nhất trong `test/` | ✔ | **Khoá sắp xếp ở màn chọn đề.** Tuyệt đối **không** parse số từ tiêu đề H1 — W1 không có số, cách đó fragile. |
| `title` | string | ✔ | Tên hiển thị, là chủ đề bài đọc (nội dung dòng `## Passage:` cũ). **Nguồn sự thật duy nhất**; H1 đầu file là bản render của nó và phải trùng khít ([N33](#n33--h1-là-render-target-của-title)). |
| `topic_slug` | kebab-case, duy nhất | ✔ | **`ParsedTest.id`.** Khoá `localStorage`. Lấy từ frontmatter chứ không từ tên file → đổi tên file không mất tiến trình. |
| `passage_word_count` | integer, **850–1050** | ✔ | Hiển thị ở màn bắt đầu (ước lượng thời gian đọc). `validate` kiểm hai điều: khớp ±2% với số từ đếm thật, **và** nằm trong 850–1050 (luật generator, [§7](#7-upstream--luật-cho-generator)). |
| `question_count` | integer | ✔ | `validate` đối chiếu với số câu parse được. Sai lệch → `parseWarnings`. |
| `question_types` | list `kind` theo thứ tự khối | ✔ | `validate` đối chiếu với `blocks.map(b => b.kind)`. Trùng lặp (`gap-text` ×4) là bình thường. |
| `answer_language` | list mã ngôn ngữ | ✔ | Ngôn ngữ của **đáp án**. Có `vi` ⇒ grading bật lượt so sánh bỏ dấu (`CLAUDE.md` §7, `Luy Lau` = `Luy Lâu`). |
| `passage_language` | mã ngôn ngữ | ✔ | Cả 5 file: `en`. |
| `created` | `YYYY-MM-DD` | ✔ | Lấy từ mtime hiện tại của file: cả 5 đều `2026-08-17`. Sửa nếu ngày thật khác. |

Giá trị cho 5 file:

| File | `workbook_id` | `topic_slug` | `passage_word_count` | `answer_language` |
|---|---|---|---|---|
| `ielts_reading_buddhism_full.md` | 1 | `buddhism-transmission-asia` | 931 | `[en]` |
| `ielts_reading_tibetan_buddhism.md` | 2 | `tibetan-buddhism-today` | 998 | `[en]` |
| `ielts_reading_vietnam_buddhism.md` | 3 | `vietnam-esoteric-buddhism` | 1021 | `[en, vi]` |
| `ielts_reading_theravada_vietnam.md` | 4 | `vietnam-theravada` | 879 | `[en, vi]` |
| `ielts_reading_mahayana_vietnam.md` | 5 | `vietnam-mahayana` | 1020 | `[en, vi]` |

---

### N02 — `strategy` bắt buộc 16/16

**ĐÚNG**:

```
## Dạng 7 — Sentence Completion (Questions 40–44)

> **Chiến thuật**
> - **Lấy đúng từ trong bài**, không đổi dạng, không tự chế từ đồng nghĩa.
> - Đếm chữ nghiêm ngặt. "NO MORE THAN TWO WORDS" → 3 từ = 0 điểm dù đúng nghĩa.
> - Đoán **loại từ** cần điền (danh/động/tính) trước khi scan.

*Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*
```

**SAI** — khối vào thẳng instruction, không có chiến thuật:

```
W3:173–175   ## Dạng 7 — Sentence Completion (Questions 40–44)
             (dòng trống)
             *Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*

W4:160–162   ## Dạng 7 — Sentence Completion (Questions 40–44)
W5:160–162   ## Dạng 7 — Sentence Completion (Questions 40–44)
```

Khối lượng backfill: **43 khối** — W3 thiếu 11 (D2, D7–D16), W4 thiếu 16, W5 thiếu 16.

Yêu cầu nội dung: tối thiểu 3 bullet, mỗi bullet là một hành vi làm bài kiểm chứng được, không phải khẩu hiệu. Lấy 16 khối của W1 làm chuẩn mực chất lượng.

---

### N03 — Thân summary thôi là blockquote

Đây là mục quan trọng nhất về mặt parser. Sau N03, ký tự `>` trong vùng câu hỏi **chỉ** có một nghĩa: khối chiến thuật. Parser không còn phải sniff nội dung blockquote để phân biệt.

**ĐÚNG**:

```
## Dạng 8 — Summary Completion (words from the passage) (Questions 45–49)

> **Chiến thuật**
> - Đọc **toàn bộ** summary trước để nắm mạch, rồi mới điền.
> - Summary thường chỉ tóm 2–3 đoạn → xác định vùng trước, đừng scan cả bài.
> - Ngữ pháp phải khớp: nếu chỗ trống sau "a/an" → danh từ số ít.

*Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*

Buddhism began as a movement of wandering **45** ______ who relied entirely on lay support. Its expansion depended less on conquest than on commerce: monasteries built at **46** ______ towns served as banks, warehouses and rest houses. Merchants gained lodging and a community that would honour **47** ______ far from home, while monks gained donors. Surviving **48** ______ inscriptions in western India show that traders gave far more often than **49** ______ did.
```

**SAI** — thân summary mở đầu bằng `>`:

```
W1:225   > Buddhism began as a movement of wandering **45** ______ who relied entirely…
W1:238   > When Buddhist texts first reached China, translators faced a **50** ______ …
W2:191   > Following the events of 1959, approximately **45** ______ Tibetans came to live…
W2:201   > In 2013 senior monastic leaders **50** ______ the science programme…
W3:189   > Buddhism is thought to have reached the Red River delta by the **45** ______ …
W3:197   > The first firm evidence dates from 580, when Vinītaruci **50** ______ …
W4:176   > The Vietnamese term *Tiểu thừa* renders a **45** ______ Sanskrit label…
W4:184   > Theravāda reached the Vietnamese-speaking majority only in the twentieth century…
W5:176   > Vietnamese Buddhism is habitually called a **45** ______ tradition…
W5:184   > A study published in 1997 argued that the text belongs to a Chinese literary **50** ______ …
```

Ở W3/W4/W5 các khối này **không** có chiến thuật, nên blockquote đầu tiên sau heading chính là thân summary — quy tắc "blockquote ngay sau heading = chiến thuật" của `CLAUDE.md` §4.3a lấy nhầm y nguyên.

10 dòng, mỗi file 2.

Kèm một luật generator để không tái phạm, xem [§7](#7-upstream--luật-cho-generator): thân đề của `gap-text` / `gap-select` **không bao giờ** dùng `>`.

---

### N04 — Một nhãn chiến thuật duy nhất

Chuẩn hoá **chỉ cái nhãn**. `strategy` được lưu và render dưới dạng **markdown thô** — bullet hay đoạn văn không khác gì nhau với parser, nên thân là [KEEP](#5-keep--parser-phải-đọc-động).

**ĐÚNG** — dòng đầu đúng bằng `> **Chiến thuật**`, thân tự do. Kiểu bullet:

```
> **Chiến thuật**
> - Đọc **câu đầu và câu cuối** mỗi đoạn trước; ý chính thường nằm ở đó.
> - Heading là **ý bao trùm**, không phải một chi tiết. Nếu heading chỉ đúng với một câu trong đoạn → sai.
> - Luôn thừa 3–4 heading. Đừng hoảng khi thấy 2 heading "na ná" — chọn cái khớp *phạm vi* của đoạn.
```

**ĐÚNG** — kiểu đoạn văn, cũng hợp lệ:

```
> **Chiến thuật**
> đọc câu đầu + câu cuối mỗi đoạn. Heading là **ý bao trùm**, không phải một chi tiết. Luôn thừa 3–4 heading.
```

**SAI** — nhãn lệch:

```
W1:109   > **Chiến thuật (dạng bạn hay mất điểm)**        ← ngoặc trong nhãn
W2:46    > **Nhắc lại chiến thuật:** đọc câu đầu + câu cuối mỗi đoạn. Heading là **ý bao trùm**…
W2:78    > **Nhắc lại:** tìm **chi tiết**, không phải ý chính. Gạch chân danh từ cụ thể rồi scan…
W3:53    > **Nhắc lại:** đọc câu đầu + câu cuối mỗi đoạn. Heading = ý bao trùm, không phải chi tiết.
```

Chia làm hai phần việc khác hẳn nhau:

**N04a — máy móc, 17 chỗ.** Tách nhãn khỏi thân, giữ nguyên chữ trong thân:

```
^> \*\*Nhắc lại( chiến thuật)?:?\*\*\s*(.*)$   →   > **Chiến thuật**\n> $2
```

- W2: **16 khối**, chạy script, không đọc lại nội dung. W2 giữ nguyên toàn bộ thân inline.
- W1 D3 (dòng 109): bỏ ngoặc khỏi nhãn. Tín hiệu "dạng bạn hay mất điểm" chuyển thành một bullet trong thân — nhãn không mang trạng thái riêng của người học, trạng thái đó thuộc `localStorage` chứ không thuộc file đề.

**N04b — viết nội dung, 5 khối.** W3 D1, D3, D4, D5, D6 viết lại cho ngang tầm 11 khối mà [N02](#n02--strategy-bắt-buộc-1616) đang bổ sung cho cùng file đó. Làm chung một lượt để 16 khối của W3 đồng đều; nếu tách ra thì W3 có 11 khối dày và 5 khối một dòng.

**Không** đụng vào W2 ở phần này: 16 khối `Nhắc lại` của W2 đã đủ nội dung, chỉ sai nhãn.

---

### N05 — Instruction bắt buộc ở mọi khối

**ĐÚNG**:

```
## Dạng 3 — True / False / Not Given (Questions 15–21)

> **Chiến thuật**
> - …

*Do the following statements agree with the information given in the passage?*

**TRUE** / **FALSE** / **NOT GIVEN**

15. Luy Lâu is thought to have been a Buddhist centre by the second century CE. ______
```

**SAI** — vào thẳng dòng options, không có instruction:

```
W2:96    **TRUE** / **FALSE** / **NOT GIVEN**        (D3, không có dòng in nghiêng phía trên)
W2:112   **YES** / **NO** / **NOT GIVEN**            (D4)
W2:300   **75.** What is the writer's main point in paragraph A?   (D14, không có *Choose the correct letter…*)
W3:101 / W3:117 / W3:287
W4:94  / W4:108 / W4:268
W5:93  / W5:107 / W5:271
```

12 dòng thêm (D3, D4, D14 × W2, W3, W4, W5). W1 đã đúng cả ba.

---

### N07 — Bỏ `optionsLabel`, giữ `caption` của D10

Hai thứ trông giống nhau (đều là dòng in đậm độc lập) nhưng khác hẳn về giá trị. `**List of Headings**` chỉ nói lại điều bảng bên dưới đã hiển nhiên. `**The decline of Buddhism in India**` là tiêu đề nội dung, mất đi thì người làm không biết ghi chú nói về cái gì.

**ĐÚNG** — options vào thẳng, không nhãn:

```
*Choose the correct heading for each paragraph, **A–H**.*

| | |
|---|---|
| **i** | A technology shaped by religious demand |
```

**ĐÚNG** — caption của D10 giữ nguyên:

```
*Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*

**The decline of Buddhism in India**

- By the **55** ______ century, the monastic universities of the Ganges plain were in ruins.
```

**SAI**:

```
W1:59    **List of Headings**
W1:160   **List of People**
```

2 dòng xoá, chỉ ở W1. Trường `optionsLabel` biến mất khỏi `QuestionBlock` (`CLAUDE.md` §5).

---

### N08 — Mỗi option một dòng

**ĐÚNG**:

```
**A** Ashoka
**B** Kumārajīva
**C** Xuanzang
**D** Wang Jie
```

```
**A** condemned
**B** philosophical
**C** productive
**D** displaced
**E** demand
**F** elegance
**G** praised
**H** captivity
**I** commercial
**J** permission
```

**SAI** — ba layout:

```
W1:161   **A** Ashoka  **B** Kumārajīva  **C** Xuanzang  **D** Wang Jie            ← 1 dòng
W3:138   **A** Mâu Tử  **B** Khương Tăng Hội  **C** Vinītaruci  **D** Đinh Liễn  **E** Trần Nhân Tông
W4:127   **A** Hộ Tông  **B** Thích Minh Châu  **C** Minh Đăng Quang  **D** the Khmer Krom
W5:126   **A** Thông Biện  **B** Trần Văn Giáp  **C** Cuong Tu Nguyen              ← 2 dòng
W5:127   **D** Trần Nhân Tông  **E** Thích Nhất Hạnh
W1:240   **A** condemned  **B** philosophical  **C** productive  **D** displaced  **E** demand   ← 2 dòng × 5
W1:241   **F** elegance  **G** praised  **H** captivity  **I** commercial  **J** permission
W2:203 / W3:199 / W4:186 / W5:186   (word list, 2 dòng × 5)
```

W2 D5 (dòng 133–136) và D6 của cả 5 file đã đúng.

9 khối: D5 ở W1/W3/W4/W5, D9 ở cả 5 file.

Sau N08, một quy tắc duy nhất phủ `matching-features`, `matching-endings`, `gap-select`: **gom mọi dòng liên tiếp khớp `^\*\*[A-Z]\*\*\s`**. Không còn phải ghép dòng rồi tách lại.

---

### N12 — Bỏ tiền tố instruction

**ĐÚNG**:

```
*Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*
```

**SAI**:

```
W1:206   *Complete the sentences below. Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*
W1:223   *Complete the summary below. Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*
W1:252   *Complete the notes below. Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*
W1:272   *Complete the table below. Choose **NO MORE THAN TWO WORDS AND/OR A NUMBER** from the passage for each answer.*
W1:293   *Complete the flow-chart below. Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*
W1:411   *Answer the questions below. Choose **NO MORE THAN THREE WORDS** from the passage for each answer.*
W1:57    *The passage has eight paragraphs, **A–H**. Choose the correct heading for each paragraph from the list of headings below.*
W1:323 / W2:272 / W3:261 / W4:244 / W5:247
         *Label the diagram below. Choose **NO MORE THAN TWO WORDS…** …*    ← cả 5 file
```

12 dòng. Rubric ("Complete the notes below.") suy được 1–1 từ `kind`, nên UI tự sinh lại nếu muốn hiển thị — một nguồn sự thật, không phải hai.

---

### N13 — Gạch dưới luôn 6 ký tự

**ĐÚNG**: `______` (đúng 6).

**SAI**:

```
W2:282   │    71 ____________       │      ← 12 gạch
W2:283   │    73 ____________       │
W2:286   │    the 74 ____________   │
W2:287   │  Claims 72 ____________  │
```

4 chỗ, chỉ ở W2 D13. **Đọc [§6](#6-ràng-buộc-căn-cột-ascii--bắt-buộc-đọc-trước-khi-sửa-n13) trước khi sửa** — rút ngắn phải bù space.

---

### N16 — Bảng đáp án luôn 3 cột, `Giải thích` bắt buộc ở 5 dạng

**ĐÚNG**:

```
| Q | Đ.án | Giải thích |
|---|---|---|
| 1 | **vi** | Đoạn A: một phong trào khiêm tốn (robe, begging bowl) nhưng sau đó lan khắp châu Á. Không phải "Ashoka's achievements" — đoạn này là hoài nghi. |
```

**SAI — 4 cột** (gộp `Vì sao` + `Bẫy` thành một ô, ngăn bằng ` — `):

```
W1:425   | Q | Đ.án | Vì sao | Bẫy |
W2:366   | Q | Đ.án | Vì sao | Bẫy |
W3:349   | Q | Đ.án | Vì sao | Bẫy |
```

**SAI — 2 cột** (thiếu hẳn cột giải thích):

```
W1:500   | Q | Đ.án |        (D7)
W3:399   | Q | Đ.án |        (D5)
W4:380   | Q | Đ.án |        (D5)
W5:383   | Q | Đ.án |        (D5)
```

**SAI — ô cuối rỗng**:

```
W2:451   | 45 | **130,000** | |
```

**Cột thứ ba luôn tồn tại, nhưng được phép rỗng.** Bắt buộc có nội dung ở **5 dạng**: D1, D3, D4, D14, D15 — nhóm câu mà lý do đúng/sai không tự hiển lộ từ đáp án, và là nhóm `CLAUDE.md` §6.3.4 cần nhất khi dựng màn review. Các dạng còn lại (điền từ, matching) đáp án tự nói lên nó, ô rỗng chấp nhận được.

Ô rỗng viết `| … | **X** | |` — vẫn đủ 3 cột. Parser trả `explanation: undefined`, không phải chuỗi rỗng.

Hiện trạng nhóm bắt buộc, đếm thật:

| File | D1 | D3 | D4 | D14 | D15 | Phải viết mới |
|---|---|---|---|---|---|---|
| W1 | đủ | đủ | đủ | đủ | 2 ô trống — [N21](#n21--ngoặc-bình-luận-mcq-multi-dời-sang-cột-giải-thích) lấp sẵn | 0 |
| W2 | đủ | đủ | đủ | đủ | 2 ô trống — N21 lấp sẵn | 0 |
| W3 | đủ | đủ | đủ | đủ | 2 ô trống | **2** |
| W4 | đủ | đủ | đủ | đủ | 2 ô trống | **2** |
| W5 | đủ | đủ | đủ | đủ | 2 ô trống | **2** |
| | | | | | **Tổng** | **6** |

D1, D3, D4, D14 đã đầy đủ ở cả 5 file. D15 trống ở cả 5, nhưng W1 và W2 có sẵn phần bình luận trong ngoặc mà N21 dời sang đúng cột này — nên chỉ W3, W4, W5 cần viết mới, mỗi file 2 ô.

213 ô còn lại (D5–D13, D16) chuyển sang **tuỳ chọn**: điền được thì tốt, không điền cũng không chặn `validate`.

---

### N17 — `blockNote` luôn in nghiêng

**ĐÚNG**:

```
*Tổng kết bẫy dạng này: câu 18 và 20 đều là **NOT GIVEN kiểu "thêm thông tin"** — đề thêm một chi tiết (phí, so sánh) mà bài im lặng. Quy tắc: bài im lặng ≠ bài phủ định.*
```

**SAI** — in đậm dẫn đầu, không in nghiêng:

```
W1:461   **Tổng kết bẫy dạng này:** câu 18 và 20 đều là **NOT GIVEN kiểu "thêm thông tin"** — đề thêm một chi tiết (phí, so sánh) mà bài im lặng. Đây đúng là kiểu bạn hay mất điểm. Quy tắc: *bài im lặng ≠ bài phủ định.*
```

1 dòng. Lưu ý phần in nghiêng lồng bên trong (`*bài im lặng ≠ bài phủ định.*`) phải bỏ dấu `*` khi bọc cả câu bằng in nghiêng.

Sau N17, luật parser gọn lại: trong khối đáp án, mọi dòng không bắt đầu bằng `|`, không rỗng, không phải `---` → `blockNote`.

---

### N18 — Luôn `(chấp nhận *X*)` trong ngoặc

**ĐÚNG**:

```
| 86 | **(at) Dunhuang** (chấp nhận *a sealed chamber*) | Đoạn F: "recovered in 1907 from a sealed chamber in the cave complex at Dunhuang". |
```

**SAI** — biến thể em dash:

```
W1:595   | 86 | **(at) Dunhuang** — chấp nhận *a sealed chamber* |
```

1 dòng. Tám dòng còn lại trong corpus đã dùng dạng ngoặc (W1:534, W2:533, W3:472/483/484, W5:418/461/471).

Sau N18, regex thu về một dạng: `\(chấp nhận\s+(.+?)\)`. Nhiều biến thể trong cùng ngoặc ngăn bằng `,` hoặc `/`.

---

### N21 — Ngoặc bình luận `mcq-multi` dời sang cột Giải thích

**ĐÚNG**:

```
| Q | Đ.án | Giải thích |
|---|---|---|
| 79–80 | **B** và **D** | "warehouses" = storing goods; "rest houses for caravans" = accommodation. |
| 81–82 | **B** và **D** | "withdrawal of royal patronage"; "military campaigns that destroyed Nalanda". |
```

**SAI** — bình luận nằm trong ô đáp án, cùng chỗ với ngoặc-tuỳ-chọn có nghĩa hoàn toàn khác:

```
W1:583   | 79–80 | **B** và **D** ("warehouses" = storing goods; "rest houses for caravans" = accommodation) |
W1:584   | 81–82 | **B** và **D** ("withdrawal of royal patronage"; "military campaigns that destroyed Nalanda") |
W2:522   | 79–80 | **B** và **D** (physics, neuroscience) |
W2:523   | 81–82 | **B** và **C** (full ordination unavailable; excluded from ritual and administrative roles) |
```

4 dòng. Sau N21, ngoặc trong ô đáp án chỉ còn **hai** nghĩa, phân biệt bằng vị trí so với `**`:

- **trong** `**…**` → từ tuỳ chọn, bung tổ hợp (#20 KEEP)
- **ngoài** `**…**` → bắt buộc bắt đầu bằng `chấp nhận`, là biến thể chấp nhận thêm (N18)

Không còn nghĩa thứ ba.

---

### N25 — Tên dạng khu đáp án trùng khít khu câu hỏi

**ĐÚNG**:

```
## Dạng 8 — Summary Completion (words from the passage)
## Dạng 12 — Flow-chart Completion
## Dạng 16 — Short-answer Questions
```

**SAI** — 7 tên lệch, giống nhau ở cả 5 file:

```
W1:508  W2:447  W3:430  W4:411  W5:414   ## Dạng 8 — Summary (words from passage)
W1:518  W2:457  W3:442  W4:421  W5:424   ## Dạng 9 — Summary (word list)
W1:551  W2:490  W3:477  W4:454  W5:457   ## Dạng 12 — Flow-chart
W1:561  W2:500  W3:489  W4:464  W5:467   ## Dạng 13 — Diagram Label
W1:570  W2:509  W3:498  W4:473  W5:476   ## Dạng 14 — Multiple Choice (one answer)
W1:579  W2:518  W3:507  W4:482  W5:485   ## Dạng 15 — Multiple Choice (two answers)
W1:588  W2:527  W3:516  W4:489  W5:492   ## Dạng 16 — Short Answer
```

35 dòng.

Ghép khối câu hỏi ↔ khối đáp án vẫn **luôn** bằng `typeIndex` (số sau chữ "Dạng"). N25 không đổi luật ghép — nó biến tên dạng thành một assertion kiểm tra chéo được: tên lệch ⇒ file bị sửa tay sai chỗ ⇒ `parseWarnings`.

---

### N26 — Heading cuối file cố định, bảng chẩn đoán tuỳ chọn

Dải câu của bảng chẩn đoán (1–14, 15–28, 29–39, 40–74, 75–86) giống nhau ở cả 5 file vì cấu trúc 16 dạng giống nhau. Lời khuyên trong bảng W1 cũng không nói gì riêng về Phật giáo Con đường tơ lụa — nó nói về **thói quen đọc**. Vậy nên nó là nội dung dùng chung, không phải dữ liệu của một đề. Copy 5 lần vào 5 file là tạo ra 5 bản phải đồng bộ tay.

**ĐÚNG** — cả hai section đều **tuỳ chọn**, nhưng tên thì cố định. `# BẢNG TỰ CHẨN ĐOÁN` chỉ xuất hiện khi đề đó muốn ghi đè bảng chung; `# BẢNG SO SÁNH` chỉ xuất hiện khi file có bảng đó sẵn (W1 không có, không phải thêm):

```
---

# BẢNG SO SÁNH

| Nhóm dạng | Câu | #1 | #2 | #3 | #4 | #5 |
|---|---|---|---|---|---|---|
| Headings + Matching Info | 1–14 | __ /14 | __ /14 | __ /14 | __ /14 | __ /14 |
```

**SAI** — 5 tên khác nhau:

```
W1:599   # BẢNG TỰ CHẨN ĐOÁN                 ← giữ nguyên, đây là bảng override hợp lệ
W2:538   # BẢNG SO SÁNH VỚI WORKBOOK #1
W3:527   # BẢNG SO SÁNH BA WORKBOOK
W4:500   # BẢNG SO SÁNH BỐN WORKBOOK
W5:503   # BẢNG SO SÁNH NĂM WORKBOOK
```

Tên `BA / BỐN / NĂM WORKBOOK` mã hoá **số file tại thời điểm sinh** vào trong nội dung file. Thêm file thứ sáu là bốn tên này sai hết. Đây là drift theo đúng nghĩa đen. Sửa 4 dòng, không backfill gì vào file.

#### `config/diagnostics-default.md` — nguồn dùng chung

File mới, **ngoài** `test/` nên `import.meta.glob('/test/*.md')` không nhặt nhầm thành đề. Nội dung là bảng chẩn đoán của W1 nguyên văn, để `parseDiagnostics` đọc được bằng **đúng một** hàm cho cả hai nguồn:

```markdown
# BẢNG TỰ CHẨN ĐOÁN

Đếm số câu sai theo nhóm rồi đối chiếu:

| Nhóm dạng | Câu | Sai ≥ 30% nghĩa là |
|---|---|---|
| Headings + Matching Info (1–14) | 14 | Bạn đang **đọc từng chữ** thay vì nắm ý đoạn. Luyện skimming: đọc câu đầu/cuối mỗi đoạn rồi tự viết 1 câu tóm tắt. |
| T/F/NG + Y/N/NG (15–28) | 14 | Bạn **suy diễn ngoài văn bản**. Ép mình chỉ ra *dòng cụ thể* trước khi chọn TRUE/YES; không chỉ ra được → NG. |
| Matching Features/Endings (29–39) | 11 | Bạn chưa dùng **tên riêng làm mỏ neo** khi scan. |
| Điền từ (40–74) | 35 | Nếu sai vì **nghĩa** → vốn từ. Nếu sai vì **số từ / dạng từ** → lỗi kỹ thuật, sửa được ngay bằng thói quen đếm chữ. |
| MCQ + Short answer (75–86) | 12 | Bạn đang bị hút vào phương án **chứa từ giống bài**. Che phương án, tự trả lời trước. |
```

Không có frontmatter — file này không phải một đề.

#### Thứ tự phân giải

Parser vẫn là **hàm thuần** (`CLAUDE.md` §8): nó không đọc file config, chỉ báo lại nó tìm thấy gì.

1. `parseTest(raw, filename)` → `diagnostics: []` và `diagnosticsSource: 'none'` nếu file không có `# BẢNG TỰ CHẨN ĐOÁN`; ngược lại trả bảng của file và `'file'`.
2. Loader (`src/lib/tests.ts`) parse `config/diagnostics-default.md` **một lần** bằng chính `parseDiagnostics`.
3. Với mỗi đề có `diagnosticsSource === 'none'`: nếu các `range` của bảng mặc định **phủ khít** `1..totalQuestions` (không hở, không chồng, không tràn) thì thay vào và đặt `'default'`; nếu không phủ khít thì để `[]` và giữ `'none'`, ghi một ghi chú mềm.

Bước 3 là chốt an toàn thật sự: đề nào sau này có cấu trúc khác 86 câu / 16 dạng sẽ **không** bị gán nhầm lời khuyên của cấu trúc cũ.

#### Kiểu dữ liệu

`CLAUDE.md` §5 sửa thành:

```ts
export type DiagnosticsSource = 'file' | 'default' | 'none';

export interface ParsedTest {
  …
  diagnostics: Diagnostic[];            // [] khi file không có bảng riêng
  diagnosticsSource: 'file' | 'none';   // parser thuần chỉ trả được hai giá trị này
}

// src/lib/tests.ts — sau khi loader đã phân giải
export interface LoadedTest extends Omit<ParsedTest, 'diagnosticsSource'> {
  diagnosticsSource: DiagnosticsSource;
}
```

#### `CLAUDE.md` §6.3.3 sửa thành

> **3. Chẩn đoán tự động**: lấy `diagnostics` từ bảng riêng trong file nếu có, ngược lại từ `config/diagnostics-default.md`. Nhóm nào tỉ lệ sai ≥ `threshold` thì hiện `advice`, nổi bật; nhóm đạt thì thu gọn. Khi `diagnosticsSource === 'default'`, ghi rõ trên UI đây là lời khuyên chung cho mọi đề, không riêng đề này. Khi `'none'` (dải câu của bảng mặc định không phủ khít đề), ẩn hẳn khối chẩn đoán, **không** báo lỗi.

Và §4.7 bỏ câu "Nếu file không có mục này → `diagnostics: []`, app im lặng bỏ qua phần chẩn đoán" — giờ app không bỏ qua nữa, nó rơi về bảng mặc định.

---

### N28 — Xoá bảng quy đổi band khỏi file

**SAI** — chỉ W3 có:

```
W3:538   **Quy đổi tham khảo (tỉ lệ đúng → band Reading gần đúng):**
W3:540   | Tỉ lệ đúng | Band tương đương |
W3:541   |---|---|
W3:542   | ~87% trở lên | 8.0+ |
W3:543   | ~80% | 7.5 |
W3:544   | ~72% | 7.0 |
W3:545   | ~65% | 6.5 |
W3:546   | ~57% | 6.0 |
```

**ĐÚNG**: không có. Bảng band là **logic chấm điểm**, thuộc `src/lib/grading.ts` theo `CLAUDE.md` §7, dùng chung cho mọi đề. Để trong file đề nghĩa là 5 đề có thể quy đổi band khác nhau — vô lý, và W3 sẽ lệch khỏi code ngay lần đầu §7 được chỉnh.

---

### N33 — H1 là render target của `title`

Không phải mọi chỗ đọc file này đều render YAML frontmatter — GitHub, pipeline LaTeX, phần lớn trình xem markdown đều nuốt nó hoặc in ra thô. Xoá H1 thì file mất tiêu đề trong tất cả những ngữ cảnh đó.

Nên H1 **ở lại**, nhưng nó không phải nguồn sự thật thứ hai: `title` trong frontmatter là nguồn duy nhất, H1 là bản render của nó. Drift chặn bằng **assert**, không bằng xoá.

**ĐÚNG**:

```
---
workbook_id: 1
title: The Transmission of Buddhism Across Asia
topic_slug: buddhism-transmission-asia
…
---

# The Transmission of Buddhism Across Asia

> **Cách dùng file này**
> Đây **không** phải một đề thi (đề thật chỉ 13–14 câu/passage)…
```

**SAI** — ba dòng metadata dạng văn bản, H1 mang chuỗi boilerplate thay vì chủ đề:

```
W1:1   # IELTS Academic Reading — Full Question-Type Workbook
W1:2   ## Passage: The Transmission of Buddhism Across Asia
W1:4   **86 questions · all 16 IELTS Academic Reading question types · one passage**
```
tương tự W2:1–4, W3:1–4, W4:1–4, W5:1–4.

Thao tác trên mỗi file: **xoá 2 dòng, viết lại 1 dòng.**

| Dòng | Xử lý | Đi đâu |
|---|---|---|
| `# IELTS Academic Reading — Full Question-Type Workbook #N` | **viết lại** thành `# <title>` | `#N` → `workbook_id`; phần boilerplate là hằng số của định dạng, không cần khai báo |
| `## Passage: <chủ đề>` | **xoá** | nội dung lên H1 và vào `frontmatter.title` |
| `**86 questions · all 16 … · one passage**` | **xoá** | `question_count` · `question_types.length` · hằng số định dạng |

15 chỗ (3 × 5 file).

Assertion đi kèm: `validate` so H1 đầu file với `frontmatter.title`, **lệch một ký tự là FAIL** — không cảnh báo mềm. Đây là chỗ duy nhất trong spec cho phép một sự thật xuất hiện hai lần, nên nó phải là chỗ được canh chặt nhất.

---

### N39 — Không bao giờ hai dòng gạch ngang liên tiếp

**ĐÚNG**:

```
| 86 | **(at) Dunhuang** (chấp nhận *a sealed chamber*) | … |

---

# BẢNG TỰ CHẨN ĐOÁN
```

**SAI** — `---` đôi ngay trước khu đáp án, ở cả 5 file:

```
W1:418–419   ---
             ---
W2:359–360   W3:342–343   W4:323–324   W5:326–327
```

5 chỗ. Quan trọng hơn bình thường vì sau N-A, `---` cũng là dấu phân định frontmatter — càng ít `---` mơ hồ càng tốt. Parser vẫn chỉ đọc frontmatter khi `---` nằm ở **dòng 1**.

---

### N-B — Bảng so sánh dùng 2 gạch

**ĐÚNG**:

```
| Nhóm dạng | Câu | #1 | #2 | #3 | #4 | #5 |
|---|---|---|---|---|---|---|
| Headings + Matching Info | 1–14 | __ /14 | __ /14 | __ /14 | __ /14 | __ /14 |
```

**SAI** — 3 gạch, trùng pattern `_{3,}` của chỗ trống:

```
W5:507   | Headings + Matching Info | 1–14 | ___ /14 | ___ /14 | ___ /14 | ___ /14 | ___ /14 |
W4:504   | Headings + Matching Info | 1–14 | ___ /14 | ___ /14 | ___ /14 | ___ /14 | |
W3:531 / W2:544
```

23 dòng (W2 5, W3 6, W4 6, W5 6). W1 không có bảng so sánh nên không dính.

Chặn ở nguồn rẻ hơn nhiều so với việc parser phải giới hạn vùng quét `_{3,}` theo offset của heading `ĐÁP ÁN` — một luật vô hình, dễ vỡ khi ai đó chèn section mới.

---

## 5. KEEP — parser phải đọc động

Sau chuẩn hoá, đây là **toàn bộ** biến thiên mà parser còn phải chịu. Mọi thứ ngoài danh sách này gặp phải ⇒ `parseWarnings`.

| # | Biến thiên | Parser phải |
|---|---|---|
| 4 | **Thân** khối chiến thuật: bullet (W1, W3) hay đoạn văn inline (W2) | Lưu `strategy` là **markdown thô**, render bằng `marked`. Chỉ nhãn ở dòng đầu là cố định ([N04](#n04--một-nhãn-chiến-thuật-duy-nhất)); từ dòng thứ hai trở đi không đặt ràng buộc gì |
| 6 | 1 hoặc 2 dòng instruction | Nối các dòng in nghiêng **liên tiếp** trước item đầu tiên |
| 9 | Dải chữ cái options (A–D, A–E, A–G, A–J) | Suy từ options parse được, không đọc từ instruction |
| 10 | Danh từ trong instruction D5 | Bỏ qua hoàn toàn khi nhận dạng |
| 11 | `wordLimit` theo từng khối | Rút từ `instruction` của **chính khối đó**; không suy từ `kind`, không suy từ khối khác cùng số |
| 14 | Layout ASCII trong fence | Giữ `raw` byte-exact, render `<pre>`; input inline **cùng chiều rộng ký tự** với `______` |
| 15 | Độ sâu bullet Note Completion | Giữ số space thụt lề gốc |
| 19 | Chữ `chấp nhận` trong văn xuôi | Chỉ quét `chấp nhận` ở **cột 2** của bảng đáp án |
| 20 | Ngoặc tuỳ chọn trong `**…**` | Bung tổ hợp có/không cho **mọi** nhóm ngoặc (ca 2 nhóm: `**(the) seventh (century)**` → 4 biến thể) |
| 22 | Dấu phẩy/chấm trong đáp án | Không tách biến thể bằng `,` ở mức đáp án chính; khi chuẩn hoá để chấm thì bỏ dấu phân cách nghìn |
| 23 | Đáp án chữ cái + nhãn (D9) | Chấp nhận cả chữ cái lẫn nhãn khi chấm; hiển thị cả hai |
| 29 | Số nhóm blockquote intro | Gom tất cả blockquote trước `# READING PASSAGE` |
| 30 | Nhãn blockquote intro | Không khớp nhãn; quy tắc thuần vị trí |
| 31 | `<số> ______` với số là năm | Blank số trần chỉ hợp lệ **trong code fence** và số phải nằm trong `range` |
| 35, 36 | Chiến thuật trích lại instruction | Rút `instruction` và `wordLimit` **ngoài** blockquote |
| 37 | `⚠️ ≥ → ↔ ≠` | Render nguyên; font UI cover Latin mở rộng + emoji |
| 38 | `**` / `*` trong ô đáp án | `display` giữ raw; `accepted` strip emphasis trước khi chuẩn hoá |

---

## 6. Ràng buộc căn cột ASCII — bắt buộc đọc trước khi sửa N13

`#14` (layout ASCII) là **KEEP**: khung vẽ tay phải giữ nguyên. `N13` (gạch dưới về 6 ký tự) là **NORMALIZE**. Hai điều này giao nhau ở đúng một chỗ: **W2 D13**, nơi khung 2 cột được căn theo độ dài 12 gạch.

Đo thật khung W2 (dòng 277–289): mỗi dòng thân đúng **61 ký tự**, các ký tự `│` nằm ở cột **2, 29, 33, 60**. Lòng khung trái = cột 3–28 (26 ký tự), lòng khung phải = cột 34–59 (26 ký tự).

Rút 12 gạch xuống 6 làm mất 6 ký tự ⇒ **phải bù đúng 6 space** ở cuối lòng khung, nếu không `│` và `┐ ┘` lệch cột và khung vỡ khi render `<pre>`.

Nguyên trạng (W2:274–290):

```
        TWO COMPETING CLAIMS OVER RECOGNITION

  ┌──────────────────────────┐   ┌──────────────────────────┐
  │  THE GADEN PHODRANG      │   │  THE CHINESE             │
  │  TRUST                   │   │  GOVERNMENT              │
  │                          │   │                          │
  │  Registered in           │   │  Legal basis:            │
  │    71 ____________       │   │    regulations of        │
  │                          │   │    73 ____________       │
  │  Reaffirmed on           │   │                          │
  │    2 July 2025           │   │  Required method:        │
  │                          │   │    the 74 ____________   │
  │  Claims 72 ____________  │   │    procedure             │
  │  authority               │   │                          │
  └──────────────────────────┘   └──────────────────────────┘
```

Sau N13 — 4 dòng đổi, mỗi dòng `12 gạch → 6 gạch + 6 space`, tổng vẫn 61 ký tự:

```
        TWO COMPETING CLAIMS OVER RECOGNITION

  ┌──────────────────────────┐   ┌──────────────────────────┐
  │  THE GADEN PHODRANG      │   │  THE CHINESE             │
  │  TRUST                   │   │  GOVERNMENT              │
  │                          │   │                          │
  │  Registered in           │   │  Legal basis:            │
  │    71 ______             │   │    regulations of        │
  │                          │   │    73 ______             │
  │  Reaffirmed on           │   │                          │
  │    2 July 2025           │   │  Required method:        │
  │                          │   │    the 74 ______         │
  │  Claims 72 ______        │   │    procedure             │
  │  authority               │   │                          │
  └──────────────────────────┘   └──────────────────────────┘
```

Kiểm tra sau khi sửa — cả bốn dòng phải cho cùng kết quả với các dòng còn lại:

```bash
node -e 'const fs=require("fs");
fs.readFileSync("test/ielts_reading_tibetan_buddhism.md","utf8").split(/\r?\n/)
  .slice(276,289).forEach((s,i)=>{
    const c=[];for(let k=0;k<s.length;k++) if("│┌┐└┘".includes(s[k])) c.push(k);
    console.log(String(277+i).padStart(3), [...s].length, c.join(","));
  });'
# mọi dòng phải in ra: 61  2,29,33,60
```

Ràng buộc chung cho mọi file, mọi lần sửa trong code fence:

> **Trong `gap-flow` / `gap-diagram`, mọi thao tác sửa phải giữ nguyên số ký tự của dòng.** Thêm/bớt bao nhiêu ký tự ở chỗ trống thì bù ngược lại bấy nhiêu space liền sau. `validate` kiểm: trong mỗi fence, tập vị trí cột của `│ ┌ ┐ └ ┘` phải giống nhau ở mọi dòng có chứa các ký tự đó.

W1, W3, W5 dùng khung một cột nên `│` phải nằm cùng cột trên mọi dòng. W4 dùng cây `├── └──` không có viền phải, nên chỉ cần cột của `│ ├ └` khớp.

---

## 7. UPSTREAM — luật cho generator

Bốn mục đầu 5 file hiện tại đã đúng; chốt vào spec + `validate` để file thứ sáu không trượt. Hai mục cuối là luật bổ sung: file hiện có đã được xử lý ở chỗ khác, nhưng generator phải biết để không sinh lại.

| # | Luật |
|---|---|
| 1 | `CLAUDE.md` §3 / §9 / §10 nói "toàn bộ file trong `test/`", **không** nêu số lượng. `validate` chạy trên mọi file glob được. |
| 24 | Nhiều đáp án của `mcq-multi` ngăn bằng **`và`**, không dùng `,` `/` `and` `&`. Parser vẫn tách theo `\*\*([A-Z])\*\*` nên chịu được, nhưng file sai luật ⇒ `parseWarnings`. |
| 32 | Chỗ trống **trong** code fence dùng số trần `66 ______`; **ngoài** code fence dùng số in đậm `**66** ______`. Biến thể `**71** ______` trong fence không tồn tại và không được phép xuất hiện — nó phá căn cột (§6). Xoá mô tả này khỏi `CLAUDE.md` §4.4. |
| 34 | Dòng khai báo options cố định viết đúng `**TRUE** / **FALSE** / **NOT GIVEN**` và `**YES** / **NO** / **NOT GIVEN**` — in đậm từng lựa chọn, ngăn bằng ` / `. Parser nhận theo pattern `^\*\*\w+\*\*(\s*/\s*\*\*[\w ]+\*\*)+$` và **không** coi đây là `caption`. |
| N03 | Thân đề của `gap-text` và `gap-select` (D8, D9) viết bằng **đoạn văn thường**. Không bao giờ mở đầu bằng `>`. Trong vùng câu hỏi, `>` **chỉ** dành cho khối chiến thuật — không có ngoại lệ nào khác. *(5 file hiện có: xử lý ở [N03](#n03--thân-summary-thôi-là-blockquote).)* |
| N04 | Khối chiến thuật mở đầu bằng **đúng** dòng `> **Chiến thuật**` — không hậu tố, không ngoặc, không biến thể `Nhắc lại`. **Thân từ dòng thứ hai trở đi tự do**: bullet hay đoạn văn đều được, generator không phải theo khuôn. Ràng buộc duy nhất là nhãn, vì đó là thứ `validate` kiểm được. *(5 file hiện có: xử lý ở [N04a](#n04--một-nhãn-chiến-thuật-duy-nhất).)* |
| N33 | Sinh H1 đầu file **trùng khít** `frontmatter.title` — không thêm boilerplate `IELTS Academic Reading — …`, không thêm số workbook, không thêm hậu tố. Không sinh dòng `## Passage: …` và dòng `**N questions · …**`; những con số đó thuộc `question_count` và `question_types`. *(5 file hiện có: xử lý ở [N33](#n33--h1-là-render-target-của-title).)* |
| N-A | `passage_word_count` phải nằm trong **850–1050**. Dưới 850 thì bài quá ngắn để đỡ nổi 86 câu; trên 1050 thì lệch khỏi độ dài Passage 3 thật. Số đếm thật hiện tại — 931 · 998 · 1021 · 879 · 1020 — cả 5 đều lọt, không file nào phải sửa. Ngoài khoảng ⇒ `parseWarnings`. |

---

## 8. Bất biến — assertion cho `npm run validate`

Copy từ [format-survey.md §3](format-survey.md), cập nhật theo giá trị **sau chuẩn hoá**. Cột cuối đánh dấu ô mà chuẩn hoá làm thay đổi.

| Bất biến | Giá trị (mọi file) | Đổi do chuẩn hoá |
|---|---|---|
| Frontmatter | có, ở dòng 1, đủ 9 trường bắt buộc | ✔ N-A |
| `workbook_id` | duy nhất trong `test/` | ✔ N-A |
| `topic_slug` | duy nhất trong `test/`, kebab-case | ✔ N-A |
| `question_count` khớp số câu parse được | 86 | ✔ N-A |
| `question_types` khớp `blocks.map(b => b.kind)` | 16 phần tử | ✔ N-A |
| `passage_word_count` sai lệch ≤ 2% **và** trong 850–1050 | 931 · 998 · 1021 · 879 · 1020 | ✔ N-A |
| H1 đầu file `===` `frontmatter.title` | trùng khít, lệch ⇒ **FAIL** | ✔ N33 |
| Heading cấp 1 | 10 hoặc 11 — hai section cuối (`BẢNG TỰ CHẨN ĐOÁN`, `BẢNG SO SÁNH`) đều tuỳ chọn | ✔ N26, N33 |
| Đoạn passage | 8, nhãn `A`–`H` | — |
| Khối `## Dạng` vùng câu hỏi | 16, typeIndex 1–16, không trùng | — |
| Khối `## Dạng` vùng đáp án | 16, typeIndex 1–16, khớp 1–1 | — |
| Tên dạng khu đáp án == khu câu hỏi (bỏ `(Questions a–b)`) | 16/16 | ✔ N25 |
| Tổng số câu | 86, liên tục 1–86, không trùng | — |
| Số đáp án | 86, liên tục 1–86, không trùng | — |
| Khối có `strategy` | **16/16** | ✔ N02 |
| Khối có `instruction` | **16/16** | ✔ N05 |
| Blockquote trong vùng câu hỏi | **đúng 16** (chỉ chiến thuật) | ✔ N03 |
| Bảng đáp án | **luôn 3 cột** | ✔ N16 |
| Ô `Giải thích` không rỗng ở D1, D3, D4, D14, D15 | 5 dạng × 5 file | ✔ N16 |
| `optionsLabel` | **0** ở mọi file | ✔ N07 |
| `caption` (D10) | 1 ở mọi file | — |
| Dòng options | mỗi option **một dòng** | ✔ N08 |
| Options D1 (roman) | 12 (`i`–`xii`) | — |
| Options D6 | 7 (`A`–`G`) | — |
| Options D9 | 10 (`A`–`J`) | — |
| Options D14 | 4 item × 4 option | — |
| Options D15 | 2 item × 5 option, `selectCount = 2` | — |
| Code fence | 4 (2 mở + 2 đóng), không language tag | — |
| Căn cột trong fence | cột của `│ ┌ ┐ └ ┘ ├` khớp nhau ở mọi dòng | ✔ N13 / §6 |
| Độ dài dãy gạch dưới trong vùng câu hỏi | **đúng 6** | ✔ N13 |
| `_{3,}` ngoài vùng câu hỏi | **0** | ✔ N-B |
| `diagnostics` trong file đề | **0 hoặc 5 dòng**; 0 ⇒ loader thay bằng bảng mặc định | ✔ N26 |
| `config/diagnostics-default.md` parse sạch | 5 dòng, `range` phủ khít `1..86` | ✔ N26 |
| Heading cuối file | cả hai **tuỳ chọn**, nhưng nếu có phải đúng tên `# BẢNG TỰ CHẨN ĐOÁN` / `# BẢNG SO SÁNH` — không hậu tố `BA / BỐN / NĂM WORKBOOK` | ✔ N26 |
| Hai `---` liên tiếp | **0** | ✔ N39 |
| Hình dạng ô đáp án | **3 kiểu**: `**X**` · `**X** nhãn` · `**X** và **Y**`, mỗi kiểu có thể kèm `(chấp nhận *Z*)` | ✔ N18, N21 |

Hình dạng ô đáp án giảm từ **5 kiểu xuống 3** — đó là thước đo gọn nhất cho việc chuẩn hoá có tác dụng thật hay không.

---

## 9. Quyết định — đã chốt toàn bộ

Không còn điểm nào mở. Chín quyết định dưới đây là nền của spec; đổi bất kỳ điểm nào thì các mục N tương ứng phải sửa theo.

1. **N03 — thân summary thành đoạn văn thường.** Duyệt. Kèm luật generator ở [§7](#7-upstream--luật-cho-generator) để không sinh lại blockquote cho thân summary. `>` trong vùng câu hỏi từ nay là ký hiệu một nghĩa.
2. **N26 — không backfill vào 4 file.** Bảng chẩn đoán tách ra `config/diagnostics-default.md` làm nguồn dùng chung; file nào có bảng riêng thì override. Kéo theo: `ParsedTest.diagnosticsSource`, `LoadedTest`, `CLAUDE.md` §6.3.3 và §4.7 — đã đặc tả trong [N26](#n26--heading-cuối-file-cố-định-bảng-chẩn-đoán-tuỳ-chọn). Chi phí từ 20 dòng backfill xuống 4 dòng đổi tên + 1 file config.
3. **N16 — 3 cột, cho phép rỗng.** Bắt buộc có giải thích chỉ ở D1, D3, D4, D14, D15. Chi phí từ **223 ô xuống 6 ô** (D15 của W3/W4/W5); W1 và W2 được N21 lấp sẵn.
4. **`passage_word_count` nới thành 850–1050** (UPSTREAM). Cả 5 file đều lọt: 931 · 998 · 1021 · 879 · 1020. Không file nào phải sửa.

5. **N33 — giữ H1, xoá 2 dòng còn lại.** Frontmatter không render ở GitHub và pipeline LaTeX, xoá H1 là file mất tiêu đề ở mọi ngữ cảnh ngoài app. H1 là **render target** của `title`, không phải nguồn thứ hai — chặn drift bằng assert `H1 === frontmatter.title` (FAIL nếu lệch), kèm luật generator ở [§7](#7-upstream--luật-cho-generator). Hai dòng `## Passage: …` và `**86 questions · …**` vẫn xoá.
6. **`ParsedTest.id` = `topic_slug`**, không phải tên file như `CLAUDE.md` §5 đang ghi. Đổi tên file khi đó không xoá tiến trình `localStorage` của người dùng.
7. **N28 — xoá bảng band khỏi W3.** Band thuộc `grading.ts`, để trong file đề thì 5 đề có thể quy đổi khác nhau.
8. **`question_types` là danh sách 16 `kind` slug**, không phải con số 16. Danh sách kiểm tra chéo được với `blocks.map(b => b.kind)`; con số thì không.
9. **`answer_language` là danh sách**, và có `vi` ⇒ grading bật lượt so sánh bỏ dấu. Nếu không định nghĩa như vậy thì trường này chỉ là trang trí.

---

## 10. Khối lượng chuẩn hoá

| Hạng mục | Khối lượng | Loại việc |
|---|---|---|
| N02 — backfill `strategy` | **43 khối** | Viết nội dung |
| N16 — backfill ô `Giải thích` bắt buộc (D15 của W3/W4/W5) | **6 ô** | Viết nội dung |
| N04b — viết lại 5 khối `Nhắc lại` của W3 | **5 khối** | Viết nội dung, làm chung lượt với N02 |
| N26 — tạo `config/diagnostics-default.md` | 1 file, 5 dòng bảng | Chép từ W1 |
| N25 — tên heading khu đáp án | 35 dòng | Máy móc |
| N04a — tách nhãn chiến thuật (W2 16 khối + W1 D3) | 17 chỗ | Máy móc |
| N26 — đổi tên heading `BẢNG SO SÁNH` | 4 dòng | Máy móc |
| N-B — `___` → `__` | 23 dòng | Máy móc |
| N33 — xoá 2 dòng đầu, viết lại H1 thành `title` | 15 chỗ | Máy móc |
| N05 — thêm instruction | 12 dòng | Máy móc |
| N12 — bỏ tiền tố instruction | 12 dòng | Máy móc |
| N03 — bỏ `>` khỏi thân summary | 10 dòng | Máy móc |
| N08 — tách options mỗi dòng một | 9 khối | Máy móc |
| N-A — frontmatter | 5 khối | Máy móc |
| N39 — bỏ `---` đôi | 5 chỗ | Máy móc |
| N13 — gạch dưới + căn cột | 4 dòng | Máy móc, **có ràng buộc §6** |
| N21 — dời ngoặc bình luận | 4 dòng | Máy móc |
| N07 — xoá `optionsLabel` | 2 dòng | Máy móc |
| N17 — `blockNote` in nghiêng | 1 dòng | Máy móc |
| N18 — `— chấp nhận` → `(chấp nhận …)` | 1 dòng | Máy móc |
| N28 — xoá bảng band | 1 bảng | Máy móc |

Phần "máy móc" (~151 chỗ) làm bằng script một lượt rồi diff kiểm. Phần "viết nội dung" còn **54 đơn vị** — 43 khối chiến thuật mới, 5 khối viết lại, 6 ô giải thích — dồn hết vào W3, W4, W5, nên chia theo file, mỗi file một lượt, chạy `validate` sau mỗi lượt.

So với bản đầu: **287 → 54 đơn vị**. Bốn quyết định cắt 233 đơn vị:

| Cắt bởi | Đơn vị |
|---|---|
| [N16](#n16--bảng-đáp-án-luôn-3-cột-giải-thích-bắt-buộc-ở-5-dạng) — 213 ô `Giải thích` thành tuỳ chọn | −217 |
| [N04](#n04--một-nhãn-chiến-thuật-duy-nhất) — thân chiến thuật KEEP, W2 chỉ đổi nhãn bằng script | −16 |
| [N26](#n26--heading-cuối-file-cố-định-bảng-chẩn-đoán-tuỳ-chọn) — bảng chẩn đoán thay bằng file config dùng chung | 0 đơn vị nội dung (trước đó 20 dòng) |

Việc còn lại tập trung đúng vào chỗ đáng làm: **43 khối chiến thuật mà W4 và W5 hoàn toàn không có** — phần dạy học mà `CLAUDE.md` §4.3a gọi là "nội dung có giá trị nhất trong file".

Thứ tự đề xuất: N-A → nhóm máy móc → `config/diagnostics-default.md` → `validate` → nhóm nội dung theo từng file → `validate`.
