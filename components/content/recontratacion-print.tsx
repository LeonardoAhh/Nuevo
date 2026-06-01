"use client"

import {
  INCIDENCIA_COLUMNS,
  FIRMA_RECURSOS_HUMANOS,
  FIRMA_GERENTE_PLANTA,
  formatDMY,
  formatMesLargo,
  type PeriodoMensual,
} from "@/lib/recontratacion"
import styles from "./recontratacion-print.module.css"

export interface IncidenciaMesRow {
  /** YYYY-MM */
  mes: string
  /** valores por categoría canónica */
  valores: Record<string, number>
  comentarios: string
}

export interface EvaluacionRow {
  periodo: PeriodoMensual
  calificacion: number | null
  /** "SÍ" | "NO" | "" — se deriva o se deja en blanco para llenar */
  planSeguimiento: string
  observaciones: string
}

export interface RecontratacionPrintData {
  nombre: string
  numero: string
  puesto: string
  departamento: string
  turno: string
  fechaIngresoISO: string | null
  terminoContratoISO: string | null
  /** Jefe directo detectado automáticamente (roster). "#N/D" si no se encuentra. */
  jefeDirecto: string
  /** Estado del RG-REC-048 */
  rgEntregado: string
  incidencias: IncidenciaMesRow[]
  evaluaciones: EvaluacionRow[]
}

/** Muestra el conteo de incidencias; sin dato → "0" para no dejar la celda vacía. */
function num(v: number | undefined): string {
  return v && v !== 0 ? String(v) : "0"
}

export default function RecontratacionPrint({ data }: { data: RecontratacionPrintData }) {
  return (
    <div className={`print-area ${styles.printRoot}`}>
     <div className={styles.sheet}>
      {/* ── Encabezado ─────────────────────────────────────── */}
      <div className={styles.headerRow}>
        <img src="/logo-vino-plastic.png" alt="Logo" className={styles.logo} />
        <h1 className={styles.title}>AUTORIZACIÓN DE CONTINUIDAD DE CONTRATO</h1>
      </div>

      {/* ── Datos del trabajador ───────────────────────────── */}
      <div className={styles.band}>DATOS DEL TRABAJADOR</div>
      <div className={styles.infoGrid}>
        <div className={styles.infoLabel}>NOMBRE DEL TRABAJADOR:</div>
        <div className={styles.infoValue}>{data.nombre || ""}</div>
        <div className={styles.infoLabel}>NO.</div>
        <div className={styles.infoValue}>{data.numero || ""}</div>

        <div className={styles.infoLabel}>PUESTO:</div>
        <div className={styles.infoValue}>{data.puesto || ""}</div>
        <div className={styles.infoLabel}>DEPARTAMENTO:</div>
        <div className={styles.infoValue}>{data.departamento || ""}</div>

        <div className={styles.infoLabel}>TURNO:</div>
        <div className={styles.infoValue}>{data.turno || ""}</div>
        <div className={styles.infoLabel}>FECHA DE INGRESO:</div>
        <div className={styles.infoValue}>{formatDMY(data.fechaIngresoISO)}</div>

        <div className={styles.infoLabel}>FECHA DE TERMINO DE CONTRATO:</div>
        <div className={`${styles.infoValue} ${styles.infoSpanValue}`}>
          {formatDMY(data.terminoContratoISO)}
        </div>
      </div>

      {/* ── 1. Incidencias (solo ventana de 90 días) ───────── */}
      <div className={`${styles.band} ${styles.bandLeft}`}>
        1. INCIDENCIAS EN SU RÉCORD DE ASISTENCIA
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.colMes}>MES</th>
            {INCIDENCIA_COLUMNS.map((c) => (
              <th key={c.header}>{c.header}</th>
            ))}
            <th className={styles.colComentarios}>COMENTARIOS</th>
          </tr>
        </thead>
        <tbody>
          {data.incidencias.length === 0 ? (
            <tr>
              <td className={styles.colMes}>—</td>
              {INCIDENCIA_COLUMNS.map((c) => (
                <td key={c.header}>0</td>
              ))}
              <td className={styles.colComentarios}>N/A</td>
            </tr>
          ) : (
            data.incidencias.map((row) => (
              <tr key={row.mes}>
                <td className={styles.colMes}>{formatMesLargo(row.mes)}</td>
                {INCIDENCIA_COLUMNS.map((c) => (
                  <td key={c.header}>{num(row.valores[c.categoria])}</td>
                ))}
                <td className={styles.colComentarios}>{row.comentarios || "N/A"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ── 3. Evaluación del desempeño (1 por mes) ────────── */}
      <div className={`${styles.band} ${styles.bandLeft}`}>3. EVALUACIÓN DEL DESEMPEÑO</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>NO. DE EVALUACIÓN</th>
            <th>PERIODO DE EVALUACIÓN</th>
            <th>CALIFICACIÓN OBTENIDA</th>
            <th>¿APLICÓ PLAN DE SEGUIMIENTO?</th>
            <th className={styles.colComentarios}>OBSERVACIONES</th>
          </tr>
        </thead>
        <tbody>
          {data.evaluaciones.map((ev, i) => {
            const sinCalif = ev.calificacion == null
            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{ev.periodo.label || ""}</td>
                <td>{sinCalif ? 0 : ev.calificacion}</td>
                <td>{ev.planSeguimiento}</td>
                <td className={styles.colComentarios}>
                  {sinCalif ? "El área no entregó" : ev.observaciones || ""}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* ── 4. Plan de formación ───────────────────────────── */}
      <div className={`${styles.band} ${styles.bandLeft}`}>4. PLAN DE FORMACIÓN</div>
      <div className={styles.planRow}>
        <div>RG-REC-048 REQUISITADO CORRECTAMENTE Y ENTREGADO A RECURSOS HUMANOS</div>
        <div className={styles.planChoice}>SI / NO</div>
      </div>

      {/* ── Autorización de contrato indeterminado ─────────── */}
      <div className={styles.band}>AUTORIZACIÓN DE CONTRATO INDETERMINADO</div>
      <div className={styles.authBlock}>
        <div className={styles.authQuestion}>
          CON BASE EN LOS RESULTADOS DE LOS 3 PERIODOS DE EVALUACIÓN, ¿SE AUTORIZA CONTRATO
          INDETERMINADO?&nbsp;&nbsp;&nbsp;SI / NO
        </div>
        <div className={styles.authComment}>COMENTARIOS:</div>
      </div>

      {/* ── Firmas ─────────────────────────────────────────── */}
      <div className={styles.band}>FIRMA DE AUTORIZACIONES</div>
      <div className={styles.signatureGrid}>
        <div>
          <p className={styles.signatureName}>{data.jefeDirecto || "#N/D"}</p>
          <p className={styles.signatureRole}>JEFE DIRECTO</p>
        </div>
        <div>
          <p className={styles.signatureName}>{FIRMA_RECURSOS_HUMANOS}</p>
          <p className={styles.signatureRole}>JEFE DE RECURSOS HUMANOS</p>
        </div>
        <div>
          <p className={styles.signatureName}>{FIRMA_GERENTE_PLANTA}</p>
          <p className={styles.signatureRole}>GERENTE DE PLANTA QUERÉTARO</p>
        </div>
      </div>

     </div>
    </div>
  )
}
