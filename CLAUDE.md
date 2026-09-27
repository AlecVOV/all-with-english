# all-with-english — monorepo

> Dành cho Claude Code chạy ở thư mục cha `English and Everything/`. Trả lời người dùng bằng **tiếng Việt**.
> Người dùng dặn: **chỗ nào chưa rõ thì hỏi trước, không tự ý làm** — nhất là git, push, AWS, ghi dữ liệu thật.
> Mỗi project con có `CLAUDE.md` riêng (`word-rain/CLAUDE.md`, `reading-iellts/CLAUDE.md`) — đọc khi sửa code bên trong.

## 1. Bối cảnh

| | |
|---|---|
| Repo GitHub | https://github.com/AlecVOV/all-with-english (public), nhánh `main`. Thư mục này chính là bản clone của repo |
| `word-rain/` | Nuxt 4 (SPA static) + Amplify Gen 2 backend (Cognito guest, AppSync, DynamoDB) |
| `reading-iellts/` | Vite static, không backend. Tên thư mục viết đúng như vậy (`iellts`), đừng "sửa chính tả" — `amplify.yml` trỏ theo tên này |
| `amplify.yml` (gốc repo) | Build spec monorepo cho cả 2 app; mỗi app Amplify chọn phần của mình qua env var `AMPLIFY_MONOREPO_APP_ROOT` |
| AWS | account `677276113002`, region **`ap-southeast-1`** (luôn truyền `--region ap-southeast-1`) |
| Amplify app word-rain (**đang dùng**) | ID `d2eu1mn2ux8xtn` (`word-rain-v2`), nhánh `main`, URL https://main.d2eu1mn2ux8xtn.amplifyapp.com — nối repo, **push `main` là tự deploy** |
| Backend stack word-rain | `amplify-d2eu1mn2ux8xtn-main-branch-a76328653a` — bảng `WordSet/Word-igy63z6akfdvnp565snosapwue-NONE`, dữ liệu thật của học sinh |
| App cũ (thôi dùng) | ID `d32yqkh16ilzqk`, stack `amplify-d32yqkh16ilzqk-main-branch-ee15bf4951` — deploy tay, không nối repo được. Dữ liệu đã chép sang app mới ngày 2026-09-27 |
| Service role | `AmplifyWordRainServiceRole` (policy `AmplifyBackendDeployFullAccess`), gắn vào cả 2 app |

Lịch sử chuyển app và các lỗi build đã gặp: xem `word-rain/DEPLOY.md`.

## 2. Quy tắc an toàn (bắt buộc)

- **Không xoá nhánh `main` hay app `d2eu1mn2ux8xtn`.** Với Gen 2, xoá nhánh = xoá backend stack + bảng DynamoDB.
- Không tự xoá app cũ `d32yqkh16ilzqk` — để người dùng tự làm khi đã yên tâm.
- Lệnh xoá file/thư mục, đọc/ghi DynamoDB thật, hay đổi tài nguyên AWS có thể bị bộ phân loại quyền của Claude Code chặn. Nếu bị chặn: **không lách**, đưa người dùng đúng lệnh để họ tự chạy.
- Không commit `word-rain/amplify_outputs.json`, `word-rain/.amplify/`, `*.tmp.mjs` (đã có trong `.gitignore`).
- Không bao giờ in/ghi token GitHub của người dùng vào file hay commit.

## 3. Việc còn lại

- **Xoá app cũ** (người dùng tự làm; đã chọn gửi link mới cho học sinh, không redirect): `aws amplify delete-app` + xoá stack cũ, xem cuối `word-rain/DEPLOY.md`. Sau khi xoá, gỡ các dòng về app cũ khỏi file này.
- `wordCount` của Unit 1 (60, thực tế 64) và Unit 2 (15, thực tế 40) sẽ tự đúng khi người dùng lưu lại bài đó qua web — không cần sửa tay.
- **Deploy reading-iellts** (khi người dùng yêu cầu): Amplify Console → Create new app → GitHub → `all-with-english`, nhánh `main` → tick **"My app is a monorepo"**, root `reading-iellts`. Nếu có route phía client thì thêm rewrite SPA giống word-rain.

## 4. Ghi chú kỹ thuật cần nhớ

- **Đọc danh sách từ của một bài:** phải đi qua quan hệ `WordSet.words` bằng GraphQL (`getWordSet { words(limit, nextToken) }`, xem `listWordsOfSet` trong `word-rain/app/composables/useWordSets.ts`) — đây là Query trên GSI `gsi-WordSet.words`. **Không dùng** `Word.list({ filter: { wordSetId } })` hay lazy loader `wordSet.words()` của SDK: cả hai là Scan toàn bảng, trả về thiếu trang → từng gây bug "sửa bài xong mất từ". Không thêm GSI mới trên `wordSetId` (trùng, tốn phí ghi).
- **Tạo app Amplify qua Console không gắn service role** → build lỗi `ssm:GetParameter ... cdk-bootstrap`. Luôn kiểm tra `iamServiceRoleArn` sau khi tạo app.
- **Nitro tự đổi preset trên Amplify** (`aws-amplify`, xuất ra `.amplify-hosting/`) → `amplify.yml` ép `NITRO_PRESET=static` để giữ `.output/public`. Đừng bỏ.
- Node trên máy build Amplify: 22 (Nuxt 4 cần ≥ 22.19) — đã khai báo trong `amplify.yml`.
- DynamoDB `PAY_PER_REQUEST`; các Lambda/S3 `amplify-…` thuộc stack, chỉ chạy lúc deploy — không xoá tay. Tài nguyên khác trong account (portfolio, focus-mode, kinhmatgiao…) thuộc project khác — không đụng.
- Repo public: `word-rain/DEPLOY.md` có account ID và app ID (không phải bí mật, người dùng đã được báo).
