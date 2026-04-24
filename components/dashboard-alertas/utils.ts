// Pure helpers used across dashboard-alertas.

export function agruparPorDepto<T extends { departamento: string | null }>(
  items: T[],
): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = item.departamento?.trim() || "Sin departamento"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}
