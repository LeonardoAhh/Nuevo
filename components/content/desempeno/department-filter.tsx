"use client";

import { Button } from "@/components/ui/button";
interface DeptTabProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}
export function DeptTab({
  label,
  count,
  isActive,
  onClick
}: DeptTabProps) {
  return <Button variant={isActive ? "default" : "outline"} size="sm" aria-pressed={isActive} onClick={onClick} className="flex-shrink-0 gap-1.5">
    {label}
    <span className={["inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold", isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"].join(" ")}>
      {count}
  </span>
</Button>;
}
