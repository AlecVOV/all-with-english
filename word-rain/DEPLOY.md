# Deploy log — Word Rain (ap-southeast-1)

Ghi lại toàn bộ lệnh đã chạy để deploy backend (Amplify Gen 2: Cognito guest + AppSync + DynamoDB) và frontend (Amplify Hosting, static) lên region **Singapore (ap-southeast-1)**, account AWS `677276113002`.

- **App ID:** `d2eu1mn2ux8xtn` (tên `word-rain-v2`)
- **URL:** https://main.d2eu1mn2ux8xtn.amplifyapp.com
- **Region:** ap-southeast-1
- **Cách deploy:** tự động — app nối repo GitHub `AlecVOV/all-with-english` (monorepo, root `word-rain`), mỗi lần push `main` Amplify chạy `amplify.yml` ở gốc repo (backend `ampx pipeline-deploy` + frontend `npm run generate`). Không cần chạy tay lệnh nào.
- **App cũ:** `d32yqkh16ilzqk` (deploy thủ công, không nối được repo vì Amplify đòi xoá nhánh `main` — tức là xoá luôn backend). Dữ liệu đã chép nguyên sang app mới ngày 2026-09-27 (3 bài, 153 từ, giữ nguyên ID). Các mục 1–7 bên dưới là lịch sử deploy tay của app cũ.

## Chuyển sang app mới (2026-09-27)

1. Tạo app `d2eu1mn2ux8xtn` qua Amplify Console (GitHub → `all-with-english`, monorepo root `word-rain`). Console tự đặt env var `AMPLIFY_MONOREPO_APP_ROOT=word-rain`.
2. Console **không** gắn service role → build đầu lỗi `ssm:GetParameter ... cdk-bootstrap`. Sửa: `aws amplify update-app --region ap-southeast-1 --app-id d2eu1mn2ux8xtn --iam-service-role-arn arn:aws:iam::677276113002:role/AmplifyWordRainServiceRole` (role có policy `AmplifyBackendDeployFullAccess`).
3. Nitro tự nhận môi trường Amplify và chuyển sang preset `aws-amplify` (xuất ra `.amplify-hosting/`) → lỗi `Artifact directory doesn't exist: .output/public`. Sửa trong `amplify.yml`: `NITRO_PRESET=static npm run generate`.
4. Chép dữ liệu: Scan 2 bảng cũ (`WordSet/Word-wy52jfqxtzhmbevan253h63d2i-NONE`) → BatchWrite nguyên item sang bảng mới (`…-igy63z6akfdvnp565snosapwue-NONE`).
5. Gắn rewrite SPA: `aws amplify update-app --region ap-southeast-1 --app-id d2eu1mn2ux8xtn --custom-rules file://custom-rules.json`.

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

Hiện tại: chỉ cần push `main`. Các lệnh dưới đây là cách cũ cho app `d32yqkh16ilzqk`, chỉ giữ để tham khảo.

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

## Dọn dẹp tài nguyên (nếu muốn xoá hết, ví dụ ngừng dùng)

Dùng để xoá **app cũ** `d32yqkh16ilzqk` khi không cần nữa. Stack của app cũ là `amplify-d32yqkh16ilzqk-main-branch-ee15bf4951`; đừng nhầm với stack của app mới (`amplify-d2eu1mn2ux8xtn-main-branch-…`).

```bash
aws amplify delete-app --app-id d32yqkh16ilzqk --region ap-southeast-1
# Lưu ý: lệnh trên chỉ xoá phần Hosting. Backend (Cognito/AppSync/DynamoDB) được quản lý
# bởi CloudFormation stack "amplify-d32yqkh16ilzqk-main-branch-..." — xoá qua CloudFormation
# console hoặc: aws cloudformation delete-stack --stack-name <tên-stack> --region ap-southeast-1
```
