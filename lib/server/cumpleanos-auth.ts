import "server-only"

import { createServerClient } from "@supabase/ssr"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

type BirthdayRole = "dev" | "admin"

type BirthdayAccess =
  | { authorized: true; db: SupabaseClient; userId: string; role: BirthdayRole }
  | { authorized: false; response: Response }

export async function requireBirthdayAccess(
  allowedRoles: BirthdayRole[],
): Promise<BirthdayAccess> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceRoleKey) {
    return {
      authorized: false,
      response: Response.json({ error: "Configuración del servidor incompleta" }, { status: 500 }),
    }
  }

  const cookieStore = await cookies()
  const auth = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  })

  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user) {
    return {
      authorized: false,
      response: Response.json({ error: "No autorizado" }, { status: 401 }),
    }
  }

  const db = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: profile, error } = await db
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[cumpleanos auth] No se pudo consultar el rol", error.message)
    return {
      authorized: false,
      response: Response.json({ error: "No se pudo verificar el acceso" }, { status: 500 }),
    }
  }

  const role = profile?.role as BirthdayRole | undefined
  if (!role || !allowedRoles.includes(role)) {
    return {
      authorized: false,
      response: Response.json({ error: "Acceso denegado" }, { status: 403 }),
    }
  }

  return { authorized: true, db, userId: user.id, role }
}
