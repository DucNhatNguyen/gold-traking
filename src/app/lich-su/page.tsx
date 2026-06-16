'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { LoadingScreen } from '@/components/LoadingScreen'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
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
  dayChangeBuy: number
  dayChangeSell: number
}

interface LatestPrice {
  brand: string
  buyPrice: number
  sellPrice: number
  updatedAt: string
  prevBuyPrice: number | null
  prevSellPrice: number | null
}

interface PricesData {
  latest: LatestPrice[]
  history: HistoryRecord[]
}

function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n)
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

function formatDateFull(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

const BRAND_COLORS: Record<string, string> = {
  SJC: '#f59e0b',
  DOJI: '#3b82f6',
  PNJ: '#10b981',
}

type PriceType = 'sell' | 'buy'
type DaysFilter = 5 | 10 | 20 | 30

interface DailyRow {
  date: string
  dateLabel: string
  buyPrice: number
  sellPrice: number
  spread: number
  changeBuy: number | null
}

function groupByDay(records: HistoryRecord[], brand: string): DailyRow[] {
  const dayMap = new Map<string, HistoryRecord>()
  for (const r of records) {
    if (r.brand !== brand) continue
    const key = new Date(r.createdAt).toISOString().slice(0, 10)
    dayMap.set(key, r)
  }
  const days = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  return days.map(([date, r]) => ({
    date,
    dateLabel: formatDateShort(date),
    buyPrice: r.buyPrice,
    sellPrice: r.sellPrice,
    spread: r.sellPrice - r.buyPrice,
    changeBuy: r.dayChangeBuy,
  }))
}

interface ChangeTooltipProps {
  active?: boolean
  payload?: { payload: { change: number } }[]
  label?: string
}

function ChangeTooltip({ active, payload, label }: ChangeTooltipProps) {
  if (!active || !payload?.length) return null
  const change = payload[0]?.payload?.change ?? 0
  const isUp = change >= 0
  return (
    <div
      className="rounded-lg p-3 text-xs"
      style={{ background: '#1e293b', border: '1px solid #334155', fontFamily: 'JetBrains Mono, monospace' }}
    >
      <p className="text-[#d8c3ad] mb-1 font-semibold">{label}</p>
      <p style={{ color: isUp ? '#22c55e' : '#ef4444' }}>
        {isUp ? '+' : ''}{(change / 1_000_000).toFixed(3)} tr
      </p>
      <p className="text-[#d8c3ad] text-[10px] mt-0.5">
        {isUp ? 'Tăng' : 'Giảm'} {Math.abs(Math.round(change / 1000))}k so với hôm trước
      </p>
    </div>
  )
}

const DAY_FILTERS: DaysFilter[] = [5, 10, 20, 30]

export default function LichSuPage() {
  const [data, setData] = useState<PricesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [brand, setBrand] = useState<'SJC' | 'DOJI' | 'PNJ'>('SJC')
  const [chartType, setChartType] = useState<'line' | 'candle'>('line')
  const [priceType, setPriceType] = useState<PriceType>('sell')
  const [daysFilter, setDaysFilter] = useState<DaysFilter>(30)
  const [showRows, setShowRows] = useState(10)

  async function fetchData() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/prices?days=30')
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

  const daily = useMemo(() => groupByDay(data?.history ?? [], brand), [data, brand])
  const filteredDaily = useMemo(() => daily.slice(-daysFilter), [daily, daysFilter])

  const chartData = useMemo(
    () => filteredDaily.map((d) => ({ date: d.dateLabel, value: priceType === 'sell' ? d.sellPrice : d.buyPrice })),
    [filteredDaily, priceType]
  )

  const changeData = useMemo(
    () => filteredDaily.map((d) => ({ date: d.dateLabel, change: d.changeBuy ?? 0 })),
    [filteredDaily]
  )

  const changeValues = changeData.map((d) => d.change)
  const changeAbsMax = changeValues.length ? Math.max(...changeValues.map(Math.abs)) * 1.2 : 1_000_000
  const changeMin = -changeAbsMax
  const changeMax = changeAbsMax

  const latestPrice = data?.latest.find((l) => l.brand === brand)
  const latestValue = latestPrice ? (priceType === 'sell' ? latestPrice.sellPrice : latestPrice.buyPrice) : null
  const prevValue = latestPrice ? (priceType === 'sell' ? latestPrice.prevSellPrice : latestPrice.prevBuyPrice) : null
  const delta = latestValue !== null && prevValue !== null ? latestValue - prevValue : null
  const deltaPercent = delta !== null && prevValue ? (delta / prevValue) * 100 : null

  const color = BRAND_COLORS[brand]
  const displayedRows = filteredDaily.slice().reverse().slice(0, showRows)

  return (
    <>
      <LoadingScreen show={initialLoad} />
      <div className="flex min-h-screen bg-[#060e20]">
        <Sidebar />

        <main className="flex-1 flex justify-center lg:pl-64 md:pl-16 pb-16 md:pb-0">
          <div className="w-full max-w-[1280px] px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <h1
                  className="text-[#dae2fd] text-2xl sm:text-[32px] font-semibold"
                  style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
                >
                  Lịch sử giao dịch
                </h1>
                <div className="flex items-center gap-2 flex-wrap text-[#d8c3ad] text-sm">
                  <span className="font-semibold" style={{ color: BRAND_COLORS[brand] }}>{brand}</span>
                  <span>•</span>
                  <span>{daysFilter} ngày gần nhất</span>
                  <span>•</span>
                  <span>Nguồn: vang.today</span>
                </div>
              </div>

              {/* Controls — wraps nicely on mobile */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Chart type toggle */}
                <div className="flex rounded-lg p-1 gap-1" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                  <button
                    onClick={() => setChartType('line')}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5"
                    style={{
                      background: chartType === 'line' ? '#334155' : 'transparent',
                      color: chartType === 'line' ? '#ffc174' : '#d8c3ad',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Đường
                  </button>
                  <button
                    onClick={() => setChartType('candle')}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5"
                    style={{
                      background: chartType === 'candle' ? '#334155' : 'transparent',
                      color: chartType === 'candle' ? '#ffc174' : '#d8c3ad',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="2" x2="12" y2="22" /><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" />
                    </svg>
                    Biến động
                  </button>
                </div>

                {/* Brand select */}
                <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[brand] }} />
                  <select
                    value={brand}
                    onChange={(e) => { setBrand(e.target.value as 'SJC' | 'DOJI' | 'PNJ'); setShowRows(10) }}
                    className="bg-transparent text-[#dae2fd] text-sm outline-none cursor-pointer"
                  >
                    {['SJC', 'DOJI', 'PNJ'].map((b) => (
                      <option key={b} value={b} className="bg-[#1e293b]">{b}</option>
                    ))}
                  </select>
                </div>

                {/* Refresh */}
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="bg-[#1e293b] border border-[#334155] rounded-lg p-2 text-[#dae2fd] hover:bg-[#2d3d53] transition-colors disabled:opacity-50"
                >
                  <svg
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={loading ? 'animate-spin' : ''}
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                Không thể kết nối đến nguồn dữ liệu. Vui lòng thử lại.
              </div>
            )}

            {/* Chart Card */}
            <div className="rounded-xl p-4 sm:p-6 flex flex-col gap-5 sm:gap-6" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              {/* Price + delta */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className="font-bold leading-none"
                      style={{
                        color: '#ffc174',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 'clamp(24px, 5vw, 48px)',
                      }}
                    >
                      {latestValue ? formatVND(latestValue) : '--'}
                    </span>
                    <span className="text-[#d8c3ad] text-sm">VNĐ / Lượng</span>
                  </div>
                  {delta !== null && deltaPercent !== null && (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold w-fit"
                      style={{
                        background: delta >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: delta >= 0 ? '#22c55e' : '#ef4444',
                        border: `1px solid ${delta >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      }}
                    >
                      {delta >= 0 ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                        </svg>
                      )}
                      {delta >= 0 ? '+' : ''}{Math.round(delta / 1000)}k
                      <span className="hidden sm:inline">({deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(2)}%) so với hôm qua</span>
                    </div>
                  )}
                </div>

                {/* Mua/Bán toggle */}
                {chartType === 'line' && (
                  <div className="flex rounded-lg p-1 gap-1" style={{ background: 'rgba(6,14,32,0.5)', border: '1px solid #334155' }}>
                    {(['sell', 'buy'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setPriceType(t)}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                        style={{
                          background: priceType === t ? '#334155' : 'transparent',
                          color: priceType === t ? '#ffc174' : '#d8c3ad',
                        }}
                      >
                        {t === 'sell' ? 'Bán ra' : 'Mua vào'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chart */}
              {loading ? (
                <div className="h-48 sm:h-64 animate-pulse rounded" style={{ background: 'rgba(6,14,32,0.3)' }} />
              ) : filteredDaily.length === 0 ? (
                <div className="h-48 sm:h-64 flex items-center justify-center text-[#d8c3ad]">Chưa có dữ liệu</div>
              ) : chartType === 'line' ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${brand}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#d8c3ad', fontFamily: 'JetBrains Mono, monospace' }}
                      axisLine={{ stroke: 'rgba(51,65,85,0.5)' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`}
                      tick={{ fontSize: 10, fill: '#d8c3ad', fontFamily: 'JetBrains Mono, monospace' }}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#d8c3ad' }}
                      formatter={(v: unknown) => [
                        `${formatVND(Number(v))} ₫`,
                        priceType === 'sell' ? 'Bán ra' : 'Mua vào',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      strokeWidth={2}
                      fill={`url(#grad-${brand})`}
                      dot={false}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4 justify-end">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-[#22c55e] opacity-80" />
                      <span className="text-[#d8c3ad] text-[10px]">Tăng giá</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-[#ef4444] opacity-80" />
                      <span className="text-[#d8c3ad] text-[10px]">Giảm giá</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={216}>
                    <BarChart data={changeData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#d8c3ad', fontFamily: 'JetBrains Mono, monospace' }}
                        axisLine={{ stroke: 'rgba(51,65,85,0.5)' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[changeMin, changeMax]}
                        tickFormatter={(v) => {
                          const k = Math.round(v / 1000)
                          return k === 0 ? '0' : `${k > 0 ? '+' : ''}${k}k`
                        }}
                        tick={{ fontSize: 10, fill: '#d8c3ad', fontFamily: 'JetBrains Mono, monospace' }}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                      />
                      <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
                      <Tooltip content={<ChangeTooltip />} />
                      <Bar dataKey="change" radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={40}>
                        {changeData.map((entry, i) => (
                          <Cell key={i} fill={entry.change >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Data Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              {/* Table header + days filter */}
              <div
                className="flex items-center justify-between px-4 sm:px-6 py-4 flex-wrap gap-2"
                style={{ borderBottom: '1px solid #334155' }}
              >
                <span className="text-[#dae2fd] text-base font-semibold">Dữ liệu chi tiết</span>
                <div className="flex rounded-lg p-1 gap-0.5 sm:gap-1" style={{ background: '#060e20', border: '1px solid #334155' }}>
                  {DAY_FILTERS.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDaysFilter(d); setShowRows(10) }}
                      className="px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-semibold transition-all"
                      style={{
                        background: daysFilter === d ? '#334155' : 'transparent',
                        color: daysFilter === d ? '#ffc174' : '#d8c3ad',
                      }}
                    >
                      {d}N
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop table (sm+) */}
              <div className="hidden sm:block">
                <div
                  className="grid px-6 py-3 text-[10px] font-bold tracking-widest text-[#d8c3ad] uppercase"
                  style={{ background: '#2d3449', gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr', borderBottom: '1px solid #334155' }}
                >
                  <div>Ngày</div>
                  <div>Mua vào</div>
                  <div>Bán ra</div>
                  <div>Chênh lệch</div>
                  <div>Thay đổi</div>
                </div>

                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse mx-6 my-2 rounded" style={{ background: '#334155' }} />
                  ))
                ) : displayedRows.length === 0 ? (
                  <div className="py-16 text-center text-[#d8c3ad]">Chưa có dữ liệu lịch sử</div>
                ) : (
                  displayedRows.map((row, idx) => (
                    <div
                      key={row.date}
                      className="grid px-6 py-4 items-center"
                      style={{
                        gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1fr',
                        borderTop: idx > 0 ? '1px solid rgba(51,65,85,0.5)' : 'none',
                      }}
                    >
                      <div className="text-[#d8c3ad] text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDateFull(row.date)}
                      </div>
                      <div className="text-[#dae2fd] text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatVND(row.buyPrice)}
                      </div>
                      <div className="text-[#dae2fd] text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatVND(row.sellPrice)}
                      </div>
                      <div className="text-[#d8c3ad] text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatVND(row.spread)}
                      </div>
                      <div>
                        {row.changeBuy === null || row.changeBuy === 0 ? (
                          <span className="text-[#d8c3ad] text-sm">—</span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              background: row.changeBuy > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              color: row.changeBuy > 0 ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {row.changeBuy > 0 ? '↑' : '↓'}
                            {row.changeBuy > 0 ? '+' : ''}{Math.round(row.changeBuy / 1000)}k
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Mobile card list (< sm) */}
              <div className="sm:hidden">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse mx-4 my-2 rounded" style={{ background: '#334155' }} />
                  ))
                ) : displayedRows.length === 0 ? (
                  <div className="py-12 text-center text-[#d8c3ad]">Chưa có dữ liệu lịch sử</div>
                ) : (
                  displayedRows.map((row, idx) => (
                    <div
                      key={row.date}
                      className="px-4 py-3 flex flex-col gap-2"
                      style={{ borderTop: idx > 0 ? '1px solid rgba(51,65,85,0.5)' : 'none' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[#d8c3ad] text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatDateFull(row.date)}
                        </span>
                        {row.changeBuy === null || row.changeBuy === 0 ? (
                          <span className="text-[#d8c3ad] text-xs">—</span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              background: row.changeBuy > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              color: row.changeBuy > 0 ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {row.changeBuy > 0 ? '↑' : '↓'}{Math.round(row.changeBuy / 1000)}k
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-[#d8c3ad] text-[9px] uppercase tracking-wider">Mua vào</div>
                          <div className="text-[#dae2fd] text-xs font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {(row.buyPrice / 1_000_000).toFixed(2)}tr
                          </div>
                        </div>
                        <div>
                          <div className="text-[#d8c3ad] text-[9px] uppercase tracking-wider">Bán ra</div>
                          <div className="text-[#dae2fd] text-xs font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {(row.sellPrice / 1_000_000).toFixed(2)}tr
                          </div>
                        </div>
                        <div>
                          <div className="text-[#d8c3ad] text-[9px] uppercase tracking-wider">Spread</div>
                          <div className="text-[#d8c3ad] text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {(row.spread / 1_000).toFixed(0)}k
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Show more */}
              {!loading && filteredDaily.length > showRows && (
                <div className="flex justify-center py-4" style={{ borderTop: '1px solid #334155' }}>
                  <button
                    onClick={() => setShowRows((n) => n + 10)}
                    className="text-[#ffc174] text-sm font-semibold tracking-wider hover:text-[#f59e0b] transition-colors"
                  >
                    XEM THÊM ({filteredDaily.length - showRows} ngày còn lại)
                  </button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  )
}
