"use client"

import {
  useCallback,
  useEffect,
  useRef,
} from "react"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Pilcrow,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sanitizeCuerpoHtml } from "@/lib/formatos/sanitize"

/**
 * Lightweight rich-text editor backed by `contentEditable`. Supports
 * the subset of formatting that the formato sanitizer accepts: bold,
 * italic, underline, paragraphs, headings (H2/H3), and bullet/numbered
 * lists.
 *
 * We use `document.execCommand` because:
 *   1. The editor is dev-only (admin-facing tool, predictable browsers).
 *   2. It avoids pulling in a 100KB+ rich-text library.
 *   3. The output is always sanitized via the same allowlist before save.
 */
export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  className?: string
  ariaLabel?: string
}

const TOOLBAR: Array<{
  cmd: string
  arg?: string
  icon: React.ComponentType<{ size?: number }>
  label: string
}> = [
  { cmd: "bold", icon: Bold, label: "Negrita" },
  { cmd: "italic", icon: Italic, label: "Cursiva" },
  { cmd: "underline", icon: UnderlineIcon, label: "Subrayar" },
  { cmd: "formatBlock", arg: "P", icon: Pilcrow, label: "Párrafo" },
  { cmd: "formatBlock", arg: "H2", icon: Heading2, label: "Encabezado 2" },
  { cmd: "formatBlock", arg: "H3", icon: Heading3, label: "Encabezado 3" },
  { cmd: "insertUnorderedList", icon: List, label: "Lista" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Lista numerada" },
]

export function RichTextEditor({
  value,
  onChange,
  className,
  ariaLabel = "Cuerpo del formato",
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastEmittedRef = useRef<string>("")

  // Sync the editor when `value` changes from the outside (e.g. switching
  // formats), but never mid-edit — we compare against the last value we
  // emitted to avoid clobbering the cursor.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (value === lastEmittedRef.current) return
    el.innerHTML = value
    lastEmittedRef.current = value
  }, [value])

  const emit = useCallback(() => {
    const el = ref.current
    if (!el) return
    const next = sanitizeCuerpoHtml(el.innerHTML)
    lastEmittedRef.current = next
    onChange(next)
  }, [onChange])

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      ref.current?.focus()
      document.execCommand(cmd, false, arg)
      emit()
    },
    [emit],
  )

  return (
    <div className={cn("rounded-md border border-border/60 bg-background", className)}>
      <div
        role="toolbar"
        aria-label="Formato de texto"
        className="flex flex-wrap items-center gap-1 border-b border-border/60 px-2 py-1.5"
      >
        {TOOLBAR.map((b) => (
          <button
            key={`${b.cmd}-${b.arg ?? ""}`}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(b.cmd, b.arg)}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            aria-label={b.label}
            title={b.label}
          >
            <b.icon size={16} />
          </button>
        ))}
      </div>

      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          // Paste as plain text to keep the body clean. Users can re-apply
          // formatting with the toolbar afterwards.
          e.preventDefault()
          const text = e.clipboardData.getData("text/plain")
          document.execCommand("insertText", false, text)
        }}
        className={cn(
          "min-h-[260px] w-full px-3 py-2.5 text-sm leading-relaxed outline-none",
          // Keep the look close to a Word document while editing.
          "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1",
          "[&_h3]:text-[0.95rem] [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1",
          "[&_p]:mb-2",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2",
          "[&_li]:mb-0.5",
          "[&_table]:w-full [&_table]:border-collapse [&_table]:my-2",
          "[&_td]:border [&_td]:border-border/60 [&_td]:px-2 [&_td]:py-1",
          "[&_th]:border [&_th]:border-border/60 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted/40 [&_th]:font-semibold",
        )}
      />
    </div>
  )
}
