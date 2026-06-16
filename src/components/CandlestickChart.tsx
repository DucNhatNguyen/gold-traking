'use client'

import { useState, useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface HistoryRecord {
  brand: string
  buyPrice: number
  sellPrice: number
  createdAt: string
}

interface CandlestickChartProps {
  data: HistoryRecord[]
}

const BRAND_COLORS: Record<string, string> = {
  SJC: '#f59e0b',
  DOJI: '#3b82f6',
  PNJ: '#10b981',
}

interface RangePoint {
  date: string
  base: number
  range: number
  buyPrice: number
  sellPrice: number
  up: boolean
}

function groupBuySellRange(records: HistoryRecord[], brand: string): RangePoint[] {
  type DayData = { buy: number[]; sell: number[] }
  const dayMap = new Map<string, DayData>()

  for (const r of records) {
    if (r.brand !== brand) continue
    const d = new Date(r.createdAt)
    const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    if (!dayMap.has(key)) dayMap.set(key, { buy: [], sell: [] })
    dayMap.get(key)!.buy.push(r.buyPrice)
    dayMap.get(key)!.sell.push(r.sellPrice)
  }

  const entries = Array.from(dayMap.entries())
  return entries.map(([date, { buy, sell }], idx) => {
    const buyPrice = buy[buy.length - 1]
    const sellPrice = sell[sell.length - 1]
    const prevBuy = idx > 0 ? entries[idx - 1][1].buy[entries[idx - 1][1].buy.length - 1] : null
    const up = prevBuy === null || buyPrice >= prevBuy
    return { date, base: buyPrice, range: sellPrice - buyPrice, buyPrice, sellPrice, up }
  })
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: RangePoint }[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const spread = d.sellPrice - d.buyPrice
  return (
    <div
      className="rounded-lg p-3 text-xs"
      style={{ background: '#1e293b', border: '1px solid #334155', fontFamily: 'JetBrains Mono, monospace' }}
    >
      <p className="text-[#d8c3ad] mb-2 font-semibold">{label}</p>
      <p style={{ color: '#ef4444' }}>Mua vào: {(d.buyPrice / 1_000_000).toFixed(3)} tr</p>
      <p style={{ color: '#ffc174' }}>Bán ra: {(d.sellPrice / 1_000_000).toFixed(3)} tr</p>
      <p className="text-[#d8c3ad] border-t border-[#334155] pt-1 mt-1">
        Spread: {(spread / 1_000_000).toFixed(3)} tr
      </p>
    </div>
  )
}

export function CandlestickChart({ data }: CandlestickChartProps) {
  const [brand, setBrand] = useState('SJC')

  const barData = useMemo(() => groupBuySellRange(data, brand), [data, brand])

  const allValues = barData.flatMap((d) => [d.buyPrice, d.sellPrice])
  const minY = allValues.length ? Math.min(...allValues) - 500_000 : 0
  const maxY = allValues.length ? Math.max(...allValues) + 500_000 : 1

  return (
    <div className="flex flex-col gap-3">
      {/* Brand toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['SJC', 'DOJI', 'PNJ'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className="px-3 py-1 rounded text-xs font-bold transition-colors"
              style={{
                background: brand === b ? BRAND_COLORS[b] + '20' : 'transparent',
                color: brand === b ? BRAND_COLORS[b] : '#d8c3ad',
                border: `1px solid ${brand === b ? BRAND_COLORS[b] : 'transparent'}`,
              }}
            >
              {b}
            </button>
          ))}
        </div>
        <span className="text-[#d8c3ad] text-[10px] tracking-wider">Biểu đồ Mua – Bán theo ngày</span>
      </div>

      {barData.length === 0 ? (
        <div
          className="flex items-center justify-center text-sm text-[#d8c3ad] rounded border"
          style={{ background: 'rgba(6,14,32,0.5)', borderColor: 'rgba(51,65,85,0.5)', minHeight: 200 }}
        >
          Chưa có dữ liệu lịch sử
        </div>
      ) : (
        <div
          className="rounded border"
          style={{ background: 'rgba(6,14,32,0.5)', borderColor: 'rgba(51,65,85,0.5)' }}
        >
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={barData} margin={{ top: 16, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#d8c3ad', fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={{ stroke: 'rgba(51,65,85,0.5)' }}
                tickLine={false}
              />
              <YAxis
                domain={[minY, maxY]}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`}
                tick={{ fontSize: 10, fill: '#d8c3ad', fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Invisible base bar (offset to buy price) */}
              <Bar dataKey="base" stackId="range" fill="transparent" isAnimationActive={false} />
              {/* Visible range bar (buy → sell = spread) */}
              <Bar dataKey="range" stackId="range" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {barData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.up ? '#22c55e' : '#ef4444'}
                    fillOpacity={0.75}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
