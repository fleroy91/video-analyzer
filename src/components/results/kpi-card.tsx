"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  kpiName: string
  predictedValue: string
  score: number
  explanation?: string | null
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-green-600"
  if (score >= 40) return "text-yellow-600"
  return "text-red-600"
}

function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 70) return "default"
  if (score >= 40) return "secondary"
  return "destructive"
}

function getProgressColor(score: number) {
  if (score >= 70) return "[&>div]:bg-green-500"
  if (score >= 40) return "[&>div]:bg-yellow-500"
  return "[&>div]:bg-red-500"
}

export function KpiCard({ kpiName, predictedValue, score, explanation }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{kpiName}</CardTitle>
          <Badge variant={getScoreBadgeVariant(score)}>
            <span className={cn("font-bold", getScoreColor(score))}>
              {score}
            </span>
            /100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="text-2xl font-bold">{predictedValue}</div>
        <Progress
          value={score}
          className={cn("h-2", getProgressColor(score))}
        />
        {explanation && (
          <p className="text-xs text-muted-foreground">{explanation}</p>
        )}
      </CardContent>
    </Card>
  )
}
