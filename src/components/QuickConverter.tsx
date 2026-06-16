'use client'

import { useState } from 'react'

interface LatestPrice {
  brand: string
  buyPrice: number
  sellPrice: number
}

interface QuickConverterProps {
  latest: LatestPrice[]
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫'
}

export function QuickConverter({ latest }: QuickConverterProps) {
  const [luong, setLuong] = useState('1')
  const [brand, setBrand] = useState('SJC')

  const price = latest.find((l) => l.brand === brand)
  const count = parseFloat(luong) || 0

  return (
    <div
      className="bg-[#1e293b] rounded-xl flex flex-col gap-6 p-[26px] w-full"
      style={{ border: '2px solid #ffc174', boxShadow: '0 0 7.5px rgba(245,158,11,0.1)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffc174" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-[#dae2fd] text-lg font-semibold">Công cụ quy đổi</span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Input row */}
        <div className="flex gap-2">
          <div className="bg-[#060e20] border border-[#334155] rounded-lg flex-1 flex items-center px-3 py-2 gap-2 min-w-0">
            <input
              type="number"
              min={0}
              step={0.1}
              value={luong}
              onChange={(e) => setLuong(e.target.value)}
              className="bg-transparent flex-1 text-right text-[#dae2fd] text-2xl font-semibold outline-none w-0 min-w-0"
              style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
            />
            <span className="text-[#d8c3ad] text-base shrink-0">lượng</span>
          </div>
          <div className="bg-[#060e20] border border-[#334155] rounded-lg px-3 py-2 flex items-center shrink-0">
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="bg-transparent text-[#dae2fd] text-lg font-semibold outline-none cursor-pointer"
            >
              {['SJC', 'DOJI', 'PNJ'].map((b) => (
                <option key={b} value={b} className="bg-[#1e293b]">
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#334155]" />

        {/* Results */}
        <div className="flex flex-col gap-3">
          <div
            className="rounded-lg flex flex-col gap-1 p-[17px]"
            style={{ background: 'rgba(6,14,32,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}
          >
            <span className="text-[#d8c3ad] text-xs font-bold tracking-wider">Tổng Mua vào</span>
            <span className="text-[#ffc174] text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              {price ? formatVND(price.buyPrice * count) : '--'}
            </span>
          </div>
          <div
            className="rounded-lg flex flex-col gap-1 p-[17px]"
            style={{ background: 'rgba(6,14,32,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}
          >
            <span className="text-[#d8c3ad] text-xs font-bold tracking-wider">Tổng Bán ra</span>
            <span className="text-[#dae2fd] text-2xl font-bold" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              {price ? formatVND(price.sellPrice * count) : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
