'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { BrandCard } from '@/components/BrandCard'
import { CompareChart } from '@/components/CompareChart'
import { CandlestickChart } from '@/components/CandlestickChart'
import { LoadingScreen } from '@/components/LoadingScreen'

interface LatestPrice {
  brand: string
  buyPrice: number
  sellPrice: number
  updatedAt: string
  prevBuyPrice: number | null
  prevSellPrice: number | null
}

interface HistoryRecord {
  brand: string
  buyPrice: number
  sellPrice: number
  createdAt: string
}

interface PricesData {
  latest: LatestPrice[]
  history: HistoryRecord[]
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  const mo = (d.getMonth() + 1).toString().padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${hh}:${mm} ${dd}/${mo}/${yyyy}`
}

const BRANDS = ['SJC', 'DOJI', 'PNJ'] as const

export default function Page() {
  const [data, setData] = useState<PricesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  async function fetchData() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/prices?days=5')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const latestMap = Object.fromEntries((data?.latest ?? []).map((p) => [p.brand, p]))

  const bestSpreadBrand = BRANDS.reduce<string>((best, b) => {
    const p = latestMap[b]
    if (!p) return best
    const spread = p.sellPrice - p.buyPrice
    const bestP = latestMap[best]
    if (!bestP) return b
    return spread < bestP.sellPrice - bestP.buyPrice ? b : best
  }, '')

  const updatedAt = data?.latest[0]?.updatedAt
  const isRecent = updatedAt ? Date.now() - new Date(updatedAt).getTime() < 5 * 60 * 1000 : false

  return (
    <>
      <LoadingScreen show={initialLoad} />
      <div className="flex min-h-screen bg-[#060e20]">
        <Sidebar />

        <main className="flex-1 flex justify-center lg:pl-64 md:pl-16 pb-16 md:pb-0">
          <div className="w-full max-w-[1280px] px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-1.5">
                <h1
                  className="text-[#dae2fd] text-2xl sm:text-[32px] font-semibold leading-tight"
                  style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
                >
                  Phân tích giá vàng
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#d8c3ad] text-sm">
                    {loading ? 'Đang tải...' : error ? 'Lỗi tải dữ liệu' : updatedAt ? `Cập nhật lúc ${formatUpdatedAt(updatedAt)}` : ''}
                  </span>
                  {updatedAt && !loading && (
                    <>
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: isRecent ? '#22c55e' : '#ffc174' }}
                      />
                      <span className="text-[#d8c3ad] text-sm hidden sm:inline">Tự động làm mới</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="self-start sm:self-auto bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#dae2fd] text-sm flex items-center gap-2 hover:bg-[#2d3d53] transition-colors disabled:opacity-50"
              >
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={loading ? 'animate-spin' : ''}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Làm mới
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                Không thể kết nối đến nguồn dữ liệu. Vui lòng thử lại.
              </div>
            )}

            {/* Brand Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {BRANDS.map((brand) => {
                const p = latestMap[brand]
                return (
                  <BrandCard
                    key={brand}
                    brand={brand}
                    buyPrice={p?.buyPrice ?? 0}
                    sellPrice={p?.sellPrice ?? 0}
                    prevBuyPrice={p?.prevBuyPrice ?? null}
                    prevSellPrice={p?.prevSellPrice ?? null}
                    isBestSpread={brand === bestSpreadBrand && !!p}
                  />
                )
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Compare Chart */}
              <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 sm:p-[17px] shadow-sm flex flex-col min-h-[300px] sm:min-h-[400px]">
                <div className="flex items-center justify-between pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffc174" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <span className="text-[#dae2fd] text-base sm:text-lg font-semibold">So sánh giá (5 ngày)</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    {[
                      { brand: 'SJC', color: '#f59e0b' },
                      { brand: 'DOJI', color: '#3b82f6' },
                      { brand: 'PNJ', color: '#10b981' },
                    ].map(({ brand, color }) => (
                      <div key={brand} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                        <span className="text-[10px] text-[#d8c3ad]">{brand}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {loading ? (
                  <div className="flex-1 animate-pulse rounded" style={{ background: 'rgba(6,14,32,0.3)', minHeight: 240 }} />
                ) : (
                  <CompareChart data={data?.history ?? []} />
                )}
              </div>

              {/* Buy–Sell Range Chart */}
              <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 sm:p-[17px] shadow-sm flex flex-col min-h-[300px] sm:min-h-[400px]">
                <div className="flex items-center gap-2 pb-4">
                  <div className="w-3 h-3 rounded-sm bg-[#22c55e]" />
                  <span className="text-[#dae2fd] text-base sm:text-lg font-semibold">Biên độ Mua – Bán</span>
                </div>
                {loading ? (
                  <div className="flex-1 animate-pulse rounded" style={{ background: 'rgba(6,14,32,0.5)', minHeight: 200 }} />
                ) : (
                  <CandlestickChart data={data?.history ?? []} />
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}
