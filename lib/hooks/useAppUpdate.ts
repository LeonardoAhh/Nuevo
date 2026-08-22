"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type UpdateStatus =
  | "idle"        // No check has run yet
  | "checking"    // Actively polling the server for a new SW
  | "available"   // A new SW is installed & waiting
  | "applying"    // User confirmed; SKIP_WAITING sent, reload imminent
  | "up-to-date"  // Check completed — no new version found

// ─── Singleton store ──────────────────────────────────────────────────────────
// A single shared store so every component that calls useAppUpdate() sees the
// same state without duplicating SW event listeners.

let status: UpdateStatus = "idle"
const listeners = new Set<() => void>()

function getStatus() { return status }
function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb) } }
function setStatus(next: UpdateStatus) { status = next; listeners.forEach((cb) => cb()) }

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!("serviceWorker" in navigator)) return undefined
  return navigator.serviceWorker.getRegistration()
}

function activateWaitingWorker() {
  getRegistration().then((reg) => {
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" })
    } else {
      // Edge case: no waiting worker but user requested update — hard reload
      window.location.reload()
    }
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppUpdate() {
  const currentStatus = useSyncExternalStore(subscribe, getStatus, getStatus)
  const upToDateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Passive detection: listen for a new SW installing in the background ──
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    let reg: ServiceWorkerRegistration | undefined

    const onUpdateFound = () => {
      const installing = reg?.installing
      if (!installing) return
      installing.onstatechange = () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          setStatus("available")
        }
      }
    }

    const onControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.getRegistration().then((r) => {
      if (!r) return
      reg = r
      // Already a waiting worker from a previous visit?
      if (r.waiting && navigator.serviceWorker.controller) {
        setStatus("available")
      }
      r.addEventListener("updatefound", onUpdateFound)
    })

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    return () => {
      reg?.removeEventListener("updatefound", onUpdateFound)
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])

  // ── Manual check triggered by the user ──────────────────────────────────
  const checkForUpdate = useCallback(async () => {
    // Prevent duplicate checks
    const current = getStatus()
    if (current === "checking" || current === "applying") return

    if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current)
    setStatus("checking")

    const reg = await getRegistration()

    if (!reg) {
      // No SW registered — nothing to update
      setStatus("up-to-date")
      upToDateTimerRef.current = setTimeout(() => setStatus("idle"), 4000)
      return
    }

    // Already has a waiting worker → update available right now
    if (reg.waiting && navigator.serviceWorker.controller) {
      setStatus("available")
      return
    }

    // Ask the browser to check the server for a new SW
    try {
      await reg.update()
    } catch {
      // Network error during update check — treat as up-to-date
    }

    // Give the browser a moment to fire "updatefound" if a new worker was found.
    // If status hasn't changed to "available" after this timeout, we're current.
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (getStatus() === "checking") {
      setStatus("up-to-date")
      upToDateTimerRef.current = setTimeout(() => setStatus("idle"), 4000)
    }
  }, [])

  // ── Apply the waiting update ────────────────────────────────────────────
  const applyUpdate = useCallback(() => {
    setStatus("applying")
    // Small delay so the user sees the "applying" state before the reload
    setTimeout(() => activateWaitingWorker(), 600)
  }, [])

  // Clean up timers
  useEffect(() => () => { if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current) }, [])

  return { status: currentStatus, checkForUpdate, applyUpdate, getLatestStatus: getStatus } as const
}
