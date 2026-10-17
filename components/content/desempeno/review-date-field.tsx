"use client";

import { WeekStripCalendar } from "@/components/ui/week-strip-calendar";

function parseReviewDate(value: string): Date | undefined {
  const parts = value.includes("/") ? value.split("/").map(Number).reverse() : value.split("-").map(Number);
  if (parts.length !== 3 || parts.some(part => !Number.isInteger(part))) return undefined;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}

function formatReviewDate(date: Date) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((part, index) => index < 2 ? String(part).padStart(2, "0") : String(part))
    .join("/");
}

export function ReviewDateField({ id, value, onChange }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = parseReviewDate(value);

  return <div role="group" aria-labelledby={`${id}-label`} className="min-w-0 space-y-2">
    <div className="flex min-h-5 items-center justify-between gap-2">
      <span id={`${id}-label`} className="text-sm font-medium leading-5">Fecha de revisión</span>
      {selected && <button type="button" onClick={() => onChange("")} className="rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Quitar fecha</button>}
    </div>
    <WeekStripCalendar value={selected} onSelect={date => onChange(formatReviewDate(date))} />
  </div>;
}
