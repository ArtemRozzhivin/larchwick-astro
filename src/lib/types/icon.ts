export const ICON_NAMES = [
  'coffee',
  'chevron-down',
  'check',
  'mail',
  'phone',
  'clock',
  'menu',
  'x',
] as const

export type IconName = (typeof ICON_NAMES)[number]
