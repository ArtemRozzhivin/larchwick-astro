export const ICON_NAMES = ['coffee', 'chevron-down', 'menu', 'x'] as const

export type IconName = (typeof ICON_NAMES)[number]
