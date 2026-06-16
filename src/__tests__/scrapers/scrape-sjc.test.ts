import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeSJC } from '@/lib/scrapers/scrape-sjc'

const MOCK_HTML = `
<html><body>
  <table>
    <tbody>
      <tr>
        <td>Vàng SJC 1L, 10L, 1KG</td>
        <td>85.200</td>
        <td>85.600</td>
      </tr>
    </tbody>
  </table>
</body></html>
`

describe('scrapeSJC', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns gold prices on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => MOCK_HTML,
    } as Response)

    const result = await scrapeSJC()

    expect(result.success).toBe(true)
    expect(result.data?.brand).toBe('SJC')
    expect(result.data?.buyPrice).toBe(85200000)
    expect(result.data?.sellPrice).toBe(85600000)
  })

  it('returns failure when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const result = await scrapeSJC()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Network error')
  })

  it('returns failure when HTTP status is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '',
    } as Response)

    const result = await scrapeSJC()

    expect(result.success).toBe(false)
  })
})
