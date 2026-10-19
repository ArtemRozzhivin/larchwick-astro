import { type ChatEnv, handleChat } from './chat.ts'
import { type ContactEnv, handleContact } from './contact.ts'

export default {
  async fetch(request: Request, env: ContactEnv & ChatEnv): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/contact' || pathname === '/api/contact/')
      return handleContact(request, env)
    if (pathname === '/api/chat' || pathname === '/api/chat/') return handleChat(request, env)
    return new Response('Not found', { status: 404 })
  },
}
