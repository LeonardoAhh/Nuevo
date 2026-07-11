import { supabase } from "./client"

/**
 * Paginated fetch — pulls all rows from a Supabase table.
 * Avoids the 1 000-row default limit.
 */
export async function fetchAllRows<T>(
  table: string,
  select: string,
  filters?: (q: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>,
): Promise<T[]> {
  const PAGE = 1_000
  let all: T[] = []
  let from = 0
  let hasMore = true

  while (hasMore) {
    let q = supabase.from(table).select(select).range(from, from + PAGE - 1) as any
    if (filters) q = filters(q)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    all = all.concat((data ?? []) as T[])
    hasMore = (data?.length ?? 0) === PAGE
    from += PAGE
  }
  return all
}
