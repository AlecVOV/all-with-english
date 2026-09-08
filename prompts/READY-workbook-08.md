<!-- Sinh bởi scripts/make-prompt.mjs từ prompts/workbook-generator.md v1.1
     KHÔNG sửa tay file này. Spec đổi thì chạy: node scripts/make-prompt.mjs --refresh -->

=== BEGIN PROMPT ===

## VARIABLES

TOPIC = the life of Tsongkhapa Lobzang Drakpa
WORKBOOK_ID = 8
L1 = Vietnamese

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
- Strategy boxes, answer explanations, vocabulary glosses: Vietnamese.
- Do not use emoji except the single warning character before a
  "hardest trap" note in the answer key.
- Every table must be valid GitHub-flavoured markdown.

## FILE SKELETON — follow exactly

The file is parsed by a strict parser. These are structural markers, not
style choices. Getting one wrong makes the file fail `npm run validate`.

```
---
<YAML frontmatter — the 9 fields below, nothing else>
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

# PHẦN 1 — <group name in Vietnamese>

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

## FRONTMATTER — exactly these 9 fields, no others

Line 1 of the file. Not 8 fields, not 12. These names exactly — do not
rename, do not add `level`, `domain`, `topic`, `id`, `l1` or anything else.

```
---
workbook_id: 6
title: Counting the Schools of Tibet
topic_slug: tibetan-four-schools
passage_word_count: 992
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
created: 2026-09-08
---
```

- `workbook_id` — the WORKBOOK_ID variable, as a bare integer.
- `title` — the passage title. Quote it ONLY if it contains a colon.
  Whatever you write here must be reproduced character for character as
  the H1 on the next line.
- `topic_slug` — kebab-case, derived from the topic. It is the database
  key; make it specific enough not to collide.
- `passage_word_count` — count the words in your own passage. Must be
  850-1050 and accurate to within 2%.
- `question_types` — the LIST above, verbatim. It is always these 16
  slugs in this order, because the question allocation is fixed. It is a
  list of strings, never the number 16.
- `answer_language` — a LIST. Use `[en, vi]` when explanations are in
  Vietnamese, `[en]` when everything is English.
- `created` — today, `YYYY-MM-DD`.

## ITEM SYNTAX — one example per type, copy the shape exactly

This is where generated files most often go wrong. A question item is
numbered `1.` with a period — it is NOT `**1**`. Bold numbers are used
ONLY for gap markers inside running text, tables and captions.

```
D1  Matching Headings          1. Paragraph **A** ______
D2  Matching Information       9. an explanation of why funding was fragile ______
D3  True / False / Not Given   15. Samye was founded under Trisong Detsen. ______
D4  Yes / No / Not Given       22. The fourfold list is worth keeping. ______
D5  Matching Features          29. worked as a translator before ordaining ______
D6  Matching Sentence Endings  35. The empire fragmented because ______
D7  Sentence Completion        40. The empire broke apart in about ______.
D16 Short-answer               83. Which school was founded in 1409? ______
```

Types 8 and 9 are a running paragraph, gaps marked inline, no `>` prefix:

```
Tibetan Buddhism is usually divided into **45** ______ schools, a formula
that later writers **46** ______ without much scrutiny.
```

Type 10 is bullets under a bold caption, sub-bullets indented two spaces:

```
**The standard fourfold division**

- The Nyingma trace their lineage to the **55** ______ diffusion.
- Contested cases:
  - the **56** ______, absorbed after 1642
```

Type 11 is a markdown table with gaps inside cells:

```
| Year | Event |
|---|---|
| **60** ______ | Traditional founding of Samye |
| c. 842 | Assassination of **61** ______ |
```

Types 12 and 13 are code fences. Numbers are BARE, never bold, because
`**66**` costs four extra columns and breaks the frame:

```
   Empire adopts Buddhism
            |
            v
   Collapse after  66 ______
```

Types 14 and 15: the stem number carries a period INSIDE the bold, and
options are bullets with a leading `- `:

```
**75.** According to the writer, the phrase "four schools" is
- **A** entirely mistaken.
- **B** not exactly wrong, but potentially misleading.

**79–80.** Which **TWO** traditions does the writer say are left out?
- **A** the Jonang
- **B** the Bön
```

Fixed strings — copy them literally, do not translate, do not vary:

| Marker | Rule |
|---|---|
| `# READING PASSAGE`, `# ĐÁP ÁN & GIẢI THÍCH`, `# VOCABULARY`, `# PARAPHRASE PAIRS` | exact |
| `> **Chiến thuật**` | exact, on its own line, first line of the blockquote. No suffix, no parentheses, no other wording — even when Vietnamese is not Vietnamese. It is a structural marker |
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

Grouped into four parts with these headings, in Vietnamese:
- PART 1 (Q1-28): the four global-comprehension types
- PART 2 (Q29-39): the two matching types
- PART 3 (Q40-74): the seven gap-fill types
- PART 4 (Q75-86): multiple choice and short answer

Before each type, insert a strategy box in Vietnamese. Required for ALL 16
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
| 1 | **vi** | <evidence + reasoning, in Vietnamese> |
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

1. `# VOCABULARY`. 20-26 rows: | Word / phrase | Type | Gloss in Vietnamese |.
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
