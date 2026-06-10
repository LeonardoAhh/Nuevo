"use client"

import { calcularPonderacion, type DesempenoData } from "@/lib/types/desempeno"
import styles from "./desempeno-print.module.css"

interface Props {
  data: DesempenoData
  blankMode?: boolean
}

export default function DesempenoPrint({ data, blankMode }: Props) {
  const objetivos = [...data.objetivos]
  while (objetivos.length < 5) {
    objetivos.push({ numero: objetivos.length + 1, descripcion: "", resultado: "NA", porcentaje: "NA", comentarios: "" })
  }

  const pond = calcularPonderacion(data)
  const tieneCompromisos = !!(data.compromisos || data.fecha_revision || data.observaciones)

  const forzarSaltoCompromisos = !blankMode && pond.calificacionFinal < 80 && tieneCompromisos

  const totalFilas =
    objetivos.length +
    data.cumplimiento_responsabilidades.length +
    data.competencias.length

  const isCompact = totalFilas <= 22

  return (
    <div className={`print-area ${styles.printRoot}${isCompact ? ` ${styles["printRoot--compact"]}` : ""}`}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1>EVALUACIÓN DE DESEMPEÑO PERSONAL {data.tipo === "operativo" ? "OPERATIVO" : "ADMINISTRATIVO"}</h1>
          <p>Periodo de evaluación: <span className={styles.periodBadge}>{data.periodo || "—"}</span></p>
        </div>
        <div className={styles.headerRight}>
          <img src="/logo-vino-plastic.png" alt="Logo" className={styles.logo} />
        </div>
      </div>

      {/* ── Ficha del evaluado ─────────────────────────────── */}
      <div className={styles.infoGridTop}>
        <div><strong>Nombre del evaluado:</strong> {data.nombre}</div>
        <div><strong>Puesto del evaluado:</strong> {data.puesto}</div>
        <div><strong>No. empleado:</strong> {data.numero_empleado}</div>
      </div>
      <div className={styles.infoGridBottom}>
        <div><strong>Nombre del evaluador:</strong> {data.evaluador_nombre}</div>
        <div><strong>Puesto del evaluador:</strong> {data.evaluador_puesto}</div>
      </div>

      {/* ── PARTE 1: Objetivos (40%) ───────────────────────── */}
      <div className={`${styles.sectionBlock} ${styles["sectionBlock--breakable"]}`}>
        <div className={styles.sectionHeader}>Cumplimiento de Objetivos 40%</div>
        <table className={`${styles.table} ${styles.tableObjetivos}`}>
          <thead>
            <tr>
              <th className={styles.thCenter}>CRITERIO</th>
              <th>OBJETIVOS SMART</th>
              <th className={styles.thCenter}>OBJETIVO</th>
              <th className={styles.thCenter}>% OBTENIDO</th>
              <th>COMENTARIOS</th>
            </tr>
          </thead>
          <tbody>
            {objetivos.map((obj, i) => (
              <tr key={i}>
                <td className={styles.tdCenter}>{i + 1}</td>
                <td>{obj.descripcion || "—"}</td>
                <td className={styles.tdCenter}>{obj.resultado || "NA"}</td>
                <td className={styles.tdCenter}>{obj.porcentaje || "NA"}</td>
                <td>{obj.comentarios || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.resultRow}>
          <span>RESULTADO PROMEDIO: <strong>{pond.promedioParte1}%</strong></span>
          <span>RESULTADO PONDERADO: <strong>{pond.ponderadoParte1}%</strong></span>
        </div>
      </div>

      {/* ── PARTE 2: Responsabilidades (30%) ──────────────── */}
      <div className={`${styles.sectionBlock} ${styles["sectionBlock--breakable"]}`}>
        <div className={styles.sectionHeader}>Responsabilidades 30%</div>
        <table className={`${styles.table} ${styles.tableObjetivos}`}>
          <thead>
            <tr>
              <th>Cumplimiento de responsabilidades</th>
              <th className={styles.thCenter}>% CUMP</th>
              <th className={styles.thCenter}>EVALÚA</th>
              <th>COMENTARIOS</th>
            </tr>
          </thead>
          <tbody>
            {data.cumplimiento_responsabilidades.map((item, idx) => (
              <tr key={idx}>
                <td>{item.descripcion}</td>
                <td className={styles.tdCenter}>{item.porcentaje}</td>
                <td className={styles.tdCenter}>{item.evalua}</td>
                <td>{item.comentarios || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.resultRow}>
          <span>RESULTADO PROMEDIO: <strong>{pond.promedioParte2}%</strong></span>
          <span>RESULTADO PONDERADO: <strong>{pond.ponderadoParte2}%</strong></span>
        </div>
      </div>

      {/* ── PARTE 3: Competencias Blandas (30%) ───────────── */}
      <div className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>Competencias Blandas 30%</div>
        <table className={`${styles.table} ${styles.tableCompetencias}`}>
          <thead>
            <tr>
              <th>Competencia</th>
              <th>Descripción</th>
              <th className={styles.thCenter}>Calificación (0-4)</th>
              <th className={styles.thCenter}>%</th>
            </tr>
          </thead>
          <tbody>
            {data.competencias.map((comp, idx) => (
              <tr key={idx}>
                <td className={styles.tdNormal}>{comp.nombre}</td>
                <td className={styles.tdSmall}>{comp.descripcion}</td>
                <td className={styles.tdCenter}>{comp.calificacion}</td>
                <td className={styles.tdCenter}>{Math.round((comp.calificacion / 4) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.resultRow}>
          <span>RESULTADO PROMEDIO: <strong>{pond.promedioParte3}%</strong></span>
          <span>RESULTADO PONDERADO: <strong>{pond.ponderadoParte3}%</strong></span>
        </div>
      </div>

      {/* ── Bloque final ──────────────────────────────────── */}
      <div className={forzarSaltoCompromisos ? styles.pageBreakSection : styles.finalBlock}>

        {!blankMode && pond.calificacionFinal < 80 && tieneCompromisos && (
          <div className={styles.warningBox}>
            En caso de obtener menos del 80% en esta evaluación, se deberán establecer compromisos y acuerdos.
          </div>
        )}

        <div className={styles.calificacionBox}>
          <span>CALIFICACIÓN TOTAL DEL PERIODO:</span>
          <strong>{pond.calificacionFinal}%</strong>
        </div>

        {(tieneCompromisos || blankMode) && (
          <div className={styles.notesSection}>
            <div>
              <strong>Compromisos / Acuerdos:</strong>
              <p style={{ whiteSpace: "pre-line" }}>{data.compromisos || (blankMode ? "\u00A0" : "")}</p>
            </div>
            <div>
              <strong>Fecha de revisión:</strong>
              <p>{data.fecha_revision || (blankMode ? "\u00A0" : "")}</p>
            </div>
            <div>
              <strong>Observaciones:</strong>
              <p>{data.observaciones || (blankMode ? "\u00A0" : "")}</p>
            </div>
          </div>
        )}

        <div className={styles.signatureGrid}>
          <div>
            <p className={styles.signatureName}>{data.evaluador_nombre || "—"}</p>
            <p>Firma Evaluador</p>
          </div>
          <div>
            <p className={styles.signatureName}>{data.nombre}</p>
            <p>Firma Evaluado</p>
          </div>
          <div>
            <p className={styles.signatureName}>RH</p>
            <p>Firma Recursos Humanos</p>
          </div>
        </div>
      </div>

      {/* ── Pie de página ──────────────────────────────────── */}
      {/* footer-print es la clase global que el hook usa para fixed en impresión */}
      <div className={`${styles.footerText} footer-print`}>
        <span>{data.tipo === "operativo" ? "RG-ADM-063" : "RG-ADM-062"}</span>
        <span>REV.03</span>
      </div>

    </div>
  )
}
