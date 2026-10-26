export interface RateLimiter {
  limit(_options: { key: string }): Promise<{ success: boolean }>
}

const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/
const EMBEDDED_IPV4 = /^(.*:)(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
const HEXTET = /^[0-9a-f]{1,4}$/

/** The eight 16-bit groups of an IPv6 address, or undefined if it isn't one. */
function hextets(address: string): number[] | undefined {
  // A trailing dotted quad (`::ffff:203.0.113.7`) stands for the last two groups.
  const quad = EMBEDDED_IPV4.exec(address)
  let text = address
  if (quad) {
    const [a, b, c, d] = quad.slice(2).map(Number)
    if ([a, b, c, d].some((octet) => octet > 255)) return undefined
    text = `${quad[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const halves = text.split('::')
  if (halves.length > 2) return undefined
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves[1] ? halves[1].split(':') : []
  // `::` stands for one or more zero groups; without it there must be exactly eight.
  const gap = 8 - head.length - tail.length
  if (halves.length === 2 ? gap < 1 : gap !== 0) return undefined
  const groups = [...head, ...Array<string>(gap).fill('0'), ...tail]
  return groups.every((group) => HEXTET.test(group))
    ? groups.map((group) => parseInt(group, 16))
    : undefined
}

/**
 * The rate-limit key for the address in `CF-Connecting-IP`. An IPv4 address is one visitor. An
 * IPv6 visitor usually holds a whole /64 (hosts and ISPs route one per customer), so keying on the
 * full address would give each address in it a fresh counter: the key is the /64 prefix, written
 * the same way however the address was compressed. An IPv4-mapped address (`::ffff:203.0.113.7`)
 * counts as its IPv4 address. A missing header is `unknown`; anything unparseable is kept as is.
 */
export function visitorKey(address: string | null): string {
  const text = address?.trim().toLowerCase() ?? ''
  if (!text) return 'unknown'
  if (IPV4.test(text)) return text
  const groups = hextets(text)
  if (!groups) return text
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join('.')
  }
  return `${groups
    .slice(0, 4)
    .map((group) => group.toString(16))
    .join(':')}::/64`
}

/** One counter per visitor (`visitorKey()`). */
export async function withinLimit(limiter: RateLimiter, request: Request): Promise<boolean> {
  const key = visitorKey(request.headers.get('CF-Connecting-IP'))
  return (await limiter.limit({ key })).success
}
