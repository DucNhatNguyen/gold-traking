import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Theo dõi giá vàng',
  description: 'Bảng giá vàng SJC, DOJI, PNJ cập nhật mỗi giờ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
