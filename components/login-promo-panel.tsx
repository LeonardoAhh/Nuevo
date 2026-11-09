"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import type { FocusEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Award, BookOpen, Briefcase, Building2, ClipboardList, Leaf, Search, ShieldCheck } from "lucide-react"
import { useAppReducedMotion } from "@/components/app-transition"

const ROTATION_INTERVAL = 4_500

// Mantén cada mensaje por debajo de ~45 caracteres para que no salte de línea en md:text-3xl.
const messages = [
  { title: "Capacitación", copy: "Aprender te hace crecer.", align: "text-left" },
  { title: "Tu avance", copy: "Un paso a la vez.", align: "text-right" },
  { title: "Constancia", copy: "Cada día cuenta.", align: "text-center" },
  { title: "Tu puesto", copy: "Crece en lo que haces.", align: "text-left" },
  { title: "Reconocimiento", copy: "Tu esfuerzo sí se nota.", align: "text-right" },
  { title: "Equipo", copy: "Juntos llegamos más lejos.", align: "text-center" },
] as const

const previewTabs = [
  { id: "empleados", label: "Empleados", icon: ClipboardList },
  { id: "cursos", label: "Cursos", icon: BookOpen },
  { id: "puestos", label: "Puestos", icon: Briefcase },
] as const

type PreviewTabId = (typeof previewTabs)[number]["id"]

// Datos ilustrativos del mockup: reemplázalos por cifras que se vean reales para tu catálogo.
const courseCategories = [
  { label: "Inducción", icon: Building2, completed: 2, total: 3 },
  { label: "Seguridad e Higiene", icon: ShieldCheck, completed: 5, total: 8 },
  { label: "Medio Ambiente", icon: Leaf, completed: 1, total: 4 },
  { label: "Calidad", icon: Award, completed: 3, total: 6 },
] as const

const totalCompleted = courseCategories.reduce((sum, category) => sum + category.completed, 0)
const totalCourses = courseCategories.reduce((sum, category) => sum + category.total, 0)
const progressPercent = Math.round((totalCompleted / totalCourses) * 100)

const ACTIVE_TAB: PreviewTabId = "cursos"

const wordsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const wordVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

export default function LoginPromoPanel() {
  const panelRef = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const [isInView, setIsInView] = useState(true)
  const [isPageVisible, setIsPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  )
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const reducedMotion = useAppReducedMotion()

  const isPaused = isHovered || isFocused

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting))
      : null
    observer?.observe(panel)

    const updateVisibility = () => setIsPageVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", updateVisibility)

    return () => {
      observer?.disconnect()
      document.removeEventListener("visibilitychange", updateVisibility)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion || isPaused || !isInView || !isPageVisible) return

    const timeout = window.setTimeout(
      () => setIndex(current => (current + 1) % messages.length),
      ROTATION_INTERVAL,
    )
    return () => window.clearTimeout(timeout)
  }, [index, isPaused, isInView, isPageVisible, reducedMotion])

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    // Solo se reanuda cuando el foco sale por completo del panel.
    if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false)
  }

  const message = messages[index]
  const direction = index % 2 === 0 ? 1 : -1

  return (
    <aside
      ref={panelRef}
      aria-label="Capacitación y desarrollo del equipo"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={handleBlur}
      className="hidden min-h-0 flex-col p-8 sm:flex md:p-12 lg:p-16"
    >
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex w-full max-w-[36rem] flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: direction * 24, y: direction * -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: direction * -16, y: 8 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full ${message.align}`}
            >
              <span className="sr-only">{message.title}. {message.copy}</span>
              <div aria-hidden="true">
                <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">{message.title}</p>
                <motion.p
                  variants={wordsContainerVariants}
                  initial={reducedMotion ? false : "hidden"}
                  animate="visible"
                  className="text-heading-md font-semibold text-foreground md:text-heading-lg"
                >
                  {message.copy.split(" ").map((word, wordIndex) => (
                    <Fragment key={wordIndex}>
                      {wordIndex > 0 ? " " : null}
                      <motion.span variants={wordVariants} className="inline-block">
                        {word}
                      </motion.span>
                    </Fragment>
                  ))}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div
            aria-hidden="true"
            className="mt-8 overflow-hidden rounded-xl border border-border bg-card text-left"
          >
            <div className="flex min-h-64">
              <div className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-border bg-muted/50 py-4 lg:flex">
                {previewTabs.map(({ id, icon: Icon }) => (
                  <span
                    key={id}
                    className={`flex size-8 items-center justify-center rounded-md ${
                      id === ACTIVE_TAB
                        ? "border border-border bg-card text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-semibold text-foreground">Capacitación</span>
                </div>
                <div className="flex border-b border-border px-3 pt-2">
                  {previewTabs.map(({ id, label, icon: Icon }) => (
                    <div
                      key={id}
                      className={`flex min-w-0 flex-1 items-center justify-center gap-1 border-b px-0.5 pb-2 text-xs font-medium ${
                        id === ACTIVE_TAB
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-3 shrink-0" />
                      <span className="truncate">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-heading-md font-semibold text-foreground">
                      Catálogo de cursos
                    </h2>
                    <div className="flex h-8 min-w-0 items-center gap-2 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground lg:w-36">
                      <Search className="size-3.5 shrink-0" />
                      <span className="truncate">Buscar curso...</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">Tu avance</span>
                      <span className="tabular-nums text-muted-foreground">
                        {totalCompleted} de {totalCourses} cursos
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-muted">
                      <div
                        className="h-full rounded-sm bg-primary"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    {courseCategories.map(({ label, icon: Icon, completed, total }) => (
                      <div
                        key={label}
                        className="flex min-w-0 items-center gap-2 border-b border-border py-2.5 last:border-b-0"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-xs leading-4 text-foreground">{label}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {completed}/{total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div role="group" aria-label="Elegir mensaje" className="mt-4 flex justify-center">
            {messages.map((item, itemIndex) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Ver mensaje: ${item.title}`}
                aria-pressed={itemIndex === index}
                onClick={() => setIndex(itemIndex)}
                className="group flex size-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={`block h-1.5 rounded-sm transition-[width,background-color] ${
                    itemIndex === index ? "w-4 bg-primary" : "w-1.5 bg-border group-hover:bg-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}