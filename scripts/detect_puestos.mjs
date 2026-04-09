// Script para detectar puestos en employees que NO están en el catálogo
// Ejecutar: node scripts/detect_puestos.mjs

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Catálogo de puestos válidos (copiado de catalogo.ts)
const CATALOGO = {
  "PRODUCCIÓN": [
    "GERENTE DE PRODUCCIÓN","JEFE DE PRODUCCIÓN","ASISTENTE DE PRODUCCIÓN A","ASISTENTE DE PRODUCCIÓN B",
    "PLANEADOR DE PRODUCCIÓN","SUPERVISOR DE PRODUCCIÓN A","SUPERVISOR DE PRODUCCIÓN B",
    "SUPERVISOR DE PRODUCCIÓN C","SUPERVISOR DE PRODUCCIÓN D","OPERADOR DE MÁQUINA A",
    "OPERADOR DE MÁQUINA B","OPERADOR DE MÁQUINA C","OPERADOR DE MÁQUINA D","JEFE DE PROCESO",
    "INGENIERO DE PROCESO A","INGENIERO DE PROCESO B","INGENIERO DE PROCESO C","INGENIERO DE PROCESO D",
    "SUPERVISOR DE MONTAJE","MONTADOR DE MOLDES A","MONTADOR DE MOLDES B","MONTADOR DE MOLDES C","MONTADOR DE MOLDES D"
  ],
  "CALIDAD": [
    "GERENTE DE CALIDAD","JEFE DE CALIDAD","INGENIERO DE CALIDAD A","INGENIERO DE CALIDAD B",
    "INGENIERO DE CALIDAD C","INSPECTOR DE CALIDAD A","INSPECTOR DE CALIDAD B","INSPECTOR DE CALIDAD C",
    "INSPECTOR DE CALIDAD D","OPERADOR DE ACABADOS - GP12 A","OPERADOR DE ACABADOS - GP12 B",
    "OPERADOR DE ACABADOS - GP12 C","OPERADOR DE ACABADOS - GP12 D","RESIDENTE DE CALIDAD A",
    "RESIDENTE DE CALIDAD B","RESIDENTE DE CALIDAD C","SUPERVISOR DE ACABADOS - GP12 A",
    "SUPERVISOR DE ACABADOS - GP12 B","SUPERVISOR DE ACABADOS - GP12 C"
  ],
  "MANTENIMIENTO": [
    "AUXILIAR ADMINISTRATIVO DE MANTENIMIENTO","AUXILIAR DE MANTENIMIENTO A","AUXILIAR DE MANTENIMIENTO C",
    "JEFE DE MANTENIMIENTO","TÉCNICO DE MANTENIMIENTO B","TÉCNICO DE MANTENIMIENTO C",
    "TÉCNICO DE MANTENIMIENTO D","TECNICO DE MANTENIMIENTO DE EDIFICIOS A",
    "TÉCNICO ESPECIALISTA DE MANTENIMIENTO A","TÉCNICO ESPECIALISTA DE MANTENIMIENTO B"
  ],
  "ALMACÉN": [
    "ALMACENISTA DE MATERIA PRIMA","AUXILIAR ADMINISTRATIVO DE ALMACÉN A","AUXILAIR ADMINISTRATIVO DE ALMACÉN B",
    "AUXILIAR ADMINISTRATIVO DE ALMACÉN C","AUXILIAR DE ALMACÉN A","AUXILIAR DE ALMACÉN B",
    "AUXILIAR DE ALMACÉN C","AUXILIAR DE ALMACÉN D","JEFE DE ALMACÉN"
  ],
  "RECURSOS HUMANOS": [
    "JEFE DE RECURSOS HUMANOS","AUXILIAR DE RECURSOS HUMANOS","AUXILIAR DE LIMPIEZA A","AUXILIAR DE LIMPIEZA B",
    "ANALISTA DE CAPACITACIÓN","ANALISTA DE RECLUTAMIENTO Y SELECCIÓN A","ANALISTA DE RECLUTAMIENTO Y SELECCIÓN B",
    "ANALISTA DE SEGURIDAD E HIGIENE","ANALISTA DE RECURSOS HUMANOS","ASISTENTE DE RECURSOS HUMANOS",
    "COORDINADOR DE RECLUTAMIENTO Y SELECCIÓN"
  ],
  "TALLER DE MOLDES": [
    "AUXILIAR ADMINISTRATIVO DE TALLER DE MOLDES","TÉC. ESPECIALISTA DE MOLDES (JEFE)",
    "TÉCNICO DE MOLDES A","TÉCNICO DE MOLDES B","TÉCNICO DE MOLDES C","TÉCNICO DE MOLDES D","TÉCNICO DE MOLDES E"
  ],
  "SGI": ["COORDINADOR DE SGI","AUXILIAR DE SGI A","AUXILIAR DE SGI B","AUXILIAR DE SGI C"],
  "METROLOGÍA": [
    "JEFE DE METROLOGÍA","SUPERVISOR DE METROLOGÍA","METRÓLOGO A","METRÓLOGO B","METRÓLOGO C","AUXILIAR DE METROLOGÍA"
  ],
  "PROYECTOS": [
    "GERENTE DE PROYECTOS","AUXILIAR DE PROYECTOS","LIDER DE COTIZACIONES",
    "INGENIERO DE PROYECTOS A","INGENIERO DE PROYECTOS B","INGENIERO DE PROYECTOS D",
    "LIDER DE PROYECTOS A","LIDER DE PROYECTOS B","LÍDER DE PROYECTOS C"
  ],
  "SISTEMAS": ["COORDINADOR DE RPS","AUXILIAR PROGRAMADOR"],
  "LOGÍSTICA": ["JEFE DE LOGÍSTICA","SUPERVISOR DE LOGÍSTICA"]
}

const allPuestosValidos = new Set(Object.values(CATALOGO).flat())

async function main() {
  // Obtener todos los puestos únicos de employees
  const { data, error } = await supabase
    .from("employees")
    .select("puesto")

  if (error) { console.error("Error:", error.message); return }

  const puestosUnicos = [...new Set(data.map(e => e.puesto).filter(Boolean))].sort()
  
  const noEncontrados = puestosUnicos.filter(p => !allPuestosValidos.has(p))

  console.log(`\nTotal puestos únicos en BD: ${puestosUnicos.length}`)
  console.log(`Puestos en catálogo: ${allPuestosValidos.size}`)
  console.log(`\n❌ Puestos NO encontrados en catálogo (${noEncontrados.length}):\n`)

  for (const p of noEncontrados) {
    // Contar cuántos empleados tienen este puesto
    const count = data.filter(e => e.puesto === p).length
    // Intentar sugerir el más parecido del catálogo
    const sugerencia = encontrarSimilar(p, allPuestosValidos)
    console.log(`  "${p}" (${count} empleados)`)
    if (sugerencia) console.log(`    → Sugerencia: "${sugerencia}"`)
  }

  console.log(`\n✅ Puestos que SÍ coinciden: ${puestosUnicos.length - noEncontrados.length}`)
}

function encontrarSimilar(puesto, catalogo) {
  let mejor = null
  let mejorScore = 0
  for (const c of catalogo) {
    const score = similarity(puesto.toLowerCase(), c.toLowerCase())
    if (score > mejorScore) {
      mejorScore = score
      mejor = c
    }
  }
  return mejorScore > 0.5 ? mejor : null
}

// Dice coefficient for string similarity
function similarity(a, b) {
  const bigrams = (s) => {
    const set = new Map()
    for (let i = 0; i < s.length - 1; i++) {
      const bi = s.substring(i, i + 2)
      set.set(bi, (set.get(bi) || 0) + 1)
    }
    return set
  }
  const ba = bigrams(a), bb = bigrams(b)
  let intersection = 0
  for (const [k, v] of ba) {
    intersection += Math.min(v, bb.get(k) || 0)
  }
  return (2 * intersection) / (a.length - 1 + b.length - 1) || 0
}

main()
