'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { LoadingScreen } from '@/components/LoadingScreen'

interface PriceType {
  brand: string
  code: string
  name: string
  typeName: string
  buyPrice: number
  sellPrice: number
  changeBuy: number
  changeSell: number
  updatedAt: string
}

interface PricesData {
  allLatest: PriceType[]
}

function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n)
}

function timeSince(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'Vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

const BRAND_COLORS: Record<string, string> = {
  SJC: '#f59e0b',
  DOJI: '#3b82f6',
  PNJ: '#10b981',
}

export default function BangGiaPage() {
  const [data, setData] = useState<PricesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  async function fetchData() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/prices?days=1')
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

  const updatedAt = data?.allLatest[0]?.updatedAt

  const rows = (data?.allLatest ?? []).filter((p) =>
    search
      ? p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.typeName.toLowerCase().includes(search.toLowerCase())
      : true
  )

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
                  className="text-[#dae2fd] text-2xl sm:text-[40px] lg:text-[48px] font-bold tracking-tight leading-tight"
                  style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
                >
                  Bảng Giá Vàng
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  <span className="text-[#d8c3ad] text-sm">
                    Cập nhật lần cuối:{' '}
                    {loading ? 'Đang tải...' : error ? 'Lỗi' : updatedAt ? timeSince(updatedAt) : '--'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-[#dae2fd] hover:bg-[#2d3d53] transition-colors disabled:opacity-50"
                >
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={loading ? 'animate-spin' : ''}
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
                <button className="bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-[#dae2fd] hover:bg-[#2d3d53] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                Không thể kết nối đến nguồn dữ liệu. Vui lòng thử lại.
              </div>
            )}

            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:w-80"
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d8c3ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm thương hiệu, loại vàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent flex-1 text-[#dae2fd] text-sm outline-none placeholder:text-[#d8c3ad]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-[#d8c3ad] hover:text-[#dae2fd]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              {/* Desktop Table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                {/* Table Header */}
                <div
                  className="grid items-center px-6 py-3 text-[10px] font-bold tracking-widest text-[#d8c3ad] uppercase"
                  style={{ background: '#2d3449', gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr 1fr' }}
                >
                  <div>Thương hiệu / Loại</div>
                  <div>Mua vào (VNĐ/lượng)</div>
                  <div>Bán ra (VNĐ/lượng)</div>
                  <div>Chênh lệch</div>
                  <div>Cập nhật</div>
                </div>

                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse mx-6 my-3 rounded" style={{ background: '#334155' }} />
                  ))
                ) : rows.length === 0 ? (
                  <div className="py-16 text-center text-[#d8c3ad]">Không tìm thấy kết quả</div>
                ) : (
                  rows.map((p, idx) => {
                    const spread = p.sellPrice - p.buyPrice
                    return (
                      <div
                        key={p.code}
                        className="grid items-center px-6 py-4"
                        style={{
                          gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr 1fr',
                          borderTop: idx > 0 ? '1px solid #334155' : 'none',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: BRAND_COLORS[p.brand] }} />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#dae2fd] text-sm font-semibold">{p.name}</span>
                            <span className="text-[#d8c3ad] text-xs">{p.typeName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[#dae2fd] text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {p.buyPrice > 0 ? formatVND(p.buyPrice) : '--'}
                          </span>
                          {p.changeBuy !== 0 && <DeltaBadge delta={p.changeBuy} />}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[#dae2fd] text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {p.sellPrice > 0 ? formatVND(p.sellPrice) : '--'}
                          </span>
                          {p.changeSell !== 0 && <DeltaBadge delta={p.changeSell} />}
                        </div>
                        <div>
                          <span className="text-[#d8c3ad] text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {spread > 0 ? formatVND(spread) : '--'}
                          </span>
                        </div>
                        <div className="text-[#d8c3ad] text-xs">
                          {timeSince(p.updatedAt)}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Mobile Card View (< md) */}
              <div className="md:hidden">
                {/* Header */}
                <div className="px-4 py-3 text-[10px] font-bold tracking-widest text-[#d8c3ad] uppercase" style={{ background: '#2d3449' }}>
                  Danh sách giá vàng
                </div>

                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse mx-4 my-3 rounded" style={{ background: '#334155' }} />
                  ))
                ) : rows.length === 0 ? (
                  <div className="py-12 text-center text-[#d8c3ad]">Không tìm thấy kết quả</div>
                ) : (
                  rows.map((p, idx) => {
                    const spread = p.sellPrice - p.buyPrice
                    return (
                      <div
                        key={p.code}
                        className="px-4 py-4 flex flex-col gap-3"
                        style={{ borderTop: idx > 0 ? '1px solid #334155' : 'none' }}
                      >
                        {/* Brand row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: BRAND_COLORS[p.brand] }} />
                            <div>
                              <div className="text-[#dae2fd] text-sm font-semibold">{p.name}</div>
                              <div className="text-[#d8c3ad] text-[11px]">{p.typeName}</div>
                            </div>
                          </div>
                          <span className="text-[#d8c3ad] text-[10px]">{timeSince(p.updatedAt)}</span>
                        </div>

                        {/* Price row */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[#d8c3ad] text-[9px] font-bold tracking-wider uppercase">Mua vào</span>
                            <span className="text-[#dae2fd] text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {p.buyPrice > 0 ? (p.buyPrice / 1_000_000).toFixed(2) + 'tr' : '--'}
                            </span>
                            {p.changeBuy !== 0 && <DeltaBadge delta={p.changeBuy} small />}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[#d8c3ad] text-[9px] font-bold tracking-wider uppercase">Bán ra</span>
                            <span className="text-[#ffc174] text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {p.sellPrice > 0 ? (p.sellPrice / 1_000_000).toFixed(2) + 'tr' : '--'}
                            </span>
                            {p.changeSell !== 0 && <DeltaBadge delta={p.changeSell} small />}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[#d8c3ad] text-[9px] font-bold tracking-wider uppercase">Spread</span>
                            <span className="text-[#d8c3ad] text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {spread > 0 ? (spread / 1_000).toFixed(0) + 'k' : '--'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Data source note */}
            <p className="text-[#d8c3ad] text-xs text-center">
              Nguồn dữ liệu: <span className="text-[#ffc174]">vang.today</span> — cập nhật mỗi 5 phút
            </p>

          </div>
        </main>
      </div>
    </>
  )
}

function DeltaBadge({ delta, small }: { delta: number; small?: boolean }) {
  const isUp = delta > 0
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${small ? 'px-1 py-0.5 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'}`}
      style={{
        background: isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        color: isUp ? '#22c55e' : '#ef4444',
      }}
    >
      {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{Math.round(delta / 1000)}k
    </span>
  )
}
