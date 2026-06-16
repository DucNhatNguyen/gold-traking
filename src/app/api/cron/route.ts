import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scrapeGiavang } from '@/lib/scrapers/scrape-giavang'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await scrapeGiavang()

  const saved: string[] = []
  const errors: string[] = []

  for (const result of results) {
    if (!result.success || !result.data) {
      errors.push(result.error ?? 'Unknown error')
      continue
    }

    await prisma.priceRecord.create({
      data: {
        brand: result.data.brand,
        buyPrice: result.data.buyPrice,
        sellPrice: result.data.sellPrice,
      },
    })
    saved.push(result.data.brand)
  }

  return NextResponse.json({ saved, errors })
}
