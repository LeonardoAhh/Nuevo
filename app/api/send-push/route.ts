import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"

// web-push requiere runtime de Node.js (usa crypto nativo)
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Server-side Supabase client with service role
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase env vars")
  return createClient(url, key)
}

interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
  /** If provided, only send to these user IDs. Otherwise broadcast to all. */
  userIds?: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Verify request has a valid auth or API key
    const authHeader = request.headers.get("authorization")
    const apiKey = process.env.PUSH_API_KEY

    // Allow internal cron calls via API key, or authenticated Supabase user
    const supabaseAdmin = getSupabaseAdmin()
    let authorized = false

    if (apiKey && authHeader === `Bearer ${apiKey}`) {
      authorized = true
    } else if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7)
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      authorized = !!user
    }

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: PushPayload = await request.json()
    if (!body.title || !body.body) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 })
    }

    // Fetch subscriptions
    let query = supabaseAdmin.from("push_subscriptions").select("*")
    if (body.userIds?.length) {
      query = query.in("user_id", body.userIds)
    }
    const { data: subscriptions, error } = await query
    if (error) throw error

    if (!subscriptions?.length) {
      return NextResponse.json({ sent: 0, message: "No subscriptions found" })
    }

    // Asegurar formato mailto: requerido por el estándar Web Push
    const rawEmail = process.env.VAPID_EMAIL || "admin@vinoplastic.com"
    const vapidSubject = rawEmail.startsWith("mailto:") ? rawEmail : `mailto:${rawEmail}`
    webpush.setVapidDetails(
      vapidSubject,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const payload = JSON.stringify({
      title: body.title,
      body: body.body,
      tag: body.tag || "general",
      url: body.url || "/",
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          )
          return { endpoint: sub.endpoint, success: true }
        } catch (err: any) {
          // 410 Gone = subscription expired, clean up
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabaseAdmin
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint)
          }
          return { endpoint: sub.endpoint, success: false, error: err?.message }
        }
      })
    )

    const sent = results.filter(
      (r) => r.status === "fulfilled" && (r.value as any).success
    ).length

    return NextResponse.json({ sent, total: subscriptions.length })
  } catch (err: any) {
    console.error("send-push error:", err)
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    )
  }
}
