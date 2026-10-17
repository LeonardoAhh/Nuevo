"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DepartmentPagerProps {
  label: string;
  index: number;
  total: number;
  previousLabel?: string;
  nextLabel?: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function DepartmentPager({
  label,
  index,
  total,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
}: DepartmentPagerProps) {
  const displayLabel = label.length <= 4 && !label.includes(" ")
    ? label
    : label.toLocaleLowerCase("es-MX").replace(/^./u, letter => letter.toLocaleUpperCase("es-MX"));

  return <nav aria-label="Navegar entre departamentos" className="flex min-w-0 max-w-full items-center gap-1">
    {total > 1 && <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11 shrink-0"
      onClick={onPrevious}
      disabled={index === 0}
      aria-label={previousLabel ? `Departamento anterior: ${previousLabel}` : "Primer departamento"}
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
    </Button>}
    <span aria-live="polite" aria-atomic="true" className="min-w-0 truncate text-sm font-semibold leading-5 text-foreground">
      {displayLabel}
    </span>
    {total > 1 && <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11 shrink-0"
      onClick={onNext}
      disabled={index === total - 1}
      aria-label={nextLabel ? `Departamento siguiente: ${nextLabel}` : "Último departamento"}
    >
      <ChevronRight className="size-4" aria-hidden="true" />
    </Button>}
  </nav>;
}
