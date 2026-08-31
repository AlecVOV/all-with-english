# P4 — Đóng vòng: generator ↔ canonical

Chạy **sau P3**, khi parser đã xanh. Mục đích: workbook #6 sinh ra phải vào thẳng `test/` được, không cần sửa tay và không cần parser khoan dung thêm.

Vấn đề đang có: `ielts_workbook_prompt_spec.md` mô tả cấu trúc ngữ nghĩa, `docs/canonical-format.md` mô tả format byte-level. Hai nguồn sự thật độc lập sẽ lệch nhau. Đã lệch sẵn: khối YAML trong generator spec có `generator_model`, `audit_status`, `sources_consulted`; danh sách trường bắt buộc của P0 không có.

Cách sửa: **không đồng bộ hai tài liệu bằng tay.** Biến `normalize.mjs` thành cổng thường trực, và chỉ đưa vào generator spec những gì normalize không vá được.

---

```
=== BEGIN P4 ===

git commit trước đã.

Đọc docs/canonical-format.md, ielts_workbook_prompt_spec.md, và
scripts/normalize.mjs.

Mục tiêu: workbook mới sinh ra phải qua được npm run validate mà không
cần sửa tay, và không cần thêm một dòng khoan dung nào vào parser.

BƯỚC 1 — Phân loại

Với mỗi ràng buộc trong canonical-format.md, xác định:

  MECHANICAL — normalize.mjs sửa được từ output lệch.
               (nhãn chiến thuật, số cột bảng đáp án, layout options,
                cú pháp chấp nhận, "__ /14", dấu --- đôi, tiền tố
                instruction)
  SEMANTIC   — normalize.mjs KHÔNG sửa được, generator phải làm đúng
               ngay từ đầu.
               (có đủ 16 khối strategy, có đủ 16 instruction, đủ 86 câu,
                phân bổ T/F/NG, giá trị frontmatter, wordLimit khớp với
                đáp án thật của khối đó)

In bảng phân loại. Đây là căn cứ cho hai bước sau.

BƯỚC 2 — Mở rộng normalize.mjs thành cổng thường trực

  - Thêm chế độ: node scripts/normalize.mjs --in <file> --out <file>
    Chạy được trên một file lẻ, không chỉ trên cả thư mục test/.
  - Idempotent: chạy hai lần cho kết quả byte-identical. Viết test.
  - Với mọi mục SEMANTIC, normalize KHÔNG tự sửa mà báo lỗi rõ ràng,
    exit code khác 0, in ra đúng thiếu gì ở khối nào. Vá tự động một
    thứ thuộc về nội dung là cách chắc chắn nhất để giấu lỗi.

BƯỚC 3 — Sinh phần format của generator spec từ canonical

  Viết scripts/build-generator-spec.mjs. Nó đọc canonical-format.md và
  sinh ra một phụ lục "OUTPUT FORMAT CONTRACT" cho generator spec, chứa
  ĐÚNG các mục SEMANTIC, kèm mẫu markdown nguyên văn cho từng loại khối.

  Ghi phụ lục vào ielts_workbook_prompt_spec.md, giữa hai dòng mốc
  <!-- BEGIN GENERATED --> và <!-- END GENERATED -->. Mọi thứ ngoài hai
  mốc này là phần viết tay, không được đụng vào.

  Các mục MECHANICAL KHÔNG đưa vào phụ lục. Bắt generator nhớ chi tiết
  mà script sửa được là lãng phí attention của model vào chỗ không cần.

BƯỚC 4 — Hoà giải frontmatter

  Trường bắt buộc lấy theo canonical-format.md. Các trường generator
  spec có thêm (generator_model, audit_status, sources_consulted,
  xelatex_safe, diacritics_heavy) — quyết định từng trường: đưa vào
  canonical thành optional, hay bỏ. Đừng để hai danh sách khác nhau tồn
  tại song song.

BƯỚC 5 — Script intake

  Viết scripts/intake.mjs, chạy như sau:

    node scripts/intake.mjs <đường-dẫn-file-mới>

  Trình tự: normalize --in --out → npm run validate trên file đó → nếu
  xanh thì copy vào test/ và in workbook_id đã cấp; nếu đỏ thì in lỗi
  và KHÔNG copy.

  Kiểm topic_slug trùng với file đã có trong test/ → từ chối.

BƯỚC 6 — Test hồi quy

  Lấy W3 (file lệch nhiều nhất trước khi migrate, còn trong git history),
  chạy qua normalize.mjs, khẳng định output byte-identical với W3 hiện
  tại trong test/. Đây là bằng chứng cổng vào thật sự hoạt động, chứ
  không phải chỉ chạy được một lần rồi thôi.

Cuối cùng in ra: những ràng buộc SEMANTIC nào bạn cho là generator dễ vi
phạm nhất, để tôi cân nhắc siết prompt.

=== END P4 ===
```

---

## Pipeline sau khi xong P4

```
1. chạy prompt trong ielts_workbook_prompt_spec.md → wb06_raw.md
2. chạy prompt AUDIT (cùng file, Phần 3) → sửa defect
3. node scripts/intake.mjs wb06_raw.md
4. đọc mắt 4 khối strategy ngẫu nhiên
5. git commit
```

Bước 2 và bước 4 không tự động hoá được. Bước 2 bắt lỗi nội dung (NOT GIVEN đánh nhầm thành TRUE, số liệu bịa) — validate cấu trúc mù hoàn toàn với loại lỗi này. Bước 4 bắt chiến thuật viết suông kiểu định nghĩa dạng câu hỏi thay vì chiến thuật làm bài.

## Vì sao không gộp P4 vào P0

Ở thời điểm P0, `normalize.mjs` chưa tồn tại, nên chưa biết ranh giới MECHANICAL/SEMANTIC nằm ở đâu. Phân loại lúc đó là đoán. Sau P1 thì ranh giới ấy là sự thật đã được code kiểm chứng — script làm được gì thì làm rồi.
