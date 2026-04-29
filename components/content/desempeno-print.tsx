"use client"

import type { DesempenoData } from "@/lib/types/desempeno"
import styles from "./desempeno-print.module.css"

interface Props {
  data: DesempenoData
}

export default function DesempenoPrint({ data }: Props) {
  const objetivos = [...data.objetivos]
  while (objetivos.length < 10) {
    objetivos.push({ numero: objetivos.length + 1, descripcion: "NA", resultado: "NA", porcentaje: "NA", comentarios: "" })
  }

  return (
    <div className={`print-area ${styles.printRoot}`}>
      <div className={styles.headerRow}>
        <div className={styles.logoPlaceholder} />
        <div className={styles.titleBlock}>
          <h1>EVALUACIÓN DE DESEMPEÑO PERSONAL {data.tipo === 'jefe' ? 'JEFE' : data.tipo === 'administrativo' ? 'ADMINISTRATIVO' : 'OPERATIVO'}</h1>
          <p>Periodo de evaluación: {data.periodo || '—'}</p>
        </div>
        <div className={styles.logoPlaceholder} />
      </div>

      <div className={styles.infoGrid}>
        <div><strong>Nombre del evaluado:</strong> {data.nombre}</div>
        <div><strong>No. empleado:</strong> {data.numero_empleado}</div>
        <div><strong>Puesto del evaluado:</strong> {data.puesto}</div>
        <div><strong>Nombre del evaluador:</strong> {data.evaluador_nombre}</div>
        <div><strong>Puesto del evaluador:</strong> {data.evaluador_puesto}</div>
      </div>

      <p className={styles.instructions}>
        Instrucciones para el evaluador: la evaluación está integrada por 3 partes. En la primera deberá anotar los objetivos SMART del puesto evaluado, así como el % del objetivo logrado en cada uno. En la segunda parte se completará con información de RH y SGI, la tercera parte será evaluada por el jefe inmediato.
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>CRITERIO</th>
            <th>OBJETIVOS SMART</th>
            <th>RESULTADO DEL PERIODO</th>
            <th>% OBTENIDO</th>
            <th>COMENTARIOS</th>
          </tr>
        </thead>
        <tbody>
          {objetivos.map((obj, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{obj.descripcion}</td>
              <td>{obj.resultado || 'NA'}</td>
              <td>{obj.porcentaje || 'NA'}</td>
              <td>{obj.comentarios || 'NA'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryBox}>RESULTADO PROMEDIO: {data.calificacion_final}%</div>
      </div>

      <div className={styles.secondaryTableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cumplimiento de responsabilidades</th>
              <th>% CUMP</th>
              <th>EVALÚA</th>
              <th>COMENTARIOS</th>
            </tr>
          </thead>
          <tbody>
            {data.cumplimiento_responsabilidades.map((item, idx) => {
              const [label, value] = Object.entries(item)[0] ?? ["", ""]
              const [, extra] = Object.entries(item)[1] ?? ["", ""]
              return (
                <tr key={idx}>
                  <td>{label}</td>
                  <td>{value}</td>
                  <td>{extra || '—'}</td>
                  <td>{Object.entries(item).slice(2).map(([k, v]) => v).join(' | ')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.competenciasSection}>
        <h2>Competencias blandas</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Competencia</th>
              <th>Descripción</th>
              <th>Calificación</th>
            </tr>
          </thead>
          <tbody>
            {data.competencias.map((competencia, idx) => (
              <tr key={idx}>
                <td>{competencia.nombre}</td>
                <td>{competencia.descripcion}</td>
                <td>{competencia.calificacion}/4</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.notesSection}>
        <div>
          <strong>Compromisos / Acuerdos:</strong>
          <p>{data.compromisos || '—'}</p>
        </div>
        <div>
          <strong>Fecha de revisión:</strong>
          <p>{data.fecha_revision || '—'}</p>
        </div>
        <div>
          <strong>Observaciones:</strong>
          <p>{data.observaciones || '—'}</p>
        </div>
      </div>

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

      <div className={styles.footerText}>RG-ADM-03 Rev 2</div>
    </div>
  )
}
