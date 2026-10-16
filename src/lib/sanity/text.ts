interface TextBlock {
  _type: string
  children?: readonly { text?: string }[]
}

export function plainText(blocks: readonly TextBlock[] | null | undefined): string {
  return (blocks ?? [])
    .filter((block) => block._type === 'block')
    .map((block) => (block.children ?? []).map((child) => child.text ?? '').join(''))
    .join('\n\n')
    .trim()
}
