import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { type ContactMessage, handleContact, type SendEmail } from './contact.ts'

const ORIGIN = 'https://larchwick-astro.larchwick.workers.dev'
const ENV = { RESEND_API_KEY: 're_test', CONTACT_TO: 'owner@example.com' }
const VALID = { name: 'Ana', email: 'ana@example.com', subject: 'Wholesale', message: 'Hello' }

function post(fields: Record<string, string>, origin: string | null = ORIGIN): Request {
  const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
  if (origin) headers.set('Origin', origin)
  return new Request(`${ORIGIN}/api/contact`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(fields).toString(),
  })
}

function recorder(result = true): { send: SendEmail; sent: ContactMessage[] } {
  const sent: ContactMessage[] = []
  return {
    sent,
    send: async (message) => {
      sent.push(message)
      return result
    },
  }
}

describe('POST /api/contact', () => {
  it('sends a valid message and redirects to the thank-you page with 303', async () => {
    const { send, sent } = recorder()
    const response = await handleContact(post(VALID), ENV, send)
    assert.equal(response.status, 303)
    assert.equal(response.headers.get('Location'), `${ORIGIN}/contact/thanks/`)
    assert.deepEqual(sent, [VALID])
  })

  it('accepts an empty message, which the form marks optional', async () => {
    const { send, sent } = recorder()
    await handleContact(post({ ...VALID, message: '' }), ENV, send)
    assert.equal(sent.length, 1)
  })

  it('rejects missing or invalid fields without sending', async () => {
    for (const fields of [
      { ...VALID, name: '' },
      { ...VALID, subject: '   ' },
      { ...VALID, email: 'not-an-email' },
      { ...VALID, message: 'x'.repeat(5001) },
    ]) {
      const { send, sent } = recorder()
      const response = await handleContact(post(fields), ENV, send)
      assert.equal(response.headers.get('Location'), `${ORIGIN}/contact/error/`)
      assert.equal(sent.length, 0)
    }
  })

  it('pretends success to bots that fill the honeypot, and sends nothing', async () => {
    const { send, sent } = recorder()
    const response = await handleContact(post({ ...VALID, website: 'spam.example' }), ENV, send)
    assert.equal(response.headers.get('Location'), `${ORIGIN}/contact/thanks/`)
    assert.equal(sent.length, 0)
  })

  it('refuses posts from another origin or without one', async () => {
    for (const origin of ['https://evil.example', null]) {
      const { send, sent } = recorder()
      const response = await handleContact(post(VALID, origin), ENV, send)
      assert.equal(response.status, 403)
      assert.equal(sent.length, 0)
    }
  })

  it('shows the error page when Resend fails or the secrets are missing', async () => {
    const failing = recorder(false)
    const failed = await handleContact(post(VALID), ENV, failing.send)
    assert.equal(failed.headers.get('Location'), `${ORIGIN}/contact/error/`)
    const unset = recorder()
    const missing = await handleContact(post(VALID), {}, unset.send)
    assert.equal(missing.headers.get('Location'), `${ORIGIN}/contact/error/`)
    assert.equal(unset.sent.length, 0)
  })

  it('only accepts POST', async () => {
    const response = await handleContact(new Request(`${ORIGIN}/api/contact`), ENV, recorder().send)
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('Allow'), 'POST')
  })
})
