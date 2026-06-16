'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function CompareChart({ data }: CompareChartProps) {
  const timeMap = new Map<string, Record<string, number>>()

  for (const r of data) {
    const time = formatDate(r.createdAt)
    if (!timeMap.has(time)) timeMap.set(time, {})
    timeMap.get(time)![r.brand] = r.sellPrice
  }

  const chartData = Array.from(timeMap.entries()).map(([time, values]) => ({ time, ...values }))

  if (chartData.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center text-sm text-[#d8c3ad] rounded border min-h-[304px]"
        style={{ background: 'rgba(6,14,32,0.3)', borderColor: 'rgba(51,65,85,0.5)' }}
      >
        Chưa có dữ liệu lịch sử
      </div>
    )
  }

  return (
    <div
      className="rounded border w-full"
      style={{ background: 'rgba(6,14,32,0.3)', borderColor: 'rgba(51,65,85,0.5)' }}
    >
      <ResponsiveContainer width="100%" height={304}>
        <LineChart data={chartData} margin={{ top: 16, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#d8c3ad', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: 'rgba(51,65,85,0.5)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}`}
            tick={{ fontSize: 10, fill: '#d8c3ad', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#d8c3ad' }}
            formatter={(v: unknown) => [`${(Number(v) / 1_000_000).toFixed(2)} tr`]}
          />
          {['SJC', 'DOJI', 'PNJ'].map((brand) => (
            <Line
              key={brand}
              type="monotone"
              dataKey={brand}
              stroke={BRAND_COLORS[brand]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
