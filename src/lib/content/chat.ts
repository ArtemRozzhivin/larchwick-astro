import { siteConfig } from '@lib/config/site'

/**
 * All copy for the "Ask Larchwick" assistant (PLAN.md Phase 7b). Rendered by
 * `src/components/chat/ChatPanel.astro`; the messages the Worker sends are in `worker/chat.ts`.
 */
export const chat = {
  button: `Ask ${siteConfig.name}`,
  title: `Ask ${siteConfig.name}`,
  intro:
    'Questions about our coffees, shipping, subscriptions, wholesale or brewing? I answer from this website and link the pages I used.',
  suggestionsLabel: 'Try asking',
  suggestions: [
    'Do you ship to my country?',
    'Which coffee suits pour-over?',
    'How does the subscription work?',
  ],
  label: 'Your question',
  placeholder: 'Ask about our coffee',
  send: 'Send',
  close: 'Close the assistant',
  thinking: 'Looking through the site',
  sources: 'From these pages',
  failed:
    "The assistant isn't available right now. Please try again later, or use our [contact page](/contact/).",
  note: "Answers are written by AI from this website and can be wrong. Your question goes to Anthropic to write the answer; we don't store it.",
  noScript: 'The assistant needs JavaScript. Our FAQ answers most questions:',
  noScriptLink: { label: 'Read the FAQ', href: '/faq/' },
} as const
