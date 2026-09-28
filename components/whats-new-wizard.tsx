"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight, X, CheckCircle2, FileWarning,
  TrendingDown, GraduationCap, Sparkles, ChevronLeft,
  Briefcase, LayoutDashboard, LogOut, Award, FileText, Settings, ChevronRight
} from "lucide-react"
import { useRole } from "@/lib/hooks"

// ─── Version key ─────────────────────────────────────────────────────────────
// Bump this string to re-show the wizard after a new deployment.
const WIZARD_KEY = "whats_new_v5_sidebar_flyout"

// ─── Slide data ───────────────────────────────────────────────────────────────

interface Slide {
  id: string
  badge: string
  title: string
  description: string
  icon: React.ReactNode
  mockup: React.ReactNode
}

// ─── Mockups (idénticos en estructura, mejorados visualmente) ─────────────────

function MockupSidebar() {
  return (
    <div className="wn-mockup" style={{ display: "flex", flexDirection: "row", background: "hsl(var(--background))" }}>
      <div style={{ width: "64px", borderRight: "1px solid hsl(var(--border))", display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0", alignItems: "center" }}>
        <div style={{ width: "32px", height: "32px", background: "hsl(var(--primary)/0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))" }}>
          <Briefcase size={16} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
          <div style={{ width: "32px", height: "32px", background: "hsl(var(--primary)/0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))" }}>
            <GraduationCap size={16} />
          </div>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--muted-foreground))" }}>
            <Award size={16} />
          </div>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--muted-foreground))" }}>
            <FileText size={16} />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "2rem 1rem", position: "relative" }}>
        <div style={{ position: "absolute", top: "4rem", left: "-0.5rem", width: "160px", background: "hsl(var(--background)/0.8)", backdropFilter: "blur(12px)", border: "1px solid hsl(var(--border)/0.5)", borderRadius: "12px", padding: "0.5rem", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}>
          <p style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", padding: "0.25rem 0.5rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}>Capacitación</p>
          <div style={{ fontSize: "12px", padding: "0.5rem", background: "hsl(var(--accent)/0.5)", borderRadius: "6px", marginBottom: "0.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Presentaciones</span>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(var(--primary))" }} />
          </div>
          <div style={{ fontSize: "12px", padding: "0.5rem", borderRadius: "6px" }}>Categorías</div>
          <div style={{ fontSize: "12px", padding: "0.5rem", borderRadius: "6px" }}>Exámenes</div>
        </div>
      </div>
    </div>
  )
}

function MockupHeader() {
  return (
    <div className="wn-mockup" style={{ background: "hsl(var(--background))", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "1rem", borderBottom: "1px solid hsl(var(--border))" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "hsl(var(--primary)/0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))", fontWeight: "bold", fontSize: "12px" }}>U</div>
          <div style={{ position: "absolute", top: "40px", right: "0", width: "180px", background: "hsl(var(--background)/0.8)", backdropFilter: "blur(12px)", border: "1px solid hsl(var(--border)/0.5)", borderRadius: "12px", padding: "0.25rem", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "hsl(var(--primary)/0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))", fontWeight: "bold", fontSize: "10px" }}>U</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold" }}>Usuario</span>
                <span style={{ fontSize: "10px", color: "hsl(var(--muted-foreground))" }}>user@viño.com</span>
              </div>
            </div>
            <div style={{ height: "1px", background: "hsl(var(--border))", margin: "0.25rem 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", color: "hsl(var(--destructive))", fontSize: "12px" }}>
              <LogOut size={14} />
              <span>Cerrar sesión</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockupMotivation() {
  return (
    <div className="wn-mockup" style={{ border: "none", boxShadow: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <div style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", padding: "1rem", borderRadius: "1rem" }}>
          <Sparkles size={48} />
        </div>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "hsl(var(--foreground))" }}>
            Gracias por el esfuerzo que no siempre se ve.
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.6, marginTop: "0.5rem", maxWidth: "340px", marginInline: "auto" }}>
            Sabemos que hay días complejos y decisiones difíciles detrás de escena. Queremos que sepas que valoramos profundamente tu entrega.
          </p>
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
    title: "Nueva Barra de Navegación",
    description: "Hemos rediseñado por completo la barra lateral para ofrecerte una experiencia más limpia, rápida y libre de distracciones con menús flotantes.",
    icon: <Sparkles size={22} />,
    mockup: (
      <div className="wn-welcome-grid">
        {[
          { icon: <LayoutDashboard size={18} />, label: "Diseño minimalista", color: "purple" },
          { icon: <ChevronRight size={18} />, label: "Menús Fly-out", color: "green" },
          { icon: <Briefcase size={18} />, label: "Selector Empresarial", color: "orange" },
          { icon: <Settings size={18} />, label: "Header despejado", color: "red" },
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
    id: "sidebar",
    badge: "Sidebar",
    title: "Menús Flotantes (Fly-outs)",
    description: "Agrupamos las opciones principales en una barra lateral de solo íconos. Al pasar el cursor o hacer clic, el submenú se despliega hacia la derecha en una elegante tarjeta, sin empujar tu contenido.",
    icon: <LayoutDashboard size={22} />,
    mockup: <MockupSidebar />,
  },
  {
    id: "header",
    badge: "Navegación",
    title: "Un perfil más limpio",
    description: "Hemos movido todas las opciones de navegación que saturaban tu perfil directamente a la nueva barra lateral. Ahora, el menú de perfil en la esquina superior derecha está dedicado exclusivamente a tu cuenta y a cerrar sesión.",
    icon: <Settings size={22} />,
    mockup: <MockupHeader />,
  },
  {
    id: "motivation",
    badge: "¡Gracias!",
    title: "Tu experiencia nos importa",
    description: "Sabemos el esfuerzo que dedicas al desarrollo de nuestra gente, por eso tus comentarios son clave para construir una herramienta que verdaderamente facilite tu día a día.",
    icon: <Sparkles size={22} />,
    mockup: <MockupMotivation />,
  }
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
    const t = setTimeout(() => setOpen(true), 800)
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
        <motion.div
          role="region"
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
      )}
    </AnimatePresence>
  )
}
