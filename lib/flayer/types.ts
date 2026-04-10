// ─── Flayer Editor Types & Constants ──────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ElementStyle {
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle: string
  textAlign: "left" | "center" | "right"
  textDecoration: "none" | "underline" | "line-through"
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize"
  color: string
  backgroundColor: string
  opacity: number
  borderRadius: number
  lineHeight: number
  letterSpacing: number
  textShadow: string
  borderWidth: number
  borderColor: string
  borderStyle: "none" | "solid" | "dashed" | "dotted"
  boxShadow: string
  rotation: number
  padding: number
  gradient: string
}

export type ShapeType = "rectangle" | "circle" | "line" | "triangle" | "divider" | "star"

export interface FlayerElement {
  id: string
  type: "text" | "image" | "shape" | "icon"
  x: number
  y: number
  width: number
  height: number
  content: string
  zIndex: number
  style: ElementStyle
  locked?: boolean
  shapeType?: ShapeType
  iconName?: string
  flipH?: boolean
  flipV?: boolean
}

export interface FlayerInfo {
  folio: string
  curso: string
  instructor: string
  sala: string
  turno1: string
  fechaTurno1: string
  turno2: string
  fechaTurno2: string
  turno3: string
  fechaTurno3: string
  turno4: string
  fechaTurno4: string
  horarioEspecial: string
}

export interface FlayerState {
  elements: FlayerElement[]
  canvasBg: string
  canvasBgImage: string | null
}

export interface SavedFlayer {
  name: string
  date: string
  state: FlayerState
}

export interface FlayerTemplate {
  name: string
  preview: string
  bg: string
  bgImage?: string
  elements: FlayerElement[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const CANVAS_W = 816
export const CANVAS_H = 1056
export const GRID_SIZE = 20
export const SNAP_THRESHOLD = 8
export const STORAGE_KEY = "flayer-saves"
export const GALLERY_KEY = "flayer-gallery"
export const COLOR_HISTORY_KEY = "flayer-color-history"
export const AUTOSAVE_KEY = "flayer-autosave"
export const AUTOSAVE_INTERVAL = 30_000

export const FONTS = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Oswald", value: "Oswald, sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Raleway", value: "'Raleway', sans-serif" },
] as const

export const DEFAULT_STYLE: ElementStyle = {
  fontSize: 18,
  fontFamily: "Inter, sans-serif",
  fontWeight: "normal",
  fontStyle: "normal",
  textAlign: "left",
  textDecoration: "none",
  textTransform: "none",
  color: "#1a1a1a",
  backgroundColor: "transparent",
  opacity: 1,
  borderRadius: 0,
  lineHeight: 1.4,
  letterSpacing: 0,
  textShadow: "none",
  borderWidth: 0,
  borderColor: "#000000",
  borderStyle: "none",
  boxShadow: "none",
  rotation: 0,
  padding: 4,
  gradient: "none",
}

export const TEXT_SHADOWS = [
  { label: "Ninguna", value: "none" },
  { label: "Sutil", value: "1px 1px 2px rgba(0,0,0,0.3)" },
  { label: "Media", value: "2px 2px 4px rgba(0,0,0,0.5)" },
  { label: "Fuerte", value: "3px 3px 6px rgba(0,0,0,0.7)" },
  { label: "Glow azul", value: "0 0 8px rgba(59,130,246,0.8)" },
  { label: "Glow dorado", value: "0 0 10px rgba(201,169,110,0.8)" },
  { label: "Contorno", value: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" },
] as const

export const BOX_SHADOWS = [
  { label: "Ninguna", value: "none" },
  { label: "Sutil", value: "0 1px 3px rgba(0,0,0,0.12)" },
  { label: "Media", value: "0 4px 12px rgba(0,0,0,0.15)" },
  { label: "Elevada", value: "0 8px 30px rgba(0,0,0,0.2)" },
  { label: "Contorno", value: "0 0 0 2px rgba(59,130,246,0.5)" },
  { label: "Interna", value: "inset 0 2px 8px rgba(0,0,0,0.15)" },
  { label: "Neón azul", value: "0 0 15px rgba(59,130,246,0.6), 0 0 30px rgba(59,130,246,0.3)" },
  { label: "Neón dorado", value: "0 0 15px rgba(201,169,110,0.6), 0 0 30px rgba(201,169,110,0.3)" },
] as const

export const GRADIENT_PRESETS = [
  { label: "Ninguno", value: "none" },
  { label: "Navy → Azul", value: "linear-gradient(135deg, #0f172a, #1e40af)" },
  { label: "Azul → Cyan", value: "linear-gradient(135deg, #3b82f6, #06b6d4)" },
  { label: "Dorado", value: "linear-gradient(135deg, #c9a96e, #8b6914)" },
  { label: "Sunset", value: "linear-gradient(135deg, #f97316, #ec4899)" },
  { label: "Esmeralda", value: "linear-gradient(135deg, #059669, #10b981)" },
  { label: "Púrpura", value: "linear-gradient(135deg, #7c3aed, #a855f7)" },
  { label: "Rojo → Naranja", value: "linear-gradient(135deg, #dc2626, #f97316)" },
  { label: "Oscuro", value: "linear-gradient(135deg, #1e293b, #334155)" },
  { label: "Cristal", value: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.2))" },
] as const

export const COLOR_PRESETS = [
  // VIÑOPLASTIC corporate
  { label: "Navy", value: "#0f172a" },
  { label: "Slate", value: "#1e293b" },
  { label: "Dorado", value: "#c9a96e" },
  { label: "Azul", value: "#3b82f6" },
  // Standard
  { label: "Blanco", value: "#ffffff" },
  { label: "Negro", value: "#000000" },
  { label: "Rojo", value: "#dc2626" },
  { label: "Verde", value: "#16a34a" },
  { label: "Naranja", value: "#f97316" },
  { label: "Púrpura", value: "#7c3aed" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Rosa", value: "#ec4899" },
  { label: "Gris claro", value: "#f1f5f9" },
  { label: "Gris", value: "#6b7280" },
  { label: "Crema", value: "#faf7f2" },
  { label: "Amarillo", value: "#eab308" },
] as const

export const SHAPE_CATALOG = [
  { type: "rectangle" as ShapeType, label: "Rectángulo", icon: "□" },
  { type: "circle" as ShapeType, label: "Círculo", icon: "○" },
  { type: "line" as ShapeType, label: "Línea", icon: "━" },
  { type: "triangle" as ShapeType, label: "Triángulo", icon: "△" },
  { type: "divider" as ShapeType, label: "Divisor", icon: "⎯" },
  { type: "star" as ShapeType, label: "Estrella", icon: "★" },
] as const

export const ICON_CATALOG = [
  { key: "calendar", label: "Calendario", category: "Tiempo" },
  { key: "clock", label: "Reloj", category: "Tiempo" },
  { key: "map-pin", label: "Ubicación", category: "Lugar" },
  { key: "user", label: "Persona", category: "Personas" },
  { key: "users", label: "Grupo", category: "Personas" },
  { key: "alert-triangle", label: "Alerta", category: "Seguridad" },
  { key: "shield", label: "Escudo", category: "Seguridad" },
  { key: "shield-check", label: "Escudo OK", category: "Seguridad" },
  { key: "wrench", label: "Herramienta", category: "Industrial" },
  { key: "graduation-cap", label: "Graduación", category: "Educación" },
  { key: "clipboard", label: "Portapapeles", category: "Documentos" },
  { key: "file-text", label: "Documento", category: "Documentos" },
  { key: "check-circle", label: "Check", category: "Estado" },
  { key: "x-circle", label: "Error", category: "Estado" },
  { key: "phone", label: "Teléfono", category: "Contacto" },
  { key: "mail", label: "Correo", category: "Contacto" },
  { key: "star", label: "Estrella", category: "Decorativo" },
  { key: "award", label: "Premio", category: "Decorativo" },
  { key: "heart", label: "Corazón", category: "Decorativo" },
  { key: "zap", label: "Rayo", category: "Decorativo" },
  { key: "megaphone", label: "Megáfono", category: "Comunicación" },
  { key: "building", label: "Edificio", category: "Industrial" },
  { key: "factory", label: "Fábrica", category: "Industrial" },
  { key: "hard-hat", label: "Casco", category: "Seguridad" },
  { key: "flame", label: "Fuego", category: "Seguridad" },
  { key: "eye", label: "Ojo", category: "Estado" },
  { key: "target", label: "Objetivo", category: "Decorativo" },
  { key: "trophy", label: "Trofeo", category: "Decorativo" },
  { key: "book-open", label: "Libro", category: "Educación" },
  { key: "lightbulb", label: "Idea", category: "Decorativo" },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

export function uid(): string {
  return crypto.randomUUID()
}

export function snapToGrid(v: number, gridSize: number): number {
  return Math.round(v / gridSize) * gridSize
}

export function compressImage(file: File, maxDim = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = reject
      img.onload = () => {
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/webp", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/** Merge DEFAULT_STYLE into an element's style to handle old saves */
export function migrateElement(el: FlayerElement): FlayerElement {
  return {
    ...el,
    style: { ...DEFAULT_STYLE, ...el.style },
    locked: el.locked ?? false,
    flipH: el.flipH ?? false,
    flipV: el.flipV ?? false,
  }
}
