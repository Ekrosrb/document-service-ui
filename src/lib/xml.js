const PARSER_ERROR_NAMESPACES = [
  'http://www.w3.org/1999/xhtml',
  'http://www.mozilla.org/newlayout/xml/parsererror.xml',
]

const ELEMENT_NODE = 1
const TEXT_NODE = 3
const CDATA_SECTION_NODE = 4
const PROCESSING_INSTRUCTION_NODE = 7
const COMMENT_NODE = 8
const DOCUMENT_TYPE_NODE = 10

const kindByNodeType = {
  [ELEMENT_NODE]: 'element',
  [TEXT_NODE]: 'text',
  [CDATA_SECTION_NODE]: 'cdata',
  [PROCESSING_INSTRUCTION_NODE]: 'instruction',
  [COMMENT_NODE]: 'comment',
  [DOCUMENT_TYPE_NODE]: 'doctype',
}

function toTreeNode(node) {
  const kind = kindByNodeType[node.nodeType]
  if (!kind) return null

  if (kind === 'text') {
    const value = node.nodeValue
    return value.trim() ? { kind, value: value.trim() } : null
  }

  if (kind === 'element') {
    return {
      kind,
      name: node.nodeName,
      attributes: [...node.attributes].map(({ name, value }) => ({ name, value })),
      children: toTreeNodes(node.childNodes),
    }
  }

  if (kind === 'instruction') return { kind, name: node.nodeName, value: node.nodeValue }
  if (kind === 'doctype') return { kind, name: node.name }
  return { kind, value: node.nodeValue }
}

function toTreeNodes(nodes) {
  return [...nodes].map(toTreeNode).filter(Boolean)
}

/**
 * Parses an XML document into a tree of plain nodes for the XML viewer. Returns the
 * top-level nodes, or the parser's message in `error` when the document is not well-formed.
 */
export function parseXml(text) {
  const parsed = new DOMParser().parseFromString(String(text ?? ''), 'application/xml')
  const failure = [...parsed.getElementsByTagName('parsererror')].find(
    (element) => !element.namespaceURI || PARSER_ERROR_NAMESPACES.includes(element.namespaceURI),
  )
  if (failure) return { nodes: [], error: failure.textContent.trim() }
  return { nodes: toTreeNodes(parsed.childNodes), error: null }
}

/** True when the node is an element whose children are a single piece of text. */
export function isTextOnlyElement(node) {
  return node.kind === 'element' && node.children.length === 1 && node.children[0].kind === 'text'
}

/** True when the node can be collapsed, which is an element with any children. */
export function isCollapsible(node) {
  return node.kind === 'element' && node.children.length > 0 && !isTextOnlyElement(node)
}
