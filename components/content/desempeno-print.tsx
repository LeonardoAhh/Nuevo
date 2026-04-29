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

  return (
    <div className={`print-area ${styles.printRoot}`}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.logoPlaceholder} />
        <div className={styles.titleBlock}>
          <h1>EVALUACIÓN DE DESEMPEÑO PERSONAL {data.tipo === 'jefe' ? 'JEFE' : data.tipo === 'administrativo' ? 'ADMINISTRATIVO' : 'OPERATIVO'}</h1>
          <p>Periodo de evaluación: {data.periodo || '—'}</p>
        </div>
        <div className={styles.logoPlaceholder} />
      </div>

      {/* Info */}
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

      {/* PARTE 1: Objetivos (40%) */}
      <div className={styles.sectionHeader}>Primera parte de la evaluación — ponderación total del 40%</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCenter}>CRITERIO</th>
            <th>OBJETIVOS SMART</th>
            <th className={styles.thCenter}>RESULTADO DEL PERIODO<br/>Ene - Jun / Jul - Dic</th>
            <th className={styles.thCenter}>% OBTENIDO<br/>(escala 01 al 100%)</th>
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
        <span>RESULTADO PONDERADO (×40%): <strong>{pond.ponderadoParte1}%</strong></span>
      </div>

      {/* PARTE 2: Cumplimiento (30%) */}
      <div className={styles.sectionHeader}>Segunda parte de la evaluación — ponderación total del 30%</div>
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
        <span>RESULTADO PONDERADO (×30%): <strong>{pond.ponderadoParte2}%</strong></span>
      </div>

      {/* PARTE 3: Competencias (30%) */}
      <div className={styles.sectionHeader}>Tercera parte de la evaluación — ponderación total del 30%</div>
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
        <span>RESULTADO PONDERADO (×30%): <strong>{pond.ponderadoParte3}%</strong></span>
      </div>

      {/* Calificación final */}
      <div className={styles.calificacionBox}>
        <span>CALIFICACIÓN DEL PERIODO:</span>
        <strong>{pond.calificacionFinal}%</strong>
      </div>

      {/* Compromisos */}
      {pond.calificacionFinal < 80 && (
        <div className={styles.warningBox}>
          En caso de obtener menos del 80% en esta evaluación, se deberán establecer compromisos y acuerdos.
        </div>
      )}

      <div className={styles.notesSection}>
        <div>
          <strong>Compromisos / Acuerdos:</strong>
          <p>{data.compromisos || '—'}</p>
        </div>
        <div>
          <strong>Fecha de revisión de Compromisos/Acuerdos:</strong>
          <p>{data.fecha_revision || '—'}</p>
        </div>
        <div>
          <strong>Observaciones:</strong>
          <p>{data.observaciones || '—'}</p>
        </div>
      </div>

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

      <div className={styles.footerText}>RG-ADM-03 Rev 2</div>
    </div>
  )
}
