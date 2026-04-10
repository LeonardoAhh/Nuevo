import { DEFAULT_STYLE, uid } from "./types"
import type { FlayerTemplate, FlayerElement } from "./types"

// ─── Helper to create elements with defaults ──────────────────────────────────

function el(
  overrides: Partial<FlayerElement> & Pick<FlayerElement, "type" | "x" | "y" | "width" | "height">,
): FlayerElement {
  return {
    id: uid(),
    content: "",
    zIndex: 1,
    style: { ...DEFAULT_STYLE },
    ...overrides,
  }
}

function shape(
  shapeType: FlayerElement["shapeType"],
  x: number, y: number, w: number, h: number,
  style: Partial<typeof DEFAULT_STYLE> = {},
  z = 1,
): FlayerElement {
  return el({ type: "shape", shapeType, x, y, width: w, height: h, zIndex: z, style: { ...DEFAULT_STYLE, ...style } })
}

function text(
  content: string,
  x: number, y: number, w: number, h: number,
  style: Partial<typeof DEFAULT_STYLE> = {},
  z = 3,
): FlayerElement {
  return el({ type: "text", content, x, y, width: w, height: h, zIndex: z, style: { ...DEFAULT_STYLE, ...style } })
}

function icon(
  iconName: string,
  x: number, y: number, size: number,
  style: Partial<typeof DEFAULT_STYLE> = {},
  z = 4,
): FlayerElement {
  return el({ type: "icon", iconName, x, y, width: size, height: size, zIndex: z, style: { ...DEFAULT_STYLE, color: "#ffffff", ...style } })
}

// ─── Color palette shortcuts ──────────────────────────────────────────────────

const NAVY = "#0f172a"
const SLATE = "#1e293b"
const GOLD = "#c9a96e"
const BLUE = "#3b82f6"
const WHITE = "#ffffff"
const LIGHT_GRAY = "#f1f5f9"
const DARK_GRAY = "#374151"
const MUTED = "#94a3b8"
const CREAM = "#faf7f2"
const GREEN = "#059669"
const RED = "#dc2626"
const AMBER = "#f59e0b"
const PURPLE = "#7c3aed"

// ─── 1. Convocatoria Oficial — Premium ────────────────────────────────────────

const convocatoriaOficial: FlayerTemplate = {
  name: "Convocatoria Oficial",
  preview: "📜",
  bg: CREAM,
  elements: [
    // Decorative shape: large navy circle top-right (overflow)
    shape("circle", 640, -60, 240, 240, { backgroundColor: NAVY, opacity: 0.12 }, 1),
    // Decorative shape: small gold circle top-right overlay
    shape("circle", 700, 10, 80, 80, { backgroundColor: GOLD, opacity: 0.25 }, 1),
    // Top accent line
    shape("rectangle", 40, 20, 60, 4, { gradient: `linear-gradient(90deg, ${GOLD}, ${NAVY})` }, 2),
    // Badge
    text("CONVOCATORIA OFICIAL", 40, 36, 240, 28, {
      fontSize: 10, fontWeight: "bold", color: GOLD, letterSpacing: 4,
      backgroundColor: NAVY, borderRadius: 14, textAlign: "center", lineHeight: 2.4,
    }, 5),
    // Title
    text("Curso", 40, 80, 580, 55, {
      fontSize: 44, fontWeight: "bold", color: NAVY,
      fontFamily: "'Playfair Display', serif",
    }, 4),
    // Course name (italic gold)
    text("Sistema de Gestión\nIntegral", 40, 132, 580, 75, {
      fontSize: 38, fontWeight: "bold", fontStyle: "italic", color: GOLD,
      fontFamily: "'Playfair Display', serif", lineHeight: 1.15,
    }, 4),
    // Program subtitle
    text("PROGRAMA DE CAPACITACIÓN INTERNA  ·  2026", 40, 216, 500, 20, {
      fontSize: 10, color: "#6b7280", letterSpacing: 3, textTransform: "uppercase",
    }, 3),
    // Gold divider bar
    shape("rectangle", 40, 244, 120, 4, { gradient: `linear-gradient(90deg, ${GOLD}, transparent)`, borderRadius: 2 }, 2),
    // Description
    text("Se convoca a todo el personal a participar en el Curso de Sistema de Gestión Integral. Favor de identificar el turno y fecha correspondiente a su jornada de trabajo.", 50, 262, 710, 65, {
      fontSize: 13, color: "#4b5563", lineHeight: 1.7, fontStyle: "italic",
    }, 3),
    // Section header with icon
    icon("calendar", 40, 342, 18, { color: GOLD }, 4),
    text("FECHAS Y HORARIOS", 64, 342, 240, 20, {
      fontSize: 10, fontWeight: "bold", color: MUTED, letterSpacing: 3,
    }, 3),
    // Horizontal rule
    shape("line", 40, 368, 736, 1, { backgroundColor: "#e5e7eb" }, 2),
    // Turn 1 card
    shape("rectangle", 420, 385, 350, 150, { backgroundColor: WHITE, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }, 2),
    text("1ER TURNO", 430, 390, 120, 24, {
      fontSize: 10, fontWeight: "bold", color: WHITE, backgroundColor: NAVY,
      borderRadius: 12, textAlign: "center", lineHeight: 2.2,
    }, 5),
    icon("clock", 440, 425, 16, { color: NAVY }, 5),
    text("📅  Lunes 23 de Febrero\n     2026  ·  Sesión vespertina\n\n14:00 P.M  —  15:00 P.M     60 min", 460, 422, 300, 100, {
      fontSize: 14, color: NAVY, lineHeight: 1.7,
    }, 4),
    // Turn 3 card
    shape("rectangle", 45, 385, 350, 150, { backgroundColor: WHITE, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }, 2),
    text("3ER TURNO", 55, 390, 120, 24, {
      fontSize: 10, fontWeight: "bold", color: WHITE,
      gradient: `linear-gradient(135deg, ${GOLD}, #8b6914)`,
      borderRadius: 12, textAlign: "center", lineHeight: 2.2,
    }, 5),
    text("📅  Lunes 23 de Febrero\n     2026  ·  Sesión matutina\n\n6:00 A.M  —  7:00 A.M       60 min", 85, 422, 300, 100, {
      fontSize: 14, color: NAVY, lineHeight: 1.7,
    }, 4),
    // Turn 4 card
    shape("rectangle", 45, 555, 350, 150, { backgroundColor: WHITE, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }, 2),
    text("4TO TURNO", 55, 560, 120, 24, {
      fontSize: 10, fontWeight: "bold", color: WHITE,
      gradient: `linear-gradient(135deg, ${GOLD}, #8b6914)`,
      borderRadius: 12, textAlign: "center", lineHeight: 2.2,
    }, 5),
    text("📅  Lunes 23 de Febrero\n     2026  ·  Sesión vespertina\n\n13:00 P.M  —  14:00 P.M    60 min", 85, 592, 300, 100, {
      fontSize: 14, color: NAVY, lineHeight: 1.7,
    }, 4),
    // Turn 2 card
    shape("rectangle", 420, 555, 350, 150, { backgroundColor: WHITE, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }, 2),
    text("2DO TURNO", 430, 560, 120, 24, {
      fontSize: 10, fontWeight: "bold", color: WHITE, backgroundColor: NAVY,
      borderRadius: 12, textAlign: "center", lineHeight: 2.2,
    }, 5),
    text("📅  Miércoles 25 de Febrero\n     2026  ·  Sesión vespertina\n\n13:00 P.M  —  14:00 P.M    60 min", 460, 592, 300, 100, {
      fontSize: 14, color: NAVY, lineHeight: 1.7,
    }, 4),
    // Instructor badge
    icon("user", 292, 730, 16, { color: MUTED }, 4),
    text("Instructor asignado por el depto. de Capacitación", 314, 730, 360, 18, {
      fontSize: 11, color: MUTED, fontStyle: "italic",
    }, 3),
    // Footer
    shape("rectangle", 0, 780, 816, 90, { gradient: `linear-gradient(135deg, ${NAVY}, ${SLATE})` }, 2),
    icon("alert-triangle", 40, 800, 18, { color: AMBER }, 5),
    text("Asistencia obligatoria. Cada colaborador deberá presentarse en su turno correspondiente.\nEn caso de impedimento, notificar a su supervisor con anticipación.", 66, 798, 710, 50, {
      fontSize: 11, color: "#d1d5db", lineHeight: 1.7, textAlign: "center",
    }, 4),
    // Footer brand
    text("VIÑOPLASTIC  ·  Planta Querétaro  ·  Depto. Capacitación", 200, 848, 420, 16, {
      fontSize: 9, color: GOLD, letterSpacing: 2, textAlign: "center", opacity: 0.7,
    }, 4),
  ],
}

// ─── 2. Capacitación Programada — Premium ─────────────────────────────────────

const capacitacionProgramada: FlayerTemplate = {
  name: "Capacitación Programada",
  preview: "🎓",
  bg: WHITE,
  elements: [
    // Dark header with gradient
    shape("rectangle", 0, 0, 816, 270, { gradient: `linear-gradient(135deg, ${NAVY}, #1e3a5f)` }, 1),
    // Decorative circles
    shape("circle", -40, -40, 160, 160, { backgroundColor: BLUE, opacity: 0.08 }, 1),
    shape("circle", 700, 180, 200, 200, { backgroundColor: GOLD, opacity: 0.06 }, 1),
    // Badge
    shape("rectangle", 258, 18, 300, 34, { gradient: `linear-gradient(135deg, ${AMBER}, #d97706)`, borderRadius: 17 }, 3),
    icon("graduation-cap", 274, 22, 18, { color: NAVY }, 5),
    text("CAPACITACIÓN PROGRAMADA", 296, 18, 250, 34, {
      fontSize: 12, fontWeight: "bold", color: NAVY, textAlign: "center",
      lineHeight: 2.6,
    }, 5),
    // Course title
    text("DIAGRAMA DE TORTUGA", 40, 68, 736, 55, {
      fontSize: 38, fontWeight: "bold", color: WHITE, textAlign: "center",
      fontFamily: "Montserrat, sans-serif", letterSpacing: 2,
    }, 4),
    // Subtitle
    text("Análisis de Procesos & Mejora Continua", 40, 120, 736, 24, {
      fontSize: 15, color: MUTED, textAlign: "center", fontStyle: "italic",
    }, 4),
    // Instructor section
    shape("rectangle", 280, 158, 256, 44, { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 22 }, 2),
    icon("user", 296, 168, 16, { color: GOLD }, 5),
    text("ING. NOMBRE DEL INSTRUCTOR", 318, 160, 200, 40, {
      fontSize: 13, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 2.6,
    }, 4),
    // Info pills row
    shape("rectangle", 100, 218, 180, 42, { backgroundColor: "#334155", borderRadius: 10 }, 3),
    icon("calendar", 112, 228, 16, { color: BLUE }, 5),
    text("19 FEBRERO 2026", 134, 218, 140, 42, {
      fontSize: 13, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 2.8,
    }, 4),
    shape("rectangle", 310, 218, 196, 42, { backgroundColor: GREEN, borderRadius: 10 }, 3),
    icon("clock", 322, 228, 16, { color: WHITE }, 5),
    text("9:00 - 10:00 HRS", 344, 218, 150, 42, {
      fontSize: 13, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 2.8,
    }, 4),
    shape("rectangle", 536, 218, 196, 42, { backgroundColor: PURPLE, borderRadius: 10 }, 3),
    icon("map-pin", 548, 228, 16, { color: WHITE }, 5),
    text("SALA CAPACITACIÓN 1", 566, 218, 160, 42, {
      fontSize: 12, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 3,
    }, 4),
    // Participants section
    icon("users", 40, 292, 20, { color: SLATE }, 4),
    text("Lista de Participantes", 66, 290, 350, 28, {
      fontSize: 18, fontWeight: "bold", color: SLATE,
    }, 4),
    // Table header
    shape("rectangle", 40, 330, 736, 32, { gradient: `linear-gradient(90deg, ${NAVY}, ${SLATE})`, borderRadius: 6 }, 3),
    text("ID         NOMBRE                              PUESTO                                TURNO        FECHA", 54, 330, 720, 32, {
      fontSize: 10, fontWeight: "bold", color: WHITE, letterSpacing: 0.5,
      fontFamily: "'Roboto', sans-serif", lineHeight: 2.8,
    }, 4),
    // Table rows
    text("1428     Corona Arce Liliana                   Jefe de Logística                    MIXTO    19/02/2026\n\n2010     García Arce Stephanie               Planeador de Producción           MIXTO    19/02/2026\n\n2476     Vargas Aguilar Karen                Aux. Adm. Taller de Moldes        MIXTO    19/02/2026\n\n3536     Liévano Hernández María           Asistente de Producción A          MIXTO    19/02/2026\n\n3537     Gutiérrez López Adriana            Asistente de Producción A          MIXTO    19/02/2026\n\n3853     León Torres María Vanessa        Analista de Seg. e Higiene          MIXTO    19/02/2026", 50, 370, 720, 340, {
      fontSize: 11, color: DARK_GRAY, lineHeight: 1.5,
      fontFamily: "'Roboto', sans-serif",
    }, 3),
    // Alternating row stripes
    shape("rectangle", 40, 395, 736, 26, { backgroundColor: LIGHT_GRAY, opacity: 0.4 }, 2),
    shape("rectangle", 40, 450, 736, 26, { backgroundColor: LIGHT_GRAY, opacity: 0.4 }, 2),
    shape("rectangle", 40, 505, 736, 26, { backgroundColor: LIGHT_GRAY, opacity: 0.4 }, 2),
    // Footer
    shape("rectangle", 0, 1010, 816, 46, { gradient: `linear-gradient(90deg, ${NAVY}, ${SLATE})` }, 2),
    icon("star", 340, 1022, 14, { color: GOLD }, 5),
    text("Departamento de Capacitación · Documento generado para control interno", 362, 1016, 430, 30, {
      fontSize: 10, color: MUTED, textAlign: "center", lineHeight: 2.5,
    }, 4),
  ],
}

// ─── 3. Auditoría de Proceso — Premium ────────────────────────────────────────

const auditoriaProceso: FlayerTemplate = {
  name: "Auditoría en Capas",
  preview: "📊",
  bg: WHITE,
  elements: [
    // Top bar accent
    shape("rectangle", 0, 0, 816, 6, { gradient: `linear-gradient(90deg, ${BLUE}, ${NAVY}, ${GOLD})` }, 5),
    // Logo text
    text("VIÑOPLASTIC", 40, 22, 180, 28, {
      fontSize: 17, fontWeight: "bold", color: NAVY,
      fontFamily: "Montserrat, sans-serif", letterSpacing: 2,
    }, 4),
    text("Planta Querétaro", 40, 48, 160, 16, {
      fontSize: 10, color: MUTED, letterSpacing: 1,
    }, 3),
    // Folio box
    shape("rectangle", 680, 18, 100, 48, { backgroundColor: LIGHT_GRAY, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid" }, 3),
    text("FOLIO\n4", 680, 22, 100, 40, {
      fontSize: 13, fontWeight: "bold", color: NAVY, textAlign: "center", lineHeight: 1.5,
    }, 4),
    // Header bar
    shape("rectangle", 40, 84, 736, 44, { gradient: `linear-gradient(90deg, #1e3a5f, ${NAVY})`, borderRadius: 8 }, 3),
    icon("clipboard", 56, 96, 18, { color: WHITE }, 5),
    text("AUDITORÍAS DE PROCESO EN CAPAS", 80, 84, 680, 44, {
      fontSize: 17, fontWeight: "bold", color: WHITE, lineHeight: 2.4,
    }, 4),
    // Date bar
    shape("rectangle", 40, 136, 736, 32, { gradient: `linear-gradient(135deg, ${BLUE}, #2563eb)`, borderRadius: 6 }, 3),
    icon("calendar", 54, 140, 16, { color: WHITE }, 5),
    text("lunes 19 de enero, 2026", 76, 136, 300, 32, {
      fontSize: 12, color: WHITE, lineHeight: 2.4,
    }, 4),
    // Time slot 1
    shape("rectangle", 40, 184, 170, 24, { backgroundColor: "#dbeafe", borderRadius: 4 }, 2),
    icon("clock", 46, 188, 14, { color: BLUE }, 4),
    text("11:00 - 12:00", 66, 184, 140, 24, {
      fontSize: 12, color: BLUE, fontWeight: "bold", lineHeight: 1.8,
    }, 3),
    // Column headers
    text("EMPLEADO", 40, 216, 400, 20, {
      fontSize: 10, fontWeight: "bold", color: "#1e3a5f", letterSpacing: 2,
    }, 3),
    text("DEPARTAMENTO", 540, 216, 200, 20, {
      fontSize: 10, fontWeight: "bold", color: "#1e3a5f", letterSpacing: 2,
    }, 3),
    shape("line", 40, 238, 736, 2, { backgroundColor: "#e5e7eb" }, 2),
    // Employee block 1
    text("GALLARDO DÍAZ CIUNELY YETZABEL                                               CALIDAD\nVARGAS AGUILLON ROSA MARÍA                                                       CALIDAD\nLIRA REYNOSO JOSHUA SHADDAY                                                      CALIDAD\nDÍAZ GUTIÉRREZ JOSÉ GUADALUPE                                                  PRODUCCIÓN\nLUCAS ESPINDOLA CRISTOBAL                                                            CALIDAD\nRODRÍGUEZ VEGA OCIEL ALEJANDRO                                               CALIDAD", 40, 248, 736, 180, {
      fontSize: 11, color: DARK_GRAY, lineHeight: 2,
      fontFamily: "'Roboto', sans-serif",
    }, 3),
    // Time slot 2
    shape("rectangle", 40, 446, 170, 24, { backgroundColor: "#dcfce7", borderRadius: 4 }, 2),
    icon("clock", 46, 450, 14, { color: GREEN }, 4),
    text("6:00 - 7:00", 66, 446, 140, 24, {
      fontSize: 12, color: GREEN, fontWeight: "bold", lineHeight: 1.8,
    }, 3),
    text("EMPLEADO", 40, 478, 400, 20, {
      fontSize: 10, fontWeight: "bold", color: "#1e3a5f", letterSpacing: 2,
    }, 3),
    text("DEPARTAMENTO", 540, 478, 200, 20, {
      fontSize: 10, fontWeight: "bold", color: "#1e3a5f", letterSpacing: 2,
    }, 3),
    shape("line", 40, 500, 736, 2, { backgroundColor: "#e5e7eb" }, 2),
    text("MARTÍNEZ COBOS OMAR                                                               PRODUCCIÓN\nOCHOA ORTUÑO JOSÉ MA.                                                                  PRODUCCIÓN\nSILVA CARMONA MARIAN ITZEL                                                          CALIDAD\nHERNÁNDEZ DE LA CRUZ GUADALUPE                                               CALIDAD\nVALLADARES MARTÍNEZ CRISTIAN                                                      CALIDAD\nSANTA CRUZ GALVEZ CHRISTIAN                                                        CALIDAD\nCARRILLO MADRIGAL HERMILO                                                           CALIDAD", 40, 510, 736, 220, {
      fontSize: 11, color: DARK_GRAY, lineHeight: 2,
      fontFamily: "'Roboto', sans-serif",
    }, 3),
    // Time slot 3
    shape("rectangle", 40, 748, 170, 24, { backgroundColor: "#fef3c7", borderRadius: 4 }, 2),
    icon("clock", 46, 752, 14, { color: AMBER }, 4),
    text("17:00 - 18:00", 66, 748, 140, 24, {
      fontSize: 12, color: "#92400e", fontWeight: "bold", lineHeight: 1.8,
    }, 3),
    text("EMPLEADO", 40, 780, 400, 20, {
      fontSize: 10, fontWeight: "bold", color: "#1e3a5f", letterSpacing: 2,
    }, 3),
    text("DEPARTAMENTO", 540, 780, 200, 20, {
      fontSize: 10, fontWeight: "bold", color: "#1e3a5f", letterSpacing: 2,
    }, 3),
    shape("line", 40, 802, 736, 2, { backgroundColor: "#e5e7eb" }, 2),
    text("URIAS SÁNCHEZ ARMANDO                                                             PRODUCCIÓN\nFLORES DOMINGUEZ CORAL ESTEFANIA                                              CALIDAD\nLÓPEZ CARRILLO JONATHAN EDUARDO                                              CALIDAD\nQUEZADA GUILLEN JULIO EVEREST                                                    CALIDAD\nVÁZQUEZ FLORES ERICK                                                                    PRODUCCIÓN\nZARRABAL DÍAZ JORGE JAVIER                                                          CALIDAD", 40, 812, 736, 180, {
      fontSize: 11, color: DARK_GRAY, lineHeight: 2,
      fontFamily: "'Roboto', sans-serif",
    }, 3),
  ],
}

// ─── 4. Diploma / Reconocimiento — Premium ────────────────────────────────────

const diploma: FlayerTemplate = {
  name: "Diploma",
  preview: "🏆",
  bg: "#fdfcfa",
  elements: [
    // Outer border frame
    shape("rectangle", 20, 20, 776, 1016, {
      borderWidth: 3, borderColor: GOLD, borderStyle: "solid",
      borderRadius: 0, backgroundColor: "transparent",
    }, 1),
    // Inner border frame
    shape("rectangle", 30, 30, 756, 996, {
      borderWidth: 1, borderColor: GOLD, borderStyle: "solid",
      borderRadius: 0, backgroundColor: "transparent", opacity: 0.5,
    }, 1),
    // Decorative corner circles
    shape("circle", 30, 30, 40, 40, { backgroundColor: GOLD, opacity: 0.15 }, 1),
    shape("circle", 746, 30, 40, 40, { backgroundColor: GOLD, opacity: 0.15 }, 1),
    shape("circle", 30, 986, 40, 40, { backgroundColor: GOLD, opacity: 0.15 }, 1),
    shape("circle", 746, 986, 40, 40, { backgroundColor: GOLD, opacity: 0.15 }, 1),
    // Top accent
    shape("rectangle", 308, 60, 200, 3, { gradient: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }, 2),
    // Award icon placeholder
    icon("award", 374, 80, 68, { color: GOLD }, 4),
    // Company name
    text("VIÑOPLASTIC", 200, 160, 416, 36, {
      fontSize: 16, fontWeight: "bold", color: NAVY, textAlign: "center",
      letterSpacing: 8, fontFamily: "Montserrat, sans-serif",
    }, 4),
    text("Planta Querétaro", 260, 192, 296, 22, {
      fontSize: 12, color: MUTED, textAlign: "center", letterSpacing: 3,
    }, 3),
    // Divider
    shape("rectangle", 258, 224, 300, 2, { gradient: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }, 2),
    // Main title
    text("RECONOCIMIENTO", 100, 250, 616, 50, {
      fontSize: 40, fontWeight: "bold", color: NAVY, textAlign: "center",
      fontFamily: "'Playfair Display', serif", letterSpacing: 6,
    }, 4),
    // "Se otorga a"
    text("Se otorga el presente reconocimiento a:", 160, 320, 496, 24, {
      fontSize: 14, color: MUTED, textAlign: "center", fontStyle: "italic",
    }, 3),
    // Name line
    shape("rectangle", 120, 400, 576, 2, { backgroundColor: NAVY, opacity: 0.3 }, 2),
    text("NOMBRE DEL COLABORADOR", 120, 364, 576, 38, {
      fontSize: 28, fontWeight: "bold", color: NAVY, textAlign: "center",
      fontFamily: "'Playfair Display', serif",
    }, 4),
    // Description
    text("Por haber completado satisfactoriamente el programa de capacitación en\nSistema de Gestión Integral, demostrando compromiso y dedicación\nen el desarrollo de competencias técnicas y profesionales.", 100, 430, 616, 80, {
      fontSize: 13, color: DARK_GRAY, textAlign: "center", lineHeight: 1.8,
    }, 3),
    // Divider
    shape("rectangle", 308, 530, 200, 2, { gradient: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }, 2),
    // Date
    text("Querétaro, Qro. a ___ de _________ de 2026", 200, 560, 416, 22, {
      fontSize: 13, color: DARK_GRAY, textAlign: "center",
    }, 3),
    // Signature lines
    shape("line", 100, 720, 240, 1, { backgroundColor: NAVY, opacity: 0.4 }, 2),
    text("Director de Planta", 130, 728, 180, 18, {
      fontSize: 11, color: MUTED, textAlign: "center",
    }, 3),
    shape("line", 476, 720, 240, 1, { backgroundColor: NAVY, opacity: 0.4 }, 2),
    text("Jefe de Capacitación", 504, 728, 180, 18, {
      fontSize: 11, color: MUTED, textAlign: "center",
    }, 3),
    // Bottom accent
    shape("rectangle", 308, 900, 200, 3, { gradient: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }, 2),
    // Gold shield
    icon("shield-check", 372, 920, 72, { color: GOLD, opacity: 0.3 }, 2),
  ],
}

// ─── 5. Aviso de Seguridad — Premium ──────────────────────────────────────────

const avisoSeguridad: FlayerTemplate = {
  name: "Aviso de Seguridad",
  preview: "⚠️",
  bg: WHITE,
  elements: [
    // Top warning accent
    shape("rectangle", 0, 0, 816, 8, { gradient: `linear-gradient(90deg, ${RED}, ${AMBER}, ${RED})` }, 5),
    // Decorative triangle left
    shape("triangle", -30, 140, 140, 140, { backgroundColor: AMBER, opacity: 0.06 }, 1),
    // Header bg
    shape("rectangle", 0, 8, 816, 180, { gradient: `linear-gradient(135deg, #7f1d1d, ${RED})` }, 2),
    // Alert icon
    icon("alert-triangle", 348, 28, 120, { color: AMBER }, 5),
    // Title
    text("AVISO DE\nSEGURIDAD", 150, 148, 516, 60, {
      fontSize: 24, fontWeight: "bold", color: WHITE, textAlign: "center",
      fontFamily: "Montserrat, sans-serif", letterSpacing: 8, lineHeight: 1.2,
      textShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }, 4),
    // Badge
    shape("rectangle", 290, 206, 236, 28, { backgroundColor: AMBER, borderRadius: 14 }, 4),
    text("LECTURA OBLIGATORIA", 290, 206, 236, 28, {
      fontSize: 11, fontWeight: "bold", color: "#7f1d1d", textAlign: "center",
      lineHeight: 2.2, letterSpacing: 2,
    }, 5),
    // Main content area
    shape("rectangle", 40, 256, 736, 380, {
      backgroundColor: "#fef2f2", borderRadius: 16,
      borderWidth: 2, borderColor: "#fecaca", borderStyle: "solid",
    }, 2),
    // Hazard type
    text("TIPO DE RIESGO:", 70, 274, 200, 22, {
      fontSize: 11, fontWeight: "bold", color: RED, letterSpacing: 2,
    }, 4),
    text("Riesgo Eléctrico / Bloqueo y Etiquetado (LOTO)", 70, 296, 680, 28, {
      fontSize: 18, fontWeight: "bold", color: "#7f1d1d",
    }, 4),
    // Divider
    shape("line", 70, 332, 680, 2, { backgroundColor: "#fecaca" }, 3),
    // Description
    text("Se notifica a todo el personal de planta que a partir de esta fecha\nse implementan nuevos protocolos de seguridad para el área de\nmantenimiento eléctrico. Todo colaborador que ingrese a las\náreas señalizadas deberá cumplir con los requisitos descritos.", 70, 346, 680, 90, {
      fontSize: 13, color: DARK_GRAY, lineHeight: 1.8,
    }, 3),
    // Requirements cards
    icon("shield", 80, 460, 28, { color: RED }, 5),
    shape("rectangle", 70, 452, 330, 72, { backgroundColor: WHITE, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }, 3),
    text("Equipo de Protección\nPersonal obligatorio en\ntodas las áreas marcadas", 114, 458, 270, 60, {
      fontSize: 12, color: DARK_GRAY, lineHeight: 1.6,
    }, 4),
    icon("eye", 430, 460, 28, { color: RED }, 5),
    shape("rectangle", 420, 452, 330, 72, { backgroundColor: WHITE, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }, 3),
    text("Supervisión constante\nen procedimientos de\nalto riesgo", 464, 458, 270, 60, {
      fontSize: 12, color: DARK_GRAY, lineHeight: 1.6,
    }, 4),
    // Penalties section
    icon("x-circle", 80, 546, 28, { color: "#7f1d1d" }, 5),
    shape("rectangle", 70, 540, 330, 72, { backgroundColor: WHITE, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }, 3),
    text("Incumplimiento\nresultará en sanción\nadministrativa", 114, 546, 270, 60, {
      fontSize: 12, color: DARK_GRAY, lineHeight: 1.6,
    }, 4),
    icon("check-circle", 430, 546, 28, { color: GREEN }, 5),
    shape("rectangle", 420, 540, 330, 72, { backgroundColor: WHITE, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }, 3),
    text("Capacitación LOTO\ndisponible con el\nDepto. de Capacitación", 464, 546, 270, 60, {
      fontSize: 12, color: DARK_GRAY, lineHeight: 1.6,
    }, 4),
    // Emergency contact
    shape("rectangle", 40, 660, 736, 90, {
      gradient: `linear-gradient(135deg, ${NAVY}, ${SLATE})`, borderRadius: 12,
    }, 3),
    icon("phone", 70, 680, 24, { color: AMBER }, 5),
    text("EN CASO DE EMERGENCIA", 106, 676, 300, 18, {
      fontSize: 11, fontWeight: "bold", color: AMBER, letterSpacing: 2,
    }, 4),
    text("Contactar a Seguridad e Higiene: Ext. 1234\nBrigada de emergencia: Ext. 5678\nServicios médicos internos: Ext. 9012", 106, 698, 600, 44, {
      fontSize: 12, color: "#d1d5db", lineHeight: 1.5,
    }, 4),
    // Footer
    shape("rectangle", 0, 1010, 816, 46, { gradient: `linear-gradient(90deg, ${RED}, #7f1d1d)` }, 3),
    text("DEPTO. SEGURIDAD E HIGIENE  ·  VIÑOPLASTIC PLANTA QUERÉTARO", 140, 1018, 540, 30, {
      fontSize: 10, fontWeight: "bold", color: WHITE, textAlign: "center",
      letterSpacing: 2, lineHeight: 2.6,
    }, 4),
  ],
}

// ─── 6. Memorándum Interno — Premium ──────────────────────────────────────────

const memorandum: FlayerTemplate = {
  name: "Memorándum",
  preview: "📝",
  bg: WHITE,
  elements: [
    // Accent top bar
    shape("rectangle", 0, 0, 816, 6, { gradient: `linear-gradient(90deg, ${NAVY}, ${GOLD})` }, 5),
    // Header section
    shape("rectangle", 0, 6, 816, 100, { backgroundColor: LIGHT_GRAY }, 1),
    // Company name
    text("VIÑOPLASTIC", 60, 24, 200, 32, {
      fontSize: 22, fontWeight: "bold", color: NAVY,
      fontFamily: "Montserrat, sans-serif", letterSpacing: 3,
    }, 4),
    text("Planta Querétaro", 60, 54, 160, 18, {
      fontSize: 11, color: MUTED, letterSpacing: 1,
    }, 3),
    // Memo badge
    shape("rectangle", 560, 30, 210, 44, { gradient: `linear-gradient(135deg, ${NAVY}, ${SLATE})`, borderRadius: 8 }, 3),
    icon("file-text", 576, 40, 18, { color: GOLD }, 5),
    text("MEMORÁNDUM\nINTERNO", 600, 32, 160, 40, {
      fontSize: 12, fontWeight: "bold", color: WHITE, textAlign: "center",
      lineHeight: 1.5, letterSpacing: 2,
    }, 4),
    // Gold divider
    shape("rectangle", 60, 118, 696, 3, { gradient: `linear-gradient(90deg, ${GOLD}, transparent)` }, 3),
    // Reference fields
    text("DE:", 60, 140, 40, 22, {
      fontSize: 12, fontWeight: "bold", color: NAVY,
    }, 3),
    text("Departamento de Capacitación", 110, 140, 400, 22, {
      fontSize: 12, color: DARK_GRAY,
    }, 3),
    text("PARA:", 60, 168, 50, 22, {
      fontSize: 12, fontWeight: "bold", color: NAVY,
    }, 3),
    text("Jefes de Departamento / Supervisores", 120, 168, 400, 22, {
      fontSize: 12, color: DARK_GRAY,
    }, 3),
    text("FECHA:", 60, 196, 60, 22, {
      fontSize: 12, fontWeight: "bold", color: NAVY,
    }, 3),
    text("19 de febrero de 2026", 128, 196, 300, 22, {
      fontSize: 12, color: DARK_GRAY,
    }, 3),
    text("REF:", 500, 196, 40, 22, {
      fontSize: 12, fontWeight: "bold", color: NAVY,
    }, 3),
    text("MEMO-CAP-2026-001", 545, 196, 200, 22, {
      fontSize: 12, color: DARK_GRAY, fontFamily: "'Roboto', sans-serif",
    }, 3),
    // Subject line
    shape("line", 60, 230, 696, 2, { backgroundColor: "#e5e7eb" }, 2),
    text("ASUNTO:", 60, 242, 70, 22, {
      fontSize: 12, fontWeight: "bold", color: NAVY,
    }, 3),
    text("Programa de Capacitación — Primer Trimestre 2026", 136, 242, 500, 22, {
      fontSize: 12, fontWeight: "bold", color: DARK_GRAY,
    }, 3),
    shape("line", 60, 272, 696, 2, { backgroundColor: "#e5e7eb" }, 2),
    // Body text
    text("Por medio del presente, se hace de su conocimiento que el Departamento de Capacitación ha programado las siguientes actividades formativas para el primer trimestre del año en curso.\n\nSe solicita su apoyo para garantizar la asistencia del personal a su cargo en las fechas y horarios establecidos. La participación es obligatoria y se tomará lista de asistencia.\n\nLos temas programados son:\n\n• Sistema de Gestión Integral (SGI)\n• Auditorías de Proceso en Capas (LPA)\n• Seguridad Industrial y EPP\n• Diagrama de Tortuga — Análisis de Procesos\n\nSe adjunta el calendario completo de actividades. Para cualquier ajuste, favor de comunicarse al Depto. de Capacitación, Ext. 1234.\n\nAgradecemos su colaboración.", 60, 290, 696, 420, {
      fontSize: 13, color: DARK_GRAY, lineHeight: 1.8,
    }, 3),
    // Signature section
    shape("line", 60, 770, 250, 1, { backgroundColor: NAVY, opacity: 0.3 }, 2),
    text("Nombre del emisor\nJefe de Capacitación", 60, 778, 250, 36, {
      fontSize: 12, color: MUTED, lineHeight: 1.5,
    }, 3),
    // CC section
    shape("line", 60, 840, 696, 1, { backgroundColor: "#e5e7eb" }, 2),
    text("C.c.p.", 60, 852, 50, 18, {
      fontSize: 10, fontWeight: "bold", color: MUTED,
    }, 3),
    text("Dirección de Planta\nGerencia de Recursos Humanos\nArchivo", 120, 852, 400, 50, {
      fontSize: 10, color: MUTED, lineHeight: 1.6,
    }, 3),
    // Footer
    shape("rectangle", 0, 1020, 816, 36, { backgroundColor: LIGHT_GRAY }, 2),
    text("VIÑOPLASTIC  ·  Av. Industrial No. 123, Parque Industrial  ·  Querétaro, Qro.  ·  Tel. (442) 123-4567", 100, 1026, 616, 24, {
      fontSize: 9, color: MUTED, textAlign: "center", lineHeight: 2.2,
    }, 3),
  ],
}

// ─── 7. Infografía — Premium ──────────────────────────────────────────────────

const infografia: FlayerTemplate = {
  name: "Infografía",
  preview: "📈",
  bg: LIGHT_GRAY,
  elements: [
    // Header bg
    shape("rectangle", 0, 0, 816, 220, { gradient: `linear-gradient(135deg, ${NAVY}, #1e3a5f)` }, 1),
    // Decorative shapes
    shape("circle", 680, -30, 180, 180, { backgroundColor: BLUE, opacity: 0.1 }, 1),
    shape("circle", -40, 160, 120, 120, { backgroundColor: GOLD, opacity: 0.08 }, 1),
    // Title
    text("CAPACITACIÓN\n2026", 60, 40, 500, 90, {
      fontSize: 42, fontWeight: "bold", color: WHITE,
      fontFamily: "Montserrat, sans-serif", lineHeight: 1.1, letterSpacing: 2,
    }, 4),
    // Subtitle
    text("Resumen ejecutivo del programa de formación continua", 60, 140, 500, 22, {
      fontSize: 13, color: MUTED, fontStyle: "italic",
    }, 3),
    // Year badge
    shape("rectangle", 62, 174, 80, 28, { backgroundColor: GOLD, borderRadius: 14 }, 3),
    text("Q1 2026", 62, 174, 80, 28, {
      fontSize: 11, fontWeight: "bold", color: NAVY, textAlign: "center", lineHeight: 2.2,
    }, 4),
    // Stats row
    shape("rectangle", 40, 240, 230, 130, { backgroundColor: WHITE, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }, 2),
    icon("users", 60, 260, 32, { color: BLUE }, 5),
    text("248", 60, 300, 120, 40, {
      fontSize: 36, fontWeight: "bold", color: NAVY,
      fontFamily: "Montserrat, sans-serif",
    }, 4),
    text("Colaboradores\ncapacitados", 60, 338, 180, 30, {
      fontSize: 11, color: MUTED, lineHeight: 1.3,
    }, 3),
    shape("rectangle", 293, 240, 230, 130, { backgroundColor: WHITE, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }, 2),
    icon("book-open", 313, 260, 32, { color: GREEN }, 5),
    text("12", 313, 300, 80, 40, {
      fontSize: 36, fontWeight: "bold", color: NAVY,
      fontFamily: "Montserrat, sans-serif",
    }, 4),
    text("Cursos\nimpartidos", 313, 338, 180, 30, {
      fontSize: 11, color: MUTED, lineHeight: 1.3,
    }, 3),
    shape("rectangle", 546, 240, 230, 130, { backgroundColor: WHITE, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }, 2),
    icon("clock", 566, 260, 32, { color: PURPLE }, 5),
    text("960", 566, 300, 120, 40, {
      fontSize: 36, fontWeight: "bold", color: NAVY,
      fontFamily: "Montserrat, sans-serif",
    }, 4),
    text("Horas de\ncapacitación", 566, 338, 180, 30, {
      fontSize: 11, color: MUTED, lineHeight: 1.3,
    }, 3),
    // Section: Programs
    text("PROGRAMAS PRINCIPALES", 40, 396, 300, 20, {
      fontSize: 11, fontWeight: "bold", color: MUTED, letterSpacing: 3,
    }, 3),
    shape("line", 40, 420, 736, 2, { backgroundColor: "#e2e8f0" }, 2),
    // Program cards
    shape("rectangle", 40, 436, 370, 80, { backgroundColor: WHITE, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid" }, 2),
    shape("rectangle", 40, 436, 6, 80, { backgroundColor: BLUE, borderRadius: 3 }, 3),
    icon("shield", 60, 452, 24, { color: BLUE }, 4),
    text("Seguridad Industrial", 92, 448, 290, 20, {
      fontSize: 14, fontWeight: "bold", color: NAVY,
    }, 3),
    text("4 sesiones · 120 asistentes", 92, 472, 290, 18, {
      fontSize: 11, color: MUTED,
    }, 3),
    shape("rectangle", 426, 436, 350, 80, { backgroundColor: WHITE, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid" }, 2),
    shape("rectangle", 426, 436, 6, 80, { backgroundColor: GREEN, borderRadius: 3 }, 3),
    icon("clipboard", 446, 452, 24, { color: GREEN }, 4),
    text("Auditorías LPA", 478, 448, 280, 20, {
      fontSize: 14, fontWeight: "bold", color: NAVY,
    }, 3),
    text("3 sesiones · 68 asistentes", 478, 472, 280, 18, {
      fontSize: 11, color: MUTED,
    }, 3),
    shape("rectangle", 40, 530, 370, 80, { backgroundColor: WHITE, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid" }, 2),
    shape("rectangle", 40, 530, 6, 80, { backgroundColor: AMBER, borderRadius: 3 }, 3),
    icon("wrench", 60, 546, 24, { color: AMBER }, 4),
    text("Diagrama de Tortuga", 92, 542, 290, 20, {
      fontSize: 14, fontWeight: "bold", color: NAVY,
    }, 3),
    text("2 sesiones · 36 asistentes", 92, 566, 290, 18, {
      fontSize: 11, color: MUTED,
    }, 3),
    shape("rectangle", 426, 530, 350, 80, { backgroundColor: WHITE, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid" }, 2),
    shape("rectangle", 426, 530, 6, 80, { backgroundColor: PURPLE, borderRadius: 3 }, 3),
    icon("graduation-cap", 446, 546, 24, { color: PURPLE }, 4),
    text("SGI — Gestión Integral", 478, 542, 280, 20, {
      fontSize: 14, fontWeight: "bold", color: NAVY,
    }, 3),
    text("3 sesiones · 24 asistentes", 478, 566, 280, 18, {
      fontSize: 11, color: MUTED,
    }, 3),
    // Footer section
    shape("rectangle", 0, 980, 816, 76, { gradient: `linear-gradient(135deg, ${NAVY}, ${SLATE})` }, 2),
    icon("star", 60, 1000, 20, { color: GOLD }, 5),
    text("Departamento de Capacitación\nVIÑOPLASTIC · Planta Querétaro", 90, 996, 400, 36, {
      fontSize: 11, color: MUTED, lineHeight: 1.5,
    }, 4),
    text("Generado: Febrero 2026", 600, 1004, 180, 18, {
      fontSize: 10, color: MUTED, textAlign: "right",
    }, 4),
  ],
}

// ─── 8. Lista de Asistencia — Premium ─────────────────────────────────────────

const listaAsistencia: FlayerTemplate = {
  name: "Lista de Asistencia",
  preview: "📋",
  bg: WHITE,
  elements: [
    // Top accent
    shape("rectangle", 0, 0, 816, 5, { gradient: `linear-gradient(90deg, ${NAVY}, ${BLUE}, ${GOLD})` }, 5),
    // Header section
    shape("rectangle", 0, 5, 816, 85, { backgroundColor: LIGHT_GRAY }, 1),
    text("VIÑOPLASTIC", 50, 18, 190, 28, {
      fontSize: 18, fontWeight: "bold", color: NAVY,
      fontFamily: "Montserrat, sans-serif", letterSpacing: 2,
    }, 4),
    text("Planta Querétaro", 50, 44, 140, 16, {
      fontSize: 9, color: MUTED, letterSpacing: 1,
    }, 3),
    // Badge
    shape("rectangle", 574, 20, 200, 40, { gradient: `linear-gradient(135deg, ${NAVY}, ${SLATE})`, borderRadius: 8 }, 3),
    icon("clipboard", 590, 28, 18, { color: GOLD }, 5),
    text("LISTA DE ASISTENCIA", 614, 20, 155, 40, {
      fontSize: 10, fontWeight: "bold", color: WHITE, letterSpacing: 1,
      textAlign: "center", lineHeight: 3.2,
    }, 4),
    // Gold divider
    shape("rectangle", 50, 96, 716, 3, { gradient: `linear-gradient(90deg, ${GOLD}, transparent)` }, 3),
    // Course info section
    text("CURSO:", 50, 112, 60, 20, { fontSize: 10, fontWeight: "bold", color: NAVY, letterSpacing: 1 }, 3),
    text("_____________________________________________", 115, 112, 350, 20, { fontSize: 10, color: "#d1d5db" }, 2),
    text("FECHA:", 500, 112, 60, 20, { fontSize: 10, fontWeight: "bold", color: NAVY, letterSpacing: 1 }, 3),
    text("_______________", 565, 112, 200, 20, { fontSize: 10, color: "#d1d5db" }, 2),
    text("INSTRUCTOR:", 50, 138, 90, 20, { fontSize: 10, fontWeight: "bold", color: NAVY, letterSpacing: 1 }, 3),
    text("_____________________________________________", 148, 138, 320, 20, { fontSize: 10, color: "#d1d5db" }, 2),
    text("SALA:", 500, 138, 50, 20, { fontSize: 10, fontWeight: "bold", color: NAVY, letterSpacing: 1 }, 3),
    text("_______________", 555, 138, 200, 20, { fontSize: 10, color: "#d1d5db" }, 2),
    // Table header
    shape("rectangle", 50, 172, 716, 30, { gradient: `linear-gradient(90deg, ${NAVY}, ${SLATE})`, borderRadius: 4 }, 3),
    text("No.", 60, 172, 36, 30, { fontSize: 9, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 2.8 }, 4),
    text("NO. EMPLEADO", 100, 172, 90, 30, { fontSize: 9, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 2.8 }, 4),
    text("NOMBRE COMPLETO", 196, 172, 240, 30, { fontSize: 9, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 2.8 }, 4),
    text("DEPARTAMENTO", 440, 172, 120, 30, { fontSize: 9, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 2.8 }, 4),
    text("FIRMA", 566, 172, 90, 30, { fontSize: 9, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 2.8 }, 4),
    text("HORA", 662, 172, 98, 30, { fontSize: 9, fontWeight: "bold", color: WHITE, textAlign: "center", lineHeight: 2.8 }, 4),
    // Rows (20 rows)
    ...Array.from({ length: 20 }, (_, i) => {
      const y = 206 + i * 36
      return [
        shape("rectangle", 50, y, 716, 36, {
          backgroundColor: i % 2 === 0 ? LIGHT_GRAY : "transparent",
          borderWidth: 0, borderColor: "#e5e7eb", borderStyle: "solid" as const,
        }, 1),
        shape("line", 50, y + 35, 716, 1, { backgroundColor: "#e5e7eb" }, 2),
        text(`${i + 1}`, 60, y + 4, 36, 28, {
          fontSize: 10, color: MUTED, textAlign: "center", lineHeight: 2.4,
        }, 3),
      ]
    }).flat(),
    // Footer
    shape("rectangle", 50, 934, 716, 2, { backgroundColor: NAVY, opacity: 0.2 }, 2),
    text("OBSERVACIONES:", 50, 946, 120, 18, {
      fontSize: 9, fontWeight: "bold", color: NAVY, letterSpacing: 1,
    }, 3),
    shape("line", 50, 980, 716, 1, { backgroundColor: "#e5e7eb" }, 2),
    shape("line", 50, 1000, 716, 1, { backgroundColor: "#e5e7eb" }, 2),
    // Signature line
    shape("line", 550, 1030, 220, 1, { backgroundColor: NAVY, opacity: 0.4 }, 2),
    text("Firma del Instructor", 580, 1034, 160, 16, {
      fontSize: 9, color: MUTED, textAlign: "center",
    }, 3),
  ],
}

// ─── 9. Vacío ─────────────────────────────────────────────────────────────────

const vacio: FlayerTemplate = {
  name: "Vacío",
  preview: "📄",
  bg: WHITE,
  elements: [],
}

// ─── Export all ───────────────────────────────────────────────────────────────

export const TEMPLATES: FlayerTemplate[] = [
  convocatoriaOficial,
  capacitacionProgramada,
  auditoriaProceso,
  diploma,
  avisoSeguridad,
  memorandum,
  infografia,
  listaAsistencia,
  vacio,
]
