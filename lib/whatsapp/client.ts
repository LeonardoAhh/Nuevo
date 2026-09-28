/**
 * Twilio WhatsApp REST client
 * Docs: https://www.twilio.com/docs/whatsapp/api
 *
 * Sandbox: usa número whatsapp:+14155238886 (Twilio sandbox)
 * Producción: usa tu número Twilio con WhatsApp habilitado
 */

const TWILIO_API = "https://api.twilio.com/2010-04-01"

/** Send a plain text WhatsApp message via Twilio REST API */
export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_NUMBER // e.g. whatsapp:+14155238886

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_NUMBER requeridos en .env.local"
    )
  }

  // Asegurar prefijo whatsapp: en ambos números
  const fromFormatted = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`
  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`

  const body = new URLSearchParams({
    From: fromFormatted,
    To: toFormatted,
    Body: text,
  })

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64")

  const res = await fetch(
    `${TWILIO_API}/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twilio API error ${res.status}: ${err}`)
  }
}
