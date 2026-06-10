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

    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    )
      .map((el) => {
        const href = el.href
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
        width: 100%;
      }

      /* Flujo normal — cancela cualquier position del módulo CSS */
      .print-area {
        display: block !important;
        position: static !important;
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }

      /* El pie se oculta del flujo y se fija al fondo via footer-print */
      .footer-print {
        display: none;
      }

      @media print {
        /* Todo visible — no usamos el truco visibility:hidden del módulo */
        body * {
          visibility: visible !important;
        }

        /* Cancela el position:absolute del @media print del módulo CSS */
        .print-area {
          position: static !important;
          left: auto !important;
          top: auto !important;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Pie fijo al fondo — en ventana nueva no genera página extra */
        .footer-print {
          display: flex !important;
          position: fixed !important;
          bottom: 3mm !important;
          left: 10mm !important;
          right: 10mm !important;
          justify-content: space-between !important;
          font-size: 6pt !important;
          color: #9ca3af !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }

      @page {
        size: letter portrait;
        margin: 10mm 10mm 14mm 10mm;
      }
    </style>
  </head>
  <body>
    ${nodo.outerHTML}
  </body>
</html>`)

    win.document.close()

    win.onload = () => {
      setTimeout(() => {
        win.focus()
        win.print()
        win.onafterprint = () => win.close()
        setTimeout(() => { if (!win.closed) win.close() }, 2_000)
        setImprimiendo(false)
      }, 500)
    }
  }, [selector])

  return { imprimir, imprimiendo }
}
