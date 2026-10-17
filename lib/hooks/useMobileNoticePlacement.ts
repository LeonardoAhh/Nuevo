"use client"

import { useSyncExternalStore } from "react"

const MOBILE_NOTICE_QUERY = "(max-width: 639px)"

function subscribe(onChange: () => void) {
  const media = window.matchMedia(MOBILE_NOTICE_QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_NOTICE_QUERY).matches
}

export function useMobileNoticePlacement() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
