"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  kpiName: string
  predictedValue: string
  score: number
  explanation?: string | null
}

function getScoreConfig(score: number) {
  if (score >= 70) {
    return {
      label: "Strong",
      labelColor: "text-emerald-400",
      progressColor: "[&>div]:bg-emerald-500",
      ringColor: "ring-emerald-500/20",
      glowColor: "shadow-emerald-500/10",
      dotColor: "bg-emerald-400",
    }
  }
  if (score >= 40) {
    return {
      label: "Average",
      labelColor: "text-amber-400",
      progressColor: "[&>div]:bg-amber-500",
      ringColor: "ring-amber-500/20",
      glowColor: "shadow-amber-500/10",
      dotColor: "bg-amber-400",
    }
  }
  return {
    label: "Low",
    labelColor: "text-rose-400",
    progressColor: "[&>div]:bg-rose-500",
    ringColor: "ring-rose-500/20",
    glowColor: "shadow-rose-500/10",
    dotColor: "bg-rose-400",
  }
}

function formatPredictedValue(kpiName: string, value: string): string {
  if (kpiName === "View Duration") {
    const ms = Number.parseInt(value.replaceAll(/\D/g, ""), 10)
    if (Number.isNaN(ms)) return value
    if (ms < 1000) return `${ms}ms`
    const s = Math.floor(ms / 1000)
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    const rem = s % 60
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`
  }
  return value
}

export function KpiCard({ kpiName, predictedValue, score, explanation }: Readonly<KpiCardProps>) {
  const config = getScoreConfig(score)

  return (
    <Card
      className={cn(
        "border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-200",
        "hover:border-border hover:shadow-lg",
        config.ringColor,
        config.glowColor,
        "ring-1"
      )}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-display">
            {kpiName}
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
            <span className={cn("text-xs font-bold tabular-nums", config.labelColor)}>
              {score}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 pb-4">
        <div className="text-2xl font-bold font-display tracking-tight">{formatPredictedValue(kpiName, predictedValue)}</div>
        <Progress
          value={score}
          className={cn("h-1.5 bg-muted/60", config.progressColor)}
        />
        {explanation && (
          <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
        )}
      </CardContent>
    </Card>
  )
}
