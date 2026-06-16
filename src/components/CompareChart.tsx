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
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Chưa có dữ liệu để so sánh
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatVNDShort} tick={{ fontSize: 11 }} width={55} />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${(value / 1_000_000).toFixed(2)} triệu ₫`,
            name,
          ]}
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
