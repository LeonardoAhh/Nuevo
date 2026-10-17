"use client";

import { forwardRef, useMemo, useState, type ComponentPropsWithoutRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

const WEEKDAYS = ["D", "L", "M", "X", "J", "V", "S"] as const;
const longDate = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDate = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });
const monthYear = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

export type WeekStripCalendarProps = Readonly<{
  value?: Date;
  onSelect: (date: Date) => void;
} & Omit<ComponentPropsWithoutRef<"div">, "onSelect">>;

/** Controlled week picker; the parent owns the selected date. */
export const WeekStripCalendar = forwardRef<HTMLDivElement, WeekStripCalendarProps>(
  ({ className, value, onSelect, ...props }, ref) => {
    const [today] = useState(() => startOfDay(new Date()));
    const [weekStart, setWeekStart] = useState(() => startOfWeek(value ?? today));
    const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);

    return <div ref={ref} data-slot="week-strip-calendar" className={cn("w-full rounded-md border border-input bg-card p-3 text-foreground", className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold first-letter:uppercase">{monthYear.format(days[3])}</p>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Semana anterior" onClick={() => setWeekStart(previous => addDays(previous, -7))} className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft className="size-4" aria-hidden="true" /></button>
          <button type="button" aria-label="Semana siguiente" onClick={() => setWeekStart(previous => addDays(previous, 7))} className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight className="size-4" aria-hidden="true" /></button>
        </div>
      </div>
      <p aria-live="polite" className="mt-1 text-xs text-muted-foreground">{shortDate.format(days[0])} – {shortDate.format(days[6])}</p>
      <div className="mt-2 grid grid-cols-7 gap-0.5" role="group" aria-label="Días de la semana">
        {days.map((date, index) => {
          const selected = value ? isSameDay(date, value) : false;
          const current = isSameDay(date, today);
          return <button
            key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
            type="button"
            aria-label={longDate.format(date)}
            aria-pressed={selected}
            aria-current={current ? "date" : undefined}
            onClick={() => onSelect(startOfDay(date))}
            className="group flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden="true" className={cn("text-xs font-medium text-muted-foreground", selected && "text-foreground")}>{WEEKDAYS[index]}</span>
            <span aria-hidden="true" className={cn("flex size-9 items-center justify-center rounded-md text-sm font-medium tabular-nums transition-colors", selected ? "bg-primary font-semibold text-primary-foreground" : current ? "border border-border text-foreground group-hover:bg-muted" : "group-hover:bg-muted")}>{date.getDate()}</span>
          </button>;
        })}
      </div>
    </div>;
  },
);

WeekStripCalendar.displayName = "WeekStripCalendar";
