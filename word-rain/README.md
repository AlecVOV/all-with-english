# Word Rain 🌧️

Game học từ vựng kiểu "từ rơi" — Nuxt 3 (SPA) + AWS Amplify Gen 2 (Amplify Data/AppSync + DynamoDB), guest-only, tối ưu chi phí. Chi tiết kiến trúc/tính năng xem [CLAUDE.md](./CLAUDE.md).

**Đang chạy live tại:** https://main.d2eu1mn2ux8xtn.amplifyapp.com (region `ap-southeast-1`). Toàn bộ lệnh đã dùng để deploy: xem [DEPLOY.md](./DEPLOY.md). Sơ đồ kiến trúc AWS, cấu trúc code và luồng game: xem [docs/](./docs/README.md).

> ⚠️ Lưu ý bảo mật: backend dùng `allow.guest()` (theo đúng CLAUDE.md) — mọi khách truy cập chia sẻ chung 1 vùng dữ liệu, **không có cô lập riêng theo từng học sinh/thiết bị** (Amplify Data không hỗ trợ owner-auth qua identity pool cho guest). Nếu cần riêng tư thật sự, phải chuyển sang đăng nhập Cognito User Pool thật. Chi tiết trong DEPLOY.md mục 3.

## Bắt đầu

```bash
npm install
```

### 1. Backend

Backend `main` (Cognito guest + AppSync + DynamoDB, region `ap-southeast-1`) **đã được deploy** — xem [DEPLOY.md](./DEPLOY.md). `amplify_outputs.json` ở máy bạn hiện trỏ vào backend thật đó (file này bị gitignore, không commit).

Muốn có backend riêng để dev/test không ảnh hưởng dữ liệu thật trên `main`, dùng sandbox cá nhân:

```bash
npm run sandbox
```

Lệnh này chạy liên tục, theo dõi thay đổi trong `amplify/` và đồng bộ lại backend + ghi đè `amplify_outputs.json` bằng backend sandbox riêng của bạn. Dừng bằng Ctrl+C rồi chạy lại bước 3 trong DEPLOY.md nếu muốn quay lại trỏ vào backend `main`.

### 2. Chạy app

```bash
npm run dev
```

Mở `http://localhost:3000`.

### 3. Deploy

Đã deploy thủ công qua AWS CLI lần đầu (không có GitHub repo để connect CI/CD) — toàn bộ lệnh trong [DEPLOY.md](./DEPLOY.md), kèm hướng dẫn deploy lại sau khi sửa code và cách nối GitHub để có CI/CD tự động về sau.

Đã kiểm tra qua AWS CLI sau deploy:

- 2 bảng DynamoDB (`WordSet`, `Word`) đều `PAY_PER_REQUEST` (`aws dynamodb describe-table ... BillingModeSummary`).
- Cognito Identity Pool cho phép unauthenticated identities (`unauthenticated_identities_enabled: true` trong `amplify_outputs.json`).
- Không có API Gateway nào được tạo. Có vài Lambda nội bộ do CDK/Amplify Gen 2 tự sinh (`TableManagerCustomProvider`, `CustomCDKBucketDeployment`, `AmplifyBranchLinker...`) — đây là custom resource provider chuẩn của framework để quản lý vòng đời DynamoDB table/S3 asset, **không** phải Lambda phục vụ logic API (AppSync gọi thẳng DynamoDB qua VTL resolver, không qua Lambda nào cho CRUD WordSet/Word) — đúng như kiến trúc mong muốn trong CLAUDE.md.

## Cấu trúc chính

- `amplify/data/resource.ts` — schema `WordSet` / `Word`, quyền `allow.guest()`.
- `amplify/auth/resource.ts` + `amplify/backend.ts` — guest/unauthenticated access.
- `app/composables/useWordSets.ts` — CRUD qua Amplify Data client.
- `app/composables/useGameState.ts` — state lượt chơi word rain + `SPEED_PRESETS` (chậm/vừa/nhanh, client-only).
- `app/pages/` — `index` (danh sách), `create` (nhập từ), `edit/[id]` (sửa bài), `play/[id]` (chơi), `review/[id]` (flashcard).

## Sửa bài học

Nút "Sửa" ở trang danh sách → `edit/[id].vue`, tái sử dụng `WordSetForm.vue` (điền sẵn tên bài + danh sách từ hiện có qua props `initial-title`/`initial-words`) → gọi `updateWordSet()` trong `useWordSets.ts`, ghi đè title và toàn bộ danh sách Word (xoá cũ, tạo lại theo thứ tự mới). Vì backend dùng `allow.guest()` dùng chung 1 vùng dữ liệu (xem cảnh báo phía trên), **ai có link cũng sửa được bất kỳ bài nào** — không giới hạn theo người tạo.

## Parse dòng nhập nhanh (từ có gạch nối)

`WordSetForm.vue` chỉ coi `-`/`|` là dấu phân tách từ/nghĩa khi có khoảng trắng ở **cả hai bên** (`"term - meaning"`), và chỉ tách tại lần khớp đầu tiên trong dòng. Nhờ vậy các từ có gạch nối dính liền như `hand-craft - nghĩa một từ` hay `x-ray - tia X` không bị cắt nhầm ở dấu `-` giữa từ (trước đây dùng `/\s*[-|]\s*/`, coi mọi dấu `-` là phân cách nên bị lỗi format với từ kiểu này).

## Tốc độ rơi (Chậm / Vừa / Nhanh)

Trước khi chơi, `WordRainGame.vue` hiện màn chọn tốc độ; lựa chọn được lưu vào `localStorage` (`wordrain:speed`) nên lần chơi sau tự chọn lại mức đã dùng. Mỗi mức (định nghĩa trong `SPEED_PRESETS` ở `useGameState.ts`) chỉnh cả tốc độ rơi (`base`, `%/giây`), độ tăng tốc theo điểm (`step`) lẫn nhịp độ xuất hiện từ mới (`spawnIntervalMs`) — không chỉ làm từ rơi chậm hơn mà còn giãn thời gian giữa các từ, để học sinh gõ chậm vẫn theo kịp ở mức "Chậm". "Chơi lại" mở lại màn chọn tốc độ, có thể đổi mức khác mỗi lượt.
