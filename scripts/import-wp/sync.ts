import type { DesiredDoc, Group, SanityDoc } from './documents.ts'

export type Mutation =
  | { kind: 'create'; id: string; group: Group; doc: SanityDoc }
  | {
      kind: 'patch'
      id: string
      group: Group
      rev: string
      setIfMissing: Record<string, unknown>
      set: Record<string, unknown>
    }

export interface MutationPlan {
  mutations: Mutation[]
  unchanged: string[]
  drafts: string[]
}

export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, field]) => field !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
    return `{${entries.map(([key, field]) => `${JSON.stringify(key)}:${stable(field)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function valueAt(source: Record<string, unknown> | undefined, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, part) =>
        value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined,
      source,
    )
}

export function planMutations(
  desired: readonly DesiredDoc[],
  existing: ReadonlyMap<string, Record<string, unknown>>,
  drafts: ReadonlySet<string> = new Set(),
): MutationPlan {
  const mutations: Mutation[] = []
  const unchanged: string[] = []
  const skipped: string[] = []
  for (const { doc, owned, group } of desired) {
    if (drafts.has(doc._id)) {
      skipped.push(doc._id)
      continue
    }
    const current = existing.get(doc._id)
    if (!current) {
      mutations.push({ kind: 'create', id: doc._id, group, doc })
      continue
    }
    const set: Record<string, unknown> = {}
    const setIfMissing: Record<string, unknown> = {}
    for (const path of owned) {
      const next = valueAt(doc, path)
      if (stable(next) === stable(valueAt(current, path))) continue
      set[path] = next
      const [parent, ...rest] = path.split('.')
      if (rest.length > 0) {
        setIfMissing[parent] = { _type: valueAt(doc, `${parent}._type`) }
      }
    }
    if (Object.keys(set).length > 0) {
      mutations.push({
        kind: 'patch',
        id: doc._id,
        group,
        rev: String(current._rev ?? ''),
        setIfMissing,
        set,
      })
    } else {
      unchanged.push(doc._id)
    }
  }
  return { mutations, unchanged, drafts: skipped }
}
