/**
 * Allowlist-based HTML sanitizer for `cuerpo_html`.
 *
 * The editor in /formatos only supports a small set of formatting
 * (negrita, cursiva, listas, encabezados, párrafos, saltos). We do not
 * have a heavyweight sanitizer in the bundle, so this module enforces
 * the allowlist on the client before saving and before rendering.
 *
 * Important: callers must run this through *every* `cuerpo_html` they
 * render with `dangerouslySetInnerHTML`. The DB CHECK constraint only
 * caps total length, it does not validate tags.
 */

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
  "H1",
  "H2",
  "H3",
  "H4",
  "BLOCKQUOTE",
  "HR",
  "DIV",
  "SPAN",
  // Tables — emitted by mammoth when importing .docx and useful for
  // preserving simple question grids. Cell-level attributes are still
  // stripped by the attribute pass below.
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD",
])

// Attributes are stripped entirely — this editor never needs them.
// We treat style="" as too risky for a hand-rolled sanitizer (it can
// hide URL-fetching CSS) and rely on tags + class names alone.

function sanitizeNode(node: Element) {
  // Drop disallowed tags but keep their children. We MUST recurse the
  // children before re-parenting them, otherwise their attributes
  // (e.g. `onclick`, `onerror`) survive the unwrap and end up in the
  // sanitized output. mammoth-imported docx can produce nested wrappers
  // that exercise this path (e.g. <a> wrapping a <div>).
  if (!ALLOWED_TAGS.has(node.tagName)) {
    const parent = node.parentNode
    if (!parent) return
    for (const child of Array.from(node.children)) {
      sanitizeNode(child)
    }
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node)
    }
    parent.removeChild(node)
    return
  }

  // Strip every attribute (no inline styles, no event handlers, no
  // data URLs). We re-iterate because removeAttribute mutates the list.
  for (const attr of Array.from(node.attributes)) {
    node.removeAttribute(attr.name)
  }

  // Recurse — copy first so removals during iteration are safe.
  for (const child of Array.from(node.children)) {
    sanitizeNode(child)
  }
}

export function sanitizeCuerpoHtml(html: string): string {
  if (typeof window === "undefined") {
    // SSR can't run DOMParser — return as-is and let the client
    // sanitize before render. Callers MUST sanitize again before
    // injecting via dangerouslySetInnerHTML.
    return html
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html")
  const root = doc.body.firstElementChild
  if (!root) return ""
  for (const child of Array.from(root.children)) {
    sanitizeNode(child)
  }
  return root.innerHTML
}
