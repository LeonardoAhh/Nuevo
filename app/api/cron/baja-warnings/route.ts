import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Cron diario — 8:00 AM
 * Envía push notifications para:
 *   1. Bajas de empleados (hoy, 1 día antes, 3 días antes)
 *   2. RG-REC-048 pendientes próximos a vencer (hoy, 3 días, 7 días)
 *   3. Términos de contrato próximos (hoy, 3 días, 7 días)
 *
 * Usa push_sent_log para no enviar el mismo aviso más de una vez por día/tipo.
 * Solo notifica a usuarios con rol 'dev' o 'admin'.
 */

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase env vars")
  return createClient(url, key)
}

const BAJA_DAYS     = [0, 1, 3]      // días antes de la baja
const RG_DAYS       = [0, 3, 7]      // días antes de vencer el RG-REC-048
const CONTRATO_DAYS = [0, 3, 7]      // días antes de vencer el contrato

async function alreadySent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  refId: string,
  refType: string,
  daysBefore: number
): Promise<boolean> {
  const { data } = await supabase
    .from("push_sent_log")
    .select("id")
    .eq("ref_id", refId)
    .eq("ref_type", refType)
    .eq("days_before", daysBefore)
    .eq("sent_at", new Date().toISOString().slice(0, 10))
    .maybeSingle()
  return !!data
}

async function markSent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  refId: string,
  refType: string,
  daysBefore: number
) {
  await supabase.from("push_sent_log").insert({
    ref_id: refId,
    ref_type: refType,
    days_before: daysBefore,
    sent_at: new Date().toISOString().slice(0, 10),
  }).select()
}

async function sendPush(
  baseUrl: string,
  apiKey: string | undefined,
  title: string,
  body: string,
  tag: string,
  userIds: string[]
) {
  const res = await fetch(`${baseUrl}/api/send-push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ title, body, tag, url: "/", userIds: userIds.length ? userIds : undefined }),
  })
  return res.ok
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
    const apiKey = process.env.PUSH_API_KEY

    // Usuarios admin/dev con cada preferencia habilitada
    const { data: adminUsers } = await supabase
      .from("profiles")
      .select("user_id")
      .in("role", ["dev", "admin"])

    const allAdminIds = adminUsers?.map((p) => p.user_id) ?? []

    // Filtrar por preferencia individual
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id, push_bajas, push_bajas_warning, push_rg, push_contrato")
      .in("user_id", allAdminIds)

    const usersFor = (key: "push_bajas" | "push_bajas_warning" | "push_rg" | "push_contrato") => {
      // Usuarios con preferencia explícitamente desactivada se excluyen;
      // los que no tienen registro reciben (default = true)
      const disabled = new Set(prefs?.filter((p) => p[key] === false).map((p) => p.user_id) ?? [])
      return allAdminIds.filter((id) => !disabled.has(id))
    }

    const results = { bajas: 0, rg: 0, contratos: 0 }

    // ── 1. Bajas ──────────────────────────────────────────────────────────────
    for (const daysBefore of BAJA_DAYS) {
      const targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() + daysBefore)
      const targetStr = targetDate.toISOString().slice(0, 10)

      const { data: bajas } = await supabase
        .from("baja_notifications")
        .select("id, employee_name, employee_numero, fecha_baja")
        .eq("fecha_baja", targetStr)

      for (const baja of bajas ?? []) {
        if (await alreadySent(supabase, baja.id, "baja", daysBefore)) continue

        const label = daysBefore === 0 ? "hoy" : daysBefore === 1 ? "mañana" : `en ${daysBefore} días`
        const sent = await sendPush(
          baseUrl, apiKey,
          `Baja ${label}`,
          `${baja.employee_name}${baja.employee_numero ? ` #${baja.employee_numero}` : ""} – Fecha de baja: ${baja.fecha_baja}`,
          `baja-${baja.id}-${daysBefore}d`,
          daysBefore === 0 ? usersFor("push_bajas") : usersFor("push_bajas_warning")
        )
        if (sent) { await markSent(supabase, baja.id, "baja", daysBefore); results.bajas++ }
      }
    }

    // ── 2. RG-REC-048 ─────────────────────────────────────────────────────────
    for (const daysBefore of RG_DAYS) {
      const targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() + daysBefore)
      const targetStr = targetDate.toISOString().slice(0, 10)

      const { data: registros } = await supabase
        .from("nuevo_ingreso")
        .select("id, nombre, puesto, departamento, fecha_vencimiento_rg")
        .eq("rg_rec_048", "Pendiente")
        .eq("fecha_vencimiento_rg", targetStr)

      for (const r of registros ?? []) {
        if (await alreadySent(supabase, r.id, "rg", daysBefore)) continue

        const label = daysBefore === 0 ? "hoy" : `en ${daysBefore} días`
        const sent = await sendPush(
          baseUrl, apiKey,
          `RG-REC-048 vence ${label}`,
          `${r.nombre} — ${r.puesto} · ${r.departamento}`,
          `rg-${r.id}-${daysBefore}d`,
          usersFor("push_rg")
        )
        if (sent) { await markSent(supabase, r.id, "rg", daysBefore); results.rg++ }
      }
    }

    // ── 3. Términos de contrato ───────────────────────────────────────────────
    for (const daysBefore of CONTRATO_DAYS) {
      const targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() + daysBefore)
      const targetStr = targetDate.toISOString().slice(0, 10)

      const { data: registros } = await supabase
        .from("nuevo_ingreso")
        .select("id, nombre, puesto, departamento, termino_contrato, tipo_contrato")
        .neq("tipo_contrato", "Indeterminado")
        .eq("termino_contrato", targetStr)

      for (const r of registros ?? []) {
        if (await alreadySent(supabase, r.id, "contrato", daysBefore)) continue

        const label = daysBefore === 0 ? "hoy" : `en ${daysBefore} días`
        const sent = await sendPush(
          baseUrl, apiKey,
          `Contrato vence ${label}`,
          `${r.nombre} — ${r.tipo_contrato} · ${r.departamento}`,
          `contrato-${r.id}-${daysBefore}d`,
          usersFor("push_contrato")
        )
        if (sent) { await markSent(supabase, r.id, "contrato", daysBefore); results.contratos++ }
      }
    }

    return NextResponse.json({ sent: results, date: todayStr })
  } catch (err: any) {
    console.error("cron/baja-warnings error:", err)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

