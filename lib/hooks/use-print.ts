/**
 * usePrintSinHeaderFooter
 *
 * Abre el área de impresión en una ventana nueva limpia.
 * Chrome/Edge abren el diálogo con "Encabezados y pies de página"
 * DESMARCADO por defecto cuando el print viene de window.open().
 *
 * El registro (RG-ADM) vive en un <tfoot> que el navegador repite
 * al final de CADA página impresa — método nativo y confiable.
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

    // Hojas de estilo externas
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    )
      .map((el) => `<link rel="stylesheet" href="${el.href}" />`)
      .join("\n")

    // Estilos inline (<style>) — Next.js en dev inyecta los CSS Modules así
    const inlineStyles = Array.from(document.querySelectorAll("style"))
      .map((el) => `<style>${el.textContent ?? ""}</style>`)
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
    <base href="${window.location.origin}/" />
    ${links}
    ${inlineStyles}
    <style>
      /* Este <style> es el ÚLTIMO del head: gana la cascada sobre
         el CSS global (reglas del generador de exámenes) y los módulos */
      *, *::before, *::after { box-sizing: border-box; }
      html { font-size: 16px; }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        width: 100%;
        height: auto;
      }

      /* Flujo normal — cancela position:absolute del CSS global */
      .print-area {
        display: block !important;
        position: static !important;
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }

      /* El pie con el registro (RG-ADM) SIEMPRE visible */
      .footer-print {
        display: flex !important;
        position: static !important;
        justify-content: space-between !important;
        margin: 0 !important;
      }

      @media print {
        html, body {
          height: auto !important;
          overflow: visible !important;
        }

        /* Cancela el visibility:hidden del CSS global de exámenes */
        body * {
          visibility: visible !important;
        }

        .print-area {
          position: static !important;
          left: auto !important;
          top: auto !important;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* El tfoot del documento se repite al final de cada página */
        .print-area > table > tfoot {
          display: table-footer-group !important;
        }

        .footer-print {
          display: flex !important;
          position: static !important;
          font-size: 6pt !important;
          color: #9ca3af !important;
          padding-top: 2mm !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }

      /* Declarado al final: sus márgenes ganan sobre el
         @page { margin: 0 } del CSS global de exámenes */
      @page {
        size: letter portrait;
        margin: 10mm 10mm 12mm 10mm;
      }
    </style>
  </head>
  <body>
    ${nodo.outerHTML}
  </body>
</html>`)

    win.document.close()

    let printed = false

    const lanzarImpresion = () => {
      if (printed || win.closed) return
      printed = true

      const imgs = Array.from(win.document.images)
      const esperaImgs = imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.onload = () => res()
              img.onerror = () => res()
            })
      )
      const esperaFuentes =
        "fonts" in win.document ? win.document.fonts.ready.catch(() => {}) : Promise.resolve()

      Promise.all([...esperaImgs, esperaFuentes]).then(() => {
        setTimeout(() => {
          if (win.closed) {
            setImprimiendo(false)
            return
          }
          win.focus()
          win.onafterprint = () => {
            win.close()
            setImprimiendo(false)
          }
          win.print()
          setTimeout(() => {
            if (!win.closed) win.close()
            setImprimiendo(false)
          }, 2_000)
        }, 300)
      })
    }

    win.onload = lanzarImpresion
    if (win.document.readyState === "complete") {
      lanzarImpresion()
    } else {
      setTimeout(lanzarImpresion, 1_500)
    }
  }, [selector])

  return { imprimir, imprimiendo }
}
