import {
  Building2,
  ShieldCheck,
  Leaf,
  ClipboardList,
  Award,
  CheckCircle2,
  Factory,
  Package,
  FolderKanban,
  Cog,
  GraduationCap,
  type LucideIcon,
} from "lucide-react"

// ─── Categorías de cursos ─────────────────────────────────────────────────────
//
// Cada categoría define:
// - Patrones (regex) para detectar por nombre del curso
// - Icono semántico (lucide)
// - Tono (clave del design system) usado para gradientes / acentos
// - Etiqueta legible
//
// El orden importa: el primer match gana.

export type CursoTone =
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "destructive"
  | "accent"

export interface CursoCategoria {
  key: string
  label: string
  icon: LucideIcon
  tone: CursoTone
  patterns: RegExp[]
}

const CATEGORIAS: CursoCategoria[] = [
  {
    key: "induccion",
    label: "Inducción",
    icon: Building2,
    tone: "primary",
    patterns: [/induc/i, /bienven/i, /onboard/i, /nuevo\s+ingreso/i],
  },
  {
    key: "seguridad",
    label: "Seguridad e Higiene",
    icon: ShieldCheck,
    tone: "warning",
    patterns: [/segurid/i, /higien/i, /epp/i, /riesgo/i, /salud/i],
  },
  {
    key: "ambiental",
    label: "Medio Ambiente",
    icon: Leaf,
    tone: "success",
    patterns: [/ambient/i, /ecolog/i, /sustent/i, /residuo/i, /impacto/i],
  },
  {
    key: "calidad",
    label: "Calidad",
    icon: Award,
    tone: "info",
    patterns: [/calidad/i, /iso/i, /sgc/i, /gestion\s+de\s+calidad/i],
  },
  {
    key: "produccion",
    label: "Producción",
    icon: Factory,
    tone: "primary",
    patterns: [/produc/i, /inyecc/i, /molde/i, /plast/i, /manufactur/i],
  },
  {
    key: "almacen",
    label: "Almacén",
    icon: Package,
    tone: "accent",
    patterns: [/almac[eé]n/i, /inventario/i, /log[ií]stic/i, /bodega/i],
  },
  {
    key: "proyectos",
    label: "Proyectos",
    icon: FolderKanban,
    tone: "info",
    patterns: [/proyect/i, /pmo/i],
  },
  {
    key: "procedimientos",
    label: "Procedimientos",
    icon: ClipboardList,
    tone: "accent",
    patterns: [/procedim/i, /registro/i, /instrucc/i, /sop/i, /norma/i, /document/i],
  },
  {
    key: "mantenimiento",
    label: "Mantenimiento",
    icon: Cog,
    tone: "warning",
    patterns: [/manten/i, /mecan/i, /electric/i],
  },
  {
    key: "auditoria",
    label: "Auditoría",
    icon: CheckCircle2,
    tone: "success",
    patterns: [/auditor/i, /verific/i, /inspecc/i],
  },
]

const DEFAULT_CATEGORIA: CursoCategoria = {
  key: "general",
  label: "Capacitación",
  icon: GraduationCap,
  tone: "primary",
  patterns: [],
}

export function detectarCategoria(nombre: string): CursoCategoria {
  const texto = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  for (const cat of CATEGORIAS) {
    if (cat.patterns.some((re) => re.test(texto))) return cat
  }
  return DEFAULT_CATEGORIA
}

interface ToneClasses {
  /** Gradiente CSS listo para `style={{ backgroundImage }}` */
  gradient: string
  /** Color sólido para icono / badge accent */
  solid: string
  /** Clases del badge inferior (footer card) */
  badgeBg: string
  badgeText: string
}

const TONE_CLASSES: Record<CursoTone, ToneClasses> = {
  primary: {
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #1d4ed8 100%)",
    solid: "#2563eb",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-700 dark:text-sky-300",
  },
  info: {
    gradient: "linear-gradient(135deg, #6366f1 0%, #7c3aed 55%, #5b21b6 100%)",
    solid: "#6366f1",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-700 dark:text-indigo-300",
  },
  success: {
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 55%, #047857 100%)",
    solid: "#059669",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  warning: {
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 55%, #c2410c 100%)",
    solid: "#ea580c",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  destructive: {
    gradient: "linear-gradient(135deg, #f43f5e 0%, #dc2626 55%, #b91c1c 100%)",
    solid: "#dc2626",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-700 dark:text-rose-300",
  },
  accent: {
    gradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 55%, #7e22ce 100%)",
    solid: "#9333ea",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-700 dark:text-violet-300",
  },
}

export function getToneClasses(tone: CursoTone): ToneClasses {
  return TONE_CLASSES[tone]
}