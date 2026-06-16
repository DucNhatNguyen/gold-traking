import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Giá Vàng',
  description: 'Theo dõi giá vàng SJC, DOJI, PNJ cập nhật mỗi giờ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-[#060e20] text-[#dae2fd] antialiased">
        {children}
      </body>
    </html>
  )
}
