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
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Chưa có dữ liệu lịch sử
      </div>
    )
  }

  const activeKey = priceType === 'sellPrice' ? 'Giá bán' : 'Giá mua'

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
          <YAxis tickFormatter={formatVNDShort} tick={{ fontSize: 11 }} width={55} />
          <Tooltip
            formatter={(value: unknown) => [
              `${(Number(value) / 1_000_000).toFixed(2)} triệu ₫`,
              activeKey,
            ]}
          />
          <Line
            type="monotone"
            dataKey={activeKey}
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
