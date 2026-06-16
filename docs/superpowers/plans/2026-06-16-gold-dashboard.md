# Gold Price Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js dashboard that scrapes Vietnamese gold prices (SJC, DOJI, PNJ) hourly via Vercel Cron, stores history in Neon PostgreSQL, and displays current prices + trend charts.

**Architecture:** Next.js 14 App Router — API routes handle scraping (`/api/cron`) and data serving (`/api/prices`). Prisma connects to Neon DB. Vercel Cron triggers `/api/cron` every hour. Frontend fetches data client-side and renders Recharts.

**Tech Stack:** Next.js 14, TypeScript, Prisma, Neon DB (PostgreSQL), cheerio, Recharts, Tailwind CSS, Vercel Cron Jobs, Vitest

---

## File Structure

```
gold-traking/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── cron/
│   │       │   └── route.ts
│   │       └── prices/
│   │           └── route.ts
│   ├── lib/
│   │   ├── db.ts
│   │   └── scrapers/
│   │       ├── types.ts
│   │       ├── scrape-sjc.ts
│   │       ├── scrape-doji.ts
│   │       └── scrape-pnj.ts
│   ├── components/
│   │   ├── PriceTable.tsx
│   │   ├── HistoryChart.tsx
│   │   └── CompareChart.tsx
│   └── __tests__/
│       ├── setup.ts
│       ├── scrapers/
│       │   ├── scrape-sjc.test.ts
│       │   ├── scrape-doji.test.ts
│       │   └── scrape-pnj.test.ts
│       └── api/
│           └── prices.test.ts
├── vercel.json
├── vitest.config.ts
├── next.config.ts
└── .env.local
```

---

## Task 1: Initialize Project

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `vitest.config.ts`
- Create: `src/__tests__/setup.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Scaffold Next.js app**

Chạy trong thư mục `E:\vibe-coding\gold-traking`:
```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --no-import-alias
```
Chọn tất cả mặc định khi được hỏi.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @prisma/client cheerio recharts
npm install -D prisma @types/cheerio vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure vitest**

Tạo `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Create test setup file**

Tạo `src/__tests__/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

Trong `package.json`, thêm vào `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 6: Update next.config.ts**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
}

export default nextConfig
```

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with Tailwind, Vitest"
```

---

## Task 2: Prisma Schema & DB Client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `.env.local`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema**

Thay toàn bộ nội dung `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model PriceRecord {
  id        Int      @id @default(autoincrement())
  brand     String
  buyPrice  Float
  sellPrice Float
  unit      String   @default("luong")
  createdAt DateTime @default(now())

  @@index([brand, createdAt])
}
```

- [ ] **Step 3: Create .env.local**

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
CRON_SECRET="dev-secret-change-in-production"
```

> **Lưu ý:** Thay DATABASE_URL bằng connection string từ Neon Dashboard sau khi tạo project tại neon.tech.

- [ ] **Step 4: Create Prisma client singleton**

Tạo `src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: Run migration**

```bash
npx prisma db push
npx prisma generate
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 6: Commit**

```bash
git add prisma/ src/lib/db.ts .env.local
git commit -m "feat: add Prisma schema and DB client"
```

---

## Task 3: Scraper Types

**Files:**
- Create: `src/lib/scrapers/types.ts`

- [ ] **Step 1: Write types file**

Tạo `src/lib/scrapers/types.ts`:
```typescript
export type Brand = 'SJC' | 'DOJI' | 'PNJ'

export interface GoldPrice {
  brand: Brand
  buyPrice: number  // full VND (e.g., 85200000)
  sellPrice: number // full VND (e.g., 85600000)
}

export interface ScrapeResult {
  success: boolean
  data?: GoldPrice
  error?: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/scrapers/types.ts
git commit -m "feat: add scraper types"
```

---

## Task 4: SJC Scraper

**Files:**
- Create: `src/lib/scrapers/scrape-sjc.ts`
- Create: `src/__tests__/scrapers/scrape-sjc.test.ts`

- [ ] **Step 1: Write failing test**

Tạo `src/__tests__/scrapers/scrape-sjc.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeSJC } from '@/lib/scrapers/scrape-sjc'

const MOCK_HTML = `
<html><body>
  <table>
    <tbody>
      <tr>
        <td>Vàng SJC 1L, 10L, 1KG</td>
        <td>85.200</td>
        <td>85.600</td>
      </tr>
    </tbody>
  </table>
</body></html>
`

describe('scrapeSJC', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns gold prices on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => MOCK_HTML,
    } as Response)

    const result = await scrapeSJC()

    expect(result.success).toBe(true)
    expect(result.data?.brand).toBe('SJC')
    expect(result.data?.buyPrice).toBe(85200000)
    expect(result.data?.sellPrice).toBe(85600000)
  })

  it('returns failure when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const result = await scrapeSJC()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Network error')
  })

  it('returns failure when HTTP status is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '',
    } as Response)

    const result = await scrapeSJC()

    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/__tests__/scrapers/scrape-sjc.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/scrapers/scrape-sjc'`

- [ ] **Step 3: Write SJC scraper**

Tạo `src/lib/scrapers/scrape-sjc.ts`:
```typescript
import * as cheerio from 'cheerio'
import { GoldPrice, ScrapeResult } from './types'

function parsePrice(text: string): number {
  // "85.200" (VN format with dot as thousands sep) → 85200 → * 1000 = 85200000 VND
  const digits = parseInt(text.trim().replace(/\./g, '').replace(',', ''), 10)
  return digits * 1000
}

export async function scrapeSJC(): Promise<ScrapeResult> {
  try {
    const response = await fetch('https://sjc.com.vn', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    let buyPrice = 0
    let sellPrice = 0

    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td')
      const name = $(cells.get(0)).text().trim()
      if ((name.includes('1L') || name.includes('SJC')) && buyPrice === 0) {
        buyPrice = parsePrice($(cells.get(1)).text())
        sellPrice = parsePrice($(cells.get(2)).text())
      }
    })

    if (buyPrice === 0 || sellPrice === 0) {
      return { success: false, error: 'SJC: không tìm thấy giá trong bảng' }
    }

    return { success: true, data: { brand: 'SJC', buyPrice, sellPrice } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/__tests__/scrapers/scrape-sjc.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/scrapers/scrape-sjc.ts src/__tests__/scrapers/scrape-sjc.test.ts
git commit -m "feat: add SJC scraper with tests"
```

---

## Task 5: DOJI Scraper

**Files:**
- Create: `src/lib/scrapers/scrape-doji.ts`
- Create: `src/__tests__/scrapers/scrape-doji.test.ts`

- [ ] **Step 1: Write failing test**

Tạo `src/__tests__/scrapers/scrape-doji.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeDOJI } from '@/lib/scrapers/scrape-doji'

const MOCK_HTML = `
<html><body>
  <table>
    <tbody>
      <tr>
        <td>Vàng DOJI SJC</td>
        <td>85.100</td>
        <td>85.500</td>
      </tr>
    </tbody>
  </table>
</body></html>
`

describe('scrapeDOJI', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns gold prices on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => MOCK_HTML,
    } as Response)

    const result = await scrapeDOJI()

    expect(result.success).toBe(true)
    expect(result.data?.brand).toBe('DOJI')
    expect(result.data?.buyPrice).toBe(85100000)
    expect(result.data?.sellPrice).toBe(85500000)
  })

  it('returns failure when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Connection refused'))

    const result = await scrapeDOJI()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Connection refused')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/__tests__/scrapers/scrape-doji.test.ts
```

Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Write DOJI scraper**

Tạo `src/lib/scrapers/scrape-doji.ts`:
```typescript
import * as cheerio from 'cheerio'
import { ScrapeResult } from './types'

function parsePrice(text: string): number {
  const digits = parseInt(text.trim().replace(/\./g, '').replace(',', ''), 10)
  return digits * 1000
}

export async function scrapeDOJI(): Promise<ScrapeResult> {
  try {
    const response = await fetch('https://doji.vn/bang-gia-vang/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    let buyPrice = 0
    let sellPrice = 0

    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td')
      const name = $(cells.get(0)).text().trim()
      if ((name.includes('SJC') || name.includes('DOJI')) && buyPrice === 0) {
        buyPrice = parsePrice($(cells.get(1)).text())
        sellPrice = parsePrice($(cells.get(2)).text())
      }
    })

    if (buyPrice === 0 || sellPrice === 0) {
      return { success: false, error: 'DOJI: không tìm thấy giá trong bảng' }
    }

    return { success: true, data: { brand: 'DOJI', buyPrice, sellPrice } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/__tests__/scrapers/scrape-doji.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/scrapers/scrape-doji.ts src/__tests__/scrapers/scrape-doji.test.ts
git commit -m "feat: add DOJI scraper with tests"
```

---

## Task 6: PNJ Scraper

**Files:**
- Create: `src/lib/scrapers/scrape-pnj.ts`
- Create: `src/__tests__/scrapers/scrape-pnj.test.ts`

- [ ] **Step 1: Write failing test**

Tạo `src/__tests__/scrapers/scrape-pnj.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapePNJ } from '@/lib/scrapers/scrape-pnj'

const MOCK_HTML = `
<html><body>
  <table>
    <tbody>
      <tr>
        <td>Vàng SJC PNJ</td>
        <td>85.000</td>
        <td>85.400</td>
      </tr>
    </tbody>
  </table>
</body></html>
`

describe('scrapePNJ', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns gold prices on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => MOCK_HTML,
    } as Response)

    const result = await scrapePNJ()

    expect(result.success).toBe(true)
    expect(result.data?.brand).toBe('PNJ')
    expect(result.data?.buyPrice).toBe(85000000)
    expect(result.data?.sellPrice).toBe(85400000)
  })

  it('returns failure when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Timeout'))

    const result = await scrapePNJ()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Timeout')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/__tests__/scrapers/scrape-pnj.test.ts
```

Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Write PNJ scraper**

Tạo `src/lib/scrapers/scrape-pnj.ts`:
```typescript
import * as cheerio from 'cheerio'
import { ScrapeResult } from './types'

function parsePrice(text: string): number {
  const digits = parseInt(text.trim().replace(/\./g, '').replace(',', ''), 10)
  return digits * 1000
}

export async function scrapePNJ(): Promise<ScrapeResult> {
  try {
    const response = await fetch('https://www.pnj.com.vn/blog/gia-vang/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    let buyPrice = 0
    let sellPrice = 0

    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td')
      const name = $(cells.get(0)).text().trim()
      if ((name.includes('SJC') || name.includes('PNJ')) && buyPrice === 0) {
        buyPrice = parsePrice($(cells.get(1)).text())
        sellPrice = parsePrice($(cells.get(2)).text())
      }
    })

    if (buyPrice === 0 || sellPrice === 0) {
      return { success: false, error: 'PNJ: không tìm thấy giá trong bảng' }
    }

    return { success: true, data: { brand: 'PNJ', buyPrice, sellPrice } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/__tests__/scrapers/scrape-pnj.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/scrapers/scrape-pnj.ts src/__tests__/scrapers/scrape-pnj.test.ts
git commit -m "feat: add PNJ scraper with tests"
```

---

## Task 7: /api/cron Route

**Files:**
- Create: `src/app/api/cron/route.ts`

- [ ] **Step 1: Write the cron route**

Tạo `src/app/api/cron/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scrapeSJC } from '@/lib/scrapers/scrape-sjc'
import { scrapeDOJI } from '@/lib/scrapers/scrape-doji'
import { scrapePNJ } from '@/lib/scrapers/scrape-pnj'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scrapers = [scrapeSJC, scrapeDOJI, scrapePNJ]
  const results = await Promise.allSettled(scrapers.map((fn) => fn()))

  const saved: string[] = []
  const errors: string[] = []

  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push(String(result.reason))
      continue
    }

    const scrapeResult = result.value
    if (!scrapeResult.success || !scrapeResult.data) {
      errors.push(scrapeResult.error ?? 'Unknown scrape error')
      continue
    }

    await prisma.priceRecord.create({
      data: {
        brand: scrapeResult.data.brand,
        buyPrice: scrapeResult.data.buyPrice,
        sellPrice: scrapeResult.data.sellPrice,
      },
    })
    saved.push(scrapeResult.data.brand)
  }

  return NextResponse.json({ saved, errors })
}
```

- [ ] **Step 2: Verify authorization works locally**

```bash
# Start the dev server in one terminal
npm run dev

# In another terminal, test unauthorized request
curl -X POST http://localhost:3000/api/cron
# Expected: {"error":"Unauthorized"} with 401

# Test authorized request (uses dev-secret from .env.local)
curl -X POST http://localhost:3000/api/cron \
  -H "Authorization: Bearer dev-secret-change-in-production"
# Expected: {"saved":["SJC","DOJI","PNJ"],"errors":[]} or errors if sites block scraping
```

> **Lưu ý về scraper selectors:** Nếu `saved` trả về rỗng và `errors` có giá trị "không tìm thấy giá", cần kiểm tra HTML thực tế của từng site và cập nhật CSS selector trong scraper tương ứng. Xem phần Troubleshooting ở cuối file này.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/route.ts
git commit -m "feat: add /api/cron route with auth and error isolation"
```

---

## Task 8: /api/prices Route

**Files:**
- Create: `src/app/api/prices/route.ts`
- Create: `src/__tests__/api/prices.test.ts`

- [ ] **Step 1: Write the prices route**

Tạo `src/app/api/prices/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') === '30d' ? 30 : 7

  const since = new Date()
  since.setDate(since.getDate() - range)

  const brands = ['SJC', 'DOJI', 'PNJ']

  const [latest, history] = await Promise.all([
    // Lấy bản ghi mới nhất của từng brand
    Promise.all(
      brands.map((brand) =>
        prisma.priceRecord.findFirst({
          where: { brand },
          orderBy: { createdAt: 'desc' },
        })
      )
    ),
    // Lấy lịch sử theo range
    prisma.priceRecord.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: {
        brand: true,
        buyPrice: true,
        sellPrice: true,
        createdAt: true,
      },
    }),
  ])

  return NextResponse.json({
    latest: latest
      .filter(Boolean)
      .map((r) => ({
        brand: r!.brand,
        buyPrice: r!.buyPrice,
        sellPrice: r!.sellPrice,
        updatedAt: r!.createdAt.toISOString(),
      })),
    history,
  })
}
```

- [ ] **Step 2: Test the endpoint manually**

```bash
curl http://localhost:3000/api/prices
# Expected: {"latest":[...],"history":[...]}

curl "http://localhost:3000/api/prices?range=30d"
# Expected: same structure, history spans 30 days
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/prices/route.ts
git commit -m "feat: add /api/prices route"
```

---

## Task 9: PriceTable Component

**Files:**
- Create: `src/components/PriceTable.tsx`

- [ ] **Step 1: Write PriceTable component**

Tạo `src/components/PriceTable.tsx`:
```typescript
'use client'

interface PriceEntry {
  brand: string
  buyPrice: number
  sellPrice: number
  updatedAt: string
}

interface PriceTableProps {
  data: PriceEntry[]
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoString))
}

export function PriceTable({ data }: PriceTableProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        Chưa có dữ liệu. Cron job sẽ cập nhật vào giờ tiếp theo.
      </div>
    )
  }

  const maxBuyBrand = data.reduce((max, cur) =>
    cur.buyPrice > max.buyPrice ? cur : max
  )

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-yellow-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Thương hiệu</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Mua vào</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Bán ra</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Cập nhật</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr
              key={row.brand}
              className={
                row.brand === maxBuyBrand.brand
                  ? 'bg-yellow-50/60'
                  : 'bg-white hover:bg-gray-50'
              }
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {row.brand}
                {row.brand === maxBuyBrand.brand && (
                  <span className="ml-2 rounded-full bg-yellow-200 px-2 py-0.5 text-xs text-yellow-800">
                    Mua cao nhất
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-green-700 font-medium">
                {formatVND(row.buyPrice)}
              </td>
              <td className="px-4 py-3 text-right text-red-600 font-medium">
                {formatVND(row.sellPrice)}
              </td>
              <td className="px-4 py-3 text-right text-gray-400 text-xs">
                {formatTime(row.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PriceTable.tsx
git commit -m "feat: add PriceTable component"
```

---

## Task 10: HistoryChart Component

**Files:**
- Create: `src/components/HistoryChart.tsx`

- [ ] **Step 1: Write HistoryChart component**

Tạo `src/components/HistoryChart.tsx`:
```typescript
'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface HistoryRecord {
  brand: string
  buyPrice: number
  sellPrice: number
  createdAt: string
}

interface HistoryChartProps {
  data: HistoryRecord[]
  selectedBrand: string
}

function formatVNDShort(value: number): string {
  return `${(value / 1_000_000).toFixed(1)}tr`
}

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}h`
}

export function HistoryChart({ data, selectedBrand }: HistoryChartProps) {
  const [priceType, setPriceType] = useState<'sellPrice' | 'buyPrice'>('sellPrice')

  const filtered = data
    .filter((r) => r.brand === selectedBrand)
    .map((r) => ({
      time: formatDate(r.createdAt),
      'Giá bán': r.sellPrice,
      'Giá mua': r.buyPrice,
    }))

  if (filtered.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400 text-sm">
        Chưa có dữ liệu lịch sử
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setPriceType('sellPrice')}
          className={`rounded-lg px-3 py-1 text-sm ${
            priceType === 'sellPrice'
              ? 'bg-yellow-500 text-white'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Giá bán
        </button>
        <button
          onClick={() => setPriceType('buyPrice')}
          className={`rounded-lg px-3 py-1 text-sm ${
            priceType === 'buyPrice'
              ? 'bg-yellow-500 text-white'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Giá mua
        </button>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={formatVNDShort}
            tick={{ fontSize: 11 }}
            width={55}
          />
          <Tooltip
            formatter={(value: number) => [`${(value / 1_000_000).toFixed(2)} triệu ₫`, '']}
          />
          <Line
            type="monotone"
            dataKey={priceType === 'sellPrice' ? 'Giá bán' : 'Giá mua'}
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HistoryChart.tsx
git commit -m "feat: add HistoryChart component"
```

---

## Task 11: CompareChart Component

**Files:**
- Create: `src/components/CompareChart.tsx`

- [ ] **Step 1: Write CompareChart component**

Tạo `src/components/CompareChart.tsx`:
```typescript
'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface HistoryRecord {
  brand: string
  buyPrice: number
  sellPrice: number
  createdAt: string
}

interface CompareChartProps {
  data: HistoryRecord[]
}

const BRAND_COLORS: Record<string, string> = {
  SJC: '#f59e0b',
  DOJI: '#3b82f6',
  PNJ: '#10b981',
}

function formatVNDShort(value: number): string {
  return `${(value / 1_000_000).toFixed(1)}tr`
}

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}h`
}

export function CompareChart({ data }: CompareChartProps) {
  // Pivot data: group by timestamp, merge all brands
  const timeMap = new Map<string, Record<string, number>>()

  for (const record of data) {
    const time = formatDate(record.createdAt)
    if (!timeMap.has(time)) timeMap.set(time, {})
    timeMap.get(time)![record.brand] = record.sellPrice
  }

  const chartData = Array.from(timeMap.entries()).map(([time, values]) => ({
    time,
    ...values,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400 text-sm">
        Chưa có dữ liệu để so sánh
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={formatVNDShort}
          tick={{ fontSize: 11 }}
          width={55}
        />
        <Tooltip
          formatter={(value: number) => [`${(value / 1_000_000).toFixed(2)} triệu ₫`, '']}
        />
        <Legend />
        {['SJC', 'DOJI', 'PNJ'].map((brand) => (
          <Line
            key={brand}
            type="monotone"
            dataKey={brand}
            stroke={BRAND_COLORS[brand]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CompareChart.tsx
git commit -m "feat: add CompareChart component"
```

---

## Task 12: Dashboard Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

Thay nội dung `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Theo dõi giá vàng',
  description: 'Bảng giá vàng SJC, DOJI, PNJ cập nhật mỗi giờ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${geist.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Write the dashboard page**

Thay nội dung `src/app/page.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { PriceTable } from '@/components/PriceTable'
import { HistoryChart } from '@/components/HistoryChart'
import { CompareChart } from '@/components/CompareChart'

interface PriceEntry {
  brand: string
  buyPrice: number
  sellPrice: number
  updatedAt: string
}

interface HistoryRecord {
  brand: string
  buyPrice: number
  sellPrice: number
  createdAt: string
}

interface PricesData {
  latest: PriceEntry[]
  history: HistoryRecord[]
}

export default function Page() {
  const [data, setData] = useState<PricesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'7d' | '30d'>('7d')
  const [selectedBrand, setSelectedBrand] = useState('SJC')

  async function fetchData(r: '7d' | '30d') {
    setLoading(true)
    try {
      const res = await fetch(`/api/prices?range=${r}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(range)
  }, [range])

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giá vàng hôm nay</h1>
          <p className="mt-1 text-sm text-gray-500">Cập nhật mỗi giờ — SJC, DOJI, PNJ</p>
        </div>
        <button
          onClick={() => fetchData(range)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Làm mới
        </button>
      </div>

      {/* Price Table */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-gray-700">Giá hiện tại</h2>
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
        ) : (
          <PriceTable data={data?.latest ?? []} />
        )}
      </section>

      {/* Range Selector */}
      <div className="mb-6 flex gap-2">
        {(['7d', '30d'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
              range === r
                ? 'bg-yellow-500 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {r === '7d' ? '7 ngày' : '30 ngày'}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* History Chart */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Lịch sử giá</h2>
            <div className="flex gap-1">
              {['SJC', 'DOJI', 'PNJ'].map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    selectedBrand === brand
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <HistoryChart data={data?.history ?? []} selectedBrand={selectedBrand} />
          )}
        </section>

        {/* Compare Chart */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-700">So sánh giá bán</h2>
          {loading ? (
            <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <CompareChart data={data?.history ?? []} />
          )}
        </section>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Start dev server and verify UI**

```bash
npm run dev
```

Mở `http://localhost:3000` và kiểm tra:
- Bảng giá hiển thị đúng (hoặc thông báo "Chưa có dữ liệu" nếu chưa có data)
- Hai chart không bị lỗi
- Nút "Làm mới" hoạt động
- Toggle 7d/30d hoạt động
- Toggle brand trong HistoryChart hoạt động

- [ ] **Step 4: Seed data để test UI (nếu DB trống)**

```bash
# Trigger cron manually để lấy data thật
curl -X POST http://localhost:3000/api/cron \
  -H "Authorization: Bearer dev-secret-change-in-production"
```

Nếu scraping thất bại, dùng Prisma Studio để thêm data test:
```bash
npx prisma studio
```

Thêm 3 bản ghi với brand SJC/DOJI/PNJ và giá giả để kiểm tra UI.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add dashboard page with price table and charts"
```

---

## Task 13: Vercel Config & Deploy

**Files:**
- Create: `vercel.json`
- Create: `.env.local` (đã có, cần update với giá trị thật)

- [ ] **Step 1: Create vercel.json**

Tạo `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

- [ ] **Step 2: Setup Neon DB**

1. Truy cập [neon.tech](https://neon.tech) và đăng ký tài khoản free
2. Tạo project mới (chọn region Singapore hoặc gần nhất)
3. Copy **Connection string** từ dashboard
4. Cập nhật `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   ```
5. Chạy migration lên Neon:
   ```bash
   npx prisma db push
   ```

- [ ] **Step 3: Deploy lên Vercel**

```bash
npm install -g vercel
vercel
```

Làm theo hướng dẫn của CLI. Khi được hỏi về environment variables, thêm:
- `DATABASE_URL` — connection string từ Neon
- `CRON_SECRET` — tạo một secret ngẫu nhiên, ví dụ: `openssl rand -hex 32`

- [ ] **Step 4: Verify Vercel Cron**

Sau khi deploy xong:
1. Vào Vercel Dashboard → project → Settings → Cron Jobs
2. Verify cron job `/api/cron` chạy mỗi giờ (`0 * * * *`) đã xuất hiện
3. Click "Run Now" để test cron chạy thủ công

- [ ] **Step 5: Verify production**

```bash
# Test production cron (thay URL bằng URL Vercel thật)
curl -X POST https://your-app.vercel.app/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Kiểm tra data
curl https://your-app.vercel.app/api/prices
```

- [ ] **Step 6: Final commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel cron config"
git push
```

---

## Troubleshooting: Scraper Selectors

Nếu scrapers không lấy được giá đúng, làm theo các bước sau:

**1. Inspect HTML thực tế:**
```bash
# Xem HTML của SJC
curl -s -A "Mozilla/5.0 Chrome/120" https://sjc.com.vn | grep -A5 "table"
```

**2. Debug scraper trong REPL:**
```typescript
// Tạm thêm vào src/lib/scrapers/scrape-sjc.ts để debug
const html = await response.text()
const $ = cheerio.load(html)
console.log($('table').length, 'tables found')
$('table').each((i, t) => console.log(`Table ${i}:`, $(t).text().slice(0, 200)))
```

**3. Cập nhật selector:**
Sau khi tìm được selector đúng, cập nhật `$('table tbody tr').each(...)` trong file scraper tương ứng và cập nhật mock HTML trong test file để khớp với format thực tế.
