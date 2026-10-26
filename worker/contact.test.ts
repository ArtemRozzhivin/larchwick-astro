import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  type ContactEnv,
  type ContactMessage,
  escapeHtml,
  handleContact,
  messageHtml,
  type ResendConfig,
  resendPayload,
  type SendEmail,
  sendViaResend,
} from './contact.ts'
import { brokenLimiter, recordingLimiter } from './test-fakes.ts'

const ORIGIN = 'https://larchwick-astro.larchwick.workers.dev'
const VISITOR = '203.0.113.7'
const VALID = { name: 'Ana', email: 'ana@example.com', subject: 'Wholesale', message: 'Hello' }

const ENV: ContactEnv = {
  RESEND_API_KEY: 're_test',
  CONTACT_TO: 'owner@example.com',
  CONTACT_LIMITER: recordingLimiter([]),
}

function post(
  fields: Record<string, string>,
  origin: string | null = ORIGIN,
  visitor = VISITOR,
): Request {
  const headers = new Headers({
    'Content-Type': 'application/x-www-form-urlencoded',
    'CF-Connecting-IP': visitor,
  })
  if (origin) headers.set('Origin', origin)
  return new Request(`${ORIGIN}/api/contact`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(fields).toString(),
  })
}

function recorder(result = true): {
  send: SendEmail
  sent: ContactMessage[]
  configs: ResendConfig[]
} {
  const sent: ContactMessage[] = []
  const configs: ResendConfig[] = []
  return {
    sent,
    configs,
    send: async (message, config) => {
      sent.push(message)
      configs.push(config)
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

  it('counts a submitted line break (CRLF) as one character, as the textarea does', async () => {
    const { send, sent } = recorder()
    const paragraphs = `${'x'.repeat(500)}\r\n${'y'.repeat(499)}\r\n${'z'.repeat(499)}`
    const response = await handleContact(post({ ...VALID, message: paragraphs }), ENV, send)
    assert.equal(response.headers.get('Location'), `${ORIGIN}/contact/thanks/`)
    assert.equal(sent[0].message.length, 1500)
    assert.equal(sent[0].message, paragraphs.replaceAll('\r\n', '\n'))
  })

  it('rejects missing or invalid fields without sending', async () => {
    for (const fields of [
      { ...VALID, name: '' },
      { ...VALID, subject: '   ' },
      { ...VALID, email: 'not-an-email' },
      { ...VALID, message: 'x'.repeat(1501) },
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

  it('limits messages per visitor and shows the error page without sending', async () => {
    const keys: string[] = []
    const { send, sent } = recorder()
    const env = { ...ENV, CONTACT_LIMITER: recordingLimiter(keys, false) }
    const response = await handleContact(post(VALID), env, send)
    assert.equal(response.headers.get('Location'), `${ORIGIN}/contact/error/`)
    assert.deepEqual(keys, [VISITOR])
    assert.equal(sent.length, 0)
  })

  it('counts an IPv6 visitor by its /64, so changing address within it gains nothing', async () => {
    const keys: string[] = []
    const env = { ...ENV, CONTACT_LIMITER: recordingLimiter(keys) }
    await handleContact(post(VALID, ORIGIN, '2001:db8:1:2::1'), env, recorder().send)
    await handleContact(post(VALID, ORIGIN, '2001:db8:1:2:dead:beef:0:7'), env, recorder().send)
    assert.deepEqual(keys, ['2001:db8:1:2::/64', '2001:db8:1:2::/64'])
  })

  it('shows the error page when the limiter or the send throws', async () => {
    const unsent = recorder()
    const limited = await handleContact(
      post(VALID),
      { ...ENV, CONTACT_LIMITER: brokenLimiter },
      unsent.send,
    )
    assert.equal(limited.status, 303)
    assert.equal(limited.headers.get('Location'), `${ORIGIN}/contact/error/`)
    assert.equal(unsent.sent.length, 0)
    const throwing: SendEmail = () => Promise.reject(new TypeError('fetch failed'))
    const failed = await handleContact(post(VALID), ENV, throwing)
    assert.equal(failed.status, 303)
    assert.equal(failed.headers.get('Location'), `${ORIGIN}/contact/error/`)
  })

  it('counts only messages it would send, not invalid ones or honeypot posts', async () => {
    const keys: string[] = []
    const env = { ...ENV, CONTACT_LIMITER: recordingLimiter(keys) }
    await handleContact(post({ ...VALID, email: 'not-an-email' }), env, recorder().send)
    await handleContact(post({ ...VALID, website: 'spam.example' }), env, recorder().send)
    assert.deepEqual(keys, [])
    await handleContact(post(VALID), env, recorder().send)
    assert.deepEqual(keys, [VISITOR])
  })

  it('shows the error page without a limiter rather than sending unlimited mail', async () => {
    const { send, sent } = recorder()
    const response = await handleContact(post(VALID), { ...ENV, CONTACT_LIMITER: undefined }, send)
    assert.equal(response.headers.get('Location'), `${ORIGIN}/contact/error/`)
    assert.equal(sent.length, 0)
  })

  it('only accepts POST', async () => {
    const response = await handleContact(new Request(`${ORIGIN}/api/contact`), ENV, recorder().send)
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('Allow'), 'POST')
  })
})

describe('Resend payload', () => {
  const config = { apiKey: 're_test', to: 'owner@example.com' }

  it('uses the stored template, with every visitor value HTML-escaped', () => {
    const payload = resendPayload(
      {
        name: 'Ana <b>',
        email: 'ana@example.com',
        subject: 'Beans & "milk"',
        message: 'Hi\n<script>x</script>',
      },
      { ...config, templateId: 'larchwick-contact' },
    )
    assert.equal(payload.text, undefined)
    assert.deepEqual(payload.template, {
      id: 'larchwick-contact',
      variables: {
        NAME: 'Ana &lt;b&gt;',
        SENDER_EMAIL: 'ana@example.com',
        SUBJECT: 'Beans &amp; &quot;milk&quot;',
        MESSAGE: 'Hi<br>&lt;script&gt;x&lt;/script&gt;',
      },
    })
    assert.equal(payload.reply_to, 'ana@example.com')
    assert.equal(payload.from, 'Larchwick contact form <onboarding@resend.dev>')
    assert.equal(payload.subject, '[Larchwick] Beans & "milk"')
  })

  it('falls back to plain text when no template is configured', () => {
    const payload = resendPayload(VALID, config)
    assert.equal(payload.template, undefined)
    assert.equal(payload.text, 'From: Ana <ana@example.com>\n\nHello')
  })

  it('keeps the message variable under the 2,000-character Resend limit without cutting an entity', () => {
    const html = messageHtml('&'.repeat(1500))
    assert.ok(html.length <= 2000)
    assert.match(html, /(&amp;)+…$/)
  })

  it('escapes all five HTML-sensitive characters', () => {
    assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;')
  })

  it('passes the template id from the Worker secrets to the sender', async () => {
    const { send, configs } = recorder()
    await handleContact(post(VALID), { ...ENV, RESEND_TEMPLATE_ID: 'larchwick-contact' }, send)
    assert.equal(configs[0].templateId, 'larchwick-contact')
  })

  it('sends the Resend request with an abort signal, so a hung request gives up', async (context) => {
    const requests: RequestInit[] = []
    context.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
      requests.push(init)
      return new Response('{}')
    })
    assert.equal(await sendViaResend(VALID, config), true)
    assert.ok(requests[0].signal instanceof AbortSignal)
  })
})
