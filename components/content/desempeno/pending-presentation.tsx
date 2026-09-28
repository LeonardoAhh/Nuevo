"use client";

import { type PendingEvalEntry } from "@/lib/hooks/usePendingEvals";
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const containerV = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};
export const itemV = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 6
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: EASE_OUT
    }
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    y: 4,
    transition: {
      duration: 0.18
    }
  }
};
export const MESES_ES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"] as const;
export function periodoLabel(fechaIso: string): string {
  const m = Number(fechaIso.split("-")[1]); // 1-indexed
  const start = m === 1 ? 12 : m - 1;
  return `${MESES_ES[start - 1]} – ${MESES_ES[m - 1]}`;
}
export type Periodo = PendingEvalEntry["periodo"];
export const PERIODO_BADGE: Record<Periodo, {
  bg: string;
  text: string;
}> = {
  "1er Mes": {
    bg: "bg-info",
    text: "text-info-foreground"
  },
  "2° Mes": {
    bg: "bg-primary",
    text: "text-primary-foreground"
  },
  "3er Mes": {
    bg: "bg-warning",
    text: "text-warning-foreground"
  }
};
