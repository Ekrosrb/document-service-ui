import { vi } from 'vitest'

/** jsdom has no scrolling, and the screens scroll to the top when the view changes. */
window.scrollTo = vi.fn()
