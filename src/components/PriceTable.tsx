'use client'

interface PriceEntry {
  brand: string
  buyPrice: number
  sellPrice: number
  updatedAt: string
}

interface PriceTableProps {
  data: PriceEntry[]
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoString))
}

export function PriceTable({ data }: PriceTableProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        Chưa có dữ liệu. Cron job sẽ cập nhật vào giờ tiếp theo.
      </div>
    )
  }

  const maxBuyBrand = data.reduce((max, cur) =>
    cur.buyPrice > max.buyPrice ? cur : max
  )

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-yellow-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Thương hiệu</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Mua vào</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Bán ra</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Cập nhật</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr
              key={row.brand}
              className={
                row.brand === maxBuyBrand.brand
                  ? 'bg-yellow-50/60'
                  : 'bg-white hover:bg-gray-50'
              }
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {row.brand}
                {row.brand === maxBuyBrand.brand && (
                  <span className="ml-2 rounded-full bg-yellow-200 px-2 py-0.5 text-xs text-yellow-800">
                    Mua cao nhất
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-medium text-green-700">
                {formatVND(row.buyPrice)}
              </td>
              <td className="px-4 py-3 text-right font-medium text-red-600">
                {formatVND(row.sellPrice)}
              </td>
              <td className="px-4 py-3 text-right text-xs text-gray-400">
                {formatTime(row.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
