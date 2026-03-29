"use client"

import { useEffect, useRef, useState } from "react"

export function DonutCard({
  resolved,
  total,
}: {
  resolved: number
  total: number
}) {
  const rate = total === 0 ? 0 : Math.round((resolved / total) * 100)
  const R = 26
  const SIZE = 68
  const cx = SIZE / 2
  const circumference = 2 * Math.PI * R

  const [progress, setProgress] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const DURATION = 900

  useEffect(() => {
    startRef.current = null
    if (rate === 0) {
      setProgress(0)
      return
    }
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / DURATION, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(eased * rate)
      if (p < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [rate])

  const dashArray = `${(progress / 100) * circumference} ${circumference}`

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">Resolved</p>
      <div className="flex items-center gap-4 mt-2">
        <div className="relative shrink-0">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Track */}
            <circle
              cx={cx}
              cy={cx}
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-muted/40"
            />
            {/* Arc */}
            <circle
              cx={cx}
              cy={cx}
              r={R}
              fill="none"
              stroke="#64748b"
              strokeWidth="5"
              strokeDasharray={dashArray}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cx})`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold text-muted-foreground tabular-nums mt-1">{resolved}</p>
          <p className="text-xs text-muted-foreground mt-0.5">of {total} tickets</p>
        </div>
      </div>
    </div>
  )
}
