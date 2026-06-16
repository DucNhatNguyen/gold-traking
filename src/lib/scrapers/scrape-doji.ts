import * as cheerio from 'cheerio'
import { ScrapeResult } from './types'

function parsePrice(text: string): number {
  const digits = parseInt(text.trim().replace(/\./g, '').replace(',', ''), 10)
  return digits * 1000
}

export async function scrapeDOJI(): Promise<ScrapeResult> {
  try {
    const response = await fetch('https://doji.vn/bang-gia-vang/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    let buyPrice = 0
    let sellPrice = 0

    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td')
      const name = $(cells.get(0)).text().trim()
      if ((name.includes('SJC') || name.includes('DOJI')) && buyPrice === 0) {
        buyPrice = parsePrice($(cells.get(1)).text())
        sellPrice = parsePrice($(cells.get(2)).text())
      }
    })

    if (buyPrice === 0 || sellPrice === 0) {
      return { success: false, error: 'DOJI: không tìm thấy giá trong bảng' }
    }

    return { success: true, data: { brand: 'DOJI', buyPrice, sellPrice } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
