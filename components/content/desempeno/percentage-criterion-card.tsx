import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface PercentageCriterionCardProps {
  title: string;
  description: string;
  metadataLabel: string;
  metadata: string;
  children: ReactNode;
}

export function PercentageCriterionCard({
  title,
  description,
  metadataLabel,
  metadata,
  children,
}: PercentageCriterionCardProps) {
  return <Card className="h-full">
    <fieldset className="flex h-full min-w-0 flex-col gap-3 p-4">
      <legend className="sr-only">{title}</legend>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold leading-5 text-foreground">{title}</h3>
        <span className="text-xs leading-4 text-muted-foreground">
          {metadataLabel}: <span className="font-medium text-foreground">{metadata}</span>
        </span>
      </div>
      <p className="flex-1 text-sm leading-5 text-foreground">{description}</p>
      {children}
    </fieldset>
  </Card>;
}
