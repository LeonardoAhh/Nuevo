/**
 * Resend email client
 * Docs: https://resend.com/docs
 *
 * Set RESEND_API_KEY in .env.local
 */
import { Resend } from 'resend'
import { birthdayEmailHtml, getBirthdayDisplayName } from './templates/birthday'

export const FROM_EMAIL = 'ViñoPlastic <cumpleanos@vinoplasticqro.xyz>'

export interface BirthdayEmailPayload {
  to: string
  nombre: string
}

/**
 * Sends a birthday congratulations email to a collaborator.
 * Returns the Resend message id on success.
 */
export async function sendBirthdayEmail(
  payload: BirthdayEmailPayload,
): Promise<string> {
  const { to, nombre } = payload

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no está configurado')
  }

  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `¡Feliz cumpleaños, ${getBirthdayDisplayName(nombre)}!`,
    html: birthdayEmailHtml({ nombre }),
  })

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`)
  }

  return data?.id ?? 'sent'
}
