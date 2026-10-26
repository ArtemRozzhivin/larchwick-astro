/** A caught value's message, for the logs: a thrown value need not be an Error. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Whether a caught value is what an `AbortSignal.timeout()` signal rejects with. */
export function isTimeout(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error
    ? error.name === 'TimeoutError'
    : false
}
