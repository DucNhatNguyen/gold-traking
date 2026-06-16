Build a Vietnamese gold price tracking dashboard using Next.js 14, Tailwind CSS, and Recharts.

## Context
This is a personal dashboard for tracking gold prices from 3 Vietnamese brands: SJC, DOJI, PNJ.
Data is fetched from /api/prices and returns:
{
  latest: [{ brand, buyPrice, sellPrice, updatedAt }],  // prices in VND (e.g. 149500000)
  history: [{ id, brand, buyPrice, sellPrice, createdAt }]
}

## Current features (keep these)
- Price table showing buy/sell for each brand, badge on highest buy price
- Line chart comparing all 3 brands over 7d/30d (CompareChart)
- Line chart for a single selected brand (HistoryChart)
- Range toggle: 7 ngày / 30 ngày
- Refresh button

## New features to add

### 1. Price delta indicator
In the price table, next to each price show the change vs the previous record:
- Format: "+500,000 ₫ (+0.33%)" in green or "-500,000 ₫ (-0.33%)" in red
- If no previous data: show "--"
- Show delta for both buyPrice and sellPrice

### 2. Spread column
In the price table, add a "Spread" column:
- Spread = sellPrice - buyPrice
- Format as currency (e.g. "2.000.000 ₫")
- Smaller spread = better for buyer, optionally highlight the brand with smallest spread

### 3. Candlestick chart (per brand)
Replace or add alongside the HistoryChart a candlestick/OHLC chart:
- Group data by day: Open = first record of day, High = max, Low = min, Close = last record
- Use Recharts ComposedChart with custom candlestick rendering (or a bar chart approximation)
- Show for the selected brand, toggleable between buyPrice and sellPrice
- X axis: date, Y axis: price in million VND (e.g. 149.5)

### 4. Quick conversion calculator
A small card/widget below the price table:
- Input: number of "lượng" (unit of gold, default 1)
- Brand selector: SJC / DOJI / PNJ
- Output: shows "Mua vào: X ₫" and "Bán ra: Y ₫" in large text
- Updates instantly on input change (no button needed)
- Example: 2 lượng × SJC buy 149,500,000 = 299,000,000 ₫

### 5. Last updated timestamp
- In the price table header or top of page, show "Cập nhật lúc HH:MM DD/MM/YYYY"
- Use the updatedAt field from the latest prices
- Also show a subtle "auto-refresh" indicator if data is fresh (< 5 min old)

## Design requirements
- Language: Vietnamese UI labels
- Color scheme: dark/neutral professional, gold accent (#f59e0b)
- Brand colors: SJC = amber, DOJI = blue (#3b82f6), PNJ = green (#10b981)
- Mobile responsive
- Format all prices using Vietnamese locale: Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'})
- Prices are stored as full VND integers (149500000), display in millions for charts (149.5)

## Data types
interface PriceRecord {
  id: number
  brand: 'SJC' | 'DOJI' | 'PNJ'
  buyPrice: number
  sellPrice: number
  createdAt: string // ISO datetime
}

interface LatestPrice {
  brand: 'SJC' | 'DOJI' | 'PNJ'
  buyPrice: number
  sellPrice: number
  updatedAt: string // ISO datetime
}