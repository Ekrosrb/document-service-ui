/** Each nav view with the position of its link in the bar. */
export const LINKS = Object.freeze([
  ['overview', 0],
  ['documents', 1],
  ['trash', 2],
])

export function buildProps(overrides = {}) {
  return { view: 'overview', trashCount: 0, ...overrides }
}
