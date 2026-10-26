import { type Block, numberAttr, stringAttr } from './blocks.ts'
import {
  attr,
  elements,
  firstElement,
  type HtmlElement,
  innerOf,
  isItalicOnly,
  parseHtml,
  textOf,
} from './html.ts'
import { quote, toPortableText } from './portableText.ts'
import type {
  AccessibleImage,
  ContactDetails,
  ConvertContext,
  LinkItem,
  PortableNode,
  Section,
} from './types.ts'

type SingleLink = Omit<LinkItem, '_key'>

const MUTED_BACKGROUNDS = new Set([
  'ast-global-color-4',
  'ast-global-color-5',
  'ast-global-color-7',
])
const DARK_BACKGROUNDS = new Set(['ast-global-color-2', 'ast-global-color-6'])
const FICTIONAL_NOTE = /fictional|placeholder/i
const SPEC = /^([^:]{1,40}):\s*(.+)$/
const CONTACT_FIELDS: readonly [RegExp, keyof ContactDetails][] = [
  [/wholesale/i, 'wholesaleEmail'],
  [/e-?mail/i, 'email'],
  [/phone/i, 'phone'],
  [/hours/i, 'hours'],
]

function headingText(block: Block): string {
  return textOf(parseHtml(block.html))
}

function paragraphText(block: Block, context: ConvertContext, linksHandled = false): string {
  const nodes = innerOf(block.html, 'p')
  if (!linksHandled) {
    for (const link of elements(nodes, 'a')) {
      context.warn(
        `link "${textOf(link.children)}" (${attr(link, 'href') ?? ''}) can't be kept in plain text; dropped`,
      )
    }
  }
  return textOf(nodes)
}

function linkFrom(
  element: HtmlElement | undefined,
  context: ConvertContext,
): SingleLink | undefined {
  const href = attr(element, 'href')
  const label = textOf(element?.children ?? [])
  if (!href || !label) return undefined
  return { _type: 'linkItem', label, href: context.href(href) }
}

function toneOf(color: string | undefined): 'muted' | 'inverted' | undefined {
  if (!color) return undefined
  if (MUTED_BACKGROUNDS.has(color)) return 'muted'
  if (DARK_BACKGROUNDS.has(color)) return 'inverted'
  return undefined
}

function isFictionalNote(block: Block): boolean {
  if (block.name !== 'paragraph') return false
  const nodes = innerOf(block.html, 'p')
  return isItalicOnly(nodes) && FICTIONAL_NOTE.test(textOf(nodes))
}

function dropNote(block: Block, context: ConvertContext): void {
  context.skip(
    `fictional-business note dropped: "${paragraphText(block, context)}" (the footer's demo label covers it)`,
  )
}

function image(wpId: number | undefined, context: ConvertContext, decorative = false) {
  const media = wpId === undefined ? undefined : context.media(wpId)
  if (!media) return undefined
  const value: AccessibleImage = {
    _type: 'accessibleImage',
    asset: { _type: 'reference', _ref: media.assetId },
    ...(decorative ? { decorative: true } : { alt: media.alt ?? '' }),
  }
  if (!decorative && !media.alt) context.warn(`media ${wpId} has no alt text in alt-text.json`)
  return value
}

function buttons(block: Block, context: ConvertContext): SingleLink[] {
  return block.inner
    .filter((inner) => inner.name === 'button')
    .flatMap((button) => {
      const element = firstElement(parseHtml(button.html), 'a')
      const link = linkFrom(element, context)
      if (!link) {
        context.warn(
          `button "${textOf(element?.children ?? []) || '?'}" without a link was dropped`,
        )
      }
      return link ? [link] : []
    })
}

function unwrap(blocks: readonly Block[]): Block[] {
  if (
    blocks.length === 1 &&
    blocks[0].name === 'group' &&
    !stringAttr(blocks[0], 'backgroundColor')
  ) {
    return unwrap(blocks[0].inner)
  }
  return [...blocks]
}

function splitHeading(blocks: readonly Block[]): { heading?: string; rest: Block[] } {
  const [first, ...rest] = blocks
  if (first?.name === 'heading' && (numberAttr(first, 'level') ?? 2) <= 2) {
    return { heading: headingText(first), rest }
  }
  return { rest: [...blocks] }
}

function section(type: string, context: ConvertContext, fields: Record<string, unknown>): Section {
  const defined = Object.entries(fields).filter(([, value]) => value !== undefined && value !== '')
  return { _type: type, _key: context.key(), ...Object.fromEntries(defined) }
}

function textSection(
  heading: string | undefined,
  blocks: readonly Block[],
  context: ConvertContext,
  tone?: string,
): Section[] {
  const body: PortableNode[] = toPortableText(blocks, context)
  if (body.length === 0 && !heading) return []
  if (body.length === 0) {
    context.warn(`heading "${heading}" has no content after it; kept as an empty text section`)
  }
  return [section('textBlock', context, { heading, body, tone })]
}

function readContact(column: Block, contact: ContactDetails): void {
  let field: keyof ContactDetails | undefined
  for (const block of column.inner) {
    if (block.name === 'heading') {
      const label = headingText(block)
      field = CONTACT_FIELDS.find(([pattern]) => pattern.test(label))?.[1]
      continue
    }
    if (block.name !== 'paragraph' || !field) continue
    const lines = innerOf(block.html, 'p')
      .map((node) => textOf(node))
      .filter(Boolean)
    if (field === 'hours') contact.hours = lines
    else contact[field] = lines.join(' ')
  }
}

function contactForm(columns: Block, context: ConvertContext): Section[] | undefined {
  const isForm = (column: Block) =>
    column.inner.some(
      (block) => block.name === 'shortcode' && block.html.includes('[contact-form-7'),
    )
  const formColumn = columns.inner.find(isForm)
  if (!formColumn) return undefined
  for (const column of columns.inner.filter((candidate) => candidate !== formColumn)) {
    readContact(column, context.contact)
  }
  return [section('contactForm', context, { showContactDetails: true })]
}

function stats(columns: Block, context: ConvertContext, heading?: string, tone?: string) {
  const items = columns.inner.map((column) => {
    const item = column.inner[0]?.inner[0]
    const nodes = item ? innerOf(item.html, 'li') : []
    const strong = firstElement(nodes, 'strong')
    const value = textOf(strong?.children ?? [])
    const label = textOf(nodes).slice(value.length).trim()
    return value && label ? { _type: 'stat', _key: context.key(), value, label } : undefined
  })
  if (items.some((item) => item === undefined)) return undefined
  return [section('stats', context, { heading, items, tone })]
}

function isSingleItemList(column: Block): boolean {
  return (
    column.inner.length === 1 &&
    column.inner[0].name === 'list' &&
    column.inner[0].inner.length === 1
  )
}

function card(column: Block, context: ConvertContext) {
  const title = column.inner.find((block) => block.name === 'heading')
  const imageBlock = column.inner.find((block) => block.name === 'image')
  const paragraphs = column.inner.filter((block) => block.name === 'paragraph')
  const list = column.inner.find((block) => block.name === 'list')
  const buttonBlock = column.inner.find((block) => block.name === 'buttons')
  const items = (list?.inner ?? []).map((item) => textOf(innerOf(item.html, 'li')))
  const specs = items.map((item) => SPEC.exec(item))
  const allSpecs = items.length > 0 && specs.every(Boolean)
  const imageValue = imageBlock ? image(numberAttr(imageBlock, 'id'), context) : undefined
  const inlineLinks = paragraphs.flatMap((paragraph) => elements(innerOf(paragraph.html, 'p'), 'a'))
  const moveLink = !buttonBlock && inlineLinks.length === 1
  const cta = buttonBlock
    ? buttons(buttonBlock, context)[0]
    : moveLink
      ? linkFrom(inlineLinks[0], context)
      : undefined
  return {
    _type: 'card',
    _key: context.key(),
    ...(imageValue && { image: imageValue }),
    title: title ? headingText(title) : '',
    ...(paragraphs.length > 0 && {
      text: paragraphs.map((paragraph) => paragraphText(paragraph, context, moveLink)).join('\n\n'),
    }),
    ...(allSpecs && {
      specs: specs.map((match) => ({
        _type: 'spec',
        _key: context.key(),
        label: match![1].trim(),
        value: match![2].trim(),
      })),
    }),
    ...(!allSpecs && items.length > 0 && { points: items }),
    ...(cta && { cta }),
  }
}

function columnsSection(
  columns: Block,
  context: ConvertContext,
  heading?: string,
  tone?: string,
): Section[] {
  const form = contactForm(columns, context)
  if (form) return form
  if (columns.inner.every(isSingleItemList)) {
    const result = stats(columns, context, heading, tone)
    if (result) return result
  }
  const hasTitle = (column: Block) => column.inner.some((block) => block.name === 'heading')
  const isRich = (column: Block) =>
    column.inner.some((block) => ['image', 'list', 'buttons'].includes(block.name))
  if (columns.inner.every(hasTitle) && columns.inner.some(isRich)) {
    const cards = columns.inner.map((column) => card(column, context))
    return [section('cardGrid', context, { heading, cards, tone })]
  }
  if (columns.inner.every(hasTitle)) {
    const items = columns.inner.map((column) => {
      const title = column.inner.find((block) => block.name === 'heading')
      const text = column.inner
        .filter((block) => block.name === 'paragraph')
        .map((block) => paragraphText(block, context))
      return {
        _type: 'feature',
        _key: context.key(),
        title: title ? headingText(title) : '',
        ...(text.length > 0 && { text: text.join('\n\n') }),
      }
    })
    return [section('featureGrid', context, { heading, items, tone })]
  }
  context.warn(`columns under "${heading ?? 'no heading'}" kept as plain text`)
  return textSection(heading, columns.inner, context, tone)
}

function stepsSection(list: Block, context: ConvertContext, heading?: string): Section[] {
  const items = list.inner.map((item) => {
    const text = textOf(innerOf(item.html, 'li'))
    const match = SPEC.exec(text)
    return {
      _type: 'step',
      _key: context.key(),
      title: match ? match[1].trim() : text,
      ...(match && { text: match[2].trim() }),
    }
  })
  return [section('steps', context, { heading, items })]
}

function faqGroup(heading: string | undefined, blocks: readonly Block[], context: ConvertContext) {
  const items = blocks
    .filter((block) => block.name === 'details')
    .map((details) => ({
      _type: 'faqItem',
      _key: context.key(),
      question: textOf(firstElement(parseHtml(details.html), 'summary')?.children ?? []),
      answer: toPortableText(details.inner, context),
    }))
  const others = blocks.filter((block) => block.name !== 'details')
  if (others.length > 0) {
    context.warn(`FAQ group "${heading ?? ''}" had ${others.length} non-question block(s); dropped`)
  }
  return { _type: 'faqGroup', _key: context.key(), ...(heading && { heading }), items }
}

function ctaFromBox(box: Block, context: ConvertContext, tone?: string): Section[] {
  const { heading, rest } = splitHeading(box.inner)
  const text = rest
    .filter((block) => block.name === 'paragraph')
    .map((block) => paragraphText(block, context))
    .join(' ')
  const links = rest.filter((block) => block.name === 'buttons').flatMap((b) => buttons(b, context))
  return [
    section('cta', context, {
      heading,
      text,
      primaryCta: links[0],
      secondaryCta: links[1],
      tone: tone ?? toneOf(stringAttr(box, 'backgroundColor')),
    }),
  ]
}

function trailing(blocks: readonly Block[], context: ConvertContext): Section[] {
  const sections: Section[] = []
  let loose: Block[] = []
  const flush = () => {
    sections.push(...textSection(undefined, loose, context))
    loose = []
  }
  for (const block of blocks) {
    if (isFictionalNote(block)) {
      flush()
      dropNote(block, context)
    } else if (block.name === 'quote') {
      flush()
      const value = quote(block, context)
      if (value) sections.push({ ...value, _key: context.key() })
    } else if (block.name === 'buttons') {
      flush()
      const links = buttons(block, context)
      const quoted = sections.at(-1)?._type === 'quote' ? sections.pop() : undefined
      sections.push(
        section('cta', context, {
          quote: quoted?.text,
          citation: quoted?.citation,
          primaryCta: links[0],
          secondaryCta: links[1],
        }),
      )
    } else {
      loose.push(block)
    }
  }
  flush()
  return sections
}

function groupSections(group: Block, context: ConvertContext): Section[] {
  const tone = toneOf(stringAttr(group, 'backgroundColor'))
  const blocks = unwrap(group.inner)
  if (
    blocks.length === 1 &&
    blocks[0].name === 'group' &&
    stringAttr(blocks[0], 'backgroundColor')
  ) {
    return ctaFromBox(blocks[0], context)
  }
  const { heading, rest } = splitHeading(blocks)
  if (rest.some((block) => block.name === 'details')) {
    return [section('faq', context, { groups: [faqGroup(heading, rest, context)] })]
  }
  const [first, ...after] = rest
  if (first?.name === 'columns') {
    return [...columnsSection(first, context, heading, tone), ...trailing(after, context)]
  }
  if (first?.name === 'group' && stringAttr(first, 'backgroundColor')) {
    const inner = unwrap(first.inner)
    if (inner.length === 1 && inner[0].name === 'columns') {
      const innerTone = toneOf(stringAttr(first, 'backgroundColor'))
      return [...columnsSection(inner[0], context, heading, innerTone), ...trailing(after, context)]
    }
  }
  if (rest.length === 1 && first?.name === 'list' && first.attrs.ordered === true) {
    return stepsSection(first, context, heading)
  }
  for (const block of rest.filter(isFictionalNote)) dropNote(block, context)
  return textSection(
    heading,
    rest.filter((block) => !isFictionalNote(block)),
    context,
    tone,
  )
}

function hero(cover: Block, context: ConvertContext): Section {
  const blocks = unwrap(cover.inner)
  const headingBlock = blocks.find((block) => block.name === 'heading')
  const paragraph = blocks.find((block) => block.name === 'paragraph')
  const leftovers = blocks.filter((block) => block !== headingBlock && block !== paragraph)
  if (leftovers.length > 0) {
    context.warn(`cover had ${leftovers.length} extra block(s) that the hero can't show; dropped`)
  }
  if (headingBlock && (numberAttr(headingBlock, 'level') ?? 2) !== 1) {
    context.warn('the cover heading was not an H1; the hero makes it the page H1')
  }
  return section('hero', context, {
    variant: 'banner',
    heading: headingBlock ? headingText(headingBlock) : '',
    text: paragraph ? paragraphText(paragraph, context) : undefined,
    image: image(numberAttr(cover, 'id'), context, true),
    tone: toneOf(stringAttr(cover, 'overlayColor')) ?? 'inverted',
  })
}

function imageText(block: Block, context: ConvertContext): Section {
  const { heading, rest } = splitHeading(unwrap(block.inner))
  return section('imageText', context, {
    heading,
    body: toPortableText(rest, context),
    image: image(numberAttr(block, 'mediaId'), context),
    imagePosition: stringAttr(block, 'mediaPosition') === 'right' ? 'right' : 'left',
  })
}

function mergeFaqs(sections: Section[]): Section[] {
  return sections.reduce<Section[]>((merged, current) => {
    const last = merged.at(-1)
    if (last?._type === 'faq' && current._type === 'faq') {
      const groups = [...(last.groups as unknown[]), ...(current.groups as unknown[])]
      merged[merged.length - 1] = { ...last, groups }
    } else {
      merged.push(current)
    }
    return merged
  }, [])
}

export function toSections(blocks: readonly Block[], context: ConvertContext): Section[] {
  const sections: Section[] = []
  let loose: Block[] = []
  const flush = () => {
    sections.push(...trailing(loose, context))
    loose = []
  }
  for (const block of blocks) {
    if (block.name === 'cover') {
      flush()
      sections.push(hero(block, context))
    } else if (block.name === 'media-text') {
      flush()
      sections.push(imageText(block, context))
    } else if (block.name === 'group') {
      flush()
      sections.push(...groupSections(block, context))
    } else if (block.name === 'columns') {
      flush()
      sections.push(...columnsSection(block, context))
    } else {
      loose.push(block)
    }
  }
  flush()
  return mergeFaqs(sections)
}
