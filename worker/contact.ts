import { siteConfig } from '../src/lib/config/site.ts'
import { LIMITS } from '../src/lib/contact/limits.ts'
import { errorMessage } from '../src/lib/errors.ts'
import { contactResultPath } from '../src/lib/routes.ts'
import { type RateLimiter, withinLimit } from './rate-limit.ts'

export interface ContactEnv {
  RESEND_API_KEY?: string
  CONTACT_TO?: string
  RESEND_TEMPLATE_ID?: string
  CONTACT_LIMITER?: RateLimiter
}

export interface ResendConfig {
  apiKey: string
  to: string
  templateId?: string
}

export interface ContactMessage {
  name: string
  email: string
  subject: string
  message: string
}

export type SendEmail = (_message: ContactMessage, _config: ResendConfig) => Promise<boolean>

const THANKS_PATH = contactResultPath('thanks')
const ERROR_PATH = contactResultPath('error')
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FROM = `${siteConfig.name} contact form <onboarding@resend.dev>`
// Resend caps each template variable at 2,000 characters; LIMITS.message leaves room for escaping.
const TEMPLATE_VALUE_MAX = 2000
// Resend answers in well under a second; a hung request shows the error page instead of a 524.
const SEND_TIMEOUT_MS = 10_000
const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function redirect(request: Request, path: string): Response {
  return Response.redirect(new URL(path, request.url).href, 303)
}

// Browsers submit a textarea's line breaks as CRLF, but its maxlength counts each as one character.
function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : ''
}

export function readMessage(form: FormData): ContactMessage | undefined {
  const message = {
    name: field(form, 'name'),
    email: field(form, 'email'),
    subject: field(form, 'subject'),
    message: field(form, 'message'),
  }
  const tooLong = (Object.keys(LIMITS) as (keyof ContactMessage)[]).some(
    (key) => message[key].length > LIMITS[key],
  )
  if (!message.name || !message.subject || !EMAIL.test(message.email) || tooLong) return undefined
  return message
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

export function messageHtml(text: string): string {
  const html = escapeHtml(text || '(no message)').replace(/\r?\n/g, '<br>')
  if (html.length <= TEMPLATE_VALUE_MAX) return html
  return `${html.slice(0, TEMPLATE_VALUE_MAX - 1).replace(/&[^;]*$|<[^>]*$/, '')}…`
}

export function resendPayload(
  message: ContactMessage,
  config: ResendConfig,
): Record<string, unknown> {
  const base = {
    from: FROM,
    to: [config.to],
    reply_to: message.email,
    subject: `[${siteConfig.name}] ${message.subject}`,
  }
  if (!config.templateId) {
    return {
      ...base,
      text: `From: ${message.name} <${message.email}>\n\n${message.message || '(no message)'}`,
    }
  }
  return {
    ...base,
    template: {
      id: config.templateId,
      variables: {
        NAME: escapeHtml(message.name),
        SENDER_EMAIL: escapeHtml(message.email),
        SUBJECT: escapeHtml(message.subject),
        MESSAGE: messageHtml(message.message),
      },
    },
  }
}

export const sendViaResend: SendEmail = async (message, config) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'larchwick-contact/1.0',
    },
    body: JSON.stringify(resendPayload(message, config)),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  })
  if (!response.ok) console.error(`Resend answered ${response.status}: ${await response.text()}`)
  return response.ok
}

export async function handleContact(
  request: Request,
  env: ContactEnv,
  send: SendEmail = sendViaResend,
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
  }
  // Browsers always send Origin on a form POST, so this stops other sites' forms posting here. Any
  // other client can set it; the honeypot and the rate limit are what slow scripts down.
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return new Response('Forbidden', { status: 403 })
  }
  const form = await request.formData().catch(() => undefined)
  if (!form) return redirect(request, ERROR_PATH)
  // The honeypot field is hidden from people; bots that fill it get the thank-you page anyway.
  if (field(form, 'website')) return redirect(request, THANKS_PATH)
  const message = readMessage(form)
  if (!message) return redirect(request, ERROR_PATH)
  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_LIMITER) {
    console.error('Contact form: RESEND_API_KEY, CONTACT_TO or CONTACT_LIMITER is not set')
    return redirect(request, ERROR_PATH)
  }
  try {
    if (!(await withinLimit(env.CONTACT_LIMITER, request))) return redirect(request, ERROR_PATH)
    const sent = await send(message, {
      apiKey: env.RESEND_API_KEY,
      to: env.CONTACT_TO,
      templateId: env.RESEND_TEMPLATE_ID,
    })
    return redirect(request, sent ? THANKS_PATH : ERROR_PATH)
  } catch (error) {
    // The error page tells the visitor to email us instead; a thrown error would show Cloudflare's.
    console.error(`Contact form: the message was not sent: ${errorMessage(error)}`)
    return redirect(request, ERROR_PATH)
  }
}
