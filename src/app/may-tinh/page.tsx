'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { LoadingScreen } from '@/components/LoadingScreen'

// ── Constants ────────────────────────────────────────────────────────────────

const BRANDS = ['SJC', 'DOJI', 'PNJ'] as const
type Brand = (typeof BRANDS)[number]

const BRAND_CODES: Record<Brand, string> = {
  SJC:  'SJL1L10',
  DOJI: 'DOHNL',
  PNJ:  'PQHNVM',
}

const BRAND_TYPE_NAMES: Record<Brand, string> = {
  SJC:  'SJC 9999 miếng',
  DOJI: 'DOJI Hà Nội',
  PNJ:  'PNJ Hà Nội',
}

const BRAND_COLORS: Record<Brand, string> = {
  SJC:  '#f59e0b',
  DOJI: '#3b82f6',
  PNJ:  '#10b981',
}

// ── Types ────────────────────────────────────────────────────────────────────

interface BrandPrice {
  code:       string
  buy:   number
  sell:  number
  changeBuy:  number
  changeSell: number
  updatedAt:  string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫'
}

function fmtMil(n: number): string {
  return (n / 1_000_000).toFixed(2) + 'tr'
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MayTinhPage() {
  // price cache: brand → fetched data
  const [prices, setPrices] = useState<Partial<Record<Brand, BrandPrice>>>({})
  // which brands are currently being fetched
  const [fetching, setFetching] = useState<Set<Brand>>(new Set())
  const [errors, setErrors]     = useState<Set<Brand>>(new Set())

  const [brand, setBrand]       = useState<Brand>('SJC')
  const [luong, setLuong]       = useState('1')
  const [initialLoad, setInitialLoad] = useState(true)

  // ── Fetch single brand price via /api/prices?type=CODE ──
  const fetchPrice = useCallback(async (b: Brand) => {
    const code = BRAND_CODES[b]
    setFetching((prev) => new Set(prev).add(b))
    setErrors((prev) => { const s = new Set(prev); s.delete(b); return s })
    try {
      const res = await fetch(`https://www.vang.today/api/prices?type=${code}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d: BrandPrice & { error?: string } = await res.json()
    console.log('d', d)
      if (d.error) throw new Error(d.error)
      setPrices((prev) => ({ ...prev, [b]: d }))
    } catch {
      setErrors((prev) => new Set(prev).add(b))
    } finally {
      setFetching((prev) => { const s = new Set(prev); s.delete(b); return s })
    }
  }, [])

  // On mount: fetch all 3 brands in parallel
  useEffect(() => {
    Promise.all(BRANDS.map((b) => fetchPrice(b))).finally(() => setInitialLoad(false))
  }, [fetchPrice])

  // On tab select: always re-fetch that brand
  function handleBrandSelect(b: Brand) {
    setBrand(b)
    fetchPrice(b)
  }

  // ── Computed values for selected brand ──
  const current  = prices[brand] ?? null
  const isLoading = fetching.has(brand)
  const hasError  = errors.has(brand)
  const count     = parseFloat(luong) || 0
  const buyTotal  = current ? current.buy  * count : null
  const sellTotal = current ? current.sell * count : null
  const spread    = current ? (current.sell - current.buy) * count : null
  const bColor    = BRAND_COLORS[brand]

  // ── Price cell ──
  function PriceCell({ value }: { value: number | null }) {
    if (isLoading) return <Skeleton />
    if (value === null || value === 0) return <span className="text-[#d8c3ad]">--</span>
    return <span>{fmt(value)}</span>
  }

  return (
    <>
      <LoadingScreen show={initialLoad} />
      <div className="flex min-h-screen bg-[#060e20]">
        <Sidebar />

        <main className="flex-1 flex justify-center lg:pl-64 md:pl-16 pb-16 md:pb-0">
          <div className="w-full max-w-[1280px] px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">

            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1
                className="text-[28px] sm:text-[38px] lg:text-[48px] font-bold tracking-tight leading-tight"
                style={{
                  fontFamily: 'Hanken Grotesk, sans-serif',
                  background: 'linear-gradient(135deg, #FFDDB8, #FFC174, #F59E0B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Quy đổi tài sản
              </h1>
              <p className="text-[#d8c3ad] text-sm">
                Tính toán giá trị giao dịch dựa trên giá vàng thời gian thực
              </p>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

              {/* ── Calculator ── */}
              <div
                className="lg:col-span-8 rounded-xl p-5 sm:p-8 flex flex-col gap-6 sm:gap-8"
                style={{
                  border: `2px solid ${bColor}35`,
                  background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(19,27,46,0.9) 100%)',
                  backdropFilter: 'blur(12px)',
                  transition: 'border-color 0.25s ease',
                }}
              >
                {/* Quantity */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold tracking-widest uppercase" style={{ color: bColor }}>
                    Nhập số lượng
                  </label>
                  <div className="flex flex-col gap-1">
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={luong}
                      onChange={(e) => setLuong(e.target.value)}
                      className="bg-transparent text-[#dae2fd] outline-none w-full pb-2"
                      style={{
                        fontFamily: 'Hanken Grotesk, sans-serif',
                        fontSize: 'clamp(32px, 5vw, 48px)',
                        fontWeight: 700,
                        borderBottom: `2px solid ${bColor}40`,
                        transition: 'border-color 0.25s ease',
                      }}
                      placeholder="0"
                    />
                    <span className="text-[#d8c3ad] text-sm">lượng vàng</span>
                  </div>
                </div>

                {/* Brand tabs */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#d8c3ad] text-xs font-bold tracking-widest uppercase">
                    Thương hiệu
                  </label>

                  <div className="flex rounded-lg p-1 gap-1" style={{ background: '#131b2e' }}>
                    {BRANDS.map((b) => {
                      const active   = brand === b
                      const bc       = BRAND_COLORS[b]
                      const loading  = fetching.has(b)
                      return (
                        <button
                          key={b}
                          onClick={() => handleBrandSelect(b)}
                          className="flex-1 py-2.5 rounded-md text-sm font-bold transition-all relative"
                          style={{
                            border:     active ? `1px solid ${bc}` : '1px solid transparent',
                            color:      active ? bc : '#d8c3ad',
                            background: active ? `${bc}15` : 'transparent',
                          }}
                        >
                          {b}
                          {loading && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70">
                              <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Sub-label */}
                  <div className="flex items-center gap-2 min-h-[18px]">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: bColor }} />
                    <span className="text-[#d8c3ad] text-xs">
                      {BRAND_TYPE_NAMES[brand]}
                      <span className="ml-1.5 font-mono text-[10px] opacity-50">{BRAND_CODES[brand]}</span>
                    </span>
                    {hasError && !isLoading && (
                      <span className="text-red-400 text-[10px] ml-auto">Lỗi tải — thử lại</span>
                    )}
                  </div>
                </div>

                {/* Result cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sell */}
                  <div
                    className="rounded-xl p-5 sm:p-6 flex flex-col gap-2"
                    style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <div className="text-[10px] font-bold tracking-widest uppercase text-[#ef4444]">
                      Bạn bán ra
                    </div>
                    <div
                      className="text-xl sm:text-2xl font-bold text-[#ef4444]"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      <PriceCell value={buyTotal} />
                    </div>
                    <div className="text-[#d8c3ad] text-xs h-4">
                      {!isLoading && current && current.buy > 0
                        ? `${fmt(current.buy)} / lượng` : ''}
                    </div>
                  </div>

                  {/* Buy */}
                  <div
                    className="rounded-xl p-5 sm:p-6 flex flex-col gap-2"
                    style={{ background: 'rgba(255,193,116,0.05)', border: '1px solid rgba(255,193,116,0.2)' }}
                  >
                    <div className="text-[10px] font-bold tracking-widest uppercase text-[#ffc174]">
                      Bạn mua vào
                    </div>
                    <div
                      className="text-xl sm:text-2xl font-bold text-[#ffc174]"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      <PriceCell value={sellTotal} />
                    </div>
                    <div className="text-[#d8c3ad] text-xs h-4">
                      {!isLoading && current && current.sell > 0
                        ? `${fmt(current.sell)} / lượng` : ''}
                    </div>
                  </div>
                </div>

                {/* Spread */}
                <div
                  className="rounded-lg p-4 flex items-center justify-between"
                  style={{ background: '#060e20', border: '1px dashed rgba(83,68,52,0.8)' }}
                >
                  <span className="text-[#d8c3ad] text-sm">Chênh lệch mua bán</span>
                  <span
                    className="text-[#dae2fd] text-base font-bold"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {isLoading
                      ? <Skeleton width="w-20" height="h-5" />
                      : spread !== null && spread > 0 ? fmt(spread) : '--'}
                  </span>
                </div>
              </div>

              {/* ── Reference card ── */}
              <div
                className="lg:col-span-4 rounded-xl overflow-hidden flex flex-col"
                style={{ border: '1px solid #334155' }}
              >
                {/* Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between"
                  style={{ background: 'rgba(19,27,46,0.5)', borderBottom: '1px solid #334155' }}
                >
                  <span className="text-[#dae2fd] text-base font-semibold">Tỷ giá tham chiếu</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                    <span className="text-[#22c55e] text-xs">Trực tiếp</span>
                  </div>
                </div>

                {/* Brand rows */}
                <div className="flex flex-col flex-1" style={{ background: '#1e293b' }}>
                  <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible flex-1">
                    {BRANDS.map((b, idx) => {
                      const p          = prices[b]
                      const loading    = fetching.has(b)
                      const isSelected = b === brand
                      const bc         = BRAND_COLORS[b]

                      return (
                        <button
                          key={b}
                          onClick={() => handleBrandSelect(b)}
                          className="px-5 py-4 flex flex-col gap-3 min-w-[160px] lg:min-w-0 text-left transition-colors"
                          style={{
                            borderRight: idx < 2 ? '1px solid #334155' : 'none',
                            borderBottom: 0,
                            borderLeft: `3px solid ${isSelected ? bc : 'transparent'}`,
                            background: isSelected ? `${bc}08` : 'transparent',
                          }}
                        >
                          {/* Brand label */}
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: bc }} />
                            <span className="text-[#dae2fd] text-sm font-semibold">{b}</span>
                            {loading && (
                              <svg className="animate-spin ml-auto" width="10" height="10" viewBox="0 0 24 24"
                                fill="none" stroke={bc} strokeWidth="3" strokeLinecap="round">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                            )}
                            {isSelected && !loading && (
                              <span
                                className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: `${bc}20`, color: bc }}
                              >
                                Đang chọn
                              </span>
                            )}
                          </div>

                          {/* Prices */}
                          <div className="flex lg:justify-between lg:items-center flex-col lg:flex-row gap-2 lg:gap-0">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[#d8c3ad] text-[10px] tracking-wider">MUA VÀO</span>
                              <span
                                className="text-[#dae2fd] text-sm font-semibold"
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                              >
                                {loading ? <Skeleton width="w-16" height="h-4" /> : p && p.buy > 0 ? fmtMil(p.buy) : '--'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 lg:items-end">
                              <span className="text-[#d8c3ad] text-[10px] tracking-wider">BÁN RA</span>
                              <span
                                className="text-[#ffc174] text-sm font-semibold"
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                              >
                                {loading ? <Skeleton width="w-16" height="h-4" /> : p && p.sell > 0 ? fmtMil(p.sell) : '--'}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="px-5 py-4" style={{ borderTop: '1px solid #334155' }}>
                    <p className="text-[#d8c3ad] text-[11px] italic">
                      * Giá tham chiếu, không phải giá giao dịch chính thức.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ width = 'w-36', height = 'h-7' }: { width?: string; height?: string }) {
  return (
    <span
      className={`inline-block ${width} ${height} rounded animate-pulse`}
      style={{ background: 'rgba(255,193,116,0.1)' }}
    />
  )
}
