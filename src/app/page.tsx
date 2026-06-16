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

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-gray-700">Giá hiện tại</h2>
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
        ) : (
          <PriceTable data={data?.latest ?? []} />
        )}
      </section>

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

      <div className="grid gap-6 md:grid-cols-2">
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
