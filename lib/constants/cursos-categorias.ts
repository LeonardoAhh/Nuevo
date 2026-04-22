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

// ─── Mapeo tono → clases tailwind (sin colores hardcoded) ─────────────────────

interface ToneClasses {
  /** Gradiente del cover */
  gradient: string
  /** Color del icono central */
  iconColor: string
  /** Badge de categoría */
  badgeBg: string
  badgeText: string
  /** Decoración de patrón */
  patternColor: string
}

const TONE_CLASSES: Record<CursoTone, ToneClasses> = {
  primary: {
    gradient: "from-primary/90 via-primary/70 to-primary/50",
    iconColor: "text-primary-foreground",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    patternColor: "text-primary-foreground/20",
  },
  info: {
    gradient: "from-info/90 via-info/70 to-info/50",
    iconColor: "text-info-foreground",
    badgeBg: "bg-info/10",
    badgeText: "text-info",
    patternColor: "text-info-foreground/20",
  },
  success: {
    gradient: "from-success/90 via-success/70 to-success/50",
    iconColor: "text-success-foreground",
    badgeBg: "bg-success/10",
    badgeText: "text-success",
    patternColor: "text-success-foreground/20",
  },
  warning: {
    gradient: "from-warning/90 via-warning/70 to-warning/50",
    iconColor: "text-warning-foreground",
    badgeBg: "bg-warning/10",
    badgeText: "text-warning",
    patternColor: "text-warning-foreground/20",
  },
  destructive: {
    gradient: "from-destructive/90 via-destructive/70 to-destructive/50",
    iconColor: "text-destructive-foreground",
    badgeBg: "bg-destructive/10",
    badgeText: "text-destructive",
    patternColor: "text-destructive-foreground/20",
  },
  accent: {
    gradient: "from-accent via-muted to-secondary",
    iconColor: "text-foreground/80",
    badgeBg: "bg-accent",
    badgeText: "text-accent-foreground",
    patternColor: "text-foreground/10",
  },
}

export function getToneClasses(tone: CursoTone): ToneClasses {
  return TONE_CLASSES[tone]
}
