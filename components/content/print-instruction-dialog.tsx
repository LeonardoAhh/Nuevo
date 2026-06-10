"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, AlertTriangle } from "lucide-react"

/* ─────────────────────────────────────────────────────────────────
   Estilos del mockup animado del diálogo de impresión de Chrome.

   Sin hardcodes: todos los colores derivan de tokens CSS del sistema.
   El panel usa --foreground como fondo (simula la UI oscura de Chrome
   independientemente del tema activo del sistema).

   LÍNEA DE TIEMPO — ciclo de 9 s:
   ┌─────────────────────────────────────────────────────────────────┐
   │  0.0 – 1.5s  FASE 0  Pausa inicial: fila colapsada visible     │
   │  1.5 – 2.5s  FASE 1  Cursor viaja a "Más opciones"             │
   │  2.5 – 2.8s            Click en "Más opciones"                  │
   │  2.8 – 3.5s  FASE 2  Fila "Opciones" se expande (slide-down)   │
   │              FASE 2  Checkbox aparece MARCADO                   │
   │  3.5 – 4.5s  FASE 3  Cursor viaja al checkbox                  │
   │  4.5 – 4.8s            Click → checkbox se desmarca             │
   │  4.8 – 7.0s  FASE 4  Pausa: estado desmarcado visible          │
   │  7.0 – 9.0s  FASE 5  Fade-out y reset para próximo ciclo       │
   └─────────────────────────────────────────────────────────────────┘
──────────────────────────────────────────────────────────────────── */
const MOCKUP_STYLES = `
  /* ── Panel principal ────────────────────────────────────────────── */
  .cdp-panel {
    background-color: hsl(var(--foreground));
    border-radius: var(--radius);
    border: 1px solid hsl(var(--border) / 0.4);
    overflow: hidden;
    user-select: none;
  }

  /* ── Fila base ───────────────────────────────────────────────────── */
  .cdp-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.875rem;
    gap: 0.75rem;
    position: relative;
  }

  .cdp-row-label {
    font-size: 0.75rem;
    line-height: 1.4;
    color: hsl(var(--background) / 0.85);
  }

  .cdp-row-label-dim {
    color: hsl(var(--background) / 0.35);
  }

  .cdp-divider {
    height: 1px;
    background-color: hsl(var(--background) / 0.08);
    margin: 0;
  }

  /* ── FASE 1: Fila "Más opciones de configuración" ───────────────── */
  .cdp-more-row {
    cursor: pointer;
    padding: 0.5rem 0.875rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Highlight de hover/click sobre la fila */
  .cdp-more-row::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: hsl(var(--background) / 0.08);
    opacity: 0;
    border-radius: 0;
    animation: cdpMoreHover 9s linear infinite;
  }

  @keyframes cdpMoreHover {
    0%, 14%   { opacity: 0; }
    16%       { opacity: 1; }
    31%       { opacity: 1; }
    33%       { opacity: 0; }
    100%      { opacity: 0; }
  }

  /* Chevron que rota al expandir */
  .cdp-chevron {
    width: 0.875rem;
    height: 0.875rem;
    color: hsl(var(--background) / 0.55);
    flex-shrink: 0;
    animation: cdpChevronRotate 9s linear infinite;
    transform-origin: center;
  }

  @keyframes cdpChevronRotate {
    0%, 30%   { transform: rotate(0deg); }
    38%       { transform: rotate(180deg); }
    88%       { transform: rotate(180deg); }
    96%       { transform: rotate(0deg); }
    100%      { transform: rotate(0deg); }
  }

  /* ── FASE 2: Sección "Opciones" expandida ───────────────────────── */
  .cdp-options-section {
    overflow: hidden;
    animation: cdpOptionsExpand 9s linear infinite;
    transform-origin: top;
  }

  @keyframes cdpOptionsExpand {
    0%, 30%   { max-height: 0; opacity: 0; }
    40%       { max-height: 120px; opacity: 1; }
    88%       { max-height: 120px; opacity: 1; }
    96%       { max-height: 0; opacity: 0; }
    100%      { max-height: 0; opacity: 0; }
  }

  /* Encabezado "Opciones" dentro de la sección */
  .cdp-section-header {
    padding: 0.375rem 0.875rem 0.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: hsl(var(--background) / 0.4);
  }

  /* ── Checkbox estilo Chrome ──────────────────────────────────────── */
  .cdp-option-row {
    display: flex;
    align-items: flex-start;
    padding: 0.35rem 0.875rem 0.45rem;
    gap: 0.625rem;
    position: relative;
  }

  /* Highlight de foco cuando el cursor se acerca */
  .cdp-option-row::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: hsl(var(--primary) / 0.1);
    opacity: 0;
    animation: cdpOptionHover 9s linear infinite;
  }

  @keyframes cdpOptionHover {
    0%, 37%   { opacity: 0; }
    42%       { opacity: 1; }
    53%       { opacity: 1; }
    57%       { opacity: 0; }
    100%      { opacity: 0; }
  }

  .cdp-checkbox {
    width: 0.9375rem;
    height: 0.9375rem;
    border-radius: 2px;
    border: 2px solid hsl(var(--primary));
    background-color: hsl(var(--primary));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    position: relative;
    animation: cdpCheckboxState 9s linear infinite;
  }

  @keyframes cdpCheckboxState {
    0%, 38%   { background-color: hsl(var(--primary)); border-color: hsl(var(--primary)); transform: scale(1); }
    49%       { transform: scale(0.78); }
    51%       { transform: scale(1.07); }
    53%, 88%  { background-color: transparent; border-color: hsl(var(--background) / 0.4); transform: scale(1); }
    96%       { background-color: hsl(var(--primary)); border-color: hsl(var(--primary)); transform: scale(1); }
    100%      { background-color: hsl(var(--primary)); border-color: hsl(var(--primary)); transform: scale(1); }
  }

  .cdp-checkmark {
    animation: cdpCheckmarkState 9s linear infinite;
  }

  @keyframes cdpCheckmarkState {
    0%, 47%   { opacity: 1; transform: scale(1); }
    53%       { opacity: 0; transform: scale(0.3) rotate(-15deg); }
    88%       { opacity: 0; }
    96%       { opacity: 1; transform: scale(1); }
    100%      { opacity: 1; transform: scale(1); }
  }

  .cdp-option-label {
    font-size: 0.75rem;
    line-height: 1.35;
    color: hsl(var(--background) / 0.85);
  }

  /* ── Ripple de click en el checkbox ─────────────────────────────── */
  .cdp-ripple {
    position: absolute;
    inset: -0.4rem;
    border-radius: 50%;
    border: 1.5px solid hsl(var(--primary));
    opacity: 0;
    pointer-events: none;
    animation: cdpRipple 9s linear infinite;
  }

  @keyframes cdpRipple {
    0%, 48%   { transform: scale(0.5); opacity: 0; }
    50%       { transform: scale(0.5); opacity: 0.8; }
    56%       { transform: scale(2);   opacity: 0; }
    100%      { opacity: 0; }
  }

  /* ── CURSOR 1 — viaja a "Más opciones" ──────────────────────────── */
  .cdp-cursor-1 {
    position: absolute;
    width: 1rem;
    height: 1rem;
    color: hsl(var(--background));
    filter: drop-shadow(0 1px 3px hsl(var(--foreground) / 0.6));
    pointer-events: none;
    transform-origin: top left;
    bottom: 0.3rem;
    right: 1.5rem;
    animation: cdpCursor1 9s linear infinite;
  }

  @keyframes cdpCursor1 {
    0%      { transform: translate(40px, 20px); opacity: 0; }
    10%     { transform: translate(40px, 20px); opacity: 0; }
    17%     { transform: translate(0px, 0px);   opacity: 1; }
    27%     { transform: translate(1px, 1px) scale(0.9); opacity: 1; }
    30%     { transform: translate(0px, 0px) scale(1);   opacity: 1; }
    38%     { transform: translate(20px, 15px); opacity: 0; }
    100%    { transform: translate(40px, 20px); opacity: 0; }
  }

  /* ── CURSOR 2 — viaja al checkbox ───────────────────────────────── */
  .cdp-cursor-2 {
    position: absolute;
    width: 1rem;
    height: 1rem;
    color: hsl(var(--background));
    filter: drop-shadow(0 1px 3px hsl(var(--foreground) / 0.6));
    pointer-events: none;
    transform-origin: top left;
    top: 0.15rem;
    left: 0.5rem;
    animation: cdpCursor2 9s linear infinite;
  }

  @keyframes cdpCursor2 {
    0%, 35%  { transform: translate(-30px, 30px); opacity: 0; }
    44%      { transform: translate(0px, 0px);    opacity: 1; }
    49%      { transform: translate(1px, 1px) scale(0.9); opacity: 1; }
    52%      { transform: translate(0px, 0px) scale(1);   opacity: 1; }
    62%      { transform: translate(-20px, 20px); opacity: 0; }
    100%     { transform: translate(-30px, 30px); opacity: 0; }
  }

  /* ── Reduced motion — estado estático final (desmarcado) ────────── */
  @media (prefers-reduced-motion: reduce) {
    .cdp-options-section {
      animation: none !important;
      max-height: 120px !important;
      opacity: 1 !important;
    }
    .cdp-chevron            { animation: none !important; transform: rotate(180deg) !important; }
    .cdp-checkbox           { animation: none !important; background-color: transparent !important; border-color: hsl(var(--background) / 0.4) !important; }
    .cdp-checkmark          { animation: none !important; opacity: 0 !important; }
    .cdp-cursor-1,
    .cdp-cursor-2           { animation: none !important; opacity: 0 !important; }
    .cdp-ripple             { animation: none !important; opacity: 0 !important; }
    .cdp-more-row::before,
    .cdp-option-row::before { animation: none !important; opacity: 0 !important; }
  }
`

/* ─────────────────────────────────────────────────────────────────
   SVG reutilizable del cursor
──────────────────────────────────────────────────────────────────── */
function CursorSvg({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 512"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M302.189 329.126H196.105l55.831 135.993c3.889 9.428-.555 19.999-9.444 23.999l-49.165 21.427c-9.165 4-19.443-.571-23.332-9.714l-53.053-129.136-86.664 89.138C22.279 469.975 8 464.261 8 453.407V46.593c0-10.854 14.279-16.568 22.277-8.569l288.948 274.672c8.89 8.57 2.223 23.43-10.036 23.43z" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Mockup del diálogo de impresión de Chrome
──────────────────────────────────────────────────────────────────── */
function ChromePrintMockup() {
  return (
    <div
      className="cdp-panel"
      role="img"
      aria-label="Animación: cómo desmarcar Encabezados y pies de página en el diálogo de impresión de Chrome"
    >
      {/* Fila superior (dim) — contexto */}
      <div className="cdp-row">
        <span className="cdp-row-label cdp-row-label-dim">Destino</span>
        <span className="cdp-row-label cdp-row-label-dim" style={{ opacity: 0.5 }}>
          Imprimir
        </span>
      </div>
      <div className="cdp-divider" />

      {/* Fila "Más opciones de configuración" — FASE 1 */}
      <div className="cdp-more-row" style={{ position: "relative" }}>
        <span className="cdp-row-label" style={{ color: "hsl(var(--background) / 0.75)" }}>
          Más opciones de configuración
        </span>
        <CursorSvg className="cdp-cursor-1" />
        <svg
          className="cdp-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Sección expandida — FASE 2 + 3 */}
      <div className="cdp-options-section">
        <div className="cdp-divider" />
        <p className="cdp-section-header">Opciones</p>
        <div className="cdp-option-row">
          <div className="cdp-checkbox">
            <div className="cdp-ripple" />
            <svg
              className="cdp-checkmark"
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(var(--background))"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CursorSvg className="cdp-cursor-2" />
          <span className="cdp-option-label">
            Encabezados y pies de<br />página
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   Props
──────────────────────────────────────────────────────────────────── */
interface PrintInstructionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/* ─────────────────────────────────────────────────────────────────
   Componente principal
──────────────────────────────────────────────────────────────────── */
export function PrintInstructionDialog({
  open,
  onOpenChange,
  onConfirm,
}: PrintInstructionDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false)
    // Pequeño delay para que el modal se cierre antes de invocar la impresión
    setTimeout(onConfirm, 200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Estilos del mockup — scoped, sin contaminar globales */}
      <style>{MOCKUP_STYLES}</style>

      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader className="items-center text-center gap-3">

          {/* Ícono — tokens semánticos de warning */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-warning/15">
            <AlertTriangle
              className="h-6 w-6"
              style={{ color: "hsl(var(--warning))" }}
              aria-hidden="true"
            />
          </div>

          <DialogTitle className="text-xl">
            Un paso antes de imprimir
          </DialogTitle>

          {/* ── Descripción con pasos numerados ── */}
          <DialogDescription asChild>
            <div className="text-left space-y-3 pt-1">

              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                El navegador oculta una opción que puede arruinar el formato.
                Sigue estos pasos antes de continuar:
              </p>

              <ol className="space-y-2">

                {/* Paso 1 */}
                <li className="flex items-start gap-3 rounded-md bg-secondary p-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-medium text-primary mt-0.5">
                    1
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      Abre "Más opciones de configuración"
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Está al final del panel izquierdo. Haz clic para expandirlo.
                    </p>
                  </div>
                </li>

                {/* Paso 2 */}
                <li className="flex items-start gap-3 rounded-md bg-secondary p-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-medium text-primary mt-0.5">
                    2
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      Busca la sección "Opciones"
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Aparecerá justo debajo, con una casilla de verificación.
                    </p>
                  </div>
                </li>

                {/* Paso 3 — crítico */}
                <li
                  className="flex items-start gap-3 rounded-md bg-secondary p-3"
                  style={{ border: "1px solid hsl(var(--warning) / 0.3)" }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium mt-0.5"
                    style={{
                      backgroundColor: "hsl(var(--warning) / 0.15)",
                      color: "hsl(var(--warning))",
                    }}
                  >
                    3
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      Desmarca "Encabezados y pies de página"
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      La casilla debe quedar{" "}
                      <strong className="text-foreground font-medium">vacía</strong>
                      {" "}— sin palomita. Esto evita que el navegador imprima la URL
                      y la fecha encima del documento.
                    </p>
                  </div>
                </li>

              </ol>
            </div>
          </DialogDescription>

        </DialogHeader>

        {/* Mockup animado */}
        <div className="my-1">
          <ChromePrintMockup />
        </div>

        <DialogFooter className="sm:justify-center flex-col-reverse sm:flex-row gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Printer className="h-4 w-4" aria-hidden="true" />
            Entendido, imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
