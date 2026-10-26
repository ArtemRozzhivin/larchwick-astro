import type { RateLimiter } from './rate-limit.ts'

/** A rate limiter that pushes each key it is asked about onto `keys` and answers `allowed`. */
export function recordingLimiter(keys: string[], allowed = true): RateLimiter {
  return {
    limit: async ({ key }) => {
      keys.push(key)
      return { success: allowed }
    },
  }
}

/** A rate limiter whose every call rejects, like a binding that is down. */
export const brokenLimiter: RateLimiter = {
  limit: () => Promise.reject(new Error('limiter down')),
}
