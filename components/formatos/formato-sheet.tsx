"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { sanitizeCuerpoHtml } from "@/lib/formatos/sanitize"
import { formatRevision } from "@/lib/formatos/types"

/**
 * Visual representation of a letter-size exam sheet (8.5" × 11").
 *
 * Used by:
 *   - FormatoEditor's live preview (scaled-down)
 *   - /formatos/[id]/imprimir (full-size, print-ready)
 *
 * Header (estandarizado, idéntico para todas las plantillas):
 *   logo + nombre del examen + 6 campos: Nombre, No. Empleado, Calificación,
 *   Turno, Departamento, Fecha.
 *
 * Footer: código distintivo + revisión.
 *
 * Stays monochrome and uses pure black/white because the page is designed
 * to be printed. Theme tokens are NOT used here — the sheet always looks
 * the same on paper regardless of the user's app theme.
 */
export interface FormatoSheetProps {
  nombre_examen: string
  codigo: string
  revision: number
  cuerpo_html: string
  /** Wrap the sheet in a scaled-down, scrollable preview. */
  scale?: number
  className?: string
}

export function FormatoSheet({
  nombre_examen,
  codigo,
  revision,
  cuerpo_html,
  scale,
  className,
}: FormatoSheetProps) {
  // Sanitize at render time as a defense-in-depth — the DB cannot reject
  // tags, only enforce length, so we strip any unexpected tags/attrs.
  const safeBody = sanitizeCuerpoHtml(cuerpo_html)

  const sheet = (
    <article
      data-formato-sheet
      className={cn(
        "formato-sheet relative bg-white text-black shadow-lg",
        className,
      )}
      style={{
        width: "8.5in",
        minHeight: "11in",
        padding: "0.7in 0.6in",
        boxSizing: "border-box",
        fontFamily: "Calibri, Arial, sans-serif",
        fontSize: "11pt",
        lineHeight: 1.45,
      }}
    >
      <FormatoHeader nombre_examen={nombre_examen} />

      <section
        className="formato-body"
        style={{ marginTop: "0.25in", minHeight: "7.5in" }}
        dangerouslySetInnerHTML={{ __html: safeBody }}
      />

      <FormatoFooter codigo={codigo} revision={revision} />
    </article>
  )

  if (!scale || scale === 1) return sheet
  // Wrap in a scaled box so the preview takes proportionally less space.
  // Outer box matches the SCALED sheet size to avoid layout overflow.
  return (
    <div
      style={{
        width: `${8.5 * scale}in`,
        height: `${11 * scale}in`,
        position: "relative",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: "8.5in",
          height: "11in",
        }}
      >
        {sheet}
      </div>
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

function FormatoHeader({ nombre_examen }: { nombre_examen: string }) {
  // Header proportions tuned to mirror the standard Word template — the
  // logo cell stays narrow (~1.05in) so the title row doesn't end up
  // visually oversized.
  const cellBase: React.CSSProperties = {
    border: "1px solid #000",
    padding: "3px 6px",
    fontSize: "9.5pt",
  }
  return (
    <header>
      {/* Top row — logo + title spanning the rest */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.05in 1fr",
          alignItems: "stretch",
          border: "1px solid #000",
          minHeight: "0.5in",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3px 4px",
            borderRight: "1px solid #000",
          }}
        >
          <Image
            src="/logo-vino-plastic.png"
            alt="Vino Plastic"
            width={140}
            height={70}
            priority
            unoptimized
            style={{ height: "auto", width: "100%", maxWidth: "0.95in" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 10px",
            fontWeight: 700,
            textAlign: "center",
            fontSize: "11.5pt",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {nombre_examen || "Nombre del examen"}
        </div>
      </div>

      {/* Row 2: Nombre · No. Empleado · Calificación */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1.2fr 1fr",
          borderLeft: "1px solid #000",
          borderRight: "1px solid #000",
        }}
      >
        <div style={{ ...cellBase, borderTop: 0, borderLeft: 0 }}>
          <strong>Nombre:</strong>
        </div>
        <div style={{ ...cellBase, borderTop: 0, borderLeft: 0 }}>
          <strong>No. Empleado:</strong>
        </div>
        <div style={{ ...cellBase, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
          <strong>CALIFICACIÓN:</strong>
        </div>
      </div>

      {/* Row 3: Turno · Departamento · Fecha */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr 1.2fr",
          borderLeft: "1px solid #000",
          borderRight: "1px solid #000",
          borderBottom: "1px solid #000",
        }}
      >
        <div style={{ ...cellBase, borderTop: 0, borderLeft: 0, borderBottom: 0 }}>
          <strong>Turno:</strong>
        </div>
        <div style={{ ...cellBase, borderTop: 0, borderLeft: 0, borderBottom: 0 }}>
          <strong>Departamento:</strong>
        </div>
        <div
          style={{ ...cellBase, borderTop: 0, borderLeft: 0, borderRight: 0, borderBottom: 0 }}
        >
          <strong>Fecha:</strong>
        </div>
      </div>
    </header>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function FormatoFooter({ codigo, revision }: { codigo: string; revision: number }) {
  return (
    <footer
      className="formato-footer"
      style={{
        position: "absolute",
        left: "0.6in",
        right: "0.6in",
        bottom: "0.5in",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "9.5pt",
        color: "#444",
      }}
    >
      <span>{codigo}</span>
      <span>{formatRevision(revision)}</span>
    </footer>
  )
}
