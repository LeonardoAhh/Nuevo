"use client";

import { DEPARTAMENTOS_EVALUADORES } from "@/lib/catalogo";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DESEMPENO } from "@/lib/desempeno/presentation";

/** Radix Select supplies keyboard navigation, focus restoration and option semantics. */
export function ComboboxEvaluador({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <Select value={value} onValueChange={onChange}>
    <SelectTrigger aria-label={DESEMPENO.fields.evaluator} title={value || undefined} className="w-full min-w-0 sm:max-w-sm"><SelectValue placeholder="Selecciona evaluador…" /></SelectTrigger>
    <SelectContent matchTriggerWidth>
      {Object.entries(DEPARTAMENTOS_EVALUADORES).map(([department, evaluators]) => <SelectGroup key={department}>
          <SelectLabel>{department}</SelectLabel>
          {evaluators.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
      </SelectGroup>)}
  </SelectContent>
</Select>;
}
