import { COMPANY_NAME, COMPANY_SUBTITLE } from "@/lib/constants/company"

export interface BirthdayTemplateProps {
  nombre: string
}

const EMAIL_THEME = {
  background: "#eef0f3",
  surface: "#ffffff",
  foreground: "#25282d",
  muted: "#69707a",
  border: "#dfe2e7",
  primary: "#496cc7",
  primaryDark: "#3959ad",
  primarySoft: "#edf1fb",
  celebrationPink: "#d98ca0",
  celebrationGold: "#d6a64f",
  celebrationMint: "#77aa9c",
  celebrationLavender: "#9b8bc2",
} as const

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[
        character
      ] ?? character,
  )
}

function toNameCase(value: string) {
  return value
    .toLocaleLowerCase("es-MX")
    .split("-")
    .map((part) => part.charAt(0).toLocaleUpperCase("es-MX") + part.slice(1))
    .join("-")
}

/**
 * Los nombres del sistema se almacenan normalmente como
 * APELLIDO_PATERNO APELLIDO_MATERNO NOMBRE(S).
 */
export function getBirthdayDisplayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const givenName = parts.length >= 3 ? parts[2] : parts.length === 2 ? parts[1] : parts[0]
  return toNameCase(givenName || "Colaborador")
}

export function birthdayEmailHtml({ nombre }: BirthdayTemplateProps): string {
  const displayName = escapeHtml(getBirthdayDisplayName(nombre))
  const companyName = escapeHtml(COMPANY_NAME)
  const companySubtitle = escapeHtml(COMPANY_SUBTITLE)

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>Feliz cumpleaños</title>
  </head>
  <body style="box-sizing:border-box;margin:0;background:${EMAIL_THEME.background};color:${EMAIL_THEME.foreground};font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Todo el equipo de ${companyName} celebra contigo este día especial.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${EMAIL_THEME.background};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;overflow:hidden;border:1px solid ${EMAIL_THEME.border};border-radius:14px;background:${EMAIL_THEME.surface};">
            <tr>
              <td style="padding:30px 36px 36px;background-color:${EMAIL_THEME.primary};background-image:radial-gradient(circle at 12% 18%,rgba(255,255,255,.12) 0 3px,transparent 4px),radial-gradient(circle at 88% 28%,rgba(255,255,255,.1) 0 4px,transparent 5px),radial-gradient(circle at 72% 82%,rgba(255,255,255,.08) 0 3px,transparent 4px);border-bottom:6px solid ${EMAIL_THEME.primaryDark};color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="top">
                      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">${companyName}</p>
                    </td>
                    <td align="right" width="144" aria-hidden="true">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="right">
                        <tr>
                          <td width="32" align="center" valign="bottom">
                            <div style="width:24px;height:30px;border-radius:50% 50% 48% 48%;background:${EMAIL_THEME.celebrationPink};"></div>
                            <div style="width:1px;height:15px;margin:0 auto;background:rgba(255,255,255,.55);"></div>
                          </td>
                          <td width="32" align="center" valign="bottom" style="padding-top:9px;">
                            <div style="width:22px;height:28px;border-radius:50% 50% 48% 48%;background:${EMAIL_THEME.celebrationGold};"></div>
                            <div style="width:1px;height:13px;margin:0 auto;background:rgba(255,255,255,.55);"></div>
                          </td>
                          <td width="32" align="center" valign="bottom">
                            <div style="width:24px;height:30px;border-radius:50% 50% 48% 48%;background:${EMAIL_THEME.celebrationMint};"></div>
                            <div style="width:1px;height:15px;margin:0 auto;background:rgba(255,255,255,.55);"></div>
                          </td>
                          <td width="32" align="center" valign="bottom" style="padding-top:7px;">
                            <div style="width:22px;height:28px;border-radius:50% 50% 48% 48%;background:${EMAIL_THEME.celebrationLavender};"></div>
                            <div style="width:1px;height:13px;margin:0 auto;background:rgba(255,255,255,.55);"></div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:18px 0 8px;font-size:16px;line-height:1.5;color:#e8edfb;">Un mensaje especial para ti</p>
                <h1 style="margin:0;font-size:30px;line-height:1.2;font-weight:600;letter-spacing:-.02em;">Feliz cumpleaños, ${displayName}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 36px 34px;">
                <p style="margin:0 0 20px;font-size:18px;line-height:1.6;color:${EMAIL_THEME.foreground};">
                  Hoy queremos hacer una pausa para celebrar contigo y desearte un día extraordinario.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.75;color:${EMAIL_THEME.muted};">
                  Que este nuevo año de vida llegue con bienestar, alegría y muchos motivos para seguir creciendo. Gracias por tu dedicación y por todo lo que aportas a nuestro equipo.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:30px;">
                  <tr>
                    <td style="padding:16px 18px;border-left:4px solid ${EMAIL_THEME.primary};border-radius:0 8px 8px 0;background:${EMAIL_THEME.primarySoft};color:${EMAIL_THEME.primaryDark};font-size:15px;font-weight:600;line-height:1.5;">
                      Recibe nuestros mejores deseos en tu día.
                    </td>
                  </tr>
                </table>
                <p style="margin:30px 0 0;font-size:15px;line-height:1.7;color:${EMAIL_THEME.foreground};">
                  Con aprecio,<br />
                  <strong>el equipo de Recursos Humanos</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px;border-top:1px solid ${EMAIL_THEME.border};color:${EMAIL_THEME.muted};font-size:12px;line-height:1.6;">
                <strong style="color:${EMAIL_THEME.foreground};">${companyName}</strong><br />
                ${companySubtitle} · ${new Date().getFullYear()}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:${EMAIL_THEME.muted};font-size:11px;line-height:1.5;">
            Este mensaje fue enviado por el Departamento de Capacitación.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
