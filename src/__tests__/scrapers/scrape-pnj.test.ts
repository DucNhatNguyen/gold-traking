import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapePNJ } from '@/lib/scrapers/scrape-pnj'

const MOCK_HTML = `
<html><body>
  <table>
    <tbody>
      <tr>
        <td>Vàng SJC PNJ</td>
        <td>85.000</td>
        <td>85.400</td>
      </tr>
    </tbody>
  </table>
</body></html>
`

describe('scrapePNJ', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns gold prices on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => MOCK_HTML,
    } as Response)

    const result = await scrapePNJ()

    expect(result.success).toBe(true)
    expect(result.data?.brand).toBe('PNJ')
    expect(result.data?.buyPrice).toBe(85000000)
    expect(result.data?.sellPrice).toBe(85400000)
  })

  it('returns failure when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Timeout'))

    const result = await scrapePNJ()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Timeout')
  })
})
