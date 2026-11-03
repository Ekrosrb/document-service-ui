import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { highlight } from './highlight'

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  highlight: (code, language) => `<pre class="hljs"><code>${highlight(code, language)}</code></pre>`,
})

if (DOMPurify.isSupported) {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A' || !node.getAttribute('href')) return
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  })
}

/**
 * Renders Markdown to sanitized HTML. Inline HTML is kept but stripped of scripts, event
 * handlers and styling, and links are made to open in a new tab.
 */
export function renderMarkdown(text) {
  const html = markdown.render(String(text ?? ''))
  return DOMPurify.sanitize(html, { FORBID_TAGS: ['style'], FORBID_ATTR: ['style'] })
}
