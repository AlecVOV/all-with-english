# all-with-english — monorepo (việc cần làm tiếp)

> Dành cho Claude Code chạy ở thư mục cha `English and Everything/`. Trả lời người dùng bằng **tiếng Việt**.
> Người dùng dặn: **chỗ nào chưa rõ thì hỏi trước, không tự ý làm** — nhất là git, push, AWS, ghi dữ liệu thật.
> Mỗi project con có `CLAUDE.md` riêng (`word-rain/CLAUDE.md`, `reading-iellts/CLAUDE.md`) — đọc khi sửa code bên trong.

## 1. Bối cảnh

| | |
|---|---|
| Repo GitHub | https://github.com/AlecVOV/all-with-english (public), nhánh `main` |
| `word-rain/` | Nuxt 4 (SPA static) + Amplify Gen 2 backend (Cognito guest, AppSync, DynamoDB) |
| `reading-iellts/` | Vite static, không backend. Tên thư mục viết đúng như vậy (`iellts`), đừng "sửa chính tả" — `amplify.yml` trỏ theo tên này |
| `amplify.yml` (gốc repo) | Build spec monorepo cho cả 2 app; mỗi app Amplify chọn phần của mình qua env var `AMPLIFY_MONOREPO_APP_ROOT` |
| AWS | account `677276113002`, region **`ap-southeast-1`** (luôn truyền `--region ap-southeast-1`) |
| Amplify app word-rain | ID `d32yqkh16ilzqk`, nhánh `main`, URL https://main.d32yqkh16ilzqk.amplifyapp.com |
| Backend stack word-rain | `amplify-d32yqkh16ilzqk-main-branch-ee15bf4951` — chứa 2 bảng DynamoDB có dữ liệu thật của học sinh |

Trạng thái lúc viết file này (2026-09-26): repo GitHub đã có đủ code (commit `2c0778a`), nhưng **thư mục trên máy chưa nối vào repo** và **app Amplify chưa nối repo** (vẫn là app deploy thủ công, chưa có service role, chưa có env var). Luôn kiểm tra lại trạng thái thật trước khi làm (lệnh ở từng bước).

## 2. Quy tắc an toàn (bắt buộc)

- **Không xoá nhánh `main` trong Amplify, không xoá/tạo lại app `d32yqkh16ilzqk`, không tạo app mới cho word-rain.** Với Gen 2, xoá nhánh = xoá backend stack + bảng DynamoDB. App mới = backend mới, bảng trống, URL mới.
- Lệnh xoá file/thư mục, ghi vào DynamoDB thật, hay đổi tài nguyên AWS có thể bị bộ phân loại quyền của Claude Code chặn. Nếu bị chặn: **không lách**, đưa người dùng đúng lệnh để họ tự chạy.
- Không commit `word-rain/amplify_outputs.json`, `word-rain/.amplify/`, `*.tmp.mjs` (đã có trong `.gitignore`).
- Không bao giờ in/ghi token GitHub của người dùng vào file hay commit.

## 3. Việc cần làm (theo thứ tự)

### Bước 1 — Nối thư mục trên máy vào repo

Kiểm tra: `git -C "C:\Users\Admin\Desktop\English and Everything" status`. Nếu đã là repo, remote là `all-with-english` và status sạch → bỏ qua bước này.

Hiện `reading-iellts/.git` và `word-rain/.git` là 2 repo riêng cũ — cần bỏ đi. An toàn: toàn bộ 32 commit của reading-iellts đã nằm trong repo GitHub (merge bằng `git subtree`), `word-rain/.git` chưa có commit nào. Trước khi xoá, xác nhận remote đã có đủ: `git ls-remote https://github.com/AlecVOV/all-with-english main` phải trả về `2c0778a…` (hoặc mới hơn).

PowerShell (người dùng tự chạy nếu lệnh xoá bị chặn):
```powershell
cd "C:\Users\Admin\Desktop\English and Everything"
Remove-Item -Recurse -Force reading-iellts\.git, word-rain\.git
git clone --no-checkout https://github.com/AlecVOV/all-with-english tmp-repo
Move-Item -Force tmp-repo\.git .git
Remove-Item tmp-repo
git reset
git checkout -- README.md amplify.yml
git status
```
Kết quả đúng: `git status` chỉ còn `CLAUDE.md` (file này) là untracked. Nếu có file nào khác bị "modified" thì dừng lại, cho người dùng xem diff, không tự commit/revert. Sau đó hỏi người dùng có muốn commit file `CLAUDE.md` này không.

### Bước 2 — Cho Amplify quyền deploy backend (service role + env var)

Kiểm tra: `aws amplify get-app --region ap-southeast-1 --app-id d32yqkh16ilzqk --query "app.{repo:repository,role:iamServiceRoleArn,env:environmentVariables}"`.
Nếu `role` còn `null`:
```powershell
aws iam create-role --role-name AmplifyWordRainServiceRole --assume-role-policy-document '{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"amplify.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}'
aws iam attach-role-policy --role-name AmplifyWordRainServiceRole --policy-arn arn:aws:iam::aws:policy/service-role/AmplifyBackendDeployFullAccess
aws amplify update-app --region ap-southeast-1 --app-id d32yqkh16ilzqk --iam-service-role-arn arn:aws:iam::677276113002:role/AmplifyWordRainServiceRole --environment-variables AMPLIFY_MONOREPO_APP_ROOT=word-rain
```
Lưu ý: `--environment-variables` ghi đè toàn bộ env var của app — nếu lúc đó app đã có env var khác, gộp chúng vào lệnh.

### Bước 3 — Nối app Amplify vào repo GitHub

Người dùng tự tạo GitHub token (classic, scope `repo` + `admin:repo_hook`) và tự chạy (đừng xin họ dán token vào chat):
```powershell
aws amplify update-app --region ap-southeast-1 --app-id d32yqkh16ilzqk --repository https://github.com/AlecVOV/all-with-english --access-token <TOKEN>
```
**Chưa chắc chắn:** app này được tạo bằng deploy thủ công; tài liệu AWS không nói rõ có nối repo sau được không. Nếu lệnh báo lỗi → **dừng**, báo lỗi cho người dùng và bàn phương án. Phương án dự phòng (chỉ làm khi người dùng đồng ý): tạo app mới nối repo, rồi viết script chép dữ liệu `WordSet`/`Word` từ backend cũ sang (đọc từ qua quan hệ `WordSet.words`, xem mục 4), đổi link cho học sinh, cuối cùng người dùng tự xoá app cũ.

### Bước 4 — Build lần đầu và kiểm tra

```powershell
aws amplify start-job --region ap-southeast-1 --app-id d32yqkh16ilzqk --branch-name main --job-type RELEASE
aws amplify list-jobs --region ap-southeast-1 --app-id d32yqkh16ilzqk --branch-name main --max-items 1
```
Kiểm tra: job `SUCCEED`; log có cả phase backend (`ampx pipeline-deploy`) lẫn frontend (`npm run generate`); mở URL, thấy đủ Unit 1–3; mở `/play/<id>` trực tiếp không bị 404 (rewrite SPA đã cấu hình sẵn ở app, xem `word-rain/custom-rules.json`). Sau đó mỗi lần push `main` là tự deploy. Cập nhật `word-rain/DEPLOY.md` (mục cách deploy đang ghi "thủ công qua CLI").

Nếu build lỗi ở `npm ci`: lockfile lệch `package.json` — chạy `npm install --package-lock-only` trong thư mục app đó rồi commit lockfile.

### Bước 5 — Dọn dữ liệu Unit 3 (ghi DB thật, người dùng đã đồng ý)

Unit 3 có 68 bản ghi Word nhưng chỉ 49 từ khác nhau (19 từ bị lặp do bug cũ). Script có sẵn trên máy (không có trong repo): `word-rain/cleanup-unit3.tmp.mjs`. Chạy trong `word-rain/` (cần `amplify_outputs.json` + `node_modules`):
```powershell
node cleanup-unit3.tmp.mjs          # chạy thử: in kế hoạch, ghi backup, không sửa gì
node cleanup-unit3.tmp.mjs --apply  # xoá bản cũ của từ lặp, đánh lại order 0..48, wordCount = 49
node cleanup-unit3.tmp.mjs          # kiểm tra: phải ra "drop":0,"reorder":0
```
Chạy thử lần đầu phải ra `records:68, keep:49, drop:19`. Nếu số khác → dừng, hỏi người dùng (có thể họ đã sửa bài qua web). Lưu ý: script ghi backup vào đường dẫn scratchpad của phiên cũ (có thể không còn) — sửa đường dẫn backup sang thư mục tạm của phiên hiện tại trước khi chạy. Xong thì xoá file script.

`wordCount` của Unit 1 (60, thực tế 64) và Unit 2 (15, thực tế 40) sẽ tự đúng khi người dùng lưu lại bài đó qua web — không cần sửa tay.

### Bước 6 (sau này) — Deploy reading-iellts

Khi người dùng yêu cầu: Amplify Console → Create new app → GitHub → `all-with-english`, nhánh `main` → tick **"My app is a monorepo"**, root `reading-iellts` (console tự đặt `AMPLIFY_MONOREPO_APP_ROOT`). `amplify.yml` đã có sẵn phần cho app này, không cần sửa. Nếu reading-iellts có route phía client thì thêm rewrite SPA giống word-rain.

## 4. Ghi chú kỹ thuật cần nhớ

- **Đọc danh sách từ của một bài:** phải đi qua quan hệ `WordSet.words` bằng GraphQL (`getWordSet { words(limit, nextToken) }`, xem `listWordsOfSet` trong `word-rain/app/composables/useWordSets.ts`) — đây là Query trên GSI `gsi-WordSet.words`. **Không dùng** `Word.list({ filter: { wordSetId } })` hay lazy loader `wordSet.words()` của SDK: cả hai là Scan toàn bảng, trả về thiếu trang → từng gây bug "sửa bài xong mất từ". Không thêm GSI mới trên `wordSetId` (trùng, tốn phí ghi).
- **Tài nguyên AWS đã rà (2026-09-26), không có gì thừa:** 3 bucket S3 (`…amplifydataamplifycodege…`, `…modelintrospectionschema…`, `cdk-hnb659fds-assets-…` dùng chung cho mọi deploy CDK) và 6 Lambda `amplify-d32yqkh16ilzqk-…` đều thuộc stack hiện tại, chỉ chạy lúc deploy. DynamoDB `PAY_PER_REQUEST`. Không xoá tay cái nào. Các tài nguyên khác trong account (portfolio, focus-mode, kinhmatgiao…) thuộc project khác — không đụng.
- Node trên máy build Amplify: 22 (Nuxt 4 cần ≥ 22.19) — đã khai báo trong `amplify.yml`.
- Repo public: `word-rain/DEPLOY.md` có account ID và app ID (không phải bí mật, người dùng đã được báo).
