# Word Rain — Game học từ vựng (Nuxt + AWS Amplify + DynamoDB)

> File này dùng để Claude Code đọc khi bắt đầu làm việc trong project. Đặt file này ở **root thư mục project**, đặt tên là `CLAUDE.md`.

---

## 1. Tổng quan dự án

**Word Rain** là web app giúp học sinh học từ vựng theo kiểu "từ rơi" (giống Typing Attack / kiểu chữ rơi phải gõ trước khi chạm đáy màn hình).

Luồng sử dụng chính:
1. Học sinh **nhập danh sách từ vựng** cho một bài học (bài = "word set").
2. App **lưu toàn bộ danh sách từ theo bài** đó lại (DynamoDB).
3. Học sinh **chơi game "word rain"**: từ rơi từ trên xuống, học sinh gõ đúng từ để "bắn hạ" trước khi nó chạm đáy.
4. Sau khi chơi hết một lượt (hết danh sách từ), học sinh có thể **chơi lại bài đó** (reset lượt chơi, không cần nhập lại từ).
5. Học sinh có thể **ôn tập bằng flashcard** cho từng bài đã lưu (lật thẻ xem nghĩa/từ).

**Ưu tiên tuyệt đối: chi phí AWS thấp nhất có thể.** Mọi quyết định kỹ thuật bên dưới đều ưu tiên free tier / pay-per-use rẻ, tránh các service tính phí cố định.

---

## 2. Stack bắt buộc

- **Frontend/Fullstack framework:** Nuxt 3 (SSR hoặc static — ưu tiên **static/SSG** để giảm chi phí hosting, xem mục 4)
- **Hosting + CI/CD:** AWS Amplify Hosting
- **Database:** Amazon DynamoDB
- **Truy cập dữ liệu:** AWS Amplify Gen 2 (`amplify/data`) — dùng Amplify Data (AppSync + DynamoDB được Amplify quản lý), gọi thẳng từ client, **không viết Lambda function riêng**, **không dùng API Gateway riêng** để tránh phát sinh thêm service phải trả phí/quản lý.
- **Auth:** Amplify Auth ở chế độ **guest/unauthenticated access** (không bắt học sinh đăng nhập) → tránh chi phí và phức tạp của Cognito User Pool. Nếu sau này cần lưu theo tài khoản, có thể nâng cấp lên Cognito User Pool.

---

## 3. Tính năng chi tiết

### 3.1 Nhập từ vựng (Create Word Set)
- Form nhập: tên bài học (title), danh sách cặp **từ — nghĩa** (word, meaning).
- Cho phép nhập nhiều dòng cùng lúc (textarea, mỗi dòng `từ - nghĩa` hoặc `từ | nghĩa`) để nhập nhanh, kèm chế độ nhập từng cặp thủ công.
- Parse dòng nhập nhanh: chỉ coi `-`/`|` là dấu phân tách khi có khoảng trắng ở CẢ HAI bên (`"term - meaning"`), tách tại lần khớp đầu tiên. Nhờ vậy từ có gạch nối dính liền như `hand-craft`, `x-ray` không bị cắt nhầm giữa từ (dấu `-` bên trong không có khoảng trắng bao quanh thì giữ nguyên).
- Validate: không để trống từ, không trùng từ trong cùng 1 bài.
- Lưu thành 1 **WordSet** record + danh sách **Word** con (xem schema mục 5).

### 3.2 Chơi Word Rain
- Chọn 1 bài đã lưu → chọn **tốc độ rơi: Chậm / Vừa / Nhanh** → bắt đầu chơi (tốc độ được ghi nhớ ở `localStorage` cho lần chơi sau, mặc định "Vừa").
  - Mỗi mức tốc độ chỉnh cả tốc độ rơi (%/giây) lẫn nhịp độ xuất hiện từ mới (spawn interval), không chỉ tốc độ rơi — "Chậm" vừa rơi chậm hơn vừa giãn cách giữa các từ ra lâu hơn, để học sinh gõ chậm vẫn theo kịp.
- Từ (hiển thị nghĩa hoặc từ, tuỳ chế độ) rơi từ trên xuống với tốc độ tăng dần theo điểm số, dựa trên mức tốc độ đã chọn.
- Học sinh gõ vào ô input; gõ đúng từ đang rơi gần đáy nhất (hoặc từ trùng khớp) → từ đó biến mất, cộng điểm.
- Từ rơi chạm đáy mà chưa gõ đúng → tính là "trượt" (miss), từ đó quay lại hàng chờ hoặc bị đánh dấu để ôn lại.
- Hết danh sách từ trong bài (mọi từ đã được gõ đúng ít nhất 1 lần trong lượt) → màn hình kết quả: số từ đúng, số lần trượt, thời gian.
- Nút **"Chơi lại"**: reset lượt chơi hiện tại với đúng bộ từ đó (không cần nhập lại), quay lại màn chọn tốc độ (có thể đổi mức khác).

### 3.3 Flashcard Review
- Chọn 1 bài đã lưu → vào chế độ flashcard.
- Hiển thị từng thẻ: mặt trước là từ, bấm/chạm để lật sang mặt sau là nghĩa (hoặc ngược lại).
- Điều hướng thẻ trước/sau, có thể xáo trộn thứ tự (shuffle).

### 3.4 Danh sách bài đã lưu
- Trang liệt kê các WordSet đã tạo, mỗi bài hiển thị: tên bài, số từ, ngày tạo, 4 nút hành động: Chơi, Sửa, Ôn flashcard, Xoá.

### 3.5 Sửa bài học (Edit Word Set)
- Từ danh sách, bấm "Sửa" → mở lại đúng form nhập từ (mục 3.1) với tên bài + danh sách từ hiện tại đã điền sẵn.
- Sửa xong bấm "Cập nhật bài học" → ghi đè title + toàn bộ danh sách Word của bài đó (xoá hết Word cũ, tạo lại theo danh sách mới — đơn giản và đủ dùng vì đây là thao tác không thường xuyên, không phải hot path lúc chơi game).
- Validate giống lúc tạo mới: không để trống từ, không trùng từ trong bài.
- **Ai cũng sửa được** (không giới hạn theo người tạo) — vì auth hiện tại là `allow.guest()` dùng chung 1 vùng dữ liệu cho mọi khách (xem mục 5), không có khái niệm "chủ bài học" để giới hạn quyền sửa/xoá theo từng người.

---

## 4. Kiến trúc & lý do tối ưu chi phí

```
┌─────────────────────────┐
│   Nuxt 3 (SSG - generate)│──── build tĩnh, không cần server Node chạy 24/7
└────────────┬─────────────┘
             │ deploy
             ▼
┌─────────────────────────┐
│   AWS Amplify Hosting    │──── static hosting + CDN, free tier: 1000 build min/tháng,
└────────────┬─────────────┘     15GB serve/tháng, 5GB storage — đủ cho project nhỏ
             │ SDK call (client-side, aws-amplify JS lib)
             ▼
┌─────────────────────────┐
│  Amplify Data (AppSync)  │──── GraphQL API tự sinh, KHÔNG viết resolver/Lambda thủ công
└────────────┬─────────────┘
             ▼
┌─────────────────────────┐
│      DynamoDB            │──── billing mode PAY_PER_REQUEST (on-demand)
└───────────────────────────┘     không trả phí khi không có traffic
```

**Vì sao chọn Nuxt SSG thay vì SSR:**
Nuxt SSR cần server Node chạy liên tục (Amplify sẽ dùng Lambda@Edge/SSR compute → tốn phí theo request + có thể có cold start). Vì app này không cần SEO động hay dữ liệu render phía server theo user, dùng `nuxt generate` (static) là đủ và **hoàn toàn nằm trong Amplify Hosting free tier**, không phát sinh compute cost.

**Vì sao dùng Amplify Data thay vì tự viết Lambda + API Gateway:**
Amplify Data tự sinh AppSync API gọi thẳng DynamoDB, không cần thêm Lambda/API Gateway riêng → giảm số service phải trả phí và giảm độ phức tạp. AppSync free tier: 250,000 query/mutation/tháng — dư sức cho vài trăm học sinh dùng.

**Vì sao dùng Auth ở chế độ guest (unauthenticated):**
Cognito Identity Pool cho unauthenticated access **miễn phí** (không tính theo MAU như User Pool có đăng nhập). Học sinh không cần tạo tài khoản, dữ liệu được gắn theo `identityId` ẩn danh của trình duyệt/thiết bị đó. Nếu về sau muốn học sinh đăng nhập để đồng bộ nhiều thiết bị, nâng cấp thêm Cognito User Pool sau (không bắt buộc ngay).

**DynamoDB billing mode:** luôn để `PAY_PER_REQUEST`, tuyệt đối không để `PROVISIONED` — vì app traffic thấp/không đều, on-demand sẽ rẻ hơn nhiều và không tốn phí lúc rảnh.

---

## 5. Data model (DynamoDB qua Amplify Data)

Định nghĩa trong `amplify/data/resource.ts`, dùng schema builder của Amplify Gen 2:

```
WordSet
- id: string (PK, tự sinh)
- title: string
- owner: string (identityId ẩn danh, tự gán qua auth rule)
- wordCount: int
- createdAt: datetime (tự sinh)
- words: có quan hệ 1-nhiều với Word

Word
- id: string (PK, tự sinh)
- wordSetId: string (FK -> WordSet.id)
- term: string        // từ cần học
- meaning: string      // nghĩa
- order: int           // thứ tự trong bài (để hiển thị ổn định)
```

Quyền truy cập (authorization rule): `allow.guest()` — chỉ owner (theo identityId ẩn danh của phiên) mới đọc/ghi được dữ liệu của mình. Việc này giúp mỗi thiết bị chỉ thấy bài của chính nó mà không cần đăng nhập.

> Trạng thái chơi (lượt chơi hiện tại, từ nào đã gõ đúng, điểm số) **không cần lưu DynamoDB** — giữ hoàn toàn ở state phía client (Pinia store hoặc composable), vì "chơi lại" chỉ cần load lại danh sách từ gốc từ DynamoDB rồi reset state local. Việc này giảm số lần ghi vào DynamoDB → giảm chi phí.

---

## 6. Cấu trúc thư mục đề xuất

```
word-rain/
├── amplify/
│   ├── data/
│   │   └── resource.ts          # schema WordSet, Word
│   ├── auth/
│   │   └── resource.ts          # guest access
│   └── backend.ts
├── app/  (hoặc thư mục gốc Nuxt tuỳ version)
├── components/
│   ├── WordSetForm.vue          # form nhập từ (tái dùng cho cả tạo mới + sửa)
│   ├── WordRainGame.vue         # màn chọn tốc độ + màn chơi game
│   ├── FlashcardDeck.vue        # màn hình flashcard
│   └── WordSetList.vue          # danh sách bài đã lưu
├── composables/
│   ├── useWordSets.ts           # CRUD WordSet/Word qua Amplify Data client
│   └── useGameState.ts          # state lượt chơi + SPEED_PRESETS (slow/medium/fast, client-only)
├── pages/
│   ├── index.vue                # danh sách bài
│   ├── create.vue               # nhập từ mới
│   ├── edit/[id].vue            # sửa bài đã lưu (dùng lại WordSetForm)
│   ├── play/[id].vue            # chơi word rain theo bài
│   └── review/[id].vue          # flashcard theo bài
├── amplify_outputs.json         # Amplify tự sinh sau khi deploy, KHÔNG sửa tay
├── nuxt.config.ts                # ssr: false, hoặc target static
├── CLAUDE.md                     # file này
└── package.json
```

---

## 7. Ước tính & kiểm soát chi phí

| Thành phần | Free tier / mức rẻ | Ghi chú |
|---|---|---|
| Amplify Hosting | 1000 build phút + 15GB băng thông/tháng miễn phí | App static nên gần như không vượt |
| AppSync (qua Amplify Data) | 250,000 request/tháng miễn phí | Đủ cho vài trăm học sinh dùng thường xuyên |
| DynamoDB on-demand | 25GB storage + 25 WCU/RCU dạng free tier (12 tháng đầu), sau đó tính theo request rất nhỏ (USD/triệu request) | Không tính phí giờ nhàn rỗi |
| Cognito Identity Pool (guest) | Miễn phí hoàn toàn cho unauthenticated identities | Không dùng User Pool |

**Nguyên tắc khi code:** hạn chế tối đa số lần gọi ghi (mutation) vào DynamoDB trong lúc chơi game — chỉ ghi khi cần (vd: lưu thống kê lượt chơi cuối, nếu có), không ghi theo từng từ gõ đúng.

---

## 8. Việc cần Claude Code làm theo (task breakdown)

Làm tuần tự, mỗi bước xong thì test trước khi qua bước sau:

1. **Khởi tạo Nuxt 3 project**, cấu hình `ssr: false` (hoặc dùng `nuxt generate`).
2. **Khởi tạo Amplify Gen 2** trong project (`npx create-amplify` hoặc tương đương), cấu hình region gần Việt Nam nhất có sẵn (vd `ap-southeast-1` Singapore) để giảm latency.
3. Định nghĩa **schema DynamoDB** (`WordSet`, `Word`) trong `amplify/data/resource.ts` như mục 5, auth rule `allow.guest()`.
4. Cấu hình **Amplify Auth guest access** trong `amplify/auth/resource.ts`.
5. Build **composable `useWordSets.ts`**: các hàm `createWordSet`, `listWordSets`, `getWordSetWithWords`, `updateWordSet`, `deleteWordSet`.
6. Build **trang nhập từ** (`create.vue` + `WordSetForm.vue`): form + parse textarea nhập nhanh + validate + gọi `createWordSet`.
7. Build **trang danh sách** (`index.vue` + `WordSetList.vue`), có nút Sửa dẫn tới `edit/[id].vue`.
7b. Build **trang sửa bài** (`edit/[id].vue`): load `getWordSetWithWords`, tái sử dụng `WordSetForm.vue` (điền sẵn title/words qua props), gọi `updateWordSet` khi lưu.
8. Build **composable `useGameState.ts`**: quản lý state lượt chơi (client-only) — danh sách từ còn lại, từ đang rơi, điểm số, trạng thái "hoàn thành lượt".
9. Build **game Word Rain** (`play/[id].vue` + `WordRainGame.vue`): animation từ rơi (CSS transition hoặc `requestAnimationFrame`), input gõ, xử lý đúng/sai, màn hình kết quả, nút chơi lại (reset `useGameState` với cùng bộ từ, không gọi lại DynamoDB nếu đã cache trong state).
10. Build **flashcard** (`review/[id].vue` + `FlashcardDeck.vue`): lật thẻ, next/prev, shuffle.
11. **Deploy lên Amplify Hosting**, kết nối repo Git, kiểm tra build static thành công và app chạy đúng với backend Amplify Data.
12. Kiểm tra lại toàn bộ: đảm bảo DynamoDB ở `PAY_PER_REQUEST`, không có Lambda/API Gateway thừa nào được tạo ra ngoài ý muốn (Amplify Gen 2 đôi khi tự tạo function phụ trợ — cần rà lại trong AWS Console).

---

## 9. Quy ước code

- Dùng **TypeScript** cho toàn bộ composables và schema Amplify.
- Component đặt tên PascalCase, file `.vue`.
- Không hardcode region/endpoint — luôn đọc từ `amplify_outputs.json` qua `Amplify.configure()`.
- Không commit `amplify_outputs.json` chứa thông tin nhạy cảm nếu repo public (thêm vào `.gitignore` nếu cần, tuỳ chính sách của bạn).
- Ưu tiên composable + Pinia (nếu cần state phức tạp) hơn là prop-drilling nhiều tầng.
