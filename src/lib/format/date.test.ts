import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

process.env.TZ = 'Pacific/Kiritimati'
const { formatPostDate } = await import('./date.ts')

describe('post dates', () => {
  it('writes the day, month name and year', () => {
    assert.equal(formatPostDate('2026-10-01T09:00:00Z'), '1 October 2026')
  })

  it("uses the UTC date, not the build machine's time zone (here UTC+14)", () => {
    assert.equal(formatPostDate('2026-10-01T23:30:00Z'), '1 October 2026')
    assert.equal(formatPostDate('2026-10-01T00:30:00+02:00'), '30 September 2026')
  })
})
