export const ICON_NAMES = [
  'zap',
  'search',
  'layout',
  'palette',
  'shield',
  'rocket',
  'check',
  'star',
  'sparkles',
] as const

export type IconName = (typeof ICON_NAMES)[number]
