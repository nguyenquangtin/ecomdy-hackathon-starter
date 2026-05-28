# Ecomdy Hackathon MVP Starter

> MVP starter kit cho Ecomdy AI Hackathon 2026. Code mẫu để bạn có 1 web app gọi được Ecomdy Marketing API trong khoảng 15 phút, dùng làm điểm khởi đầu cho idea hackathon.

**Stack:** NestJS (backend proxy) + ReactJS với Vite (frontend) + Ecomdy Marketing API.

---

## Kiến trúc

```
React (port 5173)  -->  NestJS proxy (port 3000)  -->  Ecomdy API (api.ecomdy.co/v1)
```

- **Frontend** chỉ chứa UI. Gọi backend qua `/api/video/*`.
- **Backend** là proxy: giữ API key bí mật trong file `.env`, không lộ ra browser. Forward request lên Ecomdy.
- **Không cần database** cho MVP. Thêm sau nếu muốn lưu lịch sử video.

---

## Cần chuẩn bị

- **Node.js 18+** (chạy `node -v` để kiểm tra)
- **API key Ecomdy** dạng `wl_live_xxxxxxxx`, lấy từ [Partner Portal](https://account.ecomdy.co) → API Keys → Create new key
- **~50 credits** để test (1 call `/video/generate` tốn 10 credits)

---

## Quickstart

```bash
# 1. Clone repo
git clone <repo-url> ecomdy-hackathon-starter
cd ecomdy-hackathon-starter

# 2. Cài dependencies cho cả backend và frontend
npm run install:all

# 3. Cấu hình API key (backend)
cp backend/.env.example backend/.env
# Mở backend/.env, dán API key của bạn vào ECOMDY_API_KEY

# 4. Cấu hình URL backend (frontend)
cp frontend/.env.example frontend/.env

# 5. Chạy cả 2 server song song
npm run dev
```

Mở `http://localhost:5173` trong browser. Nhập prompt, bấm "Tạo video", đợi 10-60 giây.

---

## Pattern quan trọng: API là async

Tạo video AI mất 10-60 giây. API thiết kế kiểu async:

1. `POST /video/generate` trả về ngay `202 + { id, status: "pending" }`
2. Client tự poll `GET /jobs/:id` mỗi 2-3 giây
3. Khi `status === "completed"`, trong response có `output_url` là link video MP4

**Sai lầm phổ biến:** ngỡ rằng POST trả luôn video URL. Phải có vòng polling riêng. Xem `frontend/src/VideoGenerator.jsx` để học pattern.

---

## Cấu trúc thư mục

```
ecomdy-hackathon-starter/
├── package.json              # Script chạy cả 2 server cùng lúc
├── backend/                  # NestJS proxy
│   ├── .env.example
│   └── src/
│       ├── main.ts           # Bật CORS, listen 3000
│       ├── app.module.ts
│       └── video/
│           ├── video.service.ts    # Gọi Ecomdy API, 2 method: generate, getJob
│           ├── video.controller.ts # Route HTTP: POST /api/video/generate, GET /api/video/jobs/:id
│           └── video.module.ts
└── frontend/                 # React + Vite
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── VideoGenerator.jsx  # Component chính: form prompt + polling + display video
        └── index.css           # Style tech-bold theme
```

---

## Endpoint backend

| Method | Path                          | Body            | Response                                   |
|--------|-------------------------------|-----------------|--------------------------------------------|
| POST   | `/api/video/generate`         | `{ prompt }`    | `{ id, status: "pending" }`                |
| GET    | `/api/video/jobs/:id`         | -               | `{ id, status, output_url }`               |

`status` có 4 giá trị: `pending`, `processing`, `completed`, `failed`.

---

## Lỗi phổ biến

| Status | Nguyên nhân                                    | Cách fix                                                      |
|--------|------------------------------------------------|---------------------------------------------------------------|
| `401`  | API key sai hoặc thiếu prefix `Bearer`         | Check lại `ECOMDY_API_KEY` trong `backend/.env`               |
| `402`  | Hết credit                                     | Top up tại Partner Portal                                     |
| `400`  | Prompt rỗng hoặc quá 2000 ký tự                | Prompt phải 1-2000 ký tự                                      |
| CORS   | Browser block request                          | Check `enableCors()` trong `backend/src/main.ts`, đúng port   |

Khi debug:

1. Mở terminal chạy `npm run dev`, xem log NestJS có request không
2. Mở DevTools (F12) trong browser, tab Network, click request gần nhất, xem status code + response
3. Nếu thấy lỗi đỏ ở tab Console: thường là CORS hoặc 4xx từ Ecomdy

---

## Nâng cấp sau khi MVP chạy

1. **Thêm database** (Prisma + SQLite) để lưu lịch sử video
2. **Deploy:** Frontend → Vercel/Netlify, Backend → Railway/Render/Fly.io
3. **Khám phá thêm API:** Dubbing (8 credits), Avatar (15 credits), Text-to-Speech (5 credits), Image to Video (10 credits)
4. **Polish UX:** loading skeleton, prompt suggestions, history sidebar
5. **Timeout:** sau 90 giây mà chưa `completed` thì hiển thị "Hệ thống bận, thử lại"

---

## Tài liệu

- **API docs:** https://api.ecomdy.co/docs
- **Partner Portal:** https://account.ecomdy.co
- **Support:** support@ecomdy.co

---

**Chúc may mắn với hackathon. Đội Ecomdy đang chờ xem MVP của bạn.**
