"use client"

/**
 * Last-resort error boundary. Rendered only when the root layout itself
 * crashes (e.g. ThemeProvider throws), so it ships its own <html> + <body>
 * and cannot rely on tokens or providers. Keep styles inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#0f1013",
          color: "#efefef",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#9a9aa2",
              margin: 0,
            }}
          >
            {error.digest ? `Error ${error.digest}` : "Error crítico"}
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "12px 0 8px" }}>
            No pudimos cargar la aplicación
          </h1>
          <p style={{ fontSize: 14, color: "#c8c8cd", margin: 0 }}>
            Intenta recargar la página. Si el problema continúa, cierra sesión y vuelve a entrar.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "#4f46e5",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
