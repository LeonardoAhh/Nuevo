/**
 * Consulta cumplimiento de capacitación por número de empleado
 * Tablas: employees, employee_courses, courses, position_courses
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { MSG } from "@/lib/whatsapp/messages"

type ComplianceRow =
  | { found: true; nombre: string; puesto: string; departamento: string; completados: number; requeridos: number; porcentaje: number; pendientes: string[]; aprobados: string[] }
  | { found: false; message: string }

// ─── Singleton Supabase client ────────────────────────────────
// Evita crear nuevo cliente en cada request serverless
let _client: SupabaseClient | null = null

function getServerClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase env vars no configuradas")
  _client = createClient(url, key)
  return _client
}

// ─── Rate-limit por teléfono ─────────────────────────────────
// Max 5 intentos por phone en ventana de 10 minutos
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const _attempts = new Map<string, { count: number; first: number }>()

export function checkRateLimit(phone: string): boolean {
  const now = Date.now()
  const entry = _attempts.get(phone)
  if (!entry || now - entry.first > RATE_LIMIT_WINDOW_MS) {
    _attempts.set(phone, { count: 1, first: now })
    return true // permitido
  }
  if (entry.count >= RATE_LIMIT_MAX) return false // bloqueado
  entry.count++
  return true
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
    return { found: false, message: MSG.noEncontrado(numero) }
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

/** Registra que el empleado ya realizó su consulta (incluye teléfono para auditoría) */
export async function markAsQueried(numero: string, phone: string): Promise<void> {
  const supabase = getServerClient()
  const { error } = await supabase.from("whatsapp_consultas").insert({ numero: numero.trim(), phone })
  if (error) {
    // Log explícito: registro falló pero empleado ya recibió resultado
    console.error(`[WhatsApp] CRITICAL: markAsQueried falló para numero=${numero} phone=${phone}:`, error.message)
  }
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

  if (result.requeridos === 0) lines.push(``, MSG.sinCursosRequeridos)
  if (result.porcentaje === 100) lines.push(``, MSG.felicidades)

  lines.push(``, MSG.datosIncorrectos)
  lines.push(``, MSG.recursos)
  lines.push(``, MSG.footer)

  return lines.join("\n")
}

function buildBar(pct: number): string {
  const filled = Math.round(pct / 10)
  return "█".repeat(filled) + "░".repeat(10 - filled)
}
