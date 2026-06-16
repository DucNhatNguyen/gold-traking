import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://www.vang.today/api/prices'

const MAIN_BRANDS = [
  { brand: 'SJC', code: 'SJL1L10', name: 'SJC 9999' },
  { brand: 'DOJI', code: 'DOHNL', name: 'DOJI Hà Nội' },
  { brand: 'PNJ', code: 'PQHNVM', name: 'PNJ Hà Nội' },
] as const

const ALL_TYPES = [
  { brand: 'SJC', code: 'SJL1L10', name: 'SJC 9999', typeName: 'Vàng miếng 9999' },
  { brand: 'SJC', code: 'SJ9999', name: 'SJC Nhẫn', typeName: 'Nhẫn tròn trơn' },
  { brand: 'DOJI', code: 'DOHNL', name: 'DOJI Hà Nội', typeName: 'Vàng miếng' },
  { brand: 'DOJI', code: 'DOJINHTV', name: 'DOJI Nữ Trang', typeName: 'Nữ trang vàng' },
  { brand: 'PNJ', code: 'PQHNVM', name: 'PNJ Hà Nội', typeName: 'Vàng miếng 24K' },
] as const

interface VangPrice {
  name: string
  buy: number
  sell: number
  change_buy: number
  change_sell: number
  currency: string
}

interface VangCurrentResponse {
  success: boolean
  timestamp: number
  prices: Record<string, VangPrice>
}

interface VangHistoryDay {
  date: string
  prices: Record<string, {
    buy: number
    sell: number
    day_change_buy: number
    day_change_sell: number
    updates: number
  }>
}

interface VangHistoryResponse {
  success: boolean
  history: VangHistoryDay[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Single-code lookup: /api/prices?type=PQHNVM  OR  /api/prices?code=PQHNVM
  // Triggered when ?type= is present WITHOUT ?days=, or when ?code= is present
  const typeParam = searchParams.get('type')
  const codeParam = searchParams.get('code')
  const singleCode = codeParam ?? (typeParam && !searchParams.has('days') ? typeParam : null)

  if (singleCode) {
    try {
      const res = await fetch(`${BASE}?type=${singleCode}`, { next: { revalidate: 60 } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      let buyPrice = 0, sellPrice = 0, changeBuy = 0, changeSell = 0
      const updatedAt = data.timestamp
        ? new Date(data.timestamp * 1000).toISOString()
        : new Date().toISOString()

      if (data.prices?.[singleCode]) {
        const p = data.prices[singleCode]
        buyPrice   = p.buy          ?? 0
        sellPrice  = p.sell         ?? 0
        changeBuy  = p.change_buy   ?? 0
        changeSell = p.change_sell  ?? 0
      } else if (Array.isArray(data.history) && data.history.length > 0) {
        const p = data.history[0]?.prices?.[singleCode]
        buyPrice   = p?.buy              ?? 0
        sellPrice  = p?.sell             ?? 0
        changeBuy  = p?.day_change_buy   ?? 0
        changeSell = p?.day_change_sell  ?? 0
      }

      return NextResponse.json({ code: singleCode, buyPrice, sellPrice, changeBuy, changeSell, updatedAt })
    } catch (err) {
      console.error('[/api/prices single-code]', err)
      return NextResponse.json({ error: 'Không thể lấy giá vàng' }, { status: 502 })
    }
  }

  const daysParam = searchParams.get('days')
  const rangeParam = searchParams.get('range')

  let days = 5
  if (daysParam) {
    days = Math.min(Math.max(parseInt(daysParam) || 5, 1), 30)
  } else if (rangeParam === '30d' || rangeParam === '90d') {
    days = 30
  } else if (rangeParam === '7d') {
    days = 7
  } else if (rangeParam === '1d') {
    days = 1
  }

  try {
    const [currentRes, ...historyResponses] = await Promise.all([
      fetch(BASE, { next: { revalidate: 300 } }),
      ...MAIN_BRANDS.map(({ code }) =>
        fetch(`${BASE}?type=${code}&days=${days}`, { next: { revalidate: 300 } })
      ),
    ])

    if (!currentRes.ok) {
      throw new Error(`vang.today current prices HTTP ${currentRes.status}`)
    }

    const current: VangCurrentResponse = await currentRes.json()
    const histories: (VangHistoryResponse | null)[] = await Promise.all(
      historyResponses.map(async (r) => {
        if (!r.ok) return null
        try { return await r.json() as VangHistoryResponse } catch { return null }
      })
    )

    if (!current.success) {
      throw new Error('vang.today returned success=false')
    }

    const updatedAt = new Date(current.timestamp * 1000).toISOString()
    const prices = current.prices ?? {}

    // 3 main brands — for BrandCards (dashboard)
    const latest = MAIN_BRANDS.map(({ brand, code }) => {
      const p = prices[code]
      const changeBuy = p?.change_buy ?? 0
      const changeSell = p?.change_sell ?? 0
      return {
        brand,
        code,
        buyPrice: p?.buy ?? 0,
        sellPrice: p?.sell ?? 0,
        changeBuy,
        changeSell,
        updatedAt,
        prevBuyPrice: p ? p.buy - changeBuy : null,
        prevSellPrice: p ? p.sell - changeSell : null,
      }
    })

    // All 5 types — for bảng giá
    const allLatest = ALL_TYPES.map(({ brand, code, name, typeName }) => {
      const p = prices[code]
      const changeBuy = p?.change_buy ?? 0
      const changeSell = p?.change_sell ?? 0
      return {
        brand,
        code,
        name,
        typeName,
        buyPrice: p?.buy ?? 0,
        sellPrice: p?.sell ?? 0,
        changeBuy,
        changeSell,
        updatedAt,
        prevBuyPrice: p ? p.buy - changeBuy : null,
        prevSellPrice: p ? p.sell - changeSell : null,
      }
    })

    // Flat history (oldest-first) — for CompareChart + lịch sử
    const history = MAIN_BRANDS.flatMap(({ brand, code }, idx) => {
      const h = histories[idx]
      if (!h || !h.history) return []
      return [...h.history].reverse().map(({ date, prices: dp }) => {
        const p = dp[code]
        return {
          brand,
          buyPrice: p?.buy ?? 0,
          sellPrice: p?.sell ?? 0,
          createdAt: `${date}T12:00:00+07:00`,
          dayChangeBuy: p?.day_change_buy ?? 0,
          dayChangeSell: p?.day_change_sell ?? 0,
        }
      })
    })

    return NextResponse.json({ latest, allLatest, history })
  } catch (err) {
    console.error('[/api/prices]', err)
    return NextResponse.json({ error: 'Không thể lấy dữ liệu giá vàng' }, { status: 502 })
  }
}
