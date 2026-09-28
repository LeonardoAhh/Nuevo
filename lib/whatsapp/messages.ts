/**
 * Mensajes del bot de WhatsApp — todos los strings centralizados aquí.
 * Editar textos sin tocar lógica de negocio.
 */

/** URL pública de la página de cursos disponibles */
export const RECURSOS_URL = "https://vinoplasticqro.xyz/recursos"

/** Línea reutilizable con el link a la página de recursos */
export const RECURSOS_LINE = `🎓 Consulta los cursos disponibles:\n${RECURSOS_URL}`

export const MSG = {
  bienvenida: (yaConsulto: boolean) =>
    yaConsulto
      ? `ℹ️ Ya realizaste tu consulta de cumplimiento.\n\nSolo se permite *1 consulta por empleado*.\n\nSi tienes dudas, acude al *Departamento de Capacitación*.\n\n${RECURSOS_LINE}`
      : `👋 *Capacitación Qro — Consulta de Cumplimiento*\n\nConsulta el estatus de tus cursos de capacitación requeridos según tu puesto.\n\nEnvía tu *número de empleado* (solo números).\nEjemplo: *12345*\n\n⚠️ *Solo tienes 1 consulta disponible.*\n\n${RECURSOS_LINE}`,

  formatoInvalido:
    "⚠️ Envía únicamente tu *número de empleado* (solo números).\n\nEjemplo: *12345*\n\nEscribe *hola* si necesitas ayuda.",

  yaConsulto:
    `ℹ️ Ya realizaste tu consulta de cumplimiento.\n\nSolo se permite *1 consulta por empleado*.\n\nSi tienes dudas, acude al *Departamento de Capacitación*.\n\n${RECURSOS_LINE}`,

  consultaUnica:
    "_Esta fue tu única consulta disponible._",

  errorServidor:
    `❌ Ocurrió un error al consultar tu información.\n\nAcude al *Departamento de Capacitación* para obtener tu estatus de manera personal.\n\n${RECURSOS_LINE}`,

  noEncontrado: (numero: string) =>
    `❌ No encontré empleado con número *${numero}*.\n\nVerifica que sea tu número de empleado correcto.\n\nSi el problema persiste, acude al *Departamento de Capacitación*.`,

  rateLimitExcedido:
    "⚠️ Demasiados intentos. Espera unos minutos e intenta de nuevo.\n\nSi necesitas ayuda, acude al *Departamento de Capacitación*.",

  sinCursosRequeridos:
    "ℹ️ No hay cursos requeridos registrados para este puesto.",

  felicidades:
    "🎉 *¡Felicidades! Tienes todos tus cursos al día.*",

  datosIncorrectos:
    "ℹ️ _Si tus datos son incorrectos, acude al Departamento de Capacitación._",

  recursos: RECURSOS_LINE,

  footer:
    "_Capacitación Planta Qro_",
}
