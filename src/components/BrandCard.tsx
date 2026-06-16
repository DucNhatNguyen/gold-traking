const BRAND_COLORS: Record<string, string> = {
  SJC: '#f59e0b',
  DOJI: '#3b82f6',
  PNJ: '#10b981',
}

interface BrandCardProps {
  brand: 'SJC' | 'DOJI' | 'PNJ'
  buyPrice: number
  sellPrice: number
  prevBuyPrice: number | null
  prevSellPrice: number | null
  isBestSpread: boolean
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price)
}

function getDelta(current: number, prev: number | null): { text: string; color: string } {
  if (prev === null) return { text: '--', color: '#d8c3ad' }
  const delta = current - prev
  if (delta === 0) return { text: '0', color: '#d8c3ad' }
  const sign = delta > 0 ? '+' : ''
  const absK = Math.abs(delta) / 1000
  const kText = absK % 1 === 0 ? `${absK}k` : `${absK.toFixed(1)}k`
  return { text: `${sign}${kText}`, color: delta > 0 ? '#22c55e' : '#ef4444' }
}

function getPercent(current: number, prev: number | null) {
  if (prev === null) return { text: '--', bg: '#060e20', color: '#d8c3ad' }
  const pct = ((current - prev) / prev) * 100
  if (pct === 0) return { text: '0.00%', bg: 'rgba(209,213,219,0.1)', color: '#d8c3ad' }
  const sign = pct > 0 ? '+' : ''
  return {
    text: `${sign}${pct.toFixed(2)}%`,
    bg: pct > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
    color: pct > 0 ? '#22c55e' : '#ef4444',
  }
}

export function BrandCard({ brand, buyPrice, sellPrice, prevBuyPrice, prevSellPrice, isBestSpread }: BrandCardProps) {
  const spread = sellPrice - buyPrice
  const pct = getPercent(sellPrice, prevSellPrice)
  const buyDelta = getDelta(buyPrice, prevBuyPrice)
  const sellDelta = getDelta(sellPrice, prevSellPrice)

  return (
    <div
      className="bg-[#1e293b] rounded-xl flex flex-col gap-3 px-[17px] pb-[18px] pt-[17px] shadow-sm"
      style={{
        border: '1px solid #334155',
        borderBottomWidth: isBestSpread ? '2px' : '1px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 rounded-full shrink-0" style={{ backgroundColor: BRAND_COLORS[brand] }} />
          <span className="text-[#dae2fd] text-lg font-semibold">{brand}</span>
        </div>
        <div className="rounded px-2 py-0.5 text-[10px]" style={{ backgroundColor: pct.bg, color: pct.color }}>
          {pct.text}
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[#d8c3ad] text-[10px]">MUA VÀO</span>
          <span
            className="text-[#dae2fd] text-base font-medium pt-1"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {formatPrice(buyPrice)}
          </span>
          <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: buyDelta.color }}>
            {buyDelta.text}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#d8c3ad] text-[10px]">BÁN RA</span>
          <span
            className="text-[#dae2fd] text-base font-medium pt-1"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {formatPrice(sellPrice)}
          </span>
          <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: sellDelta.color }}>
            {sellDelta.text}
          </span>
        </div>
      </div>

      {/* Spread */}
      <div className="border-t border-[rgba(51,65,85,0.5)] pt-2 flex items-center justify-between">
        <span className="text-[10px]" style={{ color: isBestSpread ? '#ffc174' : '#d8c3ad' }}>
          {isBestSpread ? 'TỐT NHẤT' : 'SPREAD'}
        </span>
        <span
          className="text-xs"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: isBestSpread ? '#ffc174' : '#dae2fd' }}
        >
          {formatPrice(spread)} ₫
        </span>
      </div>
    </div>
  )
}
