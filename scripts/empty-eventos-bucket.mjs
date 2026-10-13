import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local antes de continuar.",
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { error: emptyError } = await supabase.storage.emptyBucket("eventos")
if (emptyError) {
  throw new Error(`No se pudo vaciar el bucket eventos: ${emptyError.message}`)
}

const { error: deleteError } = await supabase.storage.deleteBucket("eventos")
if (deleteError) {
  throw new Error(`No se pudo eliminar el bucket eventos: ${deleteError.message}`)
}

console.log("Bucket eventos y sus archivos eliminados.")
