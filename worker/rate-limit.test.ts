import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { visitorKey, withinLimit } from './rate-limit.ts'
import { recordingLimiter } from './test-fakes.ts'

describe('rate-limit visitor key', () => {
  it('keeps an IPv4 address whole', () => {
    assert.equal(visitorKey('203.0.113.7'), '203.0.113.7')
    assert.equal(visitorKey(' 198.51.100.20 '), '198.51.100.20')
  })

  it('keys every address of one IPv6 /64 the same, however it is written', () => {
    for (const address of [
      '2001:0db8:0001:0002:0003:0004:0005:0006',
      '2001:db8:1:2::1',
      '2001:DB8:1:2:FFFF::',
      '2001:db8:1:2:a:b:c:d',
      '2001:0db8:0001:0002::abcd',
      '2001:db8:1:2:0:0:0:0',
    ]) {
      assert.equal(visitorKey(address), '2001:db8:1:2::/64', address)
    }
  })

  it('expands :: inside the prefix', () => {
    assert.equal(visitorKey('2001:db8::1'), '2001:db8:0:0::/64')
    assert.equal(visitorKey('2001:db8::1:2:3:4:5'), '2001:db8:0:1::/64')
    assert.equal(visitorKey('::2:3:4:5:6:7:8'), '0:2:3:4::/64')
    assert.equal(visitorKey('1:2:3:4:5:6:7::'), '1:2:3:4::/64')
    assert.equal(visitorKey('::1'), '0:0:0:0::/64')
    assert.equal(visitorKey('::'), '0:0:0:0::/64')
  })

  it('tells neighbouring /64s apart', () => {
    assert.notEqual(visitorKey('2001:db8:1:2::1'), visitorKey('2001:db8:1:3::1'))
  })

  it('treats an IPv4-mapped IPv6 address as the IPv4 address', () => {
    assert.equal(visitorKey('::ffff:203.0.113.7'), '203.0.113.7')
    assert.equal(visitorKey('::FFFF:cb00:7107'), '203.0.113.7')
    assert.equal(visitorKey('0:0:0:0:0:ffff:203.0.113.7'), '203.0.113.7')
  })

  it('reads a dotted quad at the end of any IPv6 address', () => {
    assert.equal(visitorKey('64:ff9b::203.0.113.7'), '64:ff9b:0:0::/64')
  })

  it('falls back to unknown without the header, and keeps anything unparseable', () => {
    assert.equal(visitorKey(null), 'unknown')
    assert.equal(visitorKey(''), 'unknown')
    for (const address of ['2001:db8::1::2', '1:2:3:4:5:6:7:8:9', '1:2:3:4:5:6:7:8::', 'g::1']) {
      assert.equal(visitorKey(address), address)
    }
    assert.equal(visitorKey('::ffff:300.0.0.1'), '::ffff:300.0.0.1')
  })

  it('asks the limiter with the visitor key', async () => {
    const keys: string[] = []
    const limiter = recordingLimiter(keys)
    const request = new Request('https://example.com/api/chat', {
      headers: { 'CF-Connecting-IP': '2001:db8:1:2:aaaa:bbbb:cccc:dddd' },
    })
    assert.equal(await withinLimit(limiter, request), true)
    assert.equal(await withinLimit(limiter, new Request('https://example.com/')), true)
    assert.deepEqual(keys, ['2001:db8:1:2::/64', 'unknown'])
  })
})
