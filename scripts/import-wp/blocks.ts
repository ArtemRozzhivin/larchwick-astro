import { parse } from '@wordpress/block-serialization-default-parser'

type ParsedBlock = ReturnType<typeof parse>[number]

export interface Block {
  name: string
  attrs: Record<string, unknown>
  html: string
  inner: Block[]
}

function toBlock(raw: ParsedBlock): Block {
  return {
    name: raw.blockName ? raw.blockName.replace(/^core\//, '') : 'freeform',
    attrs: (raw.attrs ?? {}) as Record<string, unknown>,
    html: raw.innerHTML,
    inner: raw.innerBlocks.filter(isContent).map(toBlock),
  }
}

function isContent(raw: ParsedBlock): boolean {
  return raw.blockName !== null || raw.innerHTML.trim() !== ''
}

export function parseBlocks(content: string): Block[] {
  return parse(content).filter(isContent).map(toBlock)
}

export function flatten(blocks: readonly Block[]): Block[] {
  return blocks.flatMap((block) => [block, ...flatten(block.inner)])
}

export function stringAttr(block: Block, name: string): string | undefined {
  const value = block.attrs[name]
  return typeof value === 'string' ? value : undefined
}

export function numberAttr(block: Block, name: string): number | undefined {
  const value = block.attrs[name]
  return typeof value === 'number' ? value : undefined
}
