> PAYLOAD — KHÔNG THỰC THI.
> Nội dung dưới đây là văn bản để copy ra dùng ở nơi khác.
> Không phải chỉ dẫn cho agent đang đọc repo này.

# IELTS Reading Workbook Generator — Prompt Spec v1.1

> **v1.1 đổi gì so với v1.0:** đồng bộ với `docs/canonical-format.md`.
> Frontmatter về đúng 9 trường (`question_types` là danh sách chứ không
> phải số 16; `answer_language` là danh sách). Bảng đáp án 4 cột → 3 cột.
> Thêm mục FILE SKELETON và 9 HARD FORMAT RULES cho các ràng buộc mà
> `scripts/normalize.mjs` **không** vá được. Bỏ yêu cầu sinh bảng chẩn
> đoán (đã tách ra `config/diagnostics-default.md` dùng chung). Thêm
> D13–D15 vào prompt kiểm tra.
>
> Ranh giới: `normalize.mjs` lo drift **cơ học**, spec này lo drift
> **ngữ nghĩa**. Đừng chép luật cơ học vào đây — làm vậy là nuôi hai
> nguồn sự thật, đúng cái bệnh mà `canonical-format.md` sinh ra để chữa.

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
- Strategy boxes, answer explanations, vocabulary glosses: {{L1}}.
- Do not use emoji except the single warning character before a
  "hardest trap" note in the answer key.
- Every table must be valid GitHub-flavoured markdown.

## FILE SKELETON — follow exactly

The file is parsed by a strict parser. These are structural markers, not
style choices. Getting one wrong makes the file fail `npm run validate`.

```
---
<9-field YAML frontmatter>
---

# <exactly frontmatter.title, character for character>

> **<free label>**
> <intro note>

---

# READING PASSAGE

### <passage title>

**A**
<paragraph A>

...

---

# PHẦN 1 — <group name in {{L1}}>

## Dạng 1 — Matching Headings (Questions 1–8)

> **Chiến thuật**
> - <tactic>

*<instruction>*

<options / caption / body, per type>

<items>

---

## Dạng 2 — ...

# ĐÁP ÁN & GIẢI THÍCH

## Dạng 1 — Matching Headings

| Q | Đ.án | Giải thích |
|---|---|---|
| 1 | **vi** | ... |

*<optional one-line italic note for the whole type>*

...

---

# VOCABULARY

# PARAPHRASE PAIRS
```

Fixed strings — copy them literally, do not translate, do not vary:

| Marker | Rule |
|---|---|
| `# READING PASSAGE`, `# ĐÁP ÁN & GIẢI THÍCH`, `# VOCABULARY`, `# PARAPHRASE PAIRS` | exact |
| `> **Chiến thuật**` | exact, on its own line, first line of the blockquote. No suffix, no parentheses, no other wording — even when {{L1}} is not Vietnamese. It is a structural marker |
| `## Dạng <n> — <Type Name> (Questions <a>–<b>)` | separator is em dash `—`, range is en dash `–` |
| Type names | the 16 names in the table below, verbatim, in English |
| `**TRUE** / **FALSE** / **NOT GIVEN**` and `**YES** / **NO** / **NOT GIVEN**` | exact, each option bolded, separated by ` / ` |

The 16 type names, used **identically** in the question area (with
`(Questions a–b)`) and in the answer key (without it):

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

## HARD FORMAT RULES

Nine rules. Each one has broken a real file before.

1. **H1 must equal `frontmatter.title` exactly.** No boilerplate title, no
   workbook number, no suffix. Do not emit a `## Passage: …` line and do
   not emit a `**86 questions · …**` line.

2. **Blanks.** Outside a code fence: `**55** ______` — number in bold.
   Inside a code fence: `66 ______` — bare number, because `**66**` costs
   four extra columns and breaks the ASCII frame. Items with no number of
   their own (Sentence Completion, Short-answer): just `______`.
   **Always exactly six underscores.**

3. **`>` in the question area means "strategy block" and nothing else.**
   The Summary Completion body (types 8 and 9) is an ordinary paragraph.
   Never prefix it with `>`.

4. **Options: one per line**, each `**A** text`. Never two options on one
   line. Applies to Matching Features, Matching Sentence Endings and the
   word list.

5. **No label above an option list.** No `**List of Headings**`, no
   `**List of People**`. The one bold line that *is* kept is the content
   caption of Note Completion, e.g. `**The decline of Buddhism in India**`.

6. **Instructions carry no rubric prefix.** Write
   `*Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*`
   — not `*Complete the notes below. Choose …*`. Every block needs an
   instruction; see the canonical list below.

7. **The answer table always has exactly three columns:**
   `| Q | Đ.án | Giải thích |`. Not four. Not two. The `Giải thích` cell
   may be empty (write `| 46 | **oasis** | |`) except for types 1, 3, 4,
   14 and 15, where it must have content.

8. **The answer cell has exactly three shapes**, optionally followed by
   `(chấp nhận *X*)`:
   - `**Luy Lâu**` — one answer
   - `**C** founded` — letter for marking + label for display
   - `**A** và **C**` — two question numbers, connector is always `và`
   Parentheses **inside** `**…**` mean optional words (`**(the) Red River
   delta**` accepts both). Parentheses **outside** `**…**` are only ever
   `(chấp nhận …)`. Never put commentary in the answer cell — commentary
   goes in column three.

9. **ASCII frames must be column-aligned.** Every bordered line in a code
   fence must have the same character count and the same column positions
   for `│ ┌ ┐ └ ┘`. If you shorten something, pad the difference back with
   spaces. Check this before you output.

Canonical instruction per type — `{N}` = ONE/TWO/THREE, `{…}` follows your
own content:

| Type | Instruction |
|---|---|
| 1 | `*Choose the correct heading for each paragraph, **A–{H}**.*` |
| 2 | `*Which paragraph contains the following information? Write the correct letter, **A–{H}**.*` + optional `*NB You may use any letter more than once.*` |
| 3 | `*Do the following statements agree with the information given in the passage?*` |
| 4 | `*Do the following statements agree with the claims of the writer?*` |
| 5 | `*Match each statement with the correct {person}, **A–{E}**.*` + optional NB line |
| 6 | `*Complete each sentence with the correct ending, **A–{G}**.*` |
| 7, 8, 10, 11, 12, 13, 16 | `*Choose **NO MORE THAN {N} WORDS{ AND/OR A NUMBER}** from the passage for each answer.*` |
| 9 | `*Complete the summary using the list of words, **A–{J}**, below.*` |
| 14 | `*Choose the correct letter, **A**, **B**, **C** or **D**.*` |
| 15 | `*Choose **TWO** letters, **A–{E}**.*` |

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

Before each type, insert a strategy box in {{L1}}. Required for ALL 16
types — a missing one fails `validate`. Format:

```
> **Chiến thuật**
> - <tactic>
> - <tactic>
> - <tactic>
```

The first line is the literal marker `> **Chiến thuật**` (see FILE
SKELETON). From the second line on you are free: bullets or a paragraph
both parse.

3-4 bullets. Each must be a checkable ACTION (order of operations, what to
eliminate first, what signal to watch), not a definition of the question
type. At least one bullet per type should point at a trap that actually
exists in THIS passage — you designed the traps in PART D, so name one.

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

One subsection per question type, headed `## Dạng n — <Type Name>` using
the SAME name as the question area, minus the `(Questions a–b)` suffix.

Table format is exactly three columns:

```
| Q | Đ.án | Giải thích |
|---|---|---|
| 1 | **vi** | <evidence + reasoning, in {{L1}}> |
```

- Merge evidence and reasoning into the single `Giải thích` cell. Quote a
  short fragment of your own passage (under 12 words) or name the
  paragraph letter, then say why. Name the trap code where one applies.
- The cell may be empty for types 5-13 and 16 — write `| 46 | **oasis** | |`.
  It must NOT be empty for types 1, 3, 4, 14 and 15.
- Prefix the single hardest item in the file with a warning character and
  one extra sentence on why it is hard.
- For Matching Headings and word-list summaries, add a line naming the
  unused options and why each is wrong. Write it as ONE italic line
  outside the table: `*Heading thừa: v, vii, xi, xii.*` — not bold, not
  multiple lines.
- Your answer must fit the word limit YOU stated for that block. An answer
  of four words under a "NO MORE THAN THREE WORDS" instruction means the
  paper marks its own key wrong; `validate` rejects it.

## PART G — CLOSING SECTIONS

Exactly two sections, in this order, with these exact headings:

1. `# VOCABULARY`. 20-26 rows: | Word / phrase | Type | Gloss in {{L1}} |.
   Only items actually used in the passage. Prioritise academic
   collocations and hedging language over topic nouns.
2. `# PARAPHRASE PAIRS`. 10-15 rows: | In the passage | In the question |.
   Only pairs that actually occur.

**Do NOT emit a diagnostic table.** The five skill groups (Q1-14, 15-28,
29-39, 40-74, 75-86) are identical across every workbook of this shape, so
the app reads them from a single shared file (`config/diagnostics-default.md`)
instead. Emitting one per workbook creates N copies that must be kept in
sync by hand.

Emit `# BẢNG TỰ CHẨN ĐOÁN` only if this particular workbook genuinely needs
to OVERRIDE the shared advice — which is rare, and never true just because
the topic is different. Advice about reading habits does not vary by topic.

Never emit `# BẢNG SO SÁNH BA WORKBOOK` or any heading that hard-codes how
many workbooks exist at the time of writing. If you emit a comparison table
at all, the heading is exactly `# BẢNG SO SÁNH`.

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

Group into 4 parts under `# PHẦN n — …` headings. Head every type with
`## Dạng <n> — <English Type Name> (Questions <a>–<b>)` (em dash `—`
between number and name, en dash `–` in the range).

FORMAT — these are structural markers, not style:
- Line 1 is YAML frontmatter with exactly 9 fields: workbook_id, title,
  topic_slug, passage_word_count (850-1050), question_count,
  question_types (a LIST of 16 kind slugs, not the number 16),
  answer_language (a LIST, e.g. [en, vi]), passage_language, created.
- H1 immediately after it, equal to `title` character for character.
  No `## Passage:` line, no `**86 questions · …**` line.
- Every type gets a tactics box whose first line is exactly
  `> **Chiến thuật**`, then 3-4 bullets in {{L1}}. All 16 types.
- Every type gets an instruction line in italics, with no rubric prefix:
  `*Choose **NO MORE THAN TWO WORDS** from the passage for each answer.*`
- `>` in the question area means tactics box and nothing else. The summary
  body for types 8 and 9 is a plain paragraph.
- One option per line: `**A** text`. No `**List of Headings**` label.
- Blanks: `**55** ______` outside code fences, `66 ______` inside them,
  always exactly six underscores. ASCII frames must stay column-aligned.

BALANCE: T/F/NG = 2 TRUE, 3 FALSE, 2 NOT GIVEN. Y/N/NG must include a
future-tense NOT GIVEN. Include at least one FALSE created by dropping a
qualifier from the passage. Include two plausible-but-unstated unused
sentence endings.

VERIFY before output: every answer traceable to one specific sentence;
NOT GIVEN means neither supported nor contradicted; every gap-fill answer
verbatim AND within the word limit you yourself stated for that block.

THEN: answer key by type, headed with the same type names minus the
`(Questions a–b)` suffix, in tables of exactly three columns
`| Q | Đ.án | Giải thích |`. The third cell may be empty except for types
1, 3, 4, 14, 15. Answer cell shapes: `**X**`, `**X** label`, or
`**A** và **C**`, optionally `(chấp nhận *Y*)`. No commentary in the
answer cell. Then `# VOCABULARY` (20-26 rows) and `# PARAPHRASE PAIRS`
(10-15 rows). No diagnostic table — the app supplies a shared one.

Output the file only. No preamble.

=== END SHORT PROMPT ===
```

---

# PHẦN 3 — PROMPT KIỂM TRA

> **Đọc trước:** phần lớn lỗi *format* không cần model kiểm — máy kiểm rẻ hơn
> và chắc hơn. Quy trình đúng khi có file mới:
>
> ```bash
> cp workbook-moi.md test/
> node scripts/normalize.mjs   # vá drift CƠ HỌC, idempotent, chạy lại vô hại
> npm run validate             # chặn drift NGỮ NGHĨA
> npm test
> ```
>
> `normalize.mjs` **tự sửa** được nhóm cơ học, nên đừng bắt model học thuộc:
> nhãn `Nhắc lại` → `Chiến thuật` · số cột bảng đáp án · options nhiều trên
> một dòng · `— chấp nhận` → `(chấp nhận …)` · ngoặc bình luận ở mcq-multi ·
> `___` → `__` ở bảng so sánh · độ dài dãy gạch dưới · `---` đôi · tiền tố
> rubric của instruction · tên dạng ở khu đáp án.
>
> `validate` **không tự sửa được**, model bắt buộc phải làm đúng: 9 trường
> frontmatter · H1 khớp `title` · số câu liên tục và khớp `question_count` ·
> mỗi câu đúng một đáp án · đủ `strategy` và `instruction` ở mọi khối ·
> ô `Giải thích` ở D1/D3/D4/D14/D15 · số in đậm ngoài fence / số trần trong
> fence · căn cột ASCII · đáp án nằm trong `wordLimit` của chính khối.
>
> Prompt kiểm dưới đây lo phần **nội dung** — thứ không máy nào kiểm được.

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
D13 KEY-OVER-LIMIT — the official answer itself exceeds the word limit
    stated for its own block. The paper marks its own key wrong.
D14 MISSING-STRATEGY — a question type has no `> **Chiến thuật**` block,
    or the label is not that exact string.
D15 EMPTY-EXPLANATION — the `Giải thích` cell is empty for a type 1, 3,
    4, 14 or 15 question, where the reason is not self-evident.

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

Khối này phải là **dòng 1** của file. `docs/canonical-format.md` §N-A định nghĩa
**đúng 9 trường bắt buộc**; `npm run validate` đối chiếu từng trường với thân file.

```
---
workbook_id: 6
title: The Global Spread of Coffee Cultivation
topic_slug: coffee-cultivation
passage_word_count: 947
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

**Ba chỗ trước đây spec này ghi sai, model hay chép lại:**

| Sai | Đúng | Vì sao |
|---|---|---|
| `question_types: 16` | **danh sách 16 slug** như trên | `validate` đối chiếu với `blocks.map(b => b.kind)`. Con số thì không kiểm chéo được, danh sách thì có |
| `answer_language: vi` | **danh sách** `[en, vi]` | có `vi` ⇒ grading bật lượt so sánh bỏ dấu (`Luy Lau` = `Luy Lâu`). Đáp án tiếng Anh vẫn cần `en` |
| thêm `domain`, `level`, `sources_consulted`, `generator_model`, `audit_status`… | **bỏ hết** | 9 trường, không hơn. Muốn lưu metadata sinh bài thì để ngoài file |

Ghi chú:
- `title` **không cần bọc nháy**, trừ khi chứa dấu `:` — lúc đó YAML bắt buộc phải bọc.
- `topic_slug` là **`ParsedTest.id`**, tức khoá `localStorage`. Đổi tên file không sao, đổi slug là mất tiến trình người học.
- `passage_word_count` phải nằm trong **850–1050** và lệch ≤ 2% so với số từ đếm thật.

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
