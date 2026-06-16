import * as cheerio from 'cheerio'
import { GoldPrice, ScrapeResult } from './types'

// "149.500" (VN format, dot = thousands sep) → 149500 → *1000 = 149,500,000 VND per lượng
function parsePrice(text: string): number {
  return parseInt(text.trim().replace(/\./g, '').replace(',', ''), 10) * 1000
}

const BRAND_MAP: Record<string, 'SJC' | 'DOJI' | 'PNJ'> = {
  SJC: 'SJC',
  DOJI: 'DOJI',
  PNJ: 'PNJ',
}

export async function scrapeGiavang(): Promise<ScrapeResult[]> {
  try {
    const response = await fetch('https://giavang.org', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      return [{ success: false, error: `giavang.org HTTP ${response.status}` }]
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const found: Record<string, GoldPrice> = {}

    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td')
      if (cells.length < 3) return

      const brandText = $(cells[0]).text().trim().toUpperCase()
      const brand = Object.keys(BRAND_MAP).find((b) => brandText.includes(b))
      if (!brand || found[brand]) return

      const buyPrice = parsePrice($(cells[1]).text())
      const sellPrice = parsePrice($(cells[2]).text())
      if (!buyPrice || !sellPrice) return

      found[brand] = { brand: BRAND_MAP[brand], buyPrice, sellPrice }
    })

    const results: ScrapeResult[] = ['SJC', 'DOJI', 'PNJ'].map((brand) =>
      found[brand]
        ? { success: true, data: found[brand] }
        : { success: false, error: `${brand}: không tìm thấy trên giavang.org` }
    )

    return results
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return [{ success: false, error: `giavang.org: ${msg}` }]
  }
}
