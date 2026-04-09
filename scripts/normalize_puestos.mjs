// Script para normalizar puestos en employees
// Ejecutar: node scripts/normalize_puestos.mjs

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Mapeo: puesto incorrecto → puesto correcto (catálogo)
const MAPEO = {
  "OPERADOR DE ACABADOS GP-12 A": "OPERADOR DE ACABADOS - GP12 A",
  "OPERADOR DE ACABADOS GP-12 B": "OPERADOR DE ACABADOS - GP12 B",
  "OPERADOR DE ACABADOS GP-12 C": "OPERADOR DE ACABADOS - GP12 C",
  "OPERADOR DE ACABADOS GP-12 D": "OPERADOR DE ACABADOS - GP12 D",
  "JEFE DE LOGISTICA":            "JEFE DE LOGÍSTICA",
  "AUXILIAR DEL SGI C":            "AUXILIAR DE SGI C",
}

async function main() {
  console.log("Normalizando puestos en employees...\n")

  for (const [viejo, nuevo] of Object.entries(MAPEO)) {
    const { data, error } = await supabase
      .from("employees")
      .update({ puesto: nuevo })
      .eq("puesto", viejo)
      .select("id")

    if (error) {
      console.log(`  ❌ "${viejo}" → Error: ${error.message}`)
    } else {
      console.log(`  ✅ "${viejo}" → "${nuevo}" (${data.length} actualizados)`)
    }
  }

  // También normalizar en reglas_promocion si existe
  console.log("\nNormalizando en reglas_promocion...\n")
  for (const [viejo, nuevo] of Object.entries(MAPEO)) {
    const { data, error } = await supabase
      .from("reglas_promocion")
      .update({ puesto: nuevo })
      .eq("puesto", viejo)
      .select("id")

    if (error) {
      // ignore si la tabla no tiene ese puesto
      if (!error.message.includes("0 rows")) {
        console.log(`  ⚠ reglas_promocion "${viejo}" → ${error.message}`)
      }
    } else if (data.length > 0) {
      console.log(`  ✅ reglas_promocion "${viejo}" → "${nuevo}" (${data.length})`)
    }
  }

  console.log("\n✅ Normalización completada")
}

main()
