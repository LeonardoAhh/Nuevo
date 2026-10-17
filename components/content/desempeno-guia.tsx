"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EvaluationTutorial } from "./desempeno/evaluation-tutorial";
import { useEvaluationReducedMotion } from "./desempeno/use-evaluation-motion";
import { cn } from "@/lib/utils";

interface DesempenoGuiaProps {
  open: boolean;
  onClose: () => void;
}

export function DesempenoGuia({ open, onClose }: DesempenoGuiaProps) {
  const [mode, setMode] = useState<"intro" | "practice">("intro");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useEvaluationReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("guia-open", open);
    return () => root.classList.remove("guia-open");
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) handleClose(); }}>
      <DialogContent
        raw
        className={cn("overflow-hidden", mode === "practice" ? "sm:max-h-[90dvh] sm:max-w-3xl" : "sm:max-w-md", reducedMotion && "!animate-none")}
        onPointerDownOutside={event => event.preventDefault()}
        onEscapeKeyDown={event => { if (mode === "intro") event.preventDefault(); }}
        onOpenAutoFocus={event => {
          event.preventDefault();
          previousFocusRef.current = document.activeElement as HTMLElement | null;
          titleRef.current?.focus();
        }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          previousFocusRef.current?.focus();
          setMode("intro");
        }}
      >
        <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
          <DialogTitle ref={titleRef} tabIndex={-1} className="min-w-0 flex-1 text-base leading-snug outline-none">
            {mode === "intro" ? "Primero, practica" : "Práctica de evaluación"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === "intro" ? "Elige practicar con un ejemplo o continuar sin práctica." : "Practica cada sección de una evaluación con datos ficticios. Ningún dato se guarda."}
          </DialogDescription>
          {mode === "practice" && <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={handleClose} aria-label="Salir de la práctica">
            <X aria-hidden="true" />
          </Button>}
        </header>
        {mode === "intro" ? (
          <div className="space-y-4 p-4 sm:p-6">
            <p className="text-sm leading-relaxed">
              Aprende a evaluar con un ejemplo. Son 7 pasos con datos ficticios; nada se guarda ni se imprime.
            </p>
            <div className="flex flex-col items-stretch gap-2">
              <motion.div
                animate={reducedMotion ? undefined : { scale: [1, 1.035, 1] }}
                transition={reducedMotion ? undefined : { duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
              >
                <Button type="button" onClick={() => setMode("practice")} className="min-h-11 w-full">
                  <GraduationCap aria-hidden="true" /> Empezar práctica
                </Button>
              </motion.div>
              <Button type="button" variant="ghost" onClick={handleClose} className="min-h-11 text-muted-foreground">Omitir y evaluar ahora</Button>
            </div>
          </div>
        ) : <EvaluationTutorial onFinish={handleClose} />}
      </DialogContent>
    </Dialog>
  );
}
