# Gold Price Dashboard — Design Spec

**Date:** 2026-06-16  
**Status:** Approved

## Overview

Web dashboard cá nhân để theo dõi giá vàng trong nước Việt Nam (SJC, DOJI, PNJ) theo thời gian thực. Mục tiêu sử dụng là cho vợ theo dõi giá vàng hàng ngày, không cần tài khoản, truy cập public.

## Architecture

```
[Vercel Cron Jobs - mỗi 1h] 
        │
        ▼
[POST /api/cron]
        │
        ▼
[Scraper Module]
  ├── scrape-sjc.ts
  ├── scrape-doji.ts
  └── scrape-pnj.ts
        │
        ▼
[Neon PostgreSQL via Prisma]
        │
        ▼
[GET /api/prices]
        │
        ▼
[Next.js Dashboard Page]
  ├── PriceTable (giá mua/bán hiện tại)
  ├── HistoryChart (biểu đồ lịch sử)
  └── CompareChart (so sánh các thương hiệu)
```

## Tech Stack

| Layer | Technology | Lý do |
|---|---|---|
| Framework | Next.js 14 (App Router) | API Routes + SSR trong 1 repo |
| Database | Neon DB (PostgreSQL free tier) | Persistent trên Vercel, free 0.5GB |
| ORM | Prisma | Type-safe, migration dễ |
| Scraping | cheerio + node-fetch | Parse HTML nhẹ, không cần browser |
| Chart | Recharts | Dễ dùng với React, đủ tính năng |
| Styling | Tailwind CSS | Nhanh, responsive |
| Cron | Vercel Cron Jobs | Tích hợp sẵn với Vercel, free 2 jobs |
| Deploy | Vercel free tier | Phù hợp quy mô cá nhân |

## Database Schema

```prisma
model PriceRecord {
  id        Int      @id @default(autoincrement())
  brand     String   // "SJC" | "DOJI" | "PNJ"
  buyPrice  Float    // Giá mua vào (VND/lượng)
  sellPrice Float    // Giá bán ra (VND/lượng)
  unit      String   @default("lượng")
  createdAt DateTime @default(now())

  @@index([brand, createdAt])
}
```

## API Routes

| Route | Method | Mô tả |
|---|---|---|
| `/api/cron` | POST | Trigger scraping tất cả brands, được gọi bởi Vercel Cron. Bảo vệ bằng `CRON_SECRET` header. |
| `/api/prices` | GET | Trả về giá mới nhất của từng brand + lịch sử 7 ngày gần nhất. Query param: `?range=7d\|30d` |

## Components

### PriceTable
Bảng hiển thị giá mua/bán hiện tại của SJC, DOJI, PNJ. Hiển thị thời gian cập nhật gần nhất. Highlight brand có giá mua cao nhất.

### HistoryChart
Biểu đồ đường (LineChart) lịch sử giá theo thời gian. Có thể chọn xem 7 ngày hoặc 30 ngày. Mặc định hiển thị giá bán.

### CompareChart
Biểu đồ so sánh giá bán ra của 3 brand trên cùng 1 chart. Dùng màu khác nhau cho mỗi brand.

## Scraping Strategy

Mỗi scraper là 1 async function trả về `{ brand, buyPrice, sellPrice }`:

- **SJC:** Scrape từ `sjc.com.vn` — parse bảng giá HTML
- **DOJI:** Scrape từ `doji.vn` — parse bảng giá HTML  
- **PNJ:** Scrape từ `pnj.com.vn` — parse section giá vàng

Nếu 1 scraper thất bại (bị chặn, thay đổi HTML), log lỗi và bỏ qua brand đó — không làm crash toàn bộ cron job. Giá cũ vẫn hiển thị với timestamp cũ.

## Vercel Cron Config

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Environment Variables

| Variable | Mô tả |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `CRON_SECRET` | Secret để bảo vệ endpoint `/api/cron` |

## Features

1. **Bảng giá hiện tại** — Giá mua/bán của SJC, DOJI, PNJ, cập nhật mỗi giờ
2. **Biểu đồ lịch sử** — Xem xu hướng giá theo 7 ngày / 30 ngày
3. **So sánh thương hiệu** — Xem brand nào đang mua/bán giá tốt nhất
4. **Thời gian cập nhật** — Hiển thị rõ data được lấy lúc mấy giờ

## Out of Scope

- Authentication / đăng nhập
- Cảnh báo giá (price alert)
- Giá vàng quốc tế (XAU/USD)
- Notification (email, push)
- Mobile app
