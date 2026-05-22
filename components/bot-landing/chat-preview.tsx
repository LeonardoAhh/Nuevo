"use client"

import { motion } from "framer-motion"
import { CheckCheck } from "lucide-react"

/**
 * Stylised mobile chat preview that animates in as the hero loads.
 * Theme-aware: uses tokens, no hardcoded brand green.
 *
 * Content mirrors the real bot output (see `lib/whatsapp/compliance.ts`):
 *  - employee sends their number
 *  - bot replies with name, position, % and course lists
 */
export default function ChatPreview() {
  const bubbles: Bubble[] = [
    { who: "user", text: "12345", delay: 0.2 },
    {
      who: "bot",
      delay: 0.8,
      rich: (
        <>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Cumplimiento
          </div>
          <div className="mt-1.5 text-sm font-semibold text-foreground">
            Juan Pérez González
          </div>
          <div className="text-xs text-muted-foreground">Maquinista · Producción</div>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "80%" }}
                transition={{ duration: 1.1, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
              />
            </div>
            <span className="min-w-[2ch] text-sm font-semibold text-foreground">80%</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">4 de 5 cursos</div>
          <ul className="mt-3 space-y-1 text-xs">
            <li className="flex items-center gap-1.5 text-success">
              <span className="inline-block size-1.5 rounded-full bg-success" aria-hidden />
              Seguridad Industrial
            </li>
            <li className="flex items-center gap-1.5 text-success">
              <span className="inline-block size-1.5 rounded-full bg-success" aria-hidden />
              Calidad Básica
            </li>
            <li className="flex items-center gap-1.5 text-warning">
              <span className="inline-block size-1.5 rounded-full bg-warning" aria-hidden />
              RG-REC-048 pendiente
            </li>
          </ul>
        </>
      ),
    },
  ]

  return (
    <div className="relative">
      {/* Phone frame */}
      <div className="mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-[2.25rem] border border-border/70 bg-card shadow-2xl">
        {/* Top chrome — mimics a chat header */}
        <div className="flex items-center gap-3 border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur">
          <div className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary">
            <span className="text-[13px] font-semibold">CQ</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              Capacitación Qro
            </p>
            <p className="truncate text-[11px] text-muted-foreground">en línea</p>
          </div>
        </div>

        {/* Chat body */}
        <div
          className="relative flex h-[calc(100%-3.25rem)] flex-col gap-2 overflow-hidden px-3 py-4"
          aria-hidden
        >
          {/* subtle dotted backdrop that stays visible in dark mode too */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          {bubbles.map((b, i) => (
            <ChatBubble key={i} {...b} />
          ))}
        </div>
      </div>
    </div>
  )
}

type Bubble =
  | { who: "user"; text: string; delay: number }
  | { who: "bot"; rich: React.ReactNode; delay: number }

function ChatBubble(b: Bubble) {
  const align = b.who === "user" ? "self-end" : "self-start"
  const bg = b.who === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border/60"
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: b.delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative max-w-[80%] rounded-2xl px-3 py-2 text-left shadow-sm ${align} ${bg}`}
    >
      {"text" in b ? (
        <>
          <p className="text-sm font-semibold">{b.text}</p>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] opacity-80">
            <span>10:24</span>
            <CheckCheck className="size-3" aria-hidden />
          </div>
        </>
      ) : (
        b.rich
      )}
    </motion.div>
  )
}
