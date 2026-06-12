"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight, X, CheckCircle2, FileWarning,
  TrendingDown, GraduationCap, Sparkles, ChevronLeft,
} from "lucide-react"
import { useRole } from "@/lib/hooks"

// ─── Version key ─────────────────────────────────────────────────────────────
// Bump this string to re-show the wizard after a new deployment.
const WIZARD_KEY = "whats_new_v1_actas_seguimiento"

// ─── Slide data ───────────────────────────────────────────────────────────────

interface Slide {
  id: string
  badge: string
  title: string
  description: string
  icon: React.ReactNode
  mockup: React.ReactNode
}

// ─── Mockup: Actas y Seguimiento button in table ──────────────────────────────

function MockupActas() {
  return (
    <div className="wn-mockup">
      <div className="wn-mockup__bar">
        <span className="wn-mockup__dot" style={{ background: "#ff5f57" }} />
        <span className="wn-mockup__dot" style={{ background: "#febc2e" }} />
        <span className="wn-mockup__dot" style={{ background: "#28c840" }} />
        <span className="wn-mockup__url">Capacitación → Historial</span>
      </div>
      <div className="wn-mockup__body">
        {/* Fake table row */}
        <div className="wn-row">
          <span className="wn-row__num">042</span>
          <span className="wn-row__name">González Cruz Adrián</span>
          <span className="wn-row__dept">Producción</span>
          <div className="wn-row__actions">
            <span className="wn-btn wn-btn--red wn-pulse" title="Actas y Seguimiento">
              <FileWarning size={12} />
            </span>
            <span className="wn-btn" title="Incidencias">📅</span>
            <span className="wn-btn" title="Cursos">📖</span>
            <span className="wn-btn" title="Editar">✏️</span>
          </div>
        </div>
        <div className="wn-row wn-row--muted">
          <span className="wn-row__num">039</span>
          <span className="wn-row__name">Ramírez Pérez Juan</span>
          <span className="wn-row__dept">Calidad</span>
          <div className="wn-row__actions">
            <span className="wn-btn wn-btn--red" title="Actas y Seguimiento">
              <FileWarning size={12} />
            </span>
            <span className="wn-btn">📅</span>
            <span className="wn-btn">📖</span>
            <span className="wn-btn">✏️</span>
          </div>
        </div>

        {/* Fake modal peek */}
        <div className="wn-modal-peek">
          <div className="wn-modal-peek__header">
            <div className="wn-modal-peek__icon">
              <FileWarning size={14} />
            </div>
            <div>
              <p className="wn-modal-peek__title">Actas y Seguimiento</p>
              <p className="wn-modal-peek__sub">González Cruz Adrián</p>
            </div>
          </div>
          <div className="wn-chip wn-chip--red">🗂 ACTA ADMINISTRATIVA · 10/06/2026</div>
          <div className="wn-chip wn-chip--yellow">📋 PLAN DE SEGUIMIENTO · Revisión: 25/06/2026</div>
          <div className="wn-modal-peek__footer">
            <span className="wn-badge wn-badge--green">✓ Cerrado</span>
            <span className="wn-badge wn-badge--red">⚠ Activo</span>
            <span className="wn-btn-primary">+ Nuevo registro</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mockup: Seguimiento de Compromisos page ──────────────────────────────────

function MockupSeguimiento() {
  return (
    <div className="wn-mockup">
      <div className="wn-mockup__bar">
        <span className="wn-mockup__dot" style={{ background: "#ff5f57" }} />
        <span className="wn-mockup__dot" style={{ background: "#febc2e" }} />
        <span className="wn-mockup__dot" style={{ background: "#28c840" }} />
        <span className="wn-mockup__url">/desempeno/seguimiento</span>
      </div>
      <div className="wn-mockup__body">
        {/* Stats row */}
        <div className="wn-stats">
          <div className="wn-stat">
            <span className="wn-stat__val">12</span>
            <span className="wn-stat__lbl">Total</span>
          </div>
          <div className="wn-stat wn-stat--red">
            <span className="wn-stat__val">4</span>
            <span className="wn-stat__lbl">Reprobados</span>
          </div>
          <div className="wn-stat wn-stat--red">
            <span className="wn-stat__val">2</span>
            <span className="wn-stat__lbl">Vencidos</span>
          </div>
          <div className="wn-stat wn-stat--yellow">
            <span className="wn-stat__val">3</span>
            <span className="wn-stat__lbl">Próximos</span>
          </div>
        </div>

        {/* Cards */}
        <div className="wn-eval-card wn-eval-card--red">
          <div className="wn-eval-card__top">
            <div>
              <p className="wn-eval-card__name">López Torres María</p>
              <p className="wn-eval-card__meta">Operativa · N.N. 018</p>
            </div>
            <span className="wn-score wn-score--red">62</span>
          </div>
          <div className="wn-pills">
            <span className="wn-pill">Operativo</span>
            <span className="wn-pill">DIC-MAY 2026</span>
            <span className="wn-pill wn-pill--red">⚠ Vencido · 01/06/2026</span>
          </div>
          <div className="wn-compromisos">
            Mejorar puntualidad en entrega de reportes diarios y asistir a capacitación mensual…
          </div>
        </div>

        <div className="wn-eval-card">
          <div className="wn-eval-card__top">
            <div>
              <p className="wn-eval-card__name">Herrera Vega Carlos</p>
              <p className="wn-eval-card__meta">Administrativo · N.N. 031</p>
            </div>
            <span className="wn-score wn-score--green">85</span>
          </div>
          <div className="wn-pills">
            <span className="wn-pill">Administrativo</span>
            <span className="wn-pill">DIC-MAY 2026</span>
            <span className="wn-pill wn-pill--muted">📅 Rev. 30/07/2026</span>
          </div>
          <div className="wn-compromisos">
            Fortalecer habilidades de comunicación con equipo y cumplir objetivos del Q3…
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mockup: SQL dev role ─────────────────────────────────────────────────────

function MockupSQL() {
  return (
    <div className="wn-mockup">
      <div className="wn-mockup__bar">
        <span className="wn-mockup__dot" style={{ background: "#ff5f57" }} />
        <span className="wn-mockup__dot" style={{ background: "#febc2e" }} />
        <span className="wn-mockup__dot" style={{ background: "#28c840" }} />
        <span className="wn-mockup__url">Supabase · SQL Editor</span>
      </div>
      <div className="wn-mockup__body wn-mockup__body--dark">
        <pre className="wn-sql"><code>{`<span class="wn-sql-comment">-- Asignar rol dev a un usuario</span>
<span class="wn-sql-kw">UPDATE</span> public.profiles
<span class="wn-sql-kw">SET</span>    role = <span class="wn-sql-str">'dev'</span>
<span class="wn-sql-kw">WHERE</span>  email = <span class="wn-sql-str">'tu@email.com'</span>;

<span class="wn-sql-comment">-- Verificar</span>
<span class="wn-sql-kw">SELECT</span> email, role
<span class="wn-sql-kw">FROM</span>   public.profiles
<span class="wn-sql-kw">WHERE</span>  email = <span class="wn-sql-str">'tu@email.com'</span>;`}
        </code></pre>
        <div className="wn-sql-result">
          <span className="wn-sql-result__label">Resultado</span>
          <div className="wn-sql-table">
            <div className="wn-sql-table__head">
              <span>email</span><span>role</span>
            </div>
            <div className="wn-sql-table__row">
              <span>leo@adm.com</span>
              <span className="wn-badge wn-badge--purple">dev</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slides definition ────────────────────────────────────────────────────────

const SLIDES: Slide[] = [
  {
    id: "welcome",
    badge: "¿Qué hay de nuevo?",
    title: "3 nuevas funciones implementadas",
    description:
      "Se agregaron herramientas para gestionar actas administrativas, planes de seguimiento y visualizar compromisos de evaluaciones de desempeño.",
    icon: <Sparkles size={22} />,
    mockup: (
      <div className="wn-welcome-grid">
        {[
          { icon: <FileWarning size={18} />, label: "Actas y Seguimiento", color: "red" },
          { icon: <TrendingDown size={18} />, label: "Seguimiento Compromisos", color: "orange" },
          { icon: <GraduationCap size={18} />, label: "Nuevo SQL para rol Dev", color: "purple" },
        ].map(({ icon, label, color }) => (
          <div key={label} className={`wn-feature-card wn-feature-card--${color}`}>
            <div className={`wn-feature-card__icon wn-feature-card__icon--${color}`}>{icon}</div>
            <p className="wn-feature-card__label">{label}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "actas",
    badge: "Capacitación → Historial",
    title: "Modal: Actas y Planes de Seguimiento",
    description:
      "Nuevo botón 🗂 por empleado en la tab Historial. Registra actas administrativas o planes de seguimiento con fecha de revisión, estatus y descripción.",
    icon: <FileWarning size={22} />,
    mockup: <MockupActas />,
  },
  {
    id: "seguimiento",
    badge: "Menú de usuario → Seguimiento",
    title: "Nueva sección: Seguimiento de Compromisos",
    description:
      "Accesible desde tu menú de perfil. Lista todas las evaluaciones con compromisos — reprobados (< 80) aparecen primero. Filtros por período, estado de revisión y alertas de vencimiento.",
    icon: <TrendingDown size={22} />,
    mockup: <MockupSeguimiento />,
  },
  {
    id: "sql",
    badge: "Supabase · SQL Editor",
    title: "SQL: Asignar rol Dev",
    description:
      "Ejecuta este UPDATE en el SQL Editor de Supabase para dar acceso completo a un usuario. El rol dev puede crear, editar y eliminar; admin es solo lectura.",
    icon: <GraduationCap size={22} />,
    mockup: <MockupSQL />,
  },
]

// ─── Animation variants ───────────────────────────────────────────────────────

const backdropV = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const panelV = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 30 } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18, ease: "easeIn" as const } },
}

const slideV = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0, transition: { duration: 0.2 } }),
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WhatsNewWizard() {
  const { role, loading } = useRole()
  const [open, setOpen]   = useState(false)
  const [step, setStep]   = useState(0)
  const [dir,  setDir]    = useState(1)

  useEffect(() => {
    if (loading) return
    if (role !== "dev") return
    if (typeof window === "undefined") return
    if (localStorage.getItem(WIZARD_KEY) === "seen") return
    // Small delay so layout settles first
    const t = setTimeout(() => setOpen(true), 1200)
    return () => clearTimeout(t)
  }, [role, loading])

  const dismiss = () => {
    setOpen(false)
    localStorage.setItem(WIZARD_KEY, "seen")
  }

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const current = SLIDES[step]
  const isLast  = step === SLIDES.length - 1

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="wn-backdrop"
            variants={backdropV}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={dismiss}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Novedades del sistema"
            className="wn-panel"
            variants={panelV}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* Close */}
            <button
              type="button"
              className="wn-close"
              onClick={dismiss}
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>

            {/* Left: info pane */}
            <div className="wn-info">
              {/* Step dots */}
              <div className="wn-dots">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Paso ${i + 1}`}
                    className={`wn-dot ${i === step ? "wn-dot--active" : ""}`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={current.id}
                  custom={dir}
                  variants={slideV}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="wn-slide"
                >
                  {/* Icon badge */}
                  <div className="wn-slide__icon">{current.icon}</div>

                  <span className="wn-slide__badge">{current.badge}</span>
                  <h2 className="wn-slide__title">{current.title}</h2>
                  <p className="wn-slide__desc">{current.description}</p>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="wn-nav">
                <button
                  type="button"
                  className="wn-nav__back"
                  onClick={() => goTo(step - 1)}
                  disabled={step === 0}
                  aria-label="Anterior"
                >
                  <ChevronLeft size={14} />
                  Atrás
                </button>

                {isLast ? (
                  <button
                    type="button"
                    className="wn-nav__done"
                    onClick={dismiss}
                  >
                    <CheckCircle2 size={14} />
                    ¡Entendido!
                  </button>
                ) : (
                  <button
                    type="button"
                    className="wn-nav__next"
                    onClick={() => goTo(step + 1)}
                  >
                    Siguiente
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>

              {/* Skip */}
              <button type="button" className="wn-skip" onClick={dismiss}>
                Saltar todo
              </button>
            </div>

            {/* Right: mockup pane */}
            <div className="wn-preview">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={current.id + "-mockup"}
                  custom={dir}
                  variants={slideV}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="wn-preview__inner"
                >
                  {current.mockup}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
