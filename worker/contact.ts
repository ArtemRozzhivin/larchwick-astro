export interface ContactEnv {
  RESEND_API_KEY?: string
  CONTACT_TO?: string
}

export interface ContactMessage {
  name: string
  email: string
  subject: string
  message: string
}

export type SendEmail = (_message: ContactMessage, _env: Required<ContactEnv>) => Promise<boolean>

const THANKS_PATH = '/contact/thanks/'
const ERROR_PATH = '/contact/error/'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LIMITS = { name: 100, email: 254, subject: 150, message: 5000 } as const

function redirect(request: Request, path: string): Response {
  return Response.redirect(new URL(path, request.url).href, 303)
}

function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
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

export const sendViaResend: SendEmail = async (message, env) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'larchwick-contact/1.0',
    },
    body: JSON.stringify({
      from: 'Larchwick contact form <onboarding@resend.dev>',
      to: [env.CONTACT_TO],
      reply_to: message.email,
      subject: `[Larchwick] ${message.subject}`,
      text: `From: ${message.name} <${message.email}>\n\n${message.message || '(no message)'}`,
    }),
  })
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
  // Browsers always send Origin on a form POST; a missing or foreign one is not our form.
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return new Response('Forbidden', { status: 403 })
  }
  const form = await request.formData().catch(() => undefined)
  if (!form) return redirect(request, ERROR_PATH)
  // The honeypot field is hidden from people; bots that fill it get the thank-you page anyway.
  if (field(form, 'website')) return redirect(request, THANKS_PATH)
  const message = readMessage(form)
  if (!message) return redirect(request, ERROR_PATH)
  if (!env.RESEND_API_KEY || !env.CONTACT_TO) {
    console.error('Contact form: RESEND_API_KEY or CONTACT_TO is not set')
    return redirect(request, ERROR_PATH)
  }
  const sent = await send(message, {
    RESEND_API_KEY: env.RESEND_API_KEY,
    CONTACT_TO: env.CONTACT_TO,
  })
  return redirect(request, sent ? THANKS_PATH : ERROR_PATH)
}
