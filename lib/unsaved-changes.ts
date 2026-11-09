type UnsavedChangesGuard = () => Promise<boolean>

const guards = new Set<UnsavedChangesGuard>()

export function registerUnsavedChangesGuard(guard: UnsavedChangesGuard) {
  guards.add(guard)
  return () => {
    guards.delete(guard)
  }
}

export async function confirmUnsavedChanges() {
  for (const guard of guards) {
    if (!(await guard())) return false
  }
  return true
}
