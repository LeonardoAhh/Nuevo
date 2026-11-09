import { supabase } from "./client"

type PageLoader = (
  from: number,
  to: number,
) => PromiseLike<{ data: unknown; error: unknown }>

/**
 * Fetches all rows in 1,000-row pages, either from a table or a custom query.
 */
export function fetchAllRows<T>(loadPage: PageLoader): Promise<T[]>
export function fetchAllRows<T>(table: string, select: string): Promise<T[]>
export async function fetchAllRows<T>(
  tableOrLoader: string | PageLoader,
  select?: string,
): Promise<T[]> {
  const PAGE = 1_000
  let all: T[] = []
  let from = 0
  let hasMore = true

  while (hasMore) {
    let data: T[] | null
    let error: unknown
    if (typeof tableOrLoader === "string") {
      if (!select) throw new Error("A select expression is required when fetching by table name.")
      const result = await supabase.from(tableOrLoader).select(select).range(from, from + PAGE - 1)
      data = result.data as T[] | null
      error = result.error
    } else {
      const result = await tableOrLoader(from, from + PAGE - 1)
      if (result.data !== null && !Array.isArray(result.data)) {
        throw new Error("La consulta paginada no devolvió una lista de filas.")
      }
      data = result.data as T[] | null
      error = result.error
    }
    if (error) {
      const message = error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
          ? error.message
          : "Error al cargar filas paginadas."
      throw new Error(message)
    }
    all = all.concat((data ?? []) as T[])
    hasMore = (data?.length ?? 0) === PAGE
    from += PAGE
  }
  return all
}
