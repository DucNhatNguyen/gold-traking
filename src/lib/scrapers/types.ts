export type Brand = 'SJC' | 'DOJI' | 'PNJ'

export interface GoldPrice {
  brand: Brand
  buyPrice: number  // full VND (e.g., 85200000)
  sellPrice: number // full VND (e.g., 85600000)
}

export interface ScrapeResult {
  success: boolean
  data?: GoldPrice
  error?: string
}
