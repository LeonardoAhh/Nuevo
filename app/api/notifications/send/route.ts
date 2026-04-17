import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// web-push requiere runtime de Node.js (usa crypto nativo)
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getWebPush() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("web-push") as typeof import("web-push")
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const webpush = await getWebPush()
  if (!webpush) {
    return NextResponse.json(
      { error: "web-push no instalado. Ejecuta: npm install web-push @types/web-push" },
      { status: 503 }
    )
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL

  if (!vapidPublic || !vapidPrivate || !vapidEmail) {
    return NextResponse.json(
      { error: "VAPID keys no configuradas en .env.local" },
      { status: 503 }
    )
  }

  // Asegurar formato mailto: requerido por el estándar Web Push
  const vapidSubject = vapidEmail.startsWith("mailto:") ? vapidEmail : `mailto:${vapidEmail}`
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const body = await req.json()
  const { title, body: msgBody, url = "/", tag = "general", id } = body

  if (!title) {
    return NextResponse.json({ error: "title requerido" }, { status: 400 })
  }

  // Usar service-role key para leer todas las suscripciones
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")

  if (error) {
    return NextResponse.json({ error: "Error al leer suscripciones" }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, message: "Sin suscriptores" })
  }

  const payload = JSON.stringify({ title, body: msgBody, url, tag, id })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }
      await webpush.sendNotification(pushSubscription, payload)
    })
  )

  // Limpiar suscripciones expiradas (endpoint gone → 410)
  const expired: string[] = []
  results.forEach((result, i) => {
    if (
      result.status === "rejected" &&
      ((result.reason as { statusCode?: number })?.statusCode === 410 || (result.reason as { statusCode?: number })?.statusCode === 404)
    ) {
      expired.push(subscriptions[i].endpoint)
    }
  })
  if (expired.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expired)
  }

  const sent = results.filter((r) => r.status === "fulfilled").length
  return NextResponse.json({ sent, total: subscriptions.length })
}
