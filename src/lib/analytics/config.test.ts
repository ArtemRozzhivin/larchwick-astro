import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { analyticsCookies, cookieDomains, measurementId, readConsent } from './config.ts'

describe('analytics config', () => {
  it('builds the Measurement ID into production pages only', () => {
    assert.equal(measurementId({ WORKERS_CI_BRANCH: 'main' }, 'G-TEST'), 'G-TEST')
    assert.equal(measurementId({ WORKERS_CI_BRANCH: 'feat/analytics' }, 'G-TEST'), undefined)
    assert.equal(measurementId({}, 'G-TEST'), undefined)
  })

  it('reads only a real choice from storage', () => {
    assert.equal(readConsent('granted'), 'granted')
    assert.equal(readConsent('denied'), 'denied')
    assert.equal(readConsent(null), null)
    assert.equal(readConsent('yes'), null)
  })

  it('finds the Google Analytics cookies and nothing else', () => {
    assert.deepEqual(
      analyticsCookies('_ga=GA1.1.1; theme=dark; _ga_C7SVR1FYHZ=GS2.1; _gat=1; x_ga=1'),
      ['_ga', '_ga_C7SVR1FYHZ'],
    )
    assert.deepEqual(analyticsCookies(''), [])
  })

  it('lists the domains a cookie can live on, down to the registrable one', () => {
    assert.deepEqual(cookieDomains('larchwick-astro.larchwick.workers.dev'), [
      'larchwick-astro.larchwick.workers.dev',
      'larchwick.workers.dev',
      'workers.dev',
    ])
    assert.deepEqual(cookieDomains('localhost'), [])
  })
})
