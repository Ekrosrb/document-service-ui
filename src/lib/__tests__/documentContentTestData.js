export const TEXT_CONTENT = `The document panel shows a document the way its type is meant to be read.

TEXT and CUSTOM documents are shown as plain monospaced text. JSON, CSS and TOON are
syntax highlighted. XML, MARKDOWN and HTML are rendered, with a toggle to the raw source.`

export const CUSTOM_CONTENT = `= Custom document

A CUSTOM document carries its own extension, such as .adoc, and is shown as plain text
until the UI learns that format.

== Extension

The extension is shown next to the type badge.`

export const JSON_CONTENT = `{
  "name": "document-service-ui",
  "renderers": {
    "highlighted": ["JSON", "CSS", "TOON"],
    "rendered": ["XML", "MARKDOWN", "HTML"],
    "plain": ["TEXT", "CUSTOM"]
  },
  "libraries": [
    { "name": "highlight.js", "version": 11, "bundled": true },
    { "name": "markdown-it", "version": 15, "bundled": true },
    { "name": "dompurify", "version": 3, "bundled": true }
  ],
  "rawToggle": true,
  "executesScripts": "HTML only",
  "customExtension": null
}`

export const CSS_CONTENT = `/* Content styles for the document panel. */
:root {
    --code-string: #5c7a2e;
    --code-number: #9a5a16;
}

.markdown-body pre {
    margin: 1em 0;
    overflow-x: auto;
    border-radius: var(--radius-lg);
    padding: 0.9em 1.1em;
}

.markdown-body > :first-child {
    margin-top: 0;
}

@media (prefers-color-scheme: dark) {
    .hljs-comment {
        color: #6f8a80;
        font-style: italic;
    }
}`

export const TOON_CONTENT = `project: document-service-ui
types[8]{name,extension,view}:
  TEXT,.txt,plain
  JSON,.json,highlighted
  XML,.xml,rendered
  MARKDOWN,.md,rendered
  TOON,.toon,highlighted
  HTML,.html,rendered
  CSS,.css,highlighted
  CUSTOM,"",plain
libraries[3]:
  - name: highlight.js
    license: BSD-3-Clause
    usedFor[3]: JSON,CSS,TOON
    bundled: true
  - name: markdown-it
    license: MIT
    usedFor[1]: MARKDOWN
    bundled: true
  - name: dompurify
    license: Apache-2.0
    usedFor[1]: MARKDOWN
    bundled: true
sandbox:
  html: allow-scripts
  sameOrigin: false
  maxHeight: null
updatedAt: 2026-10-19T18:00:00Z`

export const XML_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Document types supported by mcp-document-service. -->
<documentTypes count="8">
  <type name="TEXT" extension=".txt" view="plain"/>
  <type name="JSON" extension=".json" view="highlighted">
    <library>highlight.js</library>
  </type>
  <type name="XML" extension=".xml" view="rendered">
    <library>DOMParser</library>
    <notes>
      <note>Rendered as a collapsible tree.</note>
      <note>The raw toggle shows the source.</note>
    </notes>
  </type>
  <type name="HTML" extension=".html" view="rendered">
    <sandbox allowScripts="true" allowSameOrigin="false"/>
    <snippet><![CDATA[<script>document.title = "runs"</script>]]></snippet>
  </type>
</documentTypes>`

export const MALFORMED_XML_CONTENT = `<documentTypes>
  <type name="TEXT">
</documentTypes>`

export const MARKDOWN_CONTENT = `# Document types

The panel renders **Markdown**, _XML_ and HTML, and highlights \`JSON\`, \`CSS\` and \`TOON\`.

## Views

| Type | View | Library |
| --- | --- | --- |
| JSON | highlighted | highlight.js |
| MARKDOWN | rendered | markdown-it |
| HTML | rendered | sandboxed iframe |

## Rules

1. Rendered types get a raw toggle.
2. Plain types are shown as monospaced text.
   - TEXT
   - CUSTOM

> Markdown keeps inline HTML such as <kbd>Ctrl</kbd>, but scripts and styles are stripped.

<script>document.title = 'stripped'</script>

\`\`\`js
import { renderMarkdown } from '@/lib/markdown'

const html = renderMarkdown(document.content)
\`\`\`

---

See the [service README](https://example.com/readme) for the full list.`

export const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>HTML document</title>
    <style>
      body {
        margin: 0;
        padding: 24px;
        background: #0f1a20;
        color: #d8e4ff;
        font-family: system-ui, sans-serif;
      }
      h1 { margin: 0 0 8px; font-size: 20px; color: #31e981; }
      p { margin: 0 0 16px; line-height: 1.6; }
      button {
        border: 1px solid #31e981;
        border-radius: 8px;
        background: transparent;
        padding: 6px 12px;
        color: #31e981;
        cursor: pointer;
      }
      #counter { font-weight: 600; }
    </style>
  </head>
  <body>
    <h1>HTML is rendered in a sandboxed iframe</h1>
    <p>This document's own CSS is applied and its own script runs: <span id="counter">0</span></p>
    <button id="increment" type="button">Count up</button>
    <script>
      const counter = document.getElementById('counter')
      let clicks = 0
      document.getElementById('increment').addEventListener('click', () => {
        clicks += 1
        counter.textContent = String(clicks)
      })
    </script>
  </body>
</html>`

export const SCRIPT_MARKDOWN_CONTENT = `Text with <script>document.title = 'injected'</script> and a [link](https://example.com).`

export function buildTextNode(value = 'highlight.js') {
  return { kind: 'text', value }
}

export function buildElementNode(overrides = {}) {
  return { kind: 'element', name: 'type', attributes: [], children: [], ...overrides }
}

export function buildTextOnlyElementNode() {
  return buildElementNode({ name: 'library', children: [buildTextNode()] })
}

export function buildNestedElementNode() {
  return buildElementNode({ name: 'notes', children: [buildTextOnlyElementNode()] })
}
