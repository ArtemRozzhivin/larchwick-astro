export const ICON_NAMES = [
  'coffee',
  'sprout',
  'flame',
  'truck',
  'chevron-down',
  'check',
  'mail',
  'phone',
  'clock',
  'menu',
  'x',
  'message-circle',
  'send',
] as const

export type IconName = (typeof ICON_NAMES)[number]

export function isIconName(name: string | undefined): name is IconName {
  return (ICON_NAMES as readonly string[]).includes(name ?? '')
}
