import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeDOJI } from '@/lib/scrapers/scrape-doji'

const MOCK_HTML = `
<html><body>
  <table>
    <tbody>
      <tr>
        <td>Vàng DOJI SJC</td>
        <td>85.100</td>
        <td>85.500</td>
      </tr>
    </tbody>
  </table>
</body></html>
`

describe('scrapeDOJI', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns gold prices on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => MOCK_HTML,
    } as Response)

    const result = await scrapeDOJI()

    expect(result.success).toBe(true)
    expect(result.data?.brand).toBe('DOJI')
    expect(result.data?.buyPrice).toBe(85100000)
    expect(result.data?.sellPrice).toBe(85500000)
  })

  it('returns failure when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Connection refused'))

    const result = await scrapeDOJI()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Connection refused')
  })
})
