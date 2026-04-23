/**
 * Consulta cumplimiento de capacitación por número de empleado
 * Tablas: employees, employee_courses, courses, position_courses
 */

import { createClient } from "@supabase/supabase-js"

type ComplianceRow =
  | { found: true; nombre: string; puesto: string; departamento: string; completados: number; requeridos: number; porcentaje: number; pendientes: string[]; aprobados: string[] }
  | { found: false; message: string }

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase env vars no configuradas")
  return createClient(url, key)
}

export async function getComplianceByNumero(numero: string): Promise<ComplianceRow> {
  const supabase = getServerClient()

  // 1. Buscar empleado por número
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id, nombre, puesto, departamento")
    .eq("numero", numero.trim())
    .maybeSingle()

  if (empError) throw empError

  if (!employee) {
    return { found: false, message: `❌ No encontré empleado con número *${numero}*.\n\nVerifica que sea tu número de empleado correcto.\n\nSi el problema persiste, acude al *Departamento de Capacitación*.` }
  }

  // 2. Cursos completados por el empleado
  const { data: taken, error: takenError } = await supabase
    .from("employee_courses")
    .select("raw_course_name, calificacion, course_id")
    .eq("employee_id", employee.id)

  if (takenError) throw takenError

  // 3. Cursos requeridos por su puesto (via position_courses → courses)
  const { data: required, error: reqError } = await supabase
    .from("positions")
    .select("id, name, position_courses(course_id, courses(name))")
    .eq("name", employee.puesto)
    .maybeSingle()

  if (reqError) throw reqError

  // Normalizar cursos requeridos
  const requiredCourses: { id: string; name: string }[] = []

  if (required?.position_courses) {
    for (const pc of (required.position_courses as unknown) as Array<{ course_id: string; courses: { name: string } | null }>) {
      if (pc.courses?.name) {
        requiredCourses.push({ id: pc.course_id, name: pc.courses.name })
      }
    }
  }

  // Ids de cursos completados (con course_id ligado)
  const takenCourseIds = new Set(
    (taken ?? []).filter((t) => t.course_id).map((t) => t.course_id as string)
  )

  const aprobados: string[] = []
  const pendientes: string[] = []

  for (const req of requiredCourses) {
    if (takenCourseIds.has(req.id)) {
      aprobados.push(req.name)
    } else {
      pendientes.push(req.name)
    }
  }

  const completados = aprobados.length
  const requeridos = requiredCourses.length
  const porcentaje = requeridos > 0 ? Math.round((completados / requeridos) * 100) : 100

  return {
    found: true,
    nombre: employee.nombre,
    puesto: employee.puesto ?? "Sin puesto",
    departamento: employee.departamento ?? "Sin departamento",
    completados,
    requeridos,
    porcentaje,
    aprobados,
    pendientes,
  }
}

/** Verifica si el empleado ya realizó su consulta (1 vez total) */
export async function hasAlreadyQueried(numero: string): Promise<boolean> {
  const supabase = getServerClient()
  const { data } = await supabase
    .from("whatsapp_consultas")
    .select("numero")
    .eq("numero", numero.trim())
    .maybeSingle()
  return !!data
}

/** Registra que el empleado ya realizó su consulta */
export async function markAsQueried(numero: string): Promise<void> {
  const supabase = getServerClient()
  await supabase.from("whatsapp_consultas").insert({ numero: numero.trim() })
}

/** Formatea el resultado como mensaje de texto para WhatsApp */
export function formatComplianceMessage(result: ComplianceRow): string {
  if (!result.found) return result.message

  const bar = buildBar(result.porcentaje)
  const emoji = result.porcentaje === 100 ? "🎉" : result.porcentaje >= 70 ? "⚠️" : "❌"

  const lines: string[] = [
    `${emoji} *Cumplimiento de Capacitación*`,
    ``,
    `👤 *${result.nombre}*`,
    `💼 ${result.puesto}`,
    `🏢 ${result.departamento}`,
    ``,
    `📊 ${result.porcentaje}% ${bar}`,
    `   ${result.completados} de ${result.requeridos} cursos completados`,
  ]

  if (result.aprobados.length > 0) {
    lines.push(``, `✅ *Completados:*`)
    result.aprobados.forEach((c) => lines.push(`   • ${c}`))
  }

  if (result.pendientes.length > 0) {
    lines.push(``, `📌 *Pendientes:*`)
    result.pendientes.forEach((c) => lines.push(`   • ${c}`))
  }

  if (result.requeridos === 0) {
    lines.push(``, `ℹ️ No hay cursos requeridos registrados para este puesto.`)
  }

  if (result.porcentaje === 100) {
    lines.push(``, `🎉 *¡Felicidades! Tienes todos tus cursos al día.*`)
  }

  lines.push(``, `ℹ️ _Si tus datos son incorrectos, acude al Departamento de Capacitación._`)
  lines.push(``, `_Capacitación Planta Qro_`)

  return lines.join("\n")
}

function buildBar(pct: number): string {
  const filled = Math.round(pct / 10)
  return "█".repeat(filled) + "░".repeat(10 - filled)
}
