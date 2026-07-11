import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { addReportFooter } from "@/lib/pdf-footer"
import type { EmpleadoPromocion, AptitudStatus } from "./types"
import {
    calcularAptitud,
    isHabilitado,
    mesesEnPuesto,
    formatMeses,
    porcentajeCursos,
    ultimaEvaluacion,
} from "./utils"

// ─── Paleta de marca ────────────────────────────────────────────────────────
// Derivada de --primary del tema (hsl 221 62% 55% ≈ azul corporativo).
const BRAND = {
    deep: [33, 64, 125] as [number, number, number], // banner
    accent: [69, 114, 211] as [number, number, number], // acentos
    ink: [17, 24, 39] as [number, number, number],
    sub: [100, 116, 139] as [number, number, number],
    line: [226, 232, 240] as [number, number, number],
    zebra: [247, 249, 252] as [number, number, number],
    ok: [22, 163, 74] as [number, number, number],
    bad: [220, 38, 38] as [number, number, number],
    warn: [217, 119, 6] as [number, number, number],
    neutral: [100, 116, 139] as [number, number, number],
}

// Hex equivalentes para ExcelJS (ARGB)
const HEX = {
    deep: "FF21407D",
    accent: "FF4572D3",
    headerText: "FFFFFFFF",
    title: "FF111827",
    sub: "FF64748B",
    zebra: "FFF7F9FC",
    okFill: "FFE7F6EC",
    okText: "FF15803D",
    badFill: "FFFCE9E9",
    badText: "FFB91C1C",
    warnFill: "FFFDF3E3",
    warnText: "FFB45309",
    neutralFill: "FFEFF2F6",
    neutralText: "FF475569",
    border: "FFE2E8F0",
}

const STATUS_LABEL: Record<AptitudStatus, string> = {
    apto: "Apto",
    no_apto: "No Apto",
    pendiente: "Pendiente",
    en_revision: "En Revisión",
}

export interface ExportMeta {
    filtros?: {
        busqueda?: string
        departamento?: string
        puesto?: string
        estado?: string
    }
}

interface Row {
    numero: string
    nombre: string
    puesto: string
    promocionA: string
    departamento: string
    temporalidad: string
    cumpleTemp: boolean
    cursos: string
    cumpleCursos: boolean
    evaluacion: string
    cumpleEval: boolean
    examen: string
    cumpleExamen: boolean
    estado: AptitudStatus
}

function buildRows(empleados: EmpleadoPromocion[]): Row[] {
    return empleados.map((e) => {
        const meses = mesesEnPuesto(e.fechaIngresoPuesto)
        const pct = porcentajeCursos(e.cursosRequeridos)
        const done = e.cursosRequeridos.filter((c) => c.completado).length
        const total = e.cursosRequeridos.length
        const evalAct = ultimaEvaluacion(e.evaluaciones)
        const regla = e.regla

        const minTemp = regla?.minTemporalidadMeses ?? 0
        const minCursos = regla?.minPorcentajeCursos ?? 0
        const minEval = regla?.minCalificacionEvaluacion ?? 0
        const minExamen = regla?.minCalificacionExamen

        return {
            numero: e.numero ?? "—",
            nombre: e.nombre,
            puesto: e.puesto,
            promocionA: regla?.promocionA ?? "—",
            departamento: e.departamento || "—",
            temporalidad: `${formatMeses(meses)} (mín ${formatMeses(minTemp)})`,
            cumpleTemp: meses >= minTemp,
            cursos: total > 0 ? `${pct}% (${done}/${total}) · mín ${minCursos}%` : `— · mín ${minCursos}%`,
            cumpleCursos: pct >= minCursos,
            evaluacion: evalAct ? `${evalAct.calificacion} · mín ${minEval}` : `— · mín ${minEval}`,
            cumpleEval: !!evalAct && evalAct.calificacion >= minEval,
            examen:
                minExamen != null
                    ? `${e.calificacionExamen ?? "—"} · mín ${minExamen}`
                    : "N/A",
            cumpleExamen:
                minExamen == null
                    ? true
                    : e.calificacionExamen != null && e.calificacionExamen >= minExamen,
            estado: calcularAptitud(e),
        }
    })
}

function computeKpis(empleados: EmpleadoPromocion[]) {
    const habilitados = empleados.filter((e) => isHabilitado(e.puesto))
    let aptos = 0,
        noAptos = 0,
        pendientes = 0,
        revision = 0
    for (const emp of habilitados) {
        const st = calcularAptitud(emp)
        if (st === "apto") aptos++
        else if (st === "no_apto") noAptos++
        else if (st === "pendiente") pendientes++
        else revision++
    }
    return { aptos, noAptos, pendientes, revision, habilitados: habilitados.length, total: empleados.length }
}

function statusRGB(s: AptitudStatus): [number, number, number] {
    if (s === "apto") return BRAND.ok
    if (s === "no_apto") return BRAND.bad
    if (s === "pendiente") return BRAND.warn
    return BRAND.neutral
}

function fechaLarga(): string {
    return new Date().toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

function filtrosTexto(meta?: ExportMeta): string {
    const f = meta?.filtros
    if (!f) return "Todos los registros"
    const partes: string[] = []
    if (f.departamento && f.departamento !== "todos") partes.push(`Depto: ${f.departamento}`)
    if (f.puesto && f.puesto !== "todos") partes.push(`Puesto: ${f.puesto}`)
    if (f.estado && f.estado !== "todos") partes.push(`Estado: ${STATUS_LABEL[f.estado as AptitudStatus] ?? f.estado}`)
    if (f.busqueda) partes.push(`Búsqueda: "${f.busqueda}"`)
    return partes.length ? partes.join("  ·  ") : "Todos los registros"
}

// ════════════════════════════════════════════════════════════════════════════
//  PDF
// ════════════════════════════════════════════════════════════════════════════
export function exportPromocionesPDF(empleados: EmpleadoPromocion[], meta?: ExportMeta) {
    const rows = buildRows(empleados)
    const kpis = computeKpis(empleados)
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const pageW = doc.internal.pageSize.getWidth()

    // ── Banner ──────────────────────────────────────────────────────────────
    doc.setFillColor(...BRAND.deep)
    doc.rect(0, 0, pageW, 26, "F")
    doc.setFillColor(...BRAND.accent)
    doc.rect(0, 26, pageW, 1.2, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(17)
    doc.text("Reporte de Promociones", 14, 13)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    doc.setTextColor(210, 222, 245)
    doc.text("Viñoplastic · Planta Querétaro", 14, 20)

    doc.setFontSize(9)
    doc.setTextColor(225, 232, 245)
    doc.text(`Generado: ${fechaLarga()}`, pageW - 14, 13, { align: "right" })
    doc.text(`Registros: ${rows.length}`, pageW - 14, 20, { align: "right" })

    // ── Línea de filtros ──────────────────────────────────────────────────────
    doc.setTextColor(...BRAND.sub)
    doc.setFontSize(8.5)
    doc.text(`Filtros: ${filtrosTexto(meta)}`, 14, 34)

    // ── Tarjetas KPI ──────────────────────────────────────────────────────────
    const cards: Array<{ label: string; value: number; color: [number, number, number] }> = [
        { label: "Aptos", value: kpis.aptos, color: BRAND.ok },
        { label: "No Aptos", value: kpis.noAptos, color: BRAND.bad },
        { label: "Pendientes", value: kpis.pendientes, color: BRAND.warn },
        { label: "En Revisión", value: kpis.revision, color: BRAND.neutral },
        { label: "Habilitados", value: kpis.habilitados, color: BRAND.accent },
    ]
    const cardY = 38
    const cardH = 16
    const gap = 4
    const cardW = (pageW - 28 - gap * (cards.length - 1)) / cards.length
    cards.forEach((c, i) => {
        const x = 14 + i * (cardW + gap)
        doc.setFillColor(250, 251, 253)
        doc.setDrawColor(...BRAND.line)
        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "FD")
        doc.setFillColor(...c.color)
        doc.roundedRect(x, cardY, 1.6, cardH, 0.8, 0.8, "F")
        doc.setTextColor(...c.color)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(15)
        doc.text(String(c.value), x + 6, cardY + 8)
        doc.setTextColor(...BRAND.sub)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.5)
        doc.text(c.label.toUpperCase(), x + 6, cardY + 13)
    })

    // ── Tabla ────────────────────────────────────────────────────────────────
    autoTable(doc, {
        startY: cardY + cardH + 6,
        head: [["#", "Empleado", "Puesto actual", "Promoción a", "Departamento", "Temporalidad", "Cursos", "Evaluación", "Examen", "Estado"]],
        body: rows.map((r) => [
            r.numero,
            r.nombre,
            r.puesto,
            r.promocionA,
            r.departamento,
            r.temporalidad,
            r.cursos,
            r.evaluacion,
            r.examen,
            STATUS_LABEL[r.estado],
        ]),
        theme: "grid",
        headStyles: {
            fillColor: BRAND.deep,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            halign: "left",
            cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
        },
        styles: {
            fontSize: 7.5,
            cellPadding: 2,
            textColor: BRAND.ink,
            lineColor: BRAND.line,
            lineWidth: 0.1,
            overflow: "linebreak",
            valign: "middle",
        },
        alternateRowStyles: { fillColor: BRAND.zebra },
        margin: { left: 14, right: 14 },
        columnStyles: {
            0: { cellWidth: 12, halign: "center" },
            1: { cellWidth: 40, fontStyle: "bold" },
            2: { cellWidth: 32 },
            3: { cellWidth: 30 },
            4: { cellWidth: 28 },
            5: { cellWidth: 30 },
            6: { cellWidth: 31 },
            7: { cellWidth: 23, halign: "center" },
            8: { cellWidth: 20, halign: "center" },
            9: { cellWidth: 21, halign: "center", fontStyle: "bold" },
        },
        didParseCell: (data) => {
            if (data.section !== "body") return
            const r = rows[data.row.index]
            const col = data.column.index
            if (col === 5 && !r.cumpleTemp) data.cell.styles.textColor = BRAND.bad
            if (col === 6 && !r.cumpleCursos) data.cell.styles.textColor = BRAND.bad
            if (col === 7 && !r.cumpleEval) data.cell.styles.textColor = BRAND.bad
            if (col === 8 && !r.cumpleExamen) data.cell.styles.textColor = BRAND.bad
            if (col === 9) {
                const rgb = statusRGB(r.estado)
                data.cell.styles.textColor = rgb
            }
        },
        didDrawPage: () => {
            const page = doc.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(...BRAND.sub)
            doc.text(`Página ${page}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" })
        },
    })

    addReportFooter(doc)
    doc.save(`Reporte_Promociones_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ════════════════════════════════════════════════════════════════════════════
//  Excel
// ════════════════════════════════════════════════════════════════════════════
export async function exportPromocionesExcel(empleados: EmpleadoPromocion[], meta?: ExportMeta) {
    const ExcelJS = await import("exceljs")
    // @ts-ignore - file-saver no trae tipos en este proyecto
    const { saveAs } = await import("file-saver")

    const rows = buildRows(empleados)
    const kpis = computeKpis(empleados)

    const wb = new ExcelJS.Workbook()
    wb.creator = "Viñoplastic · Planta Querétaro"
    wb.created = new Date()
    const ws = wb.addWorksheet("Promociones", {
        views: [{ state: "frozen", ySplit: 8 }],
        pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    })

    const COLS = 10
    const lastCol = String.fromCharCode(64 + COLS) // "J"

    // ── Título ────────────────────────────────────────────────────────────────
    ws.mergeCells(`A1:${lastCol}1`)
    const t = ws.getCell("A1")
    t.value = "Reporte de Promociones"
    t.font = { name: "Calibri", size: 18, bold: true, color: { argb: HEX.headerText } }
    t.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
    t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEX.deep } }
    ws.getRow(1).height = 30

    ws.mergeCells(`A2:${lastCol}2`)
    const s = ws.getCell("A2")
    s.value = `Viñoplastic · Planta Querétaro    —    Generado: ${fechaLarga()}    —    Registros: ${rows.length}`
    s.font = { name: "Calibri", size: 10, color: { argb: "FFD2DEF5" } }
    s.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
    s.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEX.accent } }
    ws.getRow(2).height = 18

    ws.mergeCells(`A3:${lastCol}3`)
    const f = ws.getCell("A3")
    f.value = `Filtros: ${filtrosTexto(meta)}`
    f.font = { name: "Calibri", size: 9, italic: true, color: { argb: HEX.sub } }
    f.alignment = { vertical: "middle", horizontal: "left", indent: 1 }

    // ── KPIs (fila 5) ───────────────────────────────────────────────────────────
    const kpiDefs: Array<[string, number, string, string]> = [
        ["Aptos", kpis.aptos, HEX.okFill, HEX.okText],
        ["No Aptos", kpis.noAptos, HEX.badFill, HEX.badText],
        ["Pendientes", kpis.pendientes, HEX.warnFill, HEX.warnText],
        ["En Revisión", kpis.revision, HEX.neutralFill, HEX.neutralText],
        ["Habilitados", kpis.habilitados, "FFEAF1FB", HEX.accent],
    ]
    // Cada KPI ocupa 2 columnas (label+valor), distribuidos en A5:J6
    kpiDefs.forEach((k, i) => {
        const c1 = String.fromCharCode(65 + i * 2)
        const c2 = String.fromCharCode(66 + i * 2)
        ws.mergeCells(`${c1}5:${c2}5`)
        ws.mergeCells(`${c1}6:${c2}6`)
        const valCell = ws.getCell(`${c1}5`)
        valCell.value = k[1]
        valCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: k[3] } }
        valCell.alignment = { vertical: "middle", horizontal: "center" }
        valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k[2] } }
        const labCell = ws.getCell(`${c1}6`)
        labCell.value = k[0].toUpperCase()
        labCell.font = { name: "Calibri", size: 8, bold: true, color: { argb: k[3] } }
        labCell.alignment = { vertical: "middle", horizontal: "center" }
        labCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k[2] } }
    })
    ws.getRow(5).height = 24
    ws.getRow(6).height = 14

    // ── Encabezado de tabla (fila 8) ──────────────────────────────────────────
    const headers = ["#", "Empleado", "Puesto actual", "Promoción a", "Departamento", "Temporalidad", "Cursos", "Evaluación", "Examen", "Estado"]
    const headerRow = ws.getRow(8)
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = h
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: HEX.headerText } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEX.deep } }
        cell.alignment = { vertical: "middle", horizontal: i === 0 ? "center" : "left", indent: i === 0 ? 0 : 1 }
        cell.border = {
            bottom: { style: "thin", color: { argb: HEX.accent } },
        }
    })
    headerRow.height = 22

    // ── Filas de datos ──────────────────────────────────────────────────────────
    const border = {
        bottom: { style: "thin" as const, color: { argb: HEX.border } },
    }
    rows.forEach((r, idx) => {
        const row = ws.getRow(9 + idx)
        const values = [
            r.numero,
            r.nombre,
            r.puesto,
            r.promocionA,
            r.departamento,
            r.temporalidad,
            r.cursos,
            r.evaluacion,
            r.examen,
            STATUS_LABEL[r.estado],
        ]
        values.forEach((v, c) => {
            const cell = row.getCell(c + 1)
            cell.value = v
            cell.font = { name: "Calibri", size: 10, color: { argb: HEX.title } }
            cell.alignment = {
                vertical: "middle",
                horizontal: c === 0 || c >= 7 ? "center" : "left",
                indent: c === 0 || c >= 7 ? 0 : 1,
                wrapText: c === 1 || c === 2,
            }
            cell.border = border
            if (idx % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEX.zebra } }
        })
        row.getCell(2).font = { name: "Calibri", size: 10, bold: true, color: { argb: HEX.title } }

        // Texto rojo en criterios no cumplidos
        const flag = (col: number, ok: boolean) => {
            if (!ok) row.getCell(col).font = { name: "Calibri", size: 10, bold: true, color: { argb: HEX.badText } }
        }
        flag(6, r.cumpleTemp)
        flag(7, r.cumpleCursos)
        flag(8, r.cumpleEval)
        flag(9, r.cumpleExamen)

        // Estado con relleno y texto de color (badge)
        const estadoCell = row.getCell(10)
        const map: Record<AptitudStatus, [string, string]> = {
            apto: [HEX.okFill, HEX.okText],
            no_apto: [HEX.badFill, HEX.badText],
            pendiente: [HEX.warnFill, HEX.warnText],
            en_revision: [HEX.neutralFill, HEX.neutralText],
        }
        const [fill, text] = map[r.estado]
        estadoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } }
        estadoCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: text } }
        row.height = 18
    })

    // ── Anchos + autofiltro ───────────────────────────────────────────────────
    const widths = [6, 30, 26, 22, 24, 26, 24, 16, 14, 14]
    widths.forEach((w, i) => {
        ws.getColumn(i + 1).width = w
    })
    ws.autoFilter = { from: { row: 8, column: 1 }, to: { row: 8, column: COLS } }

    const buffer = await wb.xlsx.writeBuffer()
    saveAs(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `Reporte_Promociones_${new Date().toISOString().slice(0, 10)}.xlsx`,
    )
}
