import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { contactMethod, isRepeatView, readPending, trackParams } from './track.ts'

describe('analytics events', () => {
  it('turns data-track-* attributes into snake_case parameters', () => {
    assert.deepEqual(
      trackParams({
        track: 'cta_click',
        trackCtaLabel: 'Shop our coffees',
        trackCtaLocation: 'hero',
        other: 'ignored',
      }),
      { cta_label: 'Shop our coffees', cta_location: 'hero' },
    )
    assert.deepEqual(trackParams({ trackView: 'generate_lead', trackFormName: 'contact' }), {
      form_name: 'contact',
    })
    assert.deepEqual(trackParams({}), {})
  })

  it('reads saved events and drops anything malformed', () => {
    const saved = [{ name: 'cta_click', params: { cta_label: 'Shop', cta_location: 'hero' } }]
    assert.deepEqual(readPending(JSON.stringify(saved)), saved)
    assert.deepEqual(readPending(null), [])
    assert.deepEqual(readPending('not json'), [])
    assert.deepEqual(readPending('[{"name":1},null,{"name":"x","params":{}}]'), [
      { name: 'x', params: {} },
    ])
  })

  it('sends page-view events once: not again on reload or Back/Forward', () => {
    assert.equal(isRepeatView('navigate'), false)
    assert.equal(isRepeatView('prerender'), false)
    assert.equal(isRepeatView(undefined), false)
    assert.equal(isRepeatView('reload'), true)
    assert.equal(isRepeatView('back_forward'), true)
  })

  it('tells email and phone links apart from everything else', () => {
    assert.equal(contactMethod('mailto:hello@larchwick.example'), 'email')
    assert.equal(contactMethod('tel:+40700000000'), 'phone')
    assert.equal(contactMethod('/contact/'), null)
  })
})
