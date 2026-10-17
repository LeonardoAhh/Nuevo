import { permanentRedirect } from "next/navigation"
import { ASSIGNMENTS_PATH } from "@/lib/navigation"

export default function LegacyEvaluatorAssignmentsPage() {
  permanentRedirect(ASSIGNMENTS_PATH)
}
