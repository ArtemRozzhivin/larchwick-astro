function textWidth(text: string): number {
  let width = 0
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    if (code < 0x20 || (code >= 0x300 && code <= 0x36f)) continue
    const isWide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0x1f300 && code <= 0x1faff) ||
      code >= 0x20000
    width += isWide ? 2 : 1
  }
  return width
}

export function renderTable(
  header: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const widths = header.map((cell, column) =>
    Math.max(3, textWidth(cell), ...rows.map((row) => textWidth(row[column] ?? ''))),
  )
  const pad = (cell: string, column: number): string =>
    cell + ' '.repeat(widths[column] - textWidth(cell))
  const line = (cells: readonly string[]): string => `| ${cells.map(pad).join(' | ')} |`
  const divider = `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`
  return [line(header), divider, ...rows.map(line)].join('\n')
}

export function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
