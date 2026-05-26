"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion"
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Database,
  FileText,
  FolderOpen,
  Lock,
  LogIn,
  Mail,
  Printer,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react"

/**
 * Guía pública para el rol Evaluador.
 *
 * Página estática (sin sesión) con scroll editorial que reproduce
 * en mockups el flujo completo: login → modalidad y periodo →
 * búsqueda del colaborador y selección de evaluador → criterios de
 * evaluación 40/30/30 → bloqueo <80% con compromisos → botones del
 * sistema (incluye drawer de Pendientes) → impresión y preview →
 * recordatorios institucionales → seguridad → CTA al login.
 *
 * Tokens: 100 % derivados de `--primary`, `--warning`, `--success`,
 * `--destructive`, `--card`, `--border`, `--muted-foreground` y
 * familias `font-serif` / `font-mono` declaradas en
 * `app/layout.tsx`. Sin hex/rgb ni `font-family` hardcoded.
 */

// ─────────────────────────────────────────────────────────────────────
// Datos estáticos para los mockups
// ─────────────────────────────────────────────────────────────────────

const SECTIONS_EVAL = [
  {
    icon: Target,
    label: "Objetivos",
    weight: 40,
    sample: 85,
    desc: "Cumplimiento de los objetivos SMART definidos al inicio del periodo.",
  },
  {
    icon: ClipboardList,
    label: "Responsabilidades",
    weight: 30,
    sample: 92,
    desc: "Funciones del puesto desempeñadas con calidad, orden y oportunidad.",
  },
  {
    icon: Award,
    label: "Competencias",
    weight: 30,
    sample: 78,
    desc: "Comportamientos y habilidades transversales del colaborador.",
  },
] as const

const EVALUADORES_MOCK = [
  {
    dept: "DIRECCIÓN",
    items: ["VIÑOLAS GONZALEZ JOSE LUIS", "HERNANDEZ RUIZ MIGUEL ANGEL"],
    active: 0,
  },
  {
    dept: "GERENCIA",
    items: ["TERRAZAS MARTINEZ JAIME"],
  },
  {
    dept: "PRODUCCIÓN",
    items: [
      "GOMEZ SANCHEZ CARLOS ARIEL",
      "JUAREZ HERNANDEZ SERGIO RICARDO",
      "RUEDA MUÑOZ FRANCISCO",
    ],
  },
] as const

type PendienteDept = { name: string; count: number; active?: boolean }
const PENDIENTES_DEPTS: readonly PendienteDept[] = [
  { name: "ALMACÉN", count: 4, active: true },
  { name: "CALIDAD", count: 14 },
  { name: "MANTENIMIENTO", count: 1 },
  { name: "PRODUCCIÓN", count: 22 },
]

const PENDIENTES_CHIPS = [
  { num: "4147", evals: 3, status: "vencida" as const },
  { num: "4140", evals: 3, status: "vencida" as const },
  { num: "4144", evals: 3, status: "pendiente" as const },
  { num: "4149", evals: 3, status: "pendiente" as const },
]

const RECORDATORIOS = [
  {
    icon: Send,
    title: "Entregar al Depto. de Capacitación",
    body:
      "Una vez firmada por colaborador y evaluador, la evaluación impresa se entrega físicamente al Departamento de Capacitación.",
  },
  {
    icon: FileText,
    title: "Documentos dados de alta en el SGI",
    body:
      "Los formatos RG-ADM-062 y RG-ADM-063 están dados de alta ante el Sistema de Gestión Integral. No modifiques el diseño impreso del formato.",
  },
  {
    icon: Building2,
    title: "Solicitar modificaciones",
    body:
      "Si la evaluación requiere ajustes o el formato necesita un cambio, acude con Leonardo Hernández (Sistemas / Capacitación) antes de imprimir la versión final.",
  },
] as const

const SECURITY = [
  {
    icon: ShieldCheck,
    title: "Autenticación Supabase",
    body:
      "Las credenciales se validan contra Supabase Auth con sesión cifrada y refresh automático.",
  },
  {
    icon: Lock,
    title: "Cifrado en tránsito y en reposo",
    body:
      "Todo el tráfico viaja sobre HTTPS / TLS 1.3 y la base de datos cifra los datos en reposo (Postgres + Supabase).",
  },
  {
    icon: Database,
    title: "Control de acceso por rol (RLS)",
    body:
      "Postgres Row Level Security limita lecturas/escrituras al rol de cada usuario. Un evaluador solo accede a lo que su rol permite.",
  },
] as const

// ─────────────────────────────────────────────────────────────────────
// Helpers de animación
// ─────────────────────────────────────────────────────────────────────

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutExpo } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export function GuiaEvaluadorPage() {
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll()
  const progressX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  })

  const viewport = useMemo(
    () => ({ once: true, amount: 0.2 } as const),
    [],
  )

  return (
    <div className="bg-background text-foreground">
      {/* Progress bar */}
      <motion.div
        className="fixed left-0 right-0 top-0 z-50 h-px origin-left bg-primary"
        style={{ scaleX: reduced ? 1 : progressX }}
        aria-hidden
      />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b border-border">
        <BgHero />
        <div className="relative mx-auto flex min-h-[88vh] max-w-5xl flex-col justify-center px-6 py-24 sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo }}
            className="flex items-center gap-3 font-mono text-[0.625rem] uppercase tracking-[0.3em] text-muted-foreground"
          >
            <span className="inline-block h-px w-10 bg-border" />
            <span>Vinoplastic · Planta Querétaro · Guía Pública</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.1 }}
            className="mt-6 font-serif text-[clamp(2.4rem,8vw,5rem)] font-extrabold leading-[0.95] tracking-tight"
          >
            Guía del{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-warning bg-clip-text italic text-transparent">
              Evaluador
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.25 }}
            className="mt-6 max-w-2xl font-serif text-base text-muted-foreground sm:text-lg"
          >
            Acompañamiento paso a paso para realizar tu evaluación de
            desempeño en el sistema, desde el inicio de sesión hasta la
            entrega del formato firmado.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.45 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Acceder al sistema
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#paso-01"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              Empezar el recorrido
              <ChevronDown className="h-3.5 w-3.5" />
            </a>
          </motion.div>

          {/* TOC */}
          <motion.ul
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="mt-16 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground sm:grid-cols-3"
          >
            {[
              "01 · Acceso",
              "02 · Modalidad y periodo",
              "03 · Buscar y evaluador",
              "04 · Cómo evaluar",
              "05 · Botones",
              "06 · Imprimir & preview",
              "07 · Recordatorios",
              "08 · Seguridad",
            ].map((t) => (
              <motion.li key={t} variants={fadeUp} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                {t}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* ── PASO 01 · ACCESO ─────────────────────────────────────── */}
      <Step
        id="paso-01"
        n="01"
        title="Acceder al sistema"
        kicker="Login"
        intro="Abre el sistema en tu navegador y captura las credenciales del rol Evaluador."
        viewport={viewport}
      >
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-start">
          {/* Login mockup */}
          <MockFrame label="auth · login" tone="dark">
            <div className="space-y-5 p-6 sm:p-8">
              <div className="space-y-1.5">
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-warning">
                  Desde 1970
                </div>
                <div className="font-serif text-2xl font-extrabold tracking-tight text-[color:hsl(var(--primary-foreground))]">
                  Iniciar sesión
                </div>
                <div className="font-serif text-xs italic text-[color:hsl(var(--primary-foreground)/0.6)]">
                  Capacitación · Querétaro
                </div>
              </div>

              <MockField icon={Mail} label="Correo" value="evaluadorqro@vinoplastic.com" />
              <MockField icon={Lock} label="Contraseña" value="••••••••••••" />

              <div className="flex items-center justify-between text-[0.65rem] text-[color:hsl(var(--primary-foreground)/0.6)]">
                <span className="font-mono uppercase tracking-[0.18em]">¿Olvidaste tu contraseña?</span>
                <LogIn className="h-3 w-3" />
              </div>

              <div className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-primary-foreground">
                Entrar
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </MockFrame>

          {/* Credenciales públicas */}
          <div className="space-y-6">
            <div>
              <SectionLabel>Credenciales del rol Evaluador</SectionLabel>
              <p className="mt-3 text-sm text-muted-foreground">
                Estas credenciales son compartidas entre los evaluadores de planta y permiten el acceso de
                solo-lectura/evaluación.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <CredentialRow label="Correo" value="evaluadorqro@vinoplastic.com" />
              <div className="my-3 h-px bg-border" />
              <CredentialRow label="Contraseña" value="vinoqro2026" />
            </div>

            <Tip>
              Si las credenciales no funcionan o necesitas un rol distinto, acude con
              {" "}
              <strong className="font-serif italic text-foreground">Leonardo Hernández</strong>.
            </Tip>
          </div>
        </div>
      </Step>

      {/* ── PASO 02 · MODALIDAD Y PERIODO ────────────────────────── */}
      <Step
        id="paso-02"
        n="02"
        title="Modalidad y periodo"
        kicker="Antes de evaluar"
        intro="En la pantalla de Desempeño, lo primero es definir el periodo: ¿estás evaluando semestral o mensual? y ¿qué semestre/mes corresponde?"
        viewport={viewport}
        reverse
      >
        <MockFrame label="/desempeno · selector de periodo">
          <div className="space-y-4 p-6">
            <SectionLabel className="text-[0.65rem]">Periodo de evaluación</SectionLabel>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
              <button className="rounded-md border border-primary/60 bg-primary/10 px-4 py-2 text-sm font-semibold text-foreground">
                Semestral
              </button>
              <button className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
                Mensual
              </button>

              <div className="col-span-2 grid grid-cols-[1fr_auto] gap-2 sm:col-span-1">
                <button className="inline-flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                  ENE-JUN 2026
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              <button className="hidden h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground sm:inline-flex">
                <Search className="h-4 w-4" />
              </button>
            </div>

            {/* Open dropdown */}
            <div className="ml-auto w-full max-w-[200px] overflow-hidden rounded-md border border-border bg-card shadow-lg">
              <div className="flex items-center gap-2 px-3 py-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">ENE-JUN 2026</span>
              </div>
              <div className="border-t border-border px-3 py-2 text-sm text-muted-foreground">
                JUL-DIC 2026
              </div>
            </div>
          </div>
        </MockFrame>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Bullet n="A">
            <strong className="font-serif italic">Semestral</strong> — para evaluaciones formales (ENE-JUN, JUL-DIC).
          </Bullet>
          <Bullet n="B">
            <strong className="font-serif italic">Mensual</strong> — para seguimientos cortos del periodo en curso.
          </Bullet>
        </div>
      </Step>

      {/* ── PASO 03 · BUSCAR Y EVALUADOR ─────────────────────────── */}
      <Step
        id="paso-03"
        n="03"
        title="Buscar al colaborador y asignar evaluador"
        kicker="Identificación"
        intro="Captura el número de empleado del colaborador a evaluar, luego selecciona quién firma como evaluador."
        viewport={viewport}
      >
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <MockFrame label="/desempeno · búsqueda">
            <div className="space-y-4 p-6">
              <SectionLabel className="text-[0.65rem]">No. de empleado</SectionLabel>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <div className="flex h-10 items-center rounded-md border border-border bg-background pl-10 pr-3 text-sm">
                  <span className="font-mono">3204</span>
                  <span className="ml-1 h-4 w-px animate-pulse bg-foreground" />
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-3">
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Colaborador
                </div>
                <div className="mt-1 font-medium">PÉREZ LÓPEZ MARÍA FERNANDA</div>
                <div className="text-xs text-muted-foreground">
                  Producción · Operadora · Ingreso 12·MAR·2022
                </div>
              </div>
            </div>
          </MockFrame>

          <MockFrame label="/desempeno · selecciona evaluador">
            <div className="p-2">
              <div className="overflow-hidden rounded-md border border-border bg-card">
                {EVALUADORES_MOCK.map((g, i) => (
                  <div key={g.dept}>
                    {i > 0 && <div className="h-px bg-border" />}
                    <div className="bg-muted/60 px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {g.dept}
                    </div>
                    {g.items.map((name, j) => {
                      const active = "active" in g && g.active === j
                      return (
                        <div
                          key={name}
                          className={
                            "px-3 py-2 text-sm " +
                            (active
                              ? "bg-primary/10 font-medium text-foreground"
                              : "text-foreground/85 hover:bg-muted/50")
                          }
                        >
                          {name}
                        </div>
                      )
                    })}
                  </div>
                ))}
                <div className="flex items-center justify-center border-t border-border py-1.5 text-muted-foreground">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 px-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                <Users className="h-3 w-3" />
                Selecciona evaluador
              </div>
            </div>
          </MockFrame>
        </div>

        <Tip>
          El sistema agrupa a los evaluadores por departamento (Dirección, Gerencia, Producción, etc.). Selecciona
          la persona que firmará la evaluación.
        </Tip>
      </Step>

      {/* ── PASO 04 · CÓMO EVALUAR ───────────────────────────────── */}
      <Step
        id="paso-04"
        n="04"
        title="Cómo evaluar cada sección"
        kicker="Criterios 40 / 30 / 30"
        intro="La evaluación está dividida en tres secciones con pesos distintos. La suma ponderada determina la calificación final."
        viewport={viewport}
        reverse
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-4 sm:grid-cols-3"
        >
          {SECTIONS_EVAL.map((s) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[0.65rem] font-semibold tracking-[0.15em] text-primary">
                    {s.weight}%
                  </span>
                </div>
                <div className="mt-3 font-serif text-lg font-semibold">{s.label}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                    <span>Ejemplo</span>
                    <span>{s.sample}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.sample}%` }}
                      viewport={viewport}
                      transition={{ duration: 0.9, ease: easeOutExpo }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Bloqueo <80% */}
        <div className="mt-10">
          <SectionLabel>Si la calificación final es menor a 80 %</SectionLabel>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            El sistema bloquea el guardado, la impresión y la descarga del PDF hasta que captures los
            <strong className="font-serif italic text-foreground"> compromisos de mejora </strong>
            del colaborador.
          </p>

          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_1fr]">
            <MockFrame label="banner de bloqueo">
              <div className="flex items-start gap-3 bg-foreground p-4 text-[color:hsl(var(--background))]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-sm">
                  La calificación es menor a <strong>80%</strong>. No puedes guardar, imprimir o descargar el
                  PDF hasta que captures los compromisos de mejora.
                </p>
              </div>
            </MockFrame>

            <MockFrame label="compromisos de mejora">
              <div className="space-y-3 p-5">
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                  Compromisos de mejora · capturar
                </div>
                <div className="space-y-2">
                  <div className="h-9 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                    Compromiso 1 — Asistir a curso de…
                  </div>
                  <div className="h-9 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                    Compromiso 2 — Mejorar puntualidad…
                  </div>
                  <div className="h-9 rounded-md border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground/70">
                    + Agregar compromiso
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Una vez capturados, se habilitan Guardar e Imprimir.
                </div>
              </div>
            </MockFrame>
          </div>
        </div>
      </Step>

      {/* ── PASO 05 · BOTONES ────────────────────────────────────── */}
      <Step
        id="paso-05"
        n="05"
        title="Botones disponibles"
        kicker="Acciones del toolbar"
        intro="En la cabecera de la pantalla de Desempeño tienes los siguientes botones, agrupados por función."
        viewport={viewport}
      >
        {/* Toolbar mock */}
        <MockFrame label="/desempeno · toolbar">
          <div className="flex flex-wrap items-center gap-2 p-4">
            <ToolbarBtn icon={BookOpen} label="Guía" />
            <ToolbarBtn icon={FolderOpen} label="Guardadas" />
            <ToolbarBtn icon={ClipboardList} label="Pendientes" badge={32} />
            <div className="mx-1 h-6 w-px bg-border" />
            <ToolbarBtn icon={Save} label="Guardar" variant="outline" />
            <ToolbarBtn icon={Printer} label="Imprimir" variant="primary" />
          </div>
        </MockFrame>

        {/* Per-button explanation */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <BtnDesc icon={BookOpen} title="Guía" body="Abre esta misma guía dentro del sistema, en formato modal." />
          <BtnDesc icon={FolderOpen} title="Guardadas" body="Lista de evaluaciones que ya fueron guardadas y firmadas." />
          <BtnDesc icon={ClipboardList} title="Pendientes" body="Drawer con todas las evaluaciones pendientes, agrupadas por departamento." />
          <BtnDesc icon={Save} title="Guardar" body="Guarda el formato en la base de datos. Se bloquea si la calificación es <80% y faltan compromisos." />
          <BtnDesc icon={Printer} title="Imprimir" body="Abre el diálogo del navegador para imprimir o exportar a PDF." />
          <BtnDesc icon={Sparkles} title="Modo Evaluador" body="Si entras con las credenciales públicas, algunos controles de admin se ocultan automáticamente." />
        </div>

        {/* Pendientes drawer mockup */}
        <div className="mt-10">
          <SectionLabel>Drawer · Evaluaciones Pendientes</SectionLabel>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Al pulsar <strong className="font-mono uppercase tracking-[0.1em]">Pendientes</strong> se abre un
            panel lateral con el desglose por departamento. Cada chip representa a un colaborador con
            evaluaciones por realizar.
          </p>

          <div className="mt-5">
            <MockFrame label="drawer · pendientes">
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em]">
                      Evaluaciones Pendientes
                    </div>
                    <div className="text-xs text-muted-foreground">56 empleados · 116 evaluaciones</div>
                  </div>
                </div>

                <div className="rounded-md bg-foreground px-3 py-2 text-xs text-[color:hsl(var(--background))]">
                  Desglose por departamento de evaluaciones pendientes
                </div>

                <div className="flex flex-wrap gap-2">
                  {PENDIENTES_DEPTS.map((d) => (
                    <button
                      key={d.name}
                      className={
                        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold " +
                        (d.active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground")
                      }
                    >
                      {d.name}
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-bold tabular-nums text-foreground">
                        {d.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em]">
                    <Users className="h-3 w-3" />4 empleados · ALMACÉN
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {PENDIENTES_CHIPS.map((c) => {
                    const isOverdue = c.status === "vencida"
                    return (
                      <div
                        key={c.num}
                        className={
                          "relative rounded-md border px-3 py-2 text-center " +
                          (isOverdue
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-success/40 bg-success/5")
                        }
                      >
                        <span
                          className={
                            "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full " +
                            (isOverdue ? "bg-destructive" : "bg-success")
                          }
                        />
                        <div className="font-serif text-lg font-bold text-destructive">
                          <span className={isOverdue ? "text-destructive" : "text-success"}>{c.num}</span>
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {c.evals} evals
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    Vencida
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Pendiente
                  </span>
                  <span className="ml-auto font-medium text-foreground">
                    Clic en No. Empleado para ver el detalle
                  </span>
                </div>
              </div>
            </MockFrame>
          </div>
        </div>
      </Step>

      {/* ── PASO 06 · IMPRIMIR & PREVIEW ─────────────────────────── */}
      <Step
        id="paso-06"
        n="06"
        title="Imprimir y vista previa"
        kicker="Salida en papel"
        intro="Cuando la evaluación está lista, pulsa Imprimir. El sistema abre el diálogo del navegador con el formato exacto y permite imprimir o exportar a PDF."
        viewport={viewport}
        reverse
      >
        <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
          <MockFrame label="diálogo de impresión" tone="dark">
            <div className="space-y-3 p-5 text-[color:hsl(var(--primary-foreground))]">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[color:hsl(var(--primary-foreground)/0.7)]">
                  Imprimir
                </div>
                <Printer className="h-4 w-4 text-warning" />
              </div>
              <div className="space-y-2 text-xs text-[color:hsl(var(--primary-foreground)/0.8)]">
                <div className="flex justify-between border-b border-[color:hsl(var(--primary-foreground)/0.1)] pb-1.5">
                  <span>Destino</span>
                  <span className="font-medium text-[color:hsl(var(--primary-foreground))]">Guardar como PDF</span>
                </div>
                <div className="flex justify-between border-b border-[color:hsl(var(--primary-foreground)/0.1)] pb-1.5">
                  <span>Páginas</span>
                  <span>Todas</span>
                </div>
                <div className="flex justify-between border-b border-[color:hsl(var(--primary-foreground)/0.1)] pb-1.5">
                  <span>Color</span>
                  <span>Color</span>
                </div>
                <div className="flex justify-between">
                  <span>Diseño</span>
                  <span>Vertical</span>
                </div>
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-primary-foreground">
                Guardar PDF
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </MockFrame>

          {/* Paper preview */}
          <MockFrame label="vista previa · RG-ADM-062 / 063">
            <div className="mx-auto max-w-sm bg-[color:hsl(var(--card))] p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <div className="font-serif text-xs font-extrabold tracking-tight">
                    VIÑOPLASTIC · PLANTA QRO
                  </div>
                  <div className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Evaluación de desempeño · ENE-JUN 2026
                  </div>
                </div>
                <div className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground">
                  RG-ADM-062
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-3/5 rounded-full bg-muted" />
                <div className="h-1.5 w-2/5 rounded-full bg-muted" />
              </div>

              <div className="mt-4 space-y-2">
                {SECTIONS_EVAL.map((s) => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[0.6rem] text-muted-foreground">
                      <span className="font-medium uppercase tracking-[0.12em]">{s.label}</span>
                      <span className="font-mono">{s.weight}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary/80" style={{ width: `${s.sample}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <div className="h-px w-full bg-foreground/50" />
                  <div className="mt-1 text-[0.55rem] text-muted-foreground">Firma colaborador</div>
                </div>
                <div>
                  <div className="h-px w-full bg-foreground/50" />
                  <div className="mt-1 text-[0.55rem] text-muted-foreground">Firma evaluador</div>
                </div>
              </div>
            </div>
          </MockFrame>
        </div>

        <Tip>
          Imprime <strong className="font-serif italic">por ambos lados</strong> cuando el formato lo permita;
          el diseño está dado de alta en el SGI y debe entregarse <strong>tal cual</strong>.
        </Tip>
      </Step>

      {/* ── RECORDATORIOS ────────────────────────────────────────── */}
      <Step
        id="paso-07"
        n="07"
        title="Recordatorios institucionales"
        kicker="Antes de cerrar"
        intro=""
        viewport={viewport}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-4 md:grid-cols-3"
        >
          {RECORDATORIOS.map((r) => {
            const Icon = r.icon
            return (
              <motion.div
                key={r.title}
                variants={fadeUp}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-warning/10 text-warning">
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="mt-4 font-serif text-base font-semibold">{r.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </Step>

      {/* ── SEGURIDAD ────────────────────────────────────────────── */}
      <Step
        id="paso-08"
        n="08"
        title="Seguridad de los datos"
        kicker="Confidencialidad"
        intro="La información captada en una evaluación es sensible. El sistema aplica varias capas para protegerla."
        viewport={viewport}
        reverse
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-4 md:grid-cols-3"
        >
          {SECURITY.map((s) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.title}
                variants={fadeUp}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="mt-4 font-serif text-base font-semibold">{s.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </motion.div>
            )
          })}
        </motion.div>

        <Tip>
          Si detectas un comportamiento extraño (sesión que no cierra, datos de otro evaluador, etc.) reporta
          de inmediato a <strong className="font-serif italic">Leonardo Hernández</strong>.
        </Tip>
      </Step>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-t border-border">
        <BgHero subtle />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.7, ease: easeOutExpo }}
          >
            <div className="font-mono text-[0.7rem] uppercase tracking-[0.32em] text-muted-foreground">
              Listo para empezar
            </div>
            <h2 className="mt-4 font-serif text-4xl font-extrabold tracking-tight sm:text-5xl">
              Accede al sistema
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Usa las credenciales del rol Evaluador y completa la evaluación del periodo en curso. Esta guía
              queda siempre disponible en esta misma URL.
            </p>

            <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-mono text-xs uppercase tracking-[0.22em] text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Iniciar sesión
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#paso-01"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.22em] text-foreground/80 transition-colors hover:border-primary hover:text-primary"
              >
                Repasar guía
              </a>
            </div>
          </motion.div>
        </div>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-6 py-6 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground sm:flex-row sm:items-center">
            <div>Viñoplastic · Planta Querétaro · Desde 1970</div>
            <div>Guía pública · RG-ADM-062 / 063 · SGI</div>
          </div>
        </footer>
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

function Step({
  id,
  n,
  title,
  kicker,
  intro,
  children,
  viewport,
  reverse,
}: {
  id: string
  n: string
  title: string
  kicker: string
  intro: string
  children: React.ReactNode
  viewport: { once: true; amount: number }
  reverse?: boolean
}) {
  return (
    <section
      id={id}
      className={
        "relative border-b border-border " +
        (reverse ? "bg-muted/20" : "bg-background")
      }
    >
      <div className="mx-auto max-w-5xl px-6 py-20 sm:px-10 sm:py-28">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="mb-10 max-w-3xl"
        >
          <div className="flex items-baseline gap-3 font-mono text-[0.65rem] uppercase tracking-[0.32em] text-muted-foreground">
            <span className="text-primary">Paso {n}</span>
            <span className="h-px w-8 bg-border" />
            <span>{kicker}</span>
          </div>
          <h2 className="mt-4 font-serif text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h2>
          {intro ? (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{intro}</p>
          ) : null}
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
}

function MockFrame({
  label,
  children,
  tone = "light",
}: {
  label: string
  children: React.ReactNode
  tone?: "light" | "dark"
}) {
  const isDark = tone === "dark"
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive/60" />
          <span className="h-2 w-2 rounded-full bg-warning/70" />
          <span className="h-2 w-2 rounded-full bg-success/60" />
        </div>
        <div className="font-mono text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </div>
        <div className="w-8" />
      </div>
      <div
        className={
          isDark
            ? "bg-[color:color-mix(in_oklab,hsl(var(--primary))_12%,black_88%)]"
            : "bg-background"
        }
      >
        {children}
      </div>
    </div>
  )
}

function MockField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[color:hsl(var(--primary-foreground)/0.55)]">
        {label}
      </div>
      <div className="flex items-center gap-2 rounded-md border border-[color:hsl(var(--primary-foreground)/0.18)] bg-[color:hsl(var(--primary-foreground)/0.04)] px-3 py-2 text-sm text-[color:hsl(var(--primary-foreground)/0.92)]">
        <Icon className="h-3.5 w-3.5 text-[color:hsl(var(--primary-foreground)/0.6)]" />
        <span className="truncate font-mono text-xs">{value}</span>
      </div>
    </div>
  )
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="break-all rounded-md bg-muted/60 px-3 py-1.5 font-mono text-sm text-foreground">
        {value}
      </div>
    </div>
  )
}

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={
        "font-mono text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-foreground " +
        className
      }
    >
      {children}
    </div>
  )
}

function Bullet({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[0.7rem] font-bold text-primary">
        {n}
      </span>
      <p className="text-sm leading-relaxed text-foreground/85">{children}</p>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p className="text-sm leading-relaxed text-foreground/85">{children}</p>
    </div>
  )
}

function ToolbarBtn({
  icon: Icon,
  label,
  badge,
  variant = "ghost",
}: {
  icon: typeof Save
  label: string
  badge?: number
  variant?: "ghost" | "outline" | "primary"
}) {
  const base =
    "relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium"
  const style =
    variant === "primary"
      ? "bg-primary text-primary-foreground"
      : variant === "outline"
      ? "border border-border bg-background text-foreground"
      : "text-foreground/80 hover:bg-muted"
  return (
    <span className={`${base} ${style}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
      {typeof badge === "number" && (
        <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold tabular-nums text-destructive-foreground">
          {badge}
        </span>
      )}
    </span>
  )
}

function BtnDesc({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Save
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-serif text-sm font-semibold">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

function BgHero({ subtle = false }: { subtle?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-[120px]" />
      <div
        className={
          "absolute -bottom-40 -right-20 h-[26rem] w-[26rem] rounded-full blur-[120px] " +
          (subtle ? "bg-warning/10" : "bg-warning/15")
        }
      />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
        }}
      />
    </div>
  )
}
