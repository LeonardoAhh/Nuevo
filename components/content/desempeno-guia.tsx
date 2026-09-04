"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { GUIDE_COPY, GUIDE_STEPS } from "./desempeno/guide-steps";
import { GuideProgress } from "./desempeno/guide-progress";
import { GuideStepContent } from "./desempeno/guide-step-content";
import { useEvaluationReducedMotion } from "./desempeno/use-evaluation-motion";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "desempeno-guia-vista";
export function guiaYaVista(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}
function marcarGuiaVista(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch { /* SSR / modo privado */ }
}

interface DesempenoGuiaProps {
  open: boolean;
  onClose: () => void;
}

export function DesempenoGuia({ open, onClose }: DesempenoGuiaProps) {
  const [step, setStep] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useEvaluationReducedMotion();
  const isLast = step === GUIDE_STEPS.length - 1;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("guia-open", open);
    return () => root.classList.remove("guia-open");
  }, [open]);

  const goTo = (next: number) => {
    setStep(Math.max(0, Math.min(GUIDE_STEPS.length - 1, next)));
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };
  const handleClose = () => {
    marcarGuiaVista();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) handleClose(); }}>
      <DialogContent
        raw
        className={cn("overflow-hidden sm:max-w-md", reducedMotion && "!animate-none")}
        onOpenAutoFocus={event => {
          event.preventDefault();
          previousFocusRef.current = document.activeElement as HTMLElement | null;
          titleRef.current?.focus();
        }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          previousFocusRef.current?.focus();
          setStep(0);
        }}
        onKeyDown={event => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            goTo(step + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
          <span className="shrink-0 text-primary" aria-hidden="true">
            <CircleHelp className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <DialogTitle ref={titleRef} tabIndex={-1} className="text-base leading-snug outline-none">{GUIDE_COPY.title}</DialogTitle>
            <DialogDescription className="sr-only">{GUIDE_COPY.description}</DialogDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={handleClose} aria-label={GUIDE_COPY.close}>
            <X aria-hidden="true" />
          </Button>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-4 pt-1">
          <GuideProgress current={step} onSelect={goTo} />
          <GuideStepContent key={GUIDE_STEPS[step].id} step={GUIDE_STEPS[step]} index={step} />
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t px-4 pt-3 pb-3 safe-bottom-content">
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
            <ChevronLeft aria-hidden="true" />
            {GUIDE_COPY.previous}
          </Button>
          <Button type="button" onClick={isLast ? handleClose : () => goTo(step + 1)}>
            {isLast ? GUIDE_COPY.finish : GUIDE_COPY.next}
            {isLast ? <Check aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
