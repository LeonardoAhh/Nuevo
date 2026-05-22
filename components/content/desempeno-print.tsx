"use client"

import { calcularPonderacion, type DesempenoData } from "@/lib/types/desempeno"
import styles from "./desempeno-print.module.css"

interface Props {
  data: DesempenoData
}

export default function DesempenoPrint({ data }: Props) {
  const objetivos = [...data.objetivos]
  while (objetivos.length < 5) {
    objetivos.push({ numero: objetivos.length + 1, descripcion: "", resultado: "NA", porcentaje: "NA", comentarios: "" })
  }

  const pond = calcularPonderacion(data)
  const tieneCompromisos = !!(data.compromisos || data.fecha_revision || data.observaciones)

  return (
    <div className={`print-area ${styles.printRoot}`}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1>EVALUACIÓN DE DESEMPEÑO PERSONAL {data.tipo === 'jefe' ? 'JEFE' : data.tipo === 'administrativo' ? 'ADMINISTRATIVO' : 'OPERATIVO'}</h1>
          <p>Periodo de evaluación: <span className={styles.periodBadge}>{data.periodo || '—'}</span></p>
        </div>
        <div className={styles.headerRight}>
          <img src="/logo-vino-plastic.png" alt="Logo" className={styles.logo} />
        </div>
      </div>

      {/* Info - Evaluado */}
      <div className={styles.infoGridTop}>
        <div><strong>Nombre del evaluado:</strong> {data.nombre}</div>
        <div><strong>Puesto del evaluado:</strong> {data.puesto}</div>
        <div><strong>No. empleado:</strong> {data.numero_empleado}</div>
      </div>
      {/* Info - Evaluador */}
      <div className={styles.infoGridBottom}>
        <div><strong>Nombre del evaluador:</strong> {data.evaluador_nombre}</div>
        <div><strong>Puesto del evaluador:</strong> {data.evaluador_puesto}</div>
      </div>

      {/* PARTE 1: Objetivos (40%) */}
      <div className={styles.sectionHeader}>Cumplimiento de Objetivos (40%)</div>
      <table className={styles.table}>
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
              <td>{obj.descripcion || '—'}</td>
              <td className={styles.tdCenter}>{obj.resultado || 'NA'}</td>
              <td className={styles.tdCenter}>{obj.porcentaje || 'NA'}</td>
              <td>{obj.comentarios || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.resultRow}>
        <span>RESULTADO PROMEDIO: <strong>{pond.promedioParte1}%</strong></span>
        <span>RESULTADO PONDERADO: <strong>{pond.ponderadoParte1}%</strong></span>
      </div>

      {/* PARTE 2: Cumplimiento (30%) */}
      <div className={styles.sectionHeader}>Responsabilidades 30%</div>
      <table className={styles.table}>
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
              <td>{item.comentarios || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.resultRow}>
        <span>RESULTADO PROMEDIO: <strong>{pond.promedioParte2}%</strong></span>
        <span>RESULTADO PONDERADO: <strong>{pond.ponderadoParte2}%</strong></span>
      </div>

      {/* PARTE 3: Competencias (30%) */}
      <div className={styles.sectionHeader}>Competencias Blandas 30%</div>
      <table className={styles.table}>
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
              <td className={styles.tdBold}>{comp.nombre}</td>
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

      {/* Calificación final */}
      <div className={styles.calificacionBox}>
        <span>CALIFICACIÓN TOTAL DEL PERIODO:</span>
        <strong>{pond.calificacionFinal}%</strong>
      </div>

      {/* Compromisos + firmas */}
      <div className={tieneCompromisos ? styles.pageBreakSection : undefined}>
        {pond.calificacionFinal < 80 && tieneCompromisos && (
          <div className={styles.warningBox}>
            En caso de obtener menos del 80% en esta evaluación, se deberán establecer compromisos y acuerdos.
          </div>
        )}

        {tieneCompromisos && (
          <div className={styles.notesSection}>
            {data.compromisos && (
              <div>
                <strong>Compromisos / Acuerdos:</strong>
                <p style={{ whiteSpace: 'pre-line' }}>{data.compromisos}</p>
              </div>
            )}
            {data.fecha_revision && (
              <div>
                <strong>Fecha de revisión:</strong>
                <p>{data.fecha_revision}</p>
              </div>
            )}
            {data.observaciones && (
              <div>
                <strong>Observaciones:</strong>
                <p>{data.observaciones}</p>
              </div>
            )}
          </div>
        )}

        {/* Firmas */}
        <div className={styles.signatureGrid}>
          <div>
            <p className={styles.signatureName}>{data.evaluador_nombre || '—'}</p>
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

      <div className={styles.footerText}>
        <span>RG-ADM-063</span>
        <span>Rev. 3</span>
      </div>
    </div>
  )
}