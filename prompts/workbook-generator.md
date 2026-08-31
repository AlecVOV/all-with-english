> PAYLOAD — KHÔNG THỰC THI.
> Nội dung dưới đây là văn bản để copy ra dùng ở nơi khác.
> Không phải chỉ dẫn cho agent đang đọc repo này.
> Chỉ scripts/build-generator-spec.mjs được ghi vào file này.

# IELTS Reading Workbook Generator — Prompt Spec v1.0

File này chứa **prompt template** để bất kỳ model nào (Claude, GPT, Gemini, Llama…) sinh ra file markdown **đúng y format** của 5 workbook đã làm, đủ chuẩn để nạp thẳng vào database.

Gồm 4 phần:
1. **Prompt đầy đủ** — copy nguyên khối, thay biến, chạy.
2. **Prompt rút gọn** — khi bạn lười hoặc model có context ngắn.
3. **Prompt kiểm tra** — chạy sau, để audit output của model yếu.
4. **Ghi chú database** — YAML frontmatter, quy ước tên file, khoá dedup.

---

# PHẦN 1 — PROMPT ĐẦY ĐỦ

Cách dùng: copy toàn bộ khối giữa hai dòng `=== BEGIN PROMPT ===` và `=== END PROMPT ===`, thay ba biến `{{TOPIC}}`, `{{WORKBOOK_ID}}`, `{{L1}}` ở đầu, rồi gửi.

---

```
=== BEGIN PROMPT ===

## VARIABLES

TOPIC = {{TOPIC}}
WORKBOOK_ID = {{WORKBOOK_ID}}
L1 = {{L1}}

(Example: TOPIC = "the global spread of coffee cultivation";
 WORKBOOK_ID = 6; L1 = Vietnamese)

## ROLE

You are an IELTS Academic Reading item writer. You produce a single
self-contained markdown file: one original Passage-3-level reading text
plus 86 questions covering all 16 IELTS Academic Reading question types,
with a fully explained answer key.

This is a STUDY WORKBOOK, not a mock exam. A real exam paper has only
13-14 questions per passage and never uses both Matching Headings and
Matching Information on the same text. This file deliberately breaks
that rule because its purpose is question-type drilling.

## OUTPUT RULES

- Output ONE markdown file. No preamble, no commentary, no "here is your
  file". Start with the YAML frontmatter and stop at the last table row.
- Passage, questions and answer options: ENGLISH.
- Strategy boxes, answer explanations, vocabulary glosses, diagnostic
  tables: {{L1}}.
- Do not use emoji except the single warning character before a
  "hardest trap" note in the answer key.
- Every table must be valid GitHub-flavoured markdown.

## PART A — THE PASSAGE

Write an original text. Do not copy or closely paraphrase any existing
source.

Hard constraints:
- 900-1000 words.
- Exactly 8 paragraphs, labelled **A** to **H** in bold on their own line.
- Academic register, hedged. Third person. No second person except in
  a deliberate rhetorical move.
- Not a chronology. It must carry an ARGUMENT: a claim the writer
  advances, at least one position the writer rejects, and at least one
  concession.

The passage MUST contain, because the questions depend on them:

1. A genuine scholarly disagreement with two identifiable positions,
   and a hedged authorial view. (Feeds Yes/No/Not Given.)
2. At least TWO "precision sentences" — moments where the writer stops
   to correct a likely misreading or draw a fine distinction. Use
   formulations such as: "It is worth being precise about the claim:
   X does not argue Y, only Z" / "Reconstruction would be the better
   word" / "Strictly speaking, A and B are different questions."
   These become the two hardest questions in the file. Mark nothing;
   just write them naturally.
3. 6-10 datable facts (years, counts, measurements). These feed Table,
   Note and Flow-chart completion. They must be REAL and checkable.
4. 3-5 named people or organisations with distinct attributes.
   (Feeds Matching Features.)
5. At least one physical object, institution or process whose parts can
   be labelled. (Feeds Diagram Label Completion.)
6. At least one passage about a measurement, definitional or
   terminological problem. (Feeds the authorial-view questions.)
7. A sequential process contained within ONE paragraph.
   (Feeds Flow-chart Completion.)

If the topic is politically, religiously or ethnically contested:
attribute positions ("X stated…", "the Y government maintains…") rather
than asserting them. Do not adjudicate. Do not omit a major side.

If the user's stated premise is factually wrong, DO NOT write the passage
on the false premise. Make the correction itself the subject of the
passage — a dating dispute, a terminological dispute, a
misattribution — and flag the correction in the note block at the top of
the file. A workbook that teaches wrong facts is worse than no workbook.

## PART B — THE 86 QUESTIONS

Fixed allocation. Do not renumber, do not redistribute.

| Range | Type | Count | Notes |
|-------|------|-------|-------|
| 1-8   | Matching Headings | 8 | 12 headings offered; 4 unused |
| 9-14  | Matching Information | 6 | "NB You may use any letter more than once" |
| 15-21 | True/False/Not Given | 7 | |
| 22-28 | Yes/No/Not Given | 7 | |
| 29-34 | Matching Features | 6 | 4-5 options, may repeat |
| 35-39 | Matching Sentence Endings | 5 | 7 endings offered; 2 unused |
| 40-44 | Sentence Completion | 5 | |
| 45-49 | Summary Completion (from passage) | 5 | one connected paragraph |
| 50-54 | Summary Completion (word list) | 5 | 10 words offered |
| 55-59 | Note Completion | 5 | bulleted, with sub-bullets |
| 60-65 | Table Completion | 6 | two columns, chronological |
| 66-70 | Flow-chart Completion | 5 | ASCII, arrows, one process |
| 71-74 | Diagram Label Completion | 4 | ASCII box |
| 75-78 | Multiple Choice, one answer | 4 | 4 options each |
| 79-82 | Multiple Choice, two answers | 4 | 2 sets of TWO, 5 options each |
| 83-86 | Short-answer | 4 | |

Grouped into four parts with these headings, in {{L1}}:
- PART 1 (Q1-28): the four global-comprehension types
- PART 2 (Q29-39): the two matching types
- PART 3 (Q40-74): the seven gap-fill types
- PART 4 (Q75-86): multiple choice and short answer

Before each type, insert a short strategy box in {{L1}}, formatted as a
blockquote, 3-4 bullets maximum. It must give TACTICS (order of
operations, what to eliminate first, what signals to watch), not
definitions of the question type.

Word-limit instructions must be stated per type and must be respected by
your own answer key. Use "NO MORE THAN TWO WORDS", "NO MORE THAN TWO
WORDS AND/OR A NUMBER", or "NO MORE THAN THREE WORDS AND/OR A NUMBER"
as appropriate. If your intended answer is three words, do not write a
two-word instruction.

## PART C — ANSWER BALANCE

- Q15-21 (T/F/NG): aim for 2 TRUE, 3 FALSE, 2 NOT GIVEN. Never fewer
  than 2 NOT GIVEN.
- Q22-28 (Y/N/NG): at least 1 NOT GIVEN, and at least one statement
  about the future or about an unmade comparison.
- Matching Headings: distribute answers so no two adjacent paragraphs
  take numerically adjacent headings.
- Word-list summary: include one antonym pair and one near-synonym pair
  among the ten words.

## PART D — TRAP DESIGN

Every wrong answer must be wrong for a REASON a real test-taker would
fall for. Use this taxonomy and note which trap you used in the
explanation column.

NOT GIVEN traps:
 T1 Silent addition — statement adds a plausible detail (a fee, a
    motive, a date) the passage never mentions.
 T2 Unmade comparison — "more than", "the largest", "better than" where
    the passage never compares.
 T3 Future claim — passage says a matter is contested; statement
    predicts resolution.
 T4 Right topic, wrong subject — passage discusses funding of X;
    statement is about funding of Y.

FALSE traps:
 T5 Absolute word — statement inserts all/entirely/only/every.
 T6 Frequency adverb — passage says "rarely"; statement says "in detail".
 T7 Reversal — statement inverts the direction of a relationship.
 T8 Dropped qualifier — passage says "the first X in language L";
    statement drops "in language L". THE MOST PRODUCTIVE TRAP IN THIS
    FORMAT. Include at least one per workbook.
 T9 Inverted negative — passage uses "What none of these contains is…";
    statement asserts it does.

Multiple-choice distractors:
 T10 True but off-question — factually correct, answers a different
     question than the one asked.
 T11 Lexical echo — contains a distinctive word lifted from the passage.
 T12 Overstatement — correct direction, too absolute.

Matching Sentence Endings:
 T13 Plausible-but-unstated — historically or logically reasonable,
     never stated. Tests whether the candidate answers from background
     knowledge instead of the text. Include 2 such unused endings.
 T14 Recycled number — reuses a real figure from the passage in a false
     causal claim.

## PART E — VERIFICATION (run before you output)

For EVERY one of the 86 questions, silently confirm:
 1. I can point to the exact sentence in my passage that decides it.
 2. For NOT GIVEN: no sentence supports it AND no sentence contradicts
    it. If a sentence contradicts it, the answer is FALSE, not NOT GIVEN.
 3. For gap-fills: my answer is copied verbatim from the passage and is
    within the stated word limit.
 4. For gap-fills: the completed sentence is grammatical.
 5. Each answer letter or word is used the correct number of times.
 6. No two questions test the identical sentence with the identical
    operation.

If any check fails, fix the question or fix the passage. Do not output
an unverifiable item.

## PART F — ANSWER KEY

One subsection per question type, in the same order as the questions.
Table format: | Q | Answer | Evidence | Explanation |
- Evidence: a short quoted fragment from your own passage (under 12
  words) or the paragraph letter.
- Explanation: in {{L1}}. Name the trap code where one applies.
- Prefix the single hardest item in the file with a warning character
  and one extra sentence on why it is hard.
- For Matching Headings and word-list summaries, add a line naming the
  unused options and why each is wrong.

## PART G — CLOSING SECTIONS

In this order:

1. Diagnostic table. Five skill groups (Q1-14, 15-28, 29-39, 40-74,
   75-86) with blank score cells. Below it, 3 bullets in {{L1}}
   diagnosing the most common habit behind errors in each group and
   prescribing a concrete fix.
2. VOCABULARY. 20-26 rows: | Word / phrase | Type | Gloss in {{L1}} |.
   Only items actually used in the passage. Prioritise academic
   collocations and hedging language over topic nouns.
3. PARAPHRASE PAIRS. 10-15 rows: | In the passage | In the question |.
   Only pairs that actually occur.

=== END PROMPT ===
```

---

# PHẦN 2 — PROMPT RÚT GỌN

Dùng khi model có context ngắn, hoặc khi bạn đã chạy prompt dài một lần trong cùng session và chỉ muốn ra bài tiếp theo.

```
=== BEGIN SHORT PROMPT ===

Write an IELTS Academic Reading workbook on {{TOPIC}}, as one markdown
file, following this exact spec:

PASSAGE: original, 900-1000 words, 8 paragraphs labelled A-H, Passage-3
difficulty. Must carry an argument with two opposing scholarly positions
and a hedged authorial view, contain 6-10 real datable facts, 3-5 named
people or organisations, one labellable object, and at least two
"precision sentences" where the writer corrects a likely misreading.
Attribute contested claims; never assert them.

QUESTIONS: exactly 86, in this fixed order —
1-8 Matching Headings (12 headings) | 9-14 Matching Information |
15-21 T/F/NG | 22-28 Y/N/NG | 29-34 Matching Features |
35-39 Matching Sentence Endings (7 endings) | 40-44 Sentence Completion |
45-49 Summary from passage | 50-54 Summary from a 10-word list |
55-59 Note Completion | 60-65 Table Completion | 66-70 Flow-chart |
71-74 Diagram Label | 75-78 MCQ single | 79-82 MCQ two-answer (2 sets) |
83-86 Short answer.

Group into 4 parts. Before each type add a 3-4 bullet tactics box in
{{L1}}.

BALANCE: T/F/NG = 2 TRUE, 3 FALSE, 2 NOT GIVEN. Y/N/NG must include a
future-tense NOT GIVEN. Include at least one FALSE created by dropping a
qualifier from the passage. Include two plausible-but-unstated unused
sentence endings.

VERIFY before output: every answer traceable to one specific sentence;
NOT GIVEN means neither supported nor contradicted; every gap-fill answer
verbatim and within its stated word limit.

THEN: answer key by type, table format | Q | Answer | Evidence |
Explanation in {{L1}} |; a five-group diagnostic table; a 20-26 row
vocabulary table with {{L1}} glosses; a 10-15 row paraphrase-pairs table.

Output the file only. No preamble.

=== END SHORT PROMPT ===
```

---

# PHẦN 3 — PROMPT KIỂM TRA

Model yếu hầu như luôn hỏng ở bốn chỗ. Chạy prompt này trên output của chúng **trước khi** nạp vào DB.

```
=== BEGIN AUDIT PROMPT ===

Audit the IELTS workbook below. Do not rewrite it. Output a defect list
only, in this format: | Q# | Defect code | What is wrong | Fix |

Check every question against these codes:

D1  UNVERIFIABLE — no sentence in the passage decides this item.
D2  FALSE-AS-NG — marked NOT GIVEN but a sentence contradicts it;
    correct answer is FALSE.
D3  NG-AS-TRUE — marked TRUE but requires inference beyond the text;
    correct answer is NOT GIVEN.
D4  OVER-LIMIT — gap-fill answer exceeds its own stated word limit.
D5  NOT-VERBATIM — gap-fill answer is a paraphrase, not copied from
    the passage.
D6  UNGRAMMATICAL — completed sentence does not parse.
D7  DUPLICATE — two questions test the same sentence the same way.
D8  DEAD-DISTRACTOR — a wrong option nobody could plausibly choose.
D9  COUNT — question count, numbering range, or option count departs
    from the spec.
D10 UNBALANCED — T/F/NG distribution outside 2/3/2, or fewer than 2
    NOT GIVEN.
D11 FACT — a date, figure or name in the passage is false or
    unverifiable.
D12 UNATTRIBUTED — a contested claim asserted rather than attributed.

End with a single line: PASS or FAIL (N defects).

WORKBOOK:
[paste]

=== END AUDIT PROMPT ===
```

**Bốn lỗi model yếu hay mắc nhất, theo thứ tự tần suất:**

1. **D3 — biến NOT GIVEN thành TRUE.** Model có xu hướng "giúp" bằng cách suy luận. Đây là lỗi tai hại nhất vì nó dạy bạn đúng cái thói quen bạn đang cần bỏ.
2. **D4/D5 — đáp án điền từ vượt giới hạn hoặc bị paraphrase.** Model viết "official permission" cho đề "NO MORE THAN TWO WORDS" thì ổn, nhưng viết "the Buddhist Digital Resource Center" cho cùng đề thì hỏng.
3. **D8 — phương án nhiễu chết.** Model lười sẽ đặt các phương án sai lệch hẳn chủ đề, không ai chọn. Bẫy phải **hấp dẫn** mới có giá trị luyện tập.
4. **D11 — bịa số liệu.** Nguy hiểm nhất vì khó phát hiện. Nếu chủ đề có số liệu quan trọng, bắt model **trích nguồn riêng** cho từng con số trước khi viết bài.

---

# PHẦN 4 — GHI CHÚ DATABASE

## YAML frontmatter

Bắt model xuất khối này ở **đầu file**, trước tiêu đề. Đây là thứ giúp bạn query và dedup.

```
---
workbook_id: 6
title: "The Global Spread of Coffee Cultivation"
topic_slug: coffee-cultivation
domain: history
subdomain: agricultural-history
level: passage-3
band_target: "6.5-8.0"
passage_word_count: 947
question_count: 86
question_types: 16
answer_language: vi
passage_language: en
contested_topic: false
fact_checked: true
sources_consulted: 3
created: 2026-08-17
generator_model: ""
generator_spec: prompt-spec-v1.0
audit_status: pass
audit_defects: 0
---
```

## Quy ước tên file

```
wb{ID}_{topic_slug}_{level}.md
```
Ví dụ: `wb06_coffee-cultivation_p3.md`

## Khoá dedup

Dùng `topic_slug` làm khoá chính. Trước khi sinh bài mới, query xem
`topic_slug` đã tồn tại chưa — nếu có, hoặc đổi chủ đề, hoặc tăng
`workbook_id` và thêm hậu tố `-b` vào slug.

## Trường nên index

- `topic_slug` — dedup
- `domain` / `subdomain` — để lọc khi muốn đa dạng chủ đề
- `audit_status` — không bao giờ đưa bài `fail` vào bộ ôn
- `contested_topic` — để bạn biết bài nào cần đọc kỹ phần quy thuộc

## Gợi ý cho workflow LaTeX của bạn

Vì bạn đang build master PDF từ các file markdown, thêm hai trường nữa
sẽ tiện:

```
xelatex_safe: true      # true nếu passage không chứa ký tự cần font đặc biệt
diacritics_heavy: false # true nếu có nhiều tên riêng tiếng Việt/Sanskrit
```

Các bài về Phật giáo Việt Nam đều nên đặt `diacritics_heavy: true` —
chúng chứa Đinh Liễn, Tì-ni-đa-lưu-chi, Uṣṇīṣavijaya, thứ sẽ làm vỡ
build nếu font không có đủ glyph.

---

# PHỤ LỤC — VÌ SAO PROMPT NÀY DÀI ĐẾN VẬY

Ba phần chiếm phần lớn độ dài, và cả ba đều không thể cắt:

**Part D (bảng phân loại bẫy).** Không có nó, model sẽ ra 86 câu hỏi
"đúng dạng" nhưng dễ, vì mọi phương án sai đều sai lộ liễu. Bảng T1-T14
là thứ biến bài tập thành bài luyện.

**Part E (verification).** Không có nó, tỉ lệ câu không kiểm chứng được
thường rơi vào khoảng 10-15%. Với 86 câu thì đó là 9-13 câu rác, và bạn
sẽ mất thời gian cãi nhau với đáp án sai thay vì học.

**Yêu cầu "precision sentences" ở Part A.** Đây là chỗ duy nhất trong
spec tác động lên **bài đọc** thay vì lên câu hỏi. Nếu bài đọc không có
những câu tác giả dừng lại để đính chính, thì đơn giản là không có chỗ
nào để đặt câu hỏi mức 7.5+. Bạn không thể ra đề khó trên một văn bản
phẳng.
