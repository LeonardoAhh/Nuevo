"use client"

import { useEffect, useRef, useState } from "react"
import { animate, useInView } from "framer-motion"

interface CountUpProps {
  to: number
  duration?: number
  suffix?: string
  prefix?: string
}

/**
 * Tween-driven integer counter. Starts only when visible and runs once.
 */
export default function CountUp({ to, duration = 1.2, suffix, prefix }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value}
      {suffix}
    </span>
  )
}
