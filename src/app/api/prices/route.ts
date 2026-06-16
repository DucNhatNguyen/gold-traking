import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') === '30d' ? 30 : 7

  const since = new Date()
  since.setDate(since.getDate() - range)

  const brands = ['SJC', 'DOJI', 'PNJ']

  const [latestRecords, history] = await Promise.all([
    Promise.all(
      brands.map((brand) =>
        prisma.priceRecord.findFirst({
          where: { brand },
          orderBy: { createdAt: 'desc' },
        })
      )
    ),
    prisma.priceRecord.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: {
        brand: true,
        buyPrice: true,
        sellPrice: true,
        createdAt: true,
      },
    }),
  ])

  return NextResponse.json({
    latest: latestRecords
      .filter(Boolean)
      .map((r) => ({
        brand: r!.brand,
        buyPrice: r!.buyPrice,
        sellPrice: r!.sellPrice,
        updatedAt: r!.createdAt.toISOString(),
      })),
    history,
  })
}
