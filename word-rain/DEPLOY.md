# Deploy log — Word Rain (ap-southeast-1)

Ghi lại toàn bộ lệnh đã chạy để deploy backend (Amplify Gen 2: Cognito guest + AppSync + DynamoDB) và frontend (Amplify Hosting, static) lên region **Singapore (ap-southeast-1)**, account AWS `677276113002`.

- **App ID:** `d32yqkh16ilzqk`
- **URL:** https://main.d32yqkh16ilzqk.amplifyapp.com
- **Region:** ap-southeast-1
- **Cách deploy:** thủ công qua AWS CLI (không dùng git-connected CI/CD vì repo chưa có remote GitHub) — xem mục "Deploy lại / CI-CD" bên dưới để nối GitHub sau này.

## Lịch sử deploy

| Job ID | Nội dung | Có redeploy backend? |
|---|---|---|
| backend (lần 1) | Schema ban đầu, thử `allow.owner().identityClaim(...)` — bị lỗi guest không truy cập được | Có |
| backend (lần 2) | Sửa lại `allow.guest()` — hoạt động đúng | Có |
| frontend job 1 | Bản đầu tiên: danh sách, tạo bài, chơi, flashcard | Không |
| frontend job 2 | Thêm tính năng **Sửa bài học** (`edit/[id].vue`, `updateWordSet()`) — chỉ đổi frontend, schema/quyền không đổi (`update` đã nằm sẵn trong `allow.guest()` mặc định) nên không cần chạy lại `ampx pipeline-deploy` | Không |
| frontend job 3 | Fix parser bulk-text với từ có gạch nối (`hand-craft`) + thêm chọn tốc độ rơi Chậm/Vừa/Nhanh (`WordRainGame.vue`, `useGameState.ts`) — chỉ đổi frontend | Không |

## 0. Kiểm tra credentials

```bash
aws sts get-caller-identity
```

## 1. Bootstrap CDK cho region ap-southeast-1 (chỉ cần chạy 1 lần / account / region)

Amplify Gen 2 dùng AWS CDK bên dưới, cần bootstrap trước khi deploy backend lần đầu vào 1 region:

```bash
export AWS_REGION=ap-southeast-1
npx cdk bootstrap aws://677276113002/ap-southeast-1
```

## 2. Tạo Amplify App (Hosting)

```bash
aws amplify create-app --name word-rain --platform WEB --region ap-southeast-1
# -> ghi lại "appId": "d32yqkh16ilzqk"

aws amplify create-branch --app-id d32yqkh16ilzqk --branch-name main --region ap-southeast-1
```

## 3. Deploy backend (Cognito guest + AppSync + DynamoDB)

`ampx pipeline-deploy` được thiết kế để chạy trong CI/CD (Amplify Hosting build container tự set các env var cần thiết). Để chạy thủ công từ máy local, set `CI=true` để bypass check môi trường:

```bash
export AWS_REGION=ap-southeast-1
export CI=true
npx ampx pipeline-deploy --branch main --app-id d32yqkh16ilzqk
```

Lệnh này tạo/cập nhật CloudFormation stack chứa Cognito Identity Pool (unauthenticated identities), AppSync GraphQL API, và 2 bảng DynamoDB (`WordSet`, `Word`, billing mode mặc định `PAY_PER_REQUEST`), đồng thời ghi file `amplify_outputs.json` (real config — KHÔNG commit file này, đã có trong `.gitignore`).

> **Lưu ý quan trọng đã phát hiện khi deploy:** thử nghiệm đầu tiên dùng `allow.owner().identityClaim('cognito:identity_id')` để cô lập dữ liệu theo từng thiết bị — nhưng Amplify Data hiện chỉ hỗ trợ `userPools`/`oidc` làm provider cho owner-auth (`identityPool` không được hỗ trợ ở API `allow.owner()`), nên rule đó thực ra làm **guest không truy cập được gì cả** (bị AppSync từ chối). Đã sửa lại schema dùng `allow.guest()` đúng như CLAUDE.md — nghĩa là **mọi khách (chưa đăng nhập) chia sẻ chung 1 vùng dữ liệu**, không có cách nào cô lập riêng theo từng học sinh/thiết bị nếu không bắt đăng nhập thật (Cognito User Pool). Đây là đánh đổi cố hữu của kiến trúc "không cần đăng nhập" — nên biết trước khi đưa nhiều lớp/nhiều học sinh dùng chung 1 link.

## 4. Cấu hình SPA fallback rewrite cho Amplify Hosting

App là SPA thuần (`ssr: false`), các route động `/play/[id]`, `/review/[id]` không có HTML tĩnh tương ứng → cần rewrite mọi path không khớp file tĩnh về `/index.html`:

```bash
aws amplify update-app --app-id d32yqkh16ilzqk --region ap-southeast-1 \
  --custom-rules file://custom-rules.json
```

Nội dung `custom-rules.json`:

```json
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>",
    "target": "/index.html",
    "status": "200"
  }
]
```

## 5. Build static site

```bash
npm run generate
# output: .output/public
```

## 6. Deploy thủ công lên Amplify Hosting (không cần git)

```bash
cd .output/public && zip -r ../../deploy.zip . && cd ../..

# Tạo deployment, lấy jobId + zipUploadUrl (presigned S3 URL, hết hạn sau 3 tiếng)
aws amplify create-deployment --app-id d32yqkh16ilzqk --branch-name main --region ap-southeast-1

# Upload file zip lên URL vừa nhận được
curl -X PUT -T deploy.zip "<zipUploadUrl>"

# Kích hoạt deployment
aws amplify start-deployment --app-id d32yqkh16ilzqk --branch-name main --job-id <jobId> --region ap-southeast-1

# Theo dõi trạng thái
aws amplify get-job --app-id d32yqkh16ilzqk --branch-name main --job-id <jobId> --region ap-southeast-1
```

Deploy lần đầu: `jobId = 1`, kết quả `SUCCEED`.

## 7. Kiểm tra sau deploy

Đã test trực tiếp qua browser thật (Playwright headless) trên URL live: tạo bài học → hiện trong danh sách → chơi word rain (gõ đúng từ cộng điểm) → flashcard hoạt động → xoá bài học. Không có lỗi console.

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://main.d32yqkh16ilzqk.amplifyapp.com/
curl -s -o /dev/null -w "%{http_code}\n" https://main.d32yqkh16ilzqk.amplifyapp.com/play/<any-id>
```

## Deploy lại sau khi sửa code

```bash
# Backend đổi (amplify/**): chạy lại bước 3
export AWS_REGION=ap-southeast-1 CI=true
npx ampx pipeline-deploy --branch main --app-id d32yqkh16ilzqk

# Frontend đổi: chạy lại bước 5 + 6
npm run generate
cd .output/public && zip -r ../../deploy.zip . && cd ../..
aws amplify create-deployment --app-id d32yqkh16ilzqk --branch-name main --region ap-southeast-1
curl -X PUT -T deploy.zip "<zipUploadUrl>"
aws amplify start-deployment --app-id d32yqkh16ilzqk --branch-name main --job-id <jobId> --region ap-southeast-1
```

## Nối GitHub để có CI/CD tự động (khuyến nghị cho lâu dài)

Cách deploy thủ công ở trên dùng tốt để có bản chạy ngay, nhưng mỗi lần sửa code phải tự chạy lại các lệnh trên. Muốn tự động build+deploy mỗi khi push code (đúng kiến trúc mô tả trong CLAUDE.md mục 4/8), cần:

1. Tạo repo Git (GitHub/CodeCommit/GitLab), push code lên.
2. Trong AWS Console → Amplify Hosting → app `word-rain` → "Connect branch" → chọn repo + branch `main`. Amplify sẽ tự đọc `amplify.yml`/mặc định để chạy `npm ci && npx ampx pipeline-deploy ... && npm run generate` trong CI mỗi lần push, không cần chạy tay các lệnh ở mục 3/5/6 nữa.

## Dọn dẹp tài nguyên (nếu muốn xoá hết, ví dụ ngừng dùng)

```bash
aws amplify delete-app --app-id d32yqkh16ilzqk --region ap-southeast-1
# Lưu ý: lệnh trên chỉ xoá phần Hosting. Backend (Cognito/AppSync/DynamoDB) được quản lý
# bởi CloudFormation stack "amplify-d32yqkh16ilzqk-main-branch-..." — xoá qua CloudFormation
# console hoặc: aws cloudformation delete-stack --stack-name <tên-stack> --region ap-southeast-1
```
