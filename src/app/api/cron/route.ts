import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scrapeSJC } from '@/lib/scrapers/scrape-sjc'
import { scrapeDOJI } from '@/lib/scrapers/scrape-doji'
import { scrapePNJ } from '@/lib/scrapers/scrape-pnj'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scrapers = [scrapeSJC, scrapeDOJI, scrapePNJ]
  const results = await Promise.allSettled(scrapers.map((fn) => fn()))

  const saved: string[] = []
  const errors: string[] = []

  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push(String(result.reason))
      continue
    }

    const scrapeResult = result.value
    if (!scrapeResult.success || !scrapeResult.data) {
      errors.push(scrapeResult.error ?? 'Unknown scrape error')
      continue
    }

    await prisma.priceRecord.create({
      data: {
        brand: scrapeResult.data.brand,
        buyPrice: scrapeResult.data.buyPrice,
        sellPrice: scrapeResult.data.sellPrice,
      },
    })
    saved.push(scrapeResult.data.brand)
  }

  return NextResponse.json({ saved, errors })
}
