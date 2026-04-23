/**
 * Twilio WhatsApp Webhook
 *
 * POST — mensajes entrantes (Twilio envía application/x-www-form-urlencoded)
 *
 * Setup en Twilio Console:
 *   Sandbox:    Messaging > Try it out > Send a WhatsApp message
 *               Sandbox Configuration > When a message comes in:
 *               URL: https://tu-dominio.com/api/whatsapp/webhook  Method: HTTP POST
 *   Producción: Phone Numbers > Manage > Active Numbers > tu número
 *               Messaging > A message comes in > Webhook POST
 *
 * No requiere GET de verificación (a diferencia de Meta API).
 * Twilio valida con firma HMAC-SHA1 en header X-Twilio-Signature.
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { sendWhatsAppMessage } from "@/lib/whatsapp/client"
import { getComplianceByNumero, formatComplianceMessage, hasAlreadyQueried, markAsQueried } from "@/lib/whatsapp/compliance"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ─── POST — Mensajes entrantes ────────────────────────────────
export async function POST(req: NextRequest) {
  // Leer body como form-encoded (formato Twilio)
  let formBody: URLSearchParams
  try {
    const text = await req.text()
    formBody = new URLSearchParams(text)
  } catch {
    return new NextResponse("Bad Request", { status: 400 })
  }

  // Validar firma Twilio (seguridad — evita requests falsos)
  const isValid = validateTwilioSignature(req, formBody)
  if (!isValid) {
    console.warn("[WhatsApp webhook] Firma Twilio inválida — request rechazado")
    return new NextResponse("Forbidden", { status: 403 })
  }

  const from = formBody.get("From") ?? "" // e.g. "whatsapp:+521234567890"
  const body = formBody.get("Body")?.trim() ?? ""

  if (!from) {
    return new NextResponse("OK", { status: 200 })
  }

  // Procesar de forma síncrona — Vercel mata la función al retornar, el fire-and-forget no funciona
  try {
    await handleMessage(from, body)
  } catch (err) {
    console.error("[WhatsApp webhook] Error al procesar mensaje:", err)
  }

  // Twilio espera respuesta vacía o TwiML — 200 vacío es suficiente
  return new NextResponse("", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  })
}

// ─── Lógica de respuesta ──────────────────────────────────────
async function handleMessage(from: string, text: string): Promise<void> {
  const normalized = text.replace(/\s+/g, "").toLowerCase()

  // Comandos de bienvenida
  if (
    ["hola", "hi", "hello", "ayuda", "help", "inicio", "start", ""].includes(normalized)
  ) {
    await sendWhatsAppMessage(
      from,
      "👋 *Capacitación Qro — Consulta de Cumplimiento*\n\nConsulta el estatus de tus cursos de capacitación requeridos según tu puesto.\n\nEnvía tu *número de empleado* (solo números).\nEjemplo: *12345*\n\n⚠️ *Solo tienes 1 consulta disponible.*"
    )
    return
  }

  // Validar que sea número de empleado (solo dígitos, 1–10 chars)
  if (!/^\d{1,10}$/.test(normalized)) {
    console.warn(`[WhatsApp webhook] Formato inválido de '${from}': "${text.slice(0, 50)}"`)
    await sendWhatsAppMessage(
      from,
      "⚠️ Envía únicamente tu *número de empleado* (solo números).\n\nEjemplo: *12345*\n\nEscribe *hola* si necesitas ayuda."
    )
    return
  }

  // Verificar límite de 1 consulta por empleado
  try {
    const already = await hasAlreadyQueried(normalized)
    if (already) {
      await sendWhatsAppMessage(
        from,
        "ℹ️ Ya realizaste tu consulta de cumplimiento.\n\nSolo se permite *1 consulta por empleado*.\n\nSi tienes dudas, acude al *Departamento de Capacitación*."
      )
      return
    }
  } catch (err) {
    console.error("[WhatsApp webhook] Error verificando consulta previa:", err)
  }

  // Consultar cumplimiento en Supabase
  try {
    const result = await getComplianceByNumero(normalized)
    const message = formatComplianceMessage(result)
    // Enviar primero — si falla, NO registrar (evita bloquear empleado sin haber recibido resultado)
    await sendWhatsAppMessage(from, message + "\n\n_Esta fue tu única consulta disponible._")
    await markAsQueried(normalized, from)
  } catch (err) {
    console.error("[WhatsApp webhook] Error Supabase:", err)
    await sendWhatsAppMessage(
      from,
      "❌ Ocurrió un error al consultar tu información.\n\nAcude al *Departamento de Capacitación* para obtener tu estatus de manera personal."
    )
  }
}

// ─── Validación de firma Twilio ───────────────────────────────
/**
 * Verifica que el request venga de Twilio.
 * Algoritmo: HMAC-SHA1(authToken, url + params ordenados) → base64
 * Docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
function validateTwilioSignature(
  req: NextRequest,
  body: URLSearchParams
): boolean {
  const signature = req.headers.get("x-twilio-signature")
  const authToken = process.env.TWILIO_AUTH_TOKEN

  // En desarrollo sin firma (Twilio Sandbox local con ngrok no siempre la envía)
  if (process.env.NODE_ENV === "development") return true
  if (!signature || !authToken) return false

  // Reconstruir URL completa (debe coincidir exactamente con la configurada en Twilio)
  const proto = req.headers.get("x-forwarded-proto") ?? "https"
  const host = req.headers.get("host") ?? req.nextUrl.host
  const url = `${proto}://${host}${req.nextUrl.pathname}`

  // Concatenar parámetros ordenados alfabéticamente
  const sortedParams = [...body.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}${v}`)
    .join("")

  const hmac = crypto.createHmac("sha1", authToken)
  hmac.update(url + sortedParams)
  const expected = hmac.digest("base64")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expected, "utf8")
    )
  } catch {
    return false
  }
}
