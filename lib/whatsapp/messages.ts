/**
 * Mensajes del bot de WhatsApp — todos los strings centralizados aquí.
 * Editar textos sin tocar lógica de negocio.
 */

export const MSG = {
  bienvenida: (yaConsulto: boolean) =>
    yaConsulto
      ? "ℹ️ Ya realizaste tu consulta de cumplimiento.\n\nSolo se permite *1 consulta por empleado*.\n\nSi tienes dudas, acude al *Departamento de Capacitación*."
      : "👋 *Capacitación Qro — Consulta de Cumplimiento*\n\nConsulta el estatus de tus cursos de capacitación requeridos según tu puesto.\n\nEnvía tu *número de empleado* (solo números).\nEjemplo: *12345*\n\n⚠️ *Solo tienes 1 consulta disponible.*",

  formatoInvalido:
    "⚠️ Envía únicamente tu *número de empleado* (solo números).\n\nEjemplo: *12345*\n\nEscribe *hola* si necesitas ayuda.",

  yaConsulto:
    "ℹ️ Ya realizaste tu consulta de cumplimiento.\n\nSolo se permite *1 consulta por empleado*.\n\nSi tienes dudas, acude al *Departamento de Capacitación*.",

  consultaUnica:
    "_Esta fue tu única consulta disponible._",

  errorServidor:
    "❌ Ocurrió un error al consultar tu información.\n\nAcude al *Departamento de Capacitación* para obtener tu estatus de manera personal.",

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

  footer:
    "_Capacitación Planta Qro_",
}
