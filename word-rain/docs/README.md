# Word Rain — sơ đồ kiến trúc

Mỗi sơ đồ có 2 file: `.drawio` (mở/sửa bằng [draw.io](https://app.diagrams.net) hoặc extension draw.io trong VS Code) và `.png` (xem nhanh).

| # | Sơ đồ | Trả lời câu hỏi |
|---|---|---|
| 1 | [01-aws-architecture](./01-aws-architecture.png) | Web chạy trên AWS thế nào, dữ liệu đi đâu, đã deploy ra sao |
| 2 | [02-frontend-structure](./02-frontend-structure.png) | File nào gọi file nào trong code Nuxt |
| 3 | [03-game-flow](./03-game-flow.png) | Một lượt chơi word rain diễn ra thế nào |

## 1. Kiến trúc AWS (`01-aws-architecture`)

Luồng lúc chạy (các cạnh đánh số):

1. Trình duyệt tải site tĩnh (Nuxt `ssr: false`, build bằng `nuxt generate`) từ **Amplify Hosting**.
2. SPA xin **guest credentials** từ **Cognito Identity Pool** (không đăng nhập).
3. SPA gọi **AppSync** (GraphQL) bằng credentials đó, ký SigV4 (IAM auth, rule `allow.guest()`).
4. AppSync đọc/ghi thẳng **DynamoDB** (không Lambda cho CRUD), 2 bảng `WordSet` và `Word`, `PAY_PER_REQUEST`.

Khối "Máy dev" là cách deploy hiện tại (không có git remote nên không có CI/CD): `npx ampx pipeline-deploy` tạo backend qua CloudFormation; frontend build ra zip rồi upload bằng `aws amplify create-deployment` / `start-deployment`. Chi tiết lệnh: [../DEPLOY.md](../DEPLOY.md).

Data model:

- `WordSet`: `id`, `title`, `wordCount`, `createdAt`, `updatedAt`; có nhiều `Word`.
- `Word`: `id`, `wordSetId` (FK), `term`, `meaning`, `order`.

Lưu ý bảo mật: `allow.guest()` nghĩa là mọi khách dùng chung một vùng dữ liệu, ai có link cũng xem/sửa/xoá được mọi bài (xem README chính).

## 2. Cấu trúc code frontend (`02-frontend-structure`)

- `app/pages`: 5 route (`index`, `create`, `edit/[id]`, `play/[id]`, `review/[id]`).
- `app/components`: `WordSetList`, `WordSetForm` (dùng cho cả tạo mới và sửa), `WordRainGame` (chọn tốc độ + màn chơi), `FlashcardDeck`.
- `app/composables`: `useWordSets` (CRUD qua Amplify Data, mọi trang cần dữ liệu đều đi qua đây), `useGameState` (state lượt chơi, chỉ ở client).
- `plugins/amplify.client.ts` cấu hình Amplify từ `amplify_outputs.json`; `generateClient(Schema)` là cửa ra duy nhất tới AppSync/DynamoDB.

## 3. Luồng một lượt chơi (`03-game-flow`)

Chọn bài → đọc danh sách từ 1 lần từ DynamoDB → chọn tốc độ (Chậm/Vừa/Nhanh, nhớ ở `localStorage`) → vòng lặp `requestAnimationFrame` + timer sinh từ mới → gõ đúng thì cộng điểm và tăng tốc, chạm đáy thì tính trượt và từ quay lại hàng chờ → hết từ thì ra màn kết quả → "Chơi lại" quay về màn chọn tốc độ. Toàn bộ vòng lặp chỉ ở client, không ghi DynamoDB lúc chơi.

## Tạo lại / chỉnh sơ đồ

Sơ đồ sinh bằng skill `drawio-aws` (layout engine của `drawio-ai-kit`), không vẽ tay toạ độ. Muốn sửa nhanh thì mở file `.drawio` và chỉnh trực tiếp; nếu code đổi nhiều (thêm trang, đổi luồng) thì nhờ Claude sinh lại các file này.
