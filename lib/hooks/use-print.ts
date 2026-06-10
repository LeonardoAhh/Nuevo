/**
 * usePrintSinHeaderFooter
 *
 * Abre el área de impresión en una ventana nueva limpia.
 * Chrome/Edge abren el diálogo con "Encabezados y pies de página"
 * DESMARCADO por defecto cuando el print viene de window.open().
 *
 * Uso:
 *   const { imprimir, imprimiendo } = usePrintSinHeaderFooter()
 *   <button onClick={imprimir} disabled={imprimiendo}>Imprimir</button>
 */

"use client"

import { useState, useCallback } from "react"

export function usePrintSinHeaderFooter(selector = ".print-area") {
  const [imprimiendo, setImprimiendo] = useState(false)

  const imprimir = useCallback(() => {
    const nodo = document.querySelector(selector)
    if (!nodo) {
      window.print()
      return
    }

    setImprimiendo(true)

    // Convierte los <link rel="stylesheet"> a URLs absolutas para que
    // resuelvan correctamente desde about:blank tanto en dev como en prod.
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    )
      .map((el) => {
        const href = el.href // .href ya devuelve la URL absoluta
        return `<link rel="stylesheet" href="${href}" />`
      })
      .join("\n")

    const win = window.open("", "_blank", "width=900,height=700")
    if (!win) {
      window.print()
      setImprimiendo(false)
      return
    }

    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Imprimir</title>

    ${links}

    <style>
      *, *::before, *::after { box-sizing: border-box; }

      html { font-size: 16px; }

      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        width: 816px; /* carta a 96dpi */
      }

      /* Flujo normal en ventana nueva — sin position:absolute */
      .print-area {
        display: block !important;
        position: static !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }

      @page {
        size: letter portrait;
        margin: 0mm;
      }
    </style>
  </head>
  <body>
    ${nodo.outerHTML}
  </body>
</html>`)

    win.document.close()

    // Esperamos a que carguen las hojas de estilo externas
    win.onload = () => {
      setTimeout(() => {
        win.focus()
        win.print()
        win.onafterprint = () => win.close()
        setTimeout(() => { if (!win.closed) win.close() }, 2_000)
        setImprimiendo(false)
      }, 500) // 500ms da tiempo a que carguen los CSS externos
    }
  }, [selector])

  return { imprimir, imprimiendo }
}
