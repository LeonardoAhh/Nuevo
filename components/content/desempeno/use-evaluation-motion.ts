"use client";

import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/components/theme-context";
export function useEvaluationReducedMotion() {
  const systemPreference = useReducedMotion();
  const {
    reducedMotion
  } = useTheme();
  return reducedMotion || !!systemPreference;
}
