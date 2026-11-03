import { buildDocument } from '@/components/__tests__/componentTestData'

export const CONFIRM_TITLE = 'Move “Service overview” to trash?'
export const CONFIRM_DESCRIPTION = 'You can restore it from Trash.'
export const CONFIRM_LABEL = 'Move to trash'
export const CANDIDATE_NAME = 'Refund flow design'
export const SEARCH_TEXT = 'refund'

export function buildConfirmProps(overrides = {}) {
  return {
    open: true,
    title: CONFIRM_TITLE,
    description: CONFIRM_DESCRIPTION,
    confirmLabel: CONFIRM_LABEL,
    ...overrides,
  }
}

export function buildCandidates() {
  return [
    buildDocument({ id: 6, name: CANDIDATE_NAME, summary: 'Partial and full refunds.' }),
    buildDocument({ id: 7, name: 'Ledger export schema', summary: 'Nightly export shape.' }),
  ]
}
