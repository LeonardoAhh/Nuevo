import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Cron endpoint — meant to be called daily (e.g. Vercel Cron).
 * Finds baja_notifications with fecha_baja in the next 3 days
 * and sends push notifications as a warning.
 *
 * Configure in vercel.json:
 *   { "crons": [{ "path": "/api/cron/baja-warnings", "schedule": "0 8 * * *" }] }
 */

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase env vars")
  return createClient(url, key)
}

export async function GET(request: Request) {
  // Verify cron secret (Vercel sets CRON_SECRET automatically)
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Dates: today and 3 days from now
    const today = new Date()
    const threeDays = new Date(today)
    threeDays.setDate(threeDays.getDate() + 3)

    const todayStr = today.toISOString().slice(0, 10)
    const threeDaysStr = threeDays.toISOString().slice(0, 10)

    // Find upcoming bajas
    const { data: upcoming, error } = await supabase
      .from("baja_notifications")
      .select("*")
      .gte("fecha_baja", todayStr)
      .lte("fecha_baja", threeDaysStr)

    if (error) throw error
    if (!upcoming?.length) {
      return NextResponse.json({ warnings: 0, message: "No upcoming bajas" })
    }

    // Get all push subscriptions (users with push_bajas_warning enabled)
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("push_bajas_warning", true)

    const userIds = prefs?.map((p) => p.user_id) || []

    // Send push for each upcoming baja via our send-push API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    let sentCount = 0
    for (const baja of upcoming) {
      const daysLeft = Math.ceil(
        (new Date(baja.fecha_baja).getTime() - today.getTime()) / 86400000
      )
      const dayLabel = daysLeft === 0 ? "hoy" : daysLeft === 1 ? "mañana" : `en ${daysLeft} días`

      const res = await fetch(`${baseUrl}/api/send-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PUSH_API_KEY}`,
        },
        body: JSON.stringify({
          title: `⚠️ Baja ${dayLabel}`,
          body: `${baja.employee_name}${baja.employee_numero ? ` (#${baja.employee_numero})` : ""} — Fecha de baja: ${baja.fecha_baja}`,
          tag: `baja-warning-${baja.id}`,
          url: "/",
          userIds: userIds.length ? userIds : undefined,
        }),
      })

      if (res.ok) sentCount++
    }

    return NextResponse.json({
      warnings: upcoming.length,
      sent: sentCount,
    })
  } catch (err: any) {
    console.error("cron/baja-warnings error:", err)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
