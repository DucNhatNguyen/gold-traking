import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeGiavang } from '@/lib/scrapers/scrape-giavang'

const MOCK_HTML = `
<html><body>
  <table>
    <thead><tr><th>Khu vực</th><th>Hệ thống</th><th>Mua vào</th><th>Bán ra</th></tr></thead>
    <tbody>
      <tr>
        <th rowspan="3">TP. Hồ Chí Minh</th>
        <td><strong>SJC</strong></td>
        <td>149.500</td>
        <td>151.500</td>
      </tr>
      <tr>
        <td><strong>PNJ</strong></td>
        <td>148.000</td>
        <td>150.000</td>
      </tr>
      <tr>
        <td><strong>DOJI</strong></td>
        <td>147.500</td>
        <td>149.500</td>
      </tr>
    </tbody>
  </table>
</body></html>
`

describe('scrapeGiavang', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns all 3 brands on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => MOCK_HTML,
    } as Response)

    const results = await scrapeGiavang()

    expect(results).toHaveLength(3)
    const sjc = results.find((r) => r.data?.brand === 'SJC')
    expect(sjc?.success).toBe(true)
    expect(sjc?.data?.buyPrice).toBe(149500000)
    expect(sjc?.data?.sellPrice).toBe(151500000)

    const pnj = results.find((r) => r.data?.brand === 'PNJ')
    expect(pnj?.success).toBe(true)
    expect(pnj?.data?.buyPrice).toBe(148000000)

    const doji = results.find((r) => r.data?.brand === 'DOJI')
    expect(doji?.success).toBe(true)
    expect(doji?.data?.buyPrice).toBe(147500000)
  })

  it('returns failure when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const results = await scrapeGiavang()

    expect(results).toHaveLength(1)
    expect(results[0].success).toBe(false)
    expect(results[0].error).toContain('Network error')
  })

  it('returns failure when HTTP status is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '',
    } as Response)

    const results = await scrapeGiavang()
    expect(results[0].success).toBe(false)
  })
})
