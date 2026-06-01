"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import RecontratacionPrint, { type RecontratacionPrintData } from "@/components/content/recontratacion-print"
import { useRecontratacion } from "@/lib/hooks/useRecontratacion"
import { useRole } from "@/lib/hooks"

export default function RecontratacionPrintPage() {
  const params = useSearchParams()
  const numero = params.get("numero") ?? ""
  const { fetchByNumero } = useRecontratacion()
  const { isEvaluador, loading: roleLoading } = useRole()
  const [data, setData] = useState<RecontratacionPrintData | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading")

  useEffect(() => {
    if (roleLoading || isEvaluador) return
    if (!numero) { setStatus("notfound"); return }
    let cancelled = false
    fetchByNumero(numero).then(d => {
      if (cancelled) return
      if (!d) { setStatus("notfound"); return }
      setData(d)
      setStatus("ready")
    })
    return () => { cancelled = true }
  }, [numero, fetchByNumero, roleLoading, isEvaluador])

  useEffect(() => {
    if (status !== "ready") return
    const t = setTimeout(() => window.print(), 600)
    return () => clearTimeout(t)
  }, [status])

  if (!roleLoading && isEvaluador) {
    return (
      <div className="no-print" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5"
      }}>
        <div style={{
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "2rem 3rem",
          textAlign: "center",
          maxWidth: "400px"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
          <p style={{ fontSize: "0.875rem", color: "#555", margin: 0 }}>
            No tienes permiso para acceder a este formato.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Barra de herramientas — solo pantalla */}
      <div className="no-print" style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.6rem 1rem",
        background: "#1a1a1a",
        borderBottom: "1px solid #333",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
      }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase", marginRight: "auto" }}>
          RG-REC-048 · Vista previa de impresión
        </span>
        <button
          onClick={() => window.print()}
          disabled={status !== "ready"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: status === "ready" ? "#ffffff" : "#555",
            color: status === "ready" ? "#1a1a1a" : "#999",
            border: "none",
            borderRadius: "4px",
            padding: "0.4rem 1rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            cursor: status === "ready" ? "pointer" : "not-allowed",
            textTransform: "uppercase",
            transition: "opacity 0.2s"
          }}
        >
          ⎙ Imprimir
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: "transparent",
            color: "#aaa",
            border: "1px solid #444",
            borderRadius: "4px",
            padding: "0.4rem 0.9rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            cursor: "pointer",
            textTransform: "uppercase"
          }}
        >
          ✕ Cerrar
        </button>
      </div>

      {/* Estados de carga / no encontrado */}
      {status === "loading" && (
        <div className="no-print" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "1rem",
          color: "#666"
        }}>
          <div style={{
            width: "32px", height: "32px",
            border: "3px solid #e0e0e0",
            borderTopColor: "#1a1a1a",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ fontSize: "0.8rem", margin: 0 }}>Cargando formato…</p>
        </div>
      )}

      {status === "notfound" && (
        <div className="no-print" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh"
        }}>
          <div style={{
            background: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "2rem 3rem",
            textAlign: "center",
            maxWidth: "420px"
          }}>
            <p style={{ fontSize: "0.85rem", color: "#333", fontWeight: 600, margin: "0 0 0.25rem" }}>
              Registro no encontrado
            </p>
            <p style={{ fontSize: "0.75rem", color: "#888", margin: 0 }}>
              Número: <strong>{numero || "—"}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Documento imprimible */}
      {data && (
        <div className="print-area-wrapper">
          <RecontratacionPrint data={data} />
        </div>
      )}

      <style>{`
        /* ── Spinner ── */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Pantalla: simula hoja sobre fondo gris ── */
        @media screen {
          body {
            background: #e8e8e8;
            margin: 0;
          }
          .print-area-wrapper {
            padding: 24px 16px 48px;
          }
          .printRoot {
            max-width: 8.5in;
            margin: 0 auto;
            background: #fff;
            box-shadow:
              0 1px 3px rgba(0,0,0,0.12),
              0 4px 16px rgba(0,0,0,0.08);
          }
        }

        /* ── Impresión: ocultar chrome, ajustar a Letter ── */
        @media print {
          body { background: #fff !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .print-area-wrapper { padding: 0 !important; }
          .printRoot {
            box-shadow: none !important;
            width: 8.5in !important;
            max-width: 8.5in !important;
          }
        }

        /* ── Responsive: pantallas pequeñas ── */
        @media screen and (max-width: 700px) {
          .print-area-wrapper {
            padding: 12px 0;
          }
          .printRoot {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </>
  )
}
