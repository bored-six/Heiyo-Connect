"use client"

import { useEffect, useRef, useState } from "react"

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const allZero = data.every((v) => v === 0)

  if (allZero) {
    return (
      <svg viewBox="0 0 60 20" className="w-full h-5" preserveAspectRatio="none">
        <line x1="0" y1="10" x2="60" y2="10" stroke={color} strokeWidth="1.5" strokeOpacity="0.35" />
      </svg>
    )
  }

  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 60
    const y = 18 - (v / max) * 16
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return (
    <svg viewBox="0 0 60 20" className="w-full h-5" preserveAspectRatio="none">
      <path
        d={`M ${points.join(" L ")}`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.6"
      />
    </svg>
  )
}

export function StatCard({
  label,
  value,
  colorClass,
  sparkline,
  sparklineColor,
}: {
  label: string
  value: number
  colorClass: string
  sparkline: number[]
  sparklineColor: string
}) {
  const [displayed, setDisplayed] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const DURATION = 800

  useEffect(() => {
    startRef.current = null
    if (value === 0) {
      setDisplayed(0)
      return
    }

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / DURATION, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * value))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value])

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 tabular-nums ${colorClass}`}>{displayed}</p>
      <div className="mt-3 opacity-70">
        <Sparkline data={sparkline} color={sparklineColor} />
      </div>
    </div>
  )
}
