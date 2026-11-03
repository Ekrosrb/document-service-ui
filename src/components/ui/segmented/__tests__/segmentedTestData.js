export const OPTIONS = Object.freeze([
  { value: 'ALL', label: 'All' },
  { value: 'DOCUMENT', label: 'Documents' },
  { value: 'MEMORY', label: 'Memories' },
])

export const [FIRST, SECOND] = OPTIONS

export function buildProps(overrides = {}) {
  return { modelValue: FIRST.value, options: [...OPTIONS], name: 'kind', ...overrides }
}
