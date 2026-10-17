"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "./pending-presentation";
import { useEvaluationReducedMotion } from "./use-evaluation-motion";

interface DepartmentPageProps {
  pageKey: string;
  direction: -1 | 1;
  children: ReactNode;
}

export function DepartmentPage({ pageKey, direction, children }: DepartmentPageProps) {
  const reducedMotion = useEvaluationReducedMotion();

  return <div className="relative -m-1 overflow-hidden p-1">
    <AnimatePresence initial={false} custom={direction} mode="popLayout">
      <motion.div
        key={pageKey}
        custom={direction}
        initial="enter"
        animate="center"
        exit="exit"
        variants={{
          enter: (side: -1 | 1) => ({ x: reducedMotion ? "0%" : `${side * 100}%`, opacity: reducedMotion ? 1 : 0.75 }),
          center: { x: "0%", opacity: 1 },
          exit: (side: -1 | 1) => ({ x: reducedMotion ? "0%" : `${side * -100}%`, opacity: reducedMotion ? 1 : 0.75 }),
        }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  </div>;
}
