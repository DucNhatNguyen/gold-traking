'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Phân tích', href: '/', icon: 'chart' as const },
  { label: 'Bảng giá', href: '/bang-gia', icon: 'list' as const },
  { label: 'Máy tính', href: '/may-tinh', icon: 'calculator' as const },
  { label: 'Lịch sử', href: '/lich-su', icon: 'history' as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ─── Desktop sidebar (lg+): full w-64 ─── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#0b1326] border-r border-[#534434] flex-col gap-4 px-4 py-8 z-20">
        <div className="flex flex-col gap-4 pb-8">
          <h1
            className="text-[#ffc174] text-2xl font-semibold px-2"
            style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}
          >
            Giá Vàng
          </h1>
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2 flex gap-3 items-center">
            <div className="bg-[#3e495d] rounded-full w-10 h-10 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dae2fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <div className="text-[#dae2fd] text-[16px] font-semibold">Theo dõi giá vàng</div>
              <div className="text-[#d8c3ad] text-[10px] font-bold tracking-wider">Dữ liệu thời gian thực</div>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map(({ label, href, icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex gap-3 items-center p-3 rounded-lg transition-colors ${active ? 'bg-[#3e495d]' : 'hover:bg-[#1e293b]'}`}
              >
                <NavIcon type={icon} active={active} />
                <span className="text-xs font-bold tracking-wider" style={{ color: active ? '#ffc174' : '#d8c3ad' }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* ─── Tablet sidebar (md → lg): icon-only w-16 ─── */}
      <aside className="hidden md:flex lg:hidden fixed left-0 top-0 h-screen w-16 bg-[#0b1326] border-r border-[#534434] flex-col items-center py-6 gap-1 z-20">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'rgba(255,193,116,0.1)', border: '1px solid rgba(255,193,116,0.3)' }}
        >
          <span className="text-[#ffc174] text-[10px] font-bold">VM</span>
        </div>
        <nav className="flex flex-col gap-1 w-full px-2">
          {NAV_ITEMS.map(({ label, href, icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`flex justify-center items-center p-3 rounded-lg transition-colors ${active ? 'bg-[#3e495d]' : 'hover:bg-[#1e293b]'}`}
              >
                <NavIcon type={icon} active={active} />
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* ─── Mobile bottom nav (< md) ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around h-16 safe-area-inset-bottom"
        style={{ background: '#0b1326', borderTop: '1px solid #534434' }}
      >
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-[56px]"
            >
              <NavIcon type={icon} active={active} />
              <span
                className="text-[9px] font-bold tracking-wide leading-none"
                style={{ color: active ? '#ffc174' : '#d8c3ad' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

function NavIcon({ type, active }: { type: 'chart' | 'list' | 'calculator' | 'history'; active: boolean }) {
  const color = active ? '#ffc174' : '#d8c3ad'
  if (type === 'chart') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
  if (type === 'list') return (
    <svg width="20" height="14" viewBox="0 0 24 18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="3" x2="21" y2="3" /><line x1="8" y1="9" x2="21" y2="9" /><line x1="8" y1="15" x2="21" y2="15" />
      <line x1="3" y1="3" x2="3.01" y2="3" /><line x1="3" y1="9" x2="3.01" y2="9" /><line x1="3" y1="15" x2="3.01" y2="15" />
    </svg>
  )
  if (type === 'calculator') return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="8" y2="10" /><line x1="12" y1="10" x2="12" y2="10" /><line x1="16" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="8" y2="14" /><line x1="12" y1="14" x2="12" y2="14" /><line x1="16" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  )
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  )
}
