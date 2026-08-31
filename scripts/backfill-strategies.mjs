#!/usr/bin/env node
/**
 * scripts/backfill-strategies.mjs — N02 + N04b, phần viết nội dung của C3.
 *
 * Bổ sung khối `> **Chiến thuật**` cho mọi khối còn thiếu, và viết lại 5 khối
 * `Nhắc lại` một dòng của W3 (N04b) cho ngang tầm 11 khối mới của cùng file.
 *
 * KHÔNG đụng W1 và W2: 16 khối của W1 là chuẩn mực chất lượng, 16 khối inline
 * của W2 đã đủ nội dung và chỉ sai nhãn — N04a đã sửa nhãn rồi
 * (docs/canonical-format.md §N04: "Không đụng vào W2 ở phần này").
 *
 * Yêu cầu nội dung (§N02): tối thiểu 3 bullet, mỗi bullet là một **hành vi làm
 * bài kiểm chứng được**, không phải khẩu hiệu. Chỗ nào bài có bẫy thật thì
 * bullet phải trỏ vào đúng bẫy đó — nguồn là cột Giải thích và blockNote của
 * chính file ấy.
 *
 * Chạy:  node scripts/backfill-strategies.mjs [--dry-run] [--force]
 *        --force ghi đè cả khối đã có (dùng cho N04b của W3)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DIR = path.join(ROOT, 'test');
const DRY = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

/* ================================================================== *
 * W3 — ielts_reading_vietnam_buddhism.md
 * Chủ đề: niên đại Mật tông ở Việt Nam. Bẫy đặc trưng của bài:
 *   · câu phủ định đảo "What none of these early sources contains is…"
 *   · đuôi F/G nghe hợp lý theo kiến thức nền nhưng bài không nói
 *   · hai mốc sát nhau 1293 (thoái vị) / 1299 (thọ giới)
 *   · lẫn "Phật giáo" với "Mật tông" — chính cái nhầm mà bài đang phê phán
 * ================================================================== */
const W3 = {
  1: [
    'Đọc **câu đầu và câu cuối** mỗi đoạn trước; ý chính của đoạn học thuật thường nằm ở một trong hai chỗ đó.',
    'Heading là **ý bao trùm cả đoạn**. Nếu nó chỉ đúng với một câu trong đoạn thì đó là bẫy chi tiết, không phải đáp án.',
    'Bài này có 12 heading cho 8 đoạn, thừa 4. Đừng hoảng khi thấy hai heading na ná — chọn cái khớp **phạm vi** của đoạn, không phải cái chứa từ giống bài.',
    'Bài xoay quanh một **tranh luận niên đại**. Đoạn nào nêu quan điểm, đoạn nào nêu bằng chứng bác lại — phân biệt được hai loại đó là xong nửa dạng này.',
  ],
  2: [
    'Khác Matching Headings: ở đây bạn tìm **một chi tiết cụ thể**, chi tiết ấy có thể nằm giữa đoạn chứ không ở câu chủ đề.',
    'Gạch chân **danh từ cụ thể** trong câu hỏi (một cột kinh, một cuộc khai quật, một niên đại) rồi mới scan.',
    'Đọc dòng "NB You may use any letter more than once" — có đoạn được dùng lại, đừng loại đoạn đã chọn.',
    'Đây là dạng **tốn thời gian nhất**. Nếu đang bấm giờ, để nó lại làm sau cùng.',
  ],
  3: [
    '**TRUE** = bài xác nhận. **FALSE** = bài nói ngược. **NOT GIVEN** = bài không đề cập. Không có ô thứ tư cho "chắc là vậy".',
    'Trước khi chọn TRUE, ép mình **chỉ ra một dòng cụ thể** trong bài. Chỉ không ra được → NOT GIVEN.',
    'Bài này dùng **câu phủ định đảo**: *"What none of these early sources contains is any account of initiation…"*. Đọc lướt cấu trúc đó là hiểu ngược hoàn toàn. Gặp `none / neither / nothing` đứng đầu mệnh đề thì đọc chậm lại một nhịp.',
    'Soi từ tuyệt đối (*all, entirely, only*) và so sánh hơn — chúng gần như luôn là chỗ đề bẻ TRUE thành FALSE.',
  ],
  4: [
    'Dạng này hỏi **quan điểm tác giả**, không hỏi sự thật khách quan như T/F/NG.',
    'Phân biệt "tác giả nói" với "tác giả **thuật lại** người khác nói". Bài dẫn nhiều quan điểm học giả — quan điểm của họ không phải quan điểm tác giả.',
    'Mệnh đề về **tương lai** hoặc về điều tác giả chưa hề bàn tới → cảnh giác NOT GIVEN.',
    'Chú ý các động từ đánh giá (*complicate, overstate, misdescribe*) — đó là chỗ tác giả lộ lập trường.',
  ],
  5: [
    'Scan **tên riêng trước**, đọc câu hỏi sau. Tên riêng là mỏ neo rẻ nhất trong cả bài.',
    'Câu hỏi dạng này **không theo thứ tự bài đọc** — đừng giả định câu 30 nằm sau câu 29 trong văn bản.',
    'Bài có 5 nhân vật (A–E) cho 6 câu, nên **ít nhất một tên phải dùng lại**. Đọc dòng NB rồi mới bắt đầu.',
    'Bẫy: một nhân vật được nhắc ở nhiều đoạn. Khớp đúng **hành động** trong câu hỏi, không khớp mỗi cái tên.',
  ],
  6: [
    'Kiểm tra **ngữ pháp trước khi kiểm tra nghĩa**: chủ ngữ, thì, số ít/số nhiều. Thường loại được 2–3 đuôi ngay lập tức.',
    'Câu hỏi dạng này **theo thứ tự bài đọc** — đã làm tới câu 37 thì đáp án nằm sau chỗ của câu 36.',
    'Bẫy chủ lực của bài này: đuôi **F** và **G** nghe rất hợp lý về mặt lịch sử nhưng bài **không hề nói**. Nếu bạn chọn chúng, nguyên nhân là bạn đang trả lời bằng kiến thức nền chứ không bằng văn bản.',
    'Đuôi đúng sự thật nhưng gắn **sai nguyên nhân** vẫn là sai. Đọc kỹ chữ "because".',
  ],
  7: [
    '**Lấy đúng từ trong bài**, không đổi dạng, không thay bằng từ đồng nghĩa của riêng bạn.',
    'Đếm chữ nghiêm ngặt. "NO MORE THAN TWO WORDS" → 3 từ là 0 điểm dù nghĩa đúng hoàn toàn.',
    'Đoán **loại từ** cần điền (danh/động/tính) từ ngữ pháp câu, rồi mới scan. Việc này thu hẹp vùng tìm rất nhanh.',
    'Đề cho phép "AND/OR A NUMBER" thì năm và thế kỷ là đáp án hợp lệ — bài này nhiều niên đại, đừng bỏ qua chúng.',
  ],
  8: [
    'Đọc **toàn bộ summary** một lượt trước khi điền ô đầu tiên, để nắm mạch lập luận.',
    'Summary chỉ tóm 2–3 đoạn. Xác định đúng vùng đó trước, đừng scan cả bài cho mỗi chỗ trống.',
    'Ngữ pháp phải khớp: chỗ trống sau "a/an" → danh từ số ít; sau giới từ → danh từ, không phải động từ.',
    'Bẫy có thật ở câu 48: bài viết *"Protective spells, known as dhāraṇī"*. Chỗ trống đứng **sau** chữ "protective" nên phải điền **spells**, không phải *dhāraṇī*. Luôn đọc lại cả cụm sau khi điền.',
  ],
  9: [
    'Dạng này dễ hơn dạng trên vì đáp án có sẵn — nhưng đổi lại, bẫy đồng nghĩa dày hơn.',
    'Loại phương án bằng **từ loại** trước khi xét nghĩa. Danh sách 10 từ thường chỉ có 3–4 từ đúng từ loại cho mỗi ô.',
    'Từ trong danh sách thường **không** trùng từ trong bài — phải nhận ra paraphrase, đừng tìm từ y hệt.',
    'Ở bài này, phần lớn từ thừa là **phản nghĩa** của đáp án đúng (destroyed / undated / abandoned / minor). Chọn nhầm nhóm đó nghĩa là bạn chưa đối chiếu lại với bài, không phải chưa biết từ.',
  ],
  10: [
    'Notes gần như luôn bám sát **một đoạn duy nhất** và đi đúng thứ tự đoạn đó. Tìm được đoạn là xong 80%.',
    'Chú ý bullet **lồng nhau**: cấp con là chi tiết của cấp cha, không phải một ý ngang hàng. Đọc theo cấu trúc, đừng đọc phẳng.',
    'Tiêu đề in đậm phía trên notes cho biết cả khối nói về cái gì — dùng nó để chốt vùng.',
    'Đề cho phép "A NUMBER" thì thế kỷ và năm là đáp án hợp lệ.',
  ],
  11: [
    'Đọc **tiêu đề cột** trước tiên — nó cho biết loại thông tin cần điền (năm / người / nơi chốn), và đó là bộ lọc mạnh nhất.',
    'Bảng gần như luôn theo **thứ tự thời gian**, nên bạn khoanh vùng được rất nhanh.',
    'Chép **y nguyên** tên riêng và con số, kể cả dấu tiếng Việt (Luy Lâu, Đinh Liễn).',
    'Bẫy tinh của bài này ở câu 65: đoạn G có **hai mốc sát nhau** — 1293 (thoái vị) và 1299 (thọ giới). Đề hỏi *ordained* nên đáp án là 1299. Khi thấy hai năm gần nhau trong một đoạn, đọc kỹ động từ trong câu hỏi.',
  ],
  12: [
    'Flow-chart mô tả **một quá trình theo trình tự**. Việc đầu tiên là tìm đoạn nào kể quá trình đó.',
    'Mũi tên = quan hệ nhân quả hoặc thời gian, nên từ cần điền thường là **kết quả** của bước ngay trước.',
    'Đọc hết cả sơ đồ rồi mới điền ô đầu — ô sau thường tiết lộ ô trước.',
    'Cảnh báo riêng cho bài này: câu 70 **không có sẵn nguyên văn** ở một chỗ. Bạn phải rút ra từ "chronologically impossible" và "divided by roughly eight centuries". Đề thật hiếm khi làm vậy, nhưng khi gặp thì đừng cố tìm một từ chép được.',
  ],
  13: [
    'Xác định **hướng đọc** của sơ đồ trước (trên→dưới hay trái→phải) — thứ tự nhãn thường **không** theo thứ tự bài.',
    'Nhãn cần điền hầu như luôn là **danh từ cụ thể**: tên vật, tên nơi, con số.',
    'Dùng các nhãn **đã điền sẵn** làm mỏ neo để định vị đoạn tương ứng, rồi đọc quanh đó.',
    'Giữ nguyên chính tả và dấu của tên riêng khi chép vào.',
  ],
  14: [
    'Đọc **câu hỏi trước**, che phương án lại, tự trả lời bằng bài, rồi mới mở phương án ra so.',
    'Bẫy số 1: phương án **đúng sự thật nhưng không trả lời câu được hỏi**.',
    'Bẫy số 2: phương án chứa từ **y hệt** trong bài — đó thường là mồi nhử, không phải đáp án.',
    'Bẫy hay nhất của bài này ở câu 75: phương án C nói Phật giáo đến muộn hơn, nhưng bài nói **Mật tông** đến muộn hơn. Nhầm hai thứ đó là rơi đúng vào cái nhầm mà cả bài đang phê phán. Luôn hỏi lại: bài đang nói về **cái nào** trong hai khái niệm?',
  ],
  15: [
    'Hai chữ cái = **hai câu trả lời riêng**, mỗi cái 1 điểm. Thứ tự không quan trọng, nên đúng một cái vẫn được điểm.',
    'Loại nhanh phương án **không hề xuất hiện** trong bài — thường có ít nhất một cái như vậy trong năm.',
    'Đề chỉ định đoạn nào thì chỉ tìm trong đoạn đó. Phương án đúng nội dung nhưng nằm ở **đoạn khác** vẫn là sai.',
    'Ở bài này, E của câu 81–82 sai rõ vì bài đã dẫn hẳn kết quả khai quật 1963–1987. Khi một phương án nghe hợp lý, hãy kiểm tra xem bài có **bác nó ở đoạn trước** không.',
  ],
  16: [
    'Trả lời bằng **từ lấy nguyên trong bài**, không viết câu hoàn chỉnh.',
    'Từ để hỏi quyết định loại đáp án: *Where* → nơi chốn; *What kind of* → cụm danh từ; *How many* → số.',
    'Mạo từ (a/the) **có tính** vào giới hạn số từ ở nhiều đề — viết ngắn nhất có thể mà vẫn đủ nghĩa.',
    'Câu hỏi theo thứ tự bài, nên bốn câu cuối này thường rơi vào 2–3 đoạn cuối.',
  ],
};

/* ================================================================== *
 * W4 — ielts_reading_theravada_vietnam.md
 * Chủ đề: Theravāda ở Việt Nam là HAI cộng đồng gần như không liên quan
 * (Khmer Krom rất cổ / Nam tông Kinh chỉ từ thế kỷ XX). Bẫy đặc trưng:
 *   · bỏ ba chữ "in Vietnamese" là câu đổi hẳn đúng/sai (câu 19)
 *   · đuôi F tái sử dụng năm 1981 CÓ THẬT trong bài để làm mồi
 *   · word list cài sẵn cặp phản nghĩa A/B và I/J
 * ================================================================== */
const W4 = {
  1: [
    'Đọc **câu đầu và câu cuối** mỗi đoạn; ý chính nằm ở đó trong gần như mọi đoạn học thuật.',
    'Heading phải bao được **cả đoạn**. Heading chỉ đúng với một câu là bẫy chi tiết.',
    'Thừa 4 heading trên 12. Khi hai heading na ná nhau, chọn cái khớp **phạm vi**, không chọn cái chứa từ giống bài.',
    'Bài này kể **hai lịch sử song song**. Trước khi ghép, tự hỏi mỗi đoạn đang nói về nhánh Khmer hay nhánh Kinh — nhiều heading phân biệt đúng ở chỗ đó.',
  ],
  2: [
    'Tìm **một chi tiết cụ thể**, không phải ý chính; chi tiết ấy hay nằm giữa đoạn.',
    'Gạch chân **danh từ cụ thể** trong câu hỏi (một nghề nghiệp, một tổ chức, một năm) rồi mới scan.',
    'Đọc dòng NB: có đoạn dùng được nhiều lần, đừng gạch bỏ đoạn đã chọn.',
    'Dạng tốn thời gian nhất — nếu đang bấm giờ thì để sau cùng.',
  ],
  3: [
    '**TRUE** = bài xác nhận. **FALSE** = bài nói ngược. **NOT GIVEN** = bài im lặng. "Nghe hợp lý" không phải TRUE.',
    'Ép mình chỉ ra **một dòng cụ thể** trước khi chọn TRUE. Không chỉ ra được → NOT GIVEN.',
    'Bẫy quan trọng nhất của cả bài ở câu 19: bài nói Bửu Quang là chùa Theravāda **dạy bằng tiếng Việt** đầu tiên; đề bỏ đi ba chữ "in Vietnamese" và câu lập tức thành sai, vì chùa Khmer đã có từ nhiều thế kỷ trước. Khi câu hỏi có cụm "đầu tiên", hãy soi xem bài giới hạn nó **trong phạm vi nào**.',
    'Soi từ tuyệt đối (*all, only, entirely*), so sánh hơn, và mọi mốc thời gian.',
  ],
  4: [
    'Hỏi **quan điểm tác giả**, không hỏi sự thật.',
    'Phân biệt "tác giả nói" và "tác giả thuật lại người khác nói".',
    'Mệnh đề về tương lai, hoặc về điều tác giả chưa bàn → cảnh giác NOT GIVEN.',
    'Chú ý chỗ tác giả **đính chính một cách gọi** — đó thường là nơi lập trường lộ ra rõ nhất, và cũng là nơi ra đề.',
  ],
  5: [
    'Scan **tên riêng trước**, đọc câu hỏi sau.',
    'Câu hỏi **không theo thứ tự bài** — đừng giả định thứ tự.',
    'Ở đây chỉ có 4 lựa chọn (A–D) cho 6 câu, nên **chắc chắn có tên dùng lại**. Đọc dòng NB trước khi bắt đầu.',
    'Một trong bốn lựa chọn là **một cộng đồng**, không phải một cá nhân. Đừng loại nó chỉ vì câu hỏi nghe như đang tả một người.',
  ],
  6: [
    'Kiểm tra **ngữ pháp trước**: chủ ngữ, thì, số. Loại được 2–3 đuôi trước khi cần hiểu nghĩa.',
    'Câu hỏi **theo thứ tự bài đọc**.',
    'Bẫy nguy hiểm nhất ở đây là đuôi **F**: nó tái sử dụng năm **1981 có thật trong bài** để làm mồi, nhưng bài không hề nói nhà nước thúc đẩy Theravāda. Một con số có thật không bảo chứng cho mệnh đề chứa nó.',
    'Đuôi đúng sự thật nhưng gắn sai nguyên nhân vẫn sai. Chữ "because" là chỗ quyết định.',
  ],
  7: [
    'Chép **đúng từ trong bài**, không đổi dạng từ.',
    'Đếm chữ nghiêm ngặt — vượt giới hạn là 0 điểm dù đúng nghĩa.',
    'Đoán **loại từ** cần điền trước khi scan.',
    'Bài nhiều năm và số liệu; nếu đề cho "AND/OR A NUMBER" thì đó thường chính là đáp án.',
  ],
  8: [
    'Đọc hết summary trước khi điền ô nào.',
    'Xác định **vùng đoạn** mà summary đang tóm, rồi mới scan trong vùng đó.',
    'Kiểm tra ngữ pháp chỗ trống: mạo từ phía trước, giới từ phía sau đều là manh mối về từ loại.',
    'Summary của bài này tóm phần lập luận về **cách gọi tên**; chú ý các từ mang sắc thái đánh giá, chúng thường là chỗ trống.',
  ],
  9: [
    'Loại phương án bằng **từ loại** trước khi xét nghĩa.',
    'Từ trong danh sách là **paraphrase**, thường không trùng từ trong bài.',
    'Danh sách này cài sẵn **hai cặp phản nghĩa** (A/B và I/J). Nếu bạn đang phân vân giữa hai từ trái nghĩa nhau thì vấn đề là chưa đọc kỹ câu, không phải chưa biết từ — quay lại đọc lại mệnh đề.',
    'Điền xong đọc lại cả đoạn summary một lượt; một từ sai thường làm mạch lập luận gãy rõ ràng.',
  ],
  10: [
    'Notes bám sát **một đoạn** và theo đúng thứ tự đoạn đó.',
    'Chú ý bullet lồng nhau — cấp con là chi tiết của cấp cha.',
    'Tiêu đề in đậm phía trên cho biết khối notes nói về cái gì; dùng nó chốt vùng.',
    'Ở bài này notes hay là **danh sách mốc thời gian**; đọc theo trục thời gian sẽ nhanh hơn đọc theo thứ tự câu hỏi.',
  ],
  11: [
    'Đọc **tiêu đề cột** trước — nó nói cho bạn biết cần điền loại thông tin gì.',
    'Bảng theo **thứ tự thời gian**, nên khoanh vùng rất nhanh.',
    'Chép y nguyên tên riêng và con số, giữ đủ dấu tiếng Việt.',
    'Khi hai dòng có năm gần nhau, đọc kỹ động từ ở cột kia để không lấy nhầm dòng.',
  ],
  12: [
    'Flow-chart là **một quá trình theo trình tự** — tìm đoạn kể quá trình đó trước.',
    'Mũi tên = nhân quả hoặc thời gian; từ cần điền thường là **kết quả** của bước trước.',
    'Đọc cả sơ đồ trước khi điền ô đầu tiên.',
    'Giữ đúng số từ cho phép: ô trong sơ đồ trông ngắn nhưng giới hạn vẫn là giới hạn của cả khối.',
  ],
  13: [
    'Xác định **hướng đọc** của sơ đồ trước; thứ tự nhãn thường không theo bài.',
    'Nhãn cần điền hầu như luôn là **danh từ cụ thể**.',
    'Dùng nhãn đã in sẵn làm mỏ neo để định vị đoạn.',
    'Sơ đồ của bài này là **cây phân nhánh** — đọc từ gốc xuống, mỗi nhánh là một cộng đồng riêng, đừng lẫn nhãn giữa hai nhánh.',
  ],
  14: [
    'Che phương án, tự trả lời trước, rồi mới so.',
    'Bẫy số 1: phương án đúng sự thật nhưng **không trả lời câu được hỏi**.',
    'Bẫy số 2: phương án chứa từ y hệt trong bài.',
    'Với bài này, hỏi thêm một câu mỗi lần chọn: phương án đang nói về **nhánh Khmer hay nhánh Kinh**? Trộn hai nhánh là cách sai phổ biến nhất ở đây.',
  ],
  15: [
    'Hai chữ cái = hai câu, mỗi câu 1 điểm; đúng một cái vẫn có điểm.',
    'Loại nhanh phương án **không hề xuất hiện** trong bài.',
    'Chỉ tìm trong đoạn đề chỉ định; đúng nội dung nhưng sai đoạn vẫn là sai.',
    'Cẩn thận với phương án tái sử dụng **con số hoặc tên riêng có thật** trong bài — đó là kiểu mồi nhử bài này dùng nhiều nhất.',
  ],
  16: [
    'Trả lời bằng từ nguyên trong bài, không viết câu hoàn chỉnh.',
    'Từ để hỏi quyết định loại đáp án: *Where* → nơi chốn, *How many* → số, *What kind of* → cụm danh từ.',
    'Mạo từ có tính vào số từ — viết ngắn nhất có thể.',
    'Câu hỏi theo thứ tự bài; bốn câu cuối thường nằm ở các đoạn cuối.',
  ],
};

/* ================================================================== *
 * W5 — ielts_reading_mahayana_vietnam.md
 * Chủ đề: khoảng cách giữa CÁI TÊN (Thiền) và CÁI THỰC HÀNH (Tịnh độ).
 * Bẫy đặc trưng: bài nhiều lần **tự đính chính** — "it is worth being precise
 * about the claim", "Reconstruction would be the better word" — và đó chính
 * là chỗ ra đề (câu 18, 25, 54, 77).
 * ================================================================== */
const W5 = {
  1: [
    'Đọc **câu đầu và câu cuối** mỗi đoạn trước khi xét heading.',
    'Heading phải bao **cả đoạn**; heading chỉ đúng một câu là bẫy chi tiết.',
    'Thừa 4 heading. Khi phân vân giữa hai cái na ná, chọn cái khớp **phạm vi** của đoạn.',
    'Bài này liên tục đối lập **tên gọi** với **thực hành**. Xác định mỗi đoạn đang bàn về vế nào, phần lớn heading tự phân biệt theo trục đó.',
  ],
  2: [
    'Tìm **chi tiết cụ thể**, không phải ý chính.',
    'Gạch chân danh từ cụ thể (một cuốn sách, một năm, một nghi lễ) rồi mới scan.',
    'Đọc dòng NB — có đoạn dùng lại được.',
    'Dạng tốn thời gian nhất; để sau cùng nếu đang bấm giờ.',
  ],
  3: [
    '**TRUE** = bài xác nhận, **FALSE** = bài nói ngược, **NOT GIVEN** = bài im lặng.',
    'Chỉ ra được **dòng cụ thể** thì mới chọn TRUE; không chỉ ra được → NOT GIVEN.',
    'Câu 18 là câu quan trọng nhất của phần này: đề dựng sẵn một hiểu lầm rất tự nhiên về lập luận của học giả, rồi bài **chủ động bác bỏ** hiểu lầm đó bằng một câu riêng (*"he does not argue that the text was fabricated"*). Khi tác giả dừng lại để nói "cần chính xác về luận điểm này", gần như chắc chắn có câu hỏi ở đó.',
    'Phân biệt "bài không so sánh" với "bài nói bằng nhau" — vài câu ở đây là NOT GIVEN đúng vì bài **không hề xếp hạng**.',
  ],
  4: [
    'Hỏi **quan điểm tác giả**, không hỏi sự thật.',
    'Phân biệt "tác giả nói" và "tác giả thuật lại".',
    'Mệnh đề về tương lai hoặc điều tác giả chưa bàn → cảnh giác NOT GIVEN.',
    'Bài có nhiều câu dạng "to describe this as X is to assume the very thing in question" — đó là tác giả đang **bác một cách gọi**, tức là một YES/NO rất rõ nếu bạn đọc đúng.',
  ],
  5: [
    'Scan **tên riêng trước**, đọc câu hỏi sau.',
    'Câu hỏi **không theo thứ tự bài**.',
    'Có 5 tên (A–E) cho 6 câu → ít nhất một tên dùng lại; đọc dòng NB trước.',
    'Trong danh sách có cả **nhân vật lịch sử lẫn học giả hiện đại**. Khớp theo **việc họ làm** trong bài, đừng khớp theo cảm giác quen tên.',
  ],
  6: [
    'Kiểm tra **ngữ pháp trước**, loại 2–3 đuôi ngay.',
    'Câu hỏi **theo thứ tự bài đọc**.',
    'Đuôi thừa **F** và **G** ở đây đều thuộc loại "nghe rất hợp lý về mặt lịch sử nhưng bài không nói". Chọn chúng nghĩa là bạn đang trả lời bằng kiến thức nền.',
    'Đuôi đúng sự thật nhưng gắn sai nguyên nhân vẫn sai — soi chữ "because".',
  ],
  7: [
    'Chép **đúng từ trong bài**, không đổi dạng.',
    'Đếm chữ nghiêm ngặt.',
    'Đoán **loại từ** cần điền trước khi scan.',
    'Bài dày đặc niên đại (1337, 1927, 1994, 1997). Khi đề cho "AND/OR A NUMBER", năm thường chính là đáp án — nhưng phải đúng năm gắn với đúng sự kiện.',
  ],
  8: [
    'Đọc hết summary trước khi điền.',
    'Khoanh **vùng đoạn** summary đang tóm rồi mới scan.',
    'Kiểm tra ngữ pháp: mạo từ phía trước và giới từ phía sau đều gợi ý từ loại.',
    'Summary ở đây tóm đúng phần **tên gọi vs thực hành** — nếu điền xong mà đoạn văn không còn thể hiện sự đối lập đó, gần như chắc bạn đã sai một ô.',
  ],
  9: [
    'Loại phương án bằng **từ loại** trước khi xét nghĩa.',
    'Từ trong danh sách là paraphrase, thường không trùng từ trong bài.',
    'Bẫy chủ lực: **G restoration** và **D reconstruction** gần như đồng nghĩa trong tiếng Việt ("phục hồi" / "tái dựng"), nhưng bài phân biệt hai từ này **rất rõ** ở đoạn F — cả đoạn tồn tại chỉ để phân biệt chúng.',
    'Khi bài dừng lại nói *"X would be the better word"*, đó là chỗ ra đề. Đánh dấu ngay lúc đọc.',
  ],
  10: [
    'Notes bám sát **một đoạn** và theo thứ tự đoạn đó.',
    'Chú ý bullet lồng nhau; cấp con là chi tiết của cấp cha.',
    'Tiêu đề in đậm phía trên cho biết khối notes nói về cái gì.',
    'Notes ở đây mô tả **những gì thực sự diễn ra trong chùa** — danh từ chỉ nghi lễ và không gian là ứng viên đáp án chính.',
  ],
  11: [
    'Đọc **tiêu đề cột** trước tiên.',
    'Bảng theo **thứ tự thời gian** — khoanh vùng nhanh.',
    'Chép y nguyên tên riêng và con số, đủ dấu tiếng Việt.',
    'Bảng của bài này trộn **mốc lịch sử xa** với **mốc học thuật hiện đại**. Đọc kỹ cột năm để không lấy nhầm sự kiện của thế kỷ khác.',
  ],
  12: [
    'Flow-chart = một quá trình theo trình tự; tìm đoạn kể quá trình đó trước.',
    'Mũi tên = nhân quả hoặc thời gian.',
    'Đọc cả sơ đồ trước khi điền ô đầu tiên.',
    'Sơ đồ ở đây kể **đời của một văn bản**: biên soạn → thất lạc → tìm lại → thành chuẩn. Bám đúng bốn bước đó thì các ô tự lộ ra.',
  ],
  13: [
    'Xác định **hướng đọc** của sơ đồ trước.',
    'Nhãn cần điền hầu như luôn là **danh từ cụ thể**.',
    'Dùng nhãn in sẵn làm mỏ neo định vị đoạn.',
    'Sơ đồ này đặt **cái tên** ở một bên và **cái thực hành** ở bên kia. Điền xong tự hỏi: hai bên có còn đối lập nhau không?',
  ],
  14: [
    'Che phương án, tự trả lời trước rồi mới so.',
    'Bẫy số 1: phương án đúng sự thật nhưng không trả lời câu được hỏi.',
    'Bẫy số 2: phương án chứa từ y hệt trong bài.',
    'Câu 75 có bẫy tinh: bài **không** nói thiền mới bị bỏ gần đây, mà nói **chưa từng có thời kỳ nào chỉ có thiền**. Hai mệnh đề đó khác hẳn nhau. Đọc kỹ phạm vi thời gian của từng phương án.',
  ],
  15: [
    'Hai chữ cái = hai câu, mỗi câu 1 điểm.',
    'Loại nhanh phương án **không hề xuất hiện** trong bài.',
    'Chỉ tìm trong đoạn đề chỉ định.',
    'Với bài này, phương án sai hay gặp nhất là loại **đúng về Phật giáo nói chung nhưng sai về Phật giáo Việt Nam**. Luôn kiểm tra bài có nói riêng về Việt Nam ở chỗ đó không.',
  ],
  16: [
    'Trả lời bằng từ nguyên trong bài, không viết câu hoàn chỉnh.',
    'Từ để hỏi quyết định loại đáp án.',
    'Mạo từ có tính vào số từ — viết ngắn nhất có thể.',
    'Câu hỏi theo thứ tự bài; bốn câu cuối rơi vào các đoạn cuối.',
  ],
};

const DATA = {
  'ielts_reading_vietnam_buddhism.md': W3,
  'ielts_reading_theravada_vietnam.md': W4,
  'ielts_reading_mahayana_vietnam.md': W5,
};

/* ================================================================== */
let total = 0;
for (const [name, blocks] of Object.entries(DATA)) {
  const file = path.join(TEST_DIR, name);
  if (!fs.existsSync(file)) {
    console.error(`  bỏ qua ${name}: không có file`);
    continue;
  }
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const done = [];

  // duyệt ngược để splice không làm lệch chỉ số phía trên
  for (let i = lines.length - 1; i >= 0; i--) {
    const head = (lines[i] ?? '').match(/^##\s+Dạng\s+(\d+)\s*[–—-]\s*.+\(Questions/);
    if (!head) continue;
    const idx = Number(head[1]);
    const bullets = blocks[idx];
    if (!bullets) continue;

    let end = i + 1;
    while (end < lines.length && !/^##?\s/.test(lines[end] ?? '')) end++;

    // vị trí khối chiến thuật hiện có (nếu có)
    let k = i + 1;
    while (k < end && (lines[k] ?? '').trim() === '') k++;
    let bqEnd = k;
    while (bqEnd < end && /^>/.test(lines[bqEnd] ?? '')) bqEnd++;
    const hasStrategy = bqEnd > k;

    if (hasStrategy && !FORCE) continue;

    const fresh = ['> **Chiến thuật**', ...bullets.map((b) => `> - ${b}`)];
    if (hasStrategy) {
      lines.splice(k, bqEnd - k, ...fresh);
      done.push(`Dạng ${idx} — viết lại (N04b)`);
    } else {
      lines.splice(k, 0, ...fresh, '');
      done.push(`Dạng ${idx} — thêm mới (N02)`);
    }
  }

  if (done.length) {
    if (!DRY) fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log(`\n  ${name}  (${done.length} khối)`);
    for (const d of done.reverse()) console.log(`     + ${d}`);
    total += done.length;
  }
}
console.log(`\n  N02 + N04b — ${total} khối chiến thuật.${DRY ? ' (DRY RUN)' : ''}\n`);
