"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { Json } from "@/types/database"

interface VideoAnalysis {
  tags?: string[]
  quality_score?: number
  hook_strength?: number
  audience_relevance?: number
  content_summary?: string
  characteristics?: {
    objective?: string
    storytelling?: number
    audio_quality?: number
    visual_quality?: number
    editing_pacing?: number
    audience_awareness?: number
    cta_present?: boolean
    lighting?: number
    stability?: number
    format_fit?: number
  }
}

function parseAnalysis(raw: Json): VideoAnalysis | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  return raw as VideoAnalysis
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70
      ? "text-emerald-400 [&>div]:bg-emerald-500"
      : value >= 40
        ? "text-amber-400 [&>div]:bg-amber-500"
        : "text-rose-400 [&>div]:bg-rose-500"

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Progress value={value} className={cn("h-1.5 bg-muted/60", color)} />
      </div>
      <span className={cn("text-sm font-bold tabular-nums w-8 text-right", color.split(" ")[0])}>
        {value}
      </span>
    </div>
  )
}

interface VideoCharacteristicsCardProps {
  data: Json | null
}

export function VideoCharacteristicsCard({ data }: VideoCharacteristicsCardProps) {
  const analysis = parseAnalysis(data)
  if (!analysis) return null

  const { tags, quality_score, hook_strength, audience_relevance, content_summary, characteristics } = analysis

  const overviewScores = [
    { label: "Production Quality", value: quality_score },
    { label: "Hook Strength", value: hook_strength },
    { label: "Audience Relevance", value: audience_relevance },
  ].filter((s): s is { label: string; value: number } => typeof s.value === "number")

  const detailScores = characteristics
    ? [
        { label: "Storytelling", value: characteristics.storytelling },
        { label: "Audio Quality", value: characteristics.audio_quality },
        { label: "Visual Quality", value: characteristics.visual_quality },
        { label: "Editing & Pacing", value: characteristics.editing_pacing },
        { label: "Audience Awareness", value: characteristics.audience_awareness },
        { label: "Lighting", value: characteristics.lighting },
        { label: "Stability", value: characteristics.stability },
        { label: "Format Fit", value: characteristics.format_fit },
      ].filter((s): s is { label: string; value: number } => typeof s.value === "number")
    : []

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">Video Analysis</CardTitle>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {characteristics?.objective && (
              <Badge variant="secondary" className="capitalize text-xs">
                {characteristics.objective}
              </Badge>
            )}
            {typeof characteristics?.cta_present === "boolean" && (
              <Badge
                variant={characteristics.cta_present ? "default" : "outline"}
                className="text-xs"
              >
                {characteristics.cta_present ? "CTA ✓" : "No CTA"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {content_summary && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/40 pl-3">
              {content_summary}
            </p>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Topics
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {overviewScores.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overview
            </p>
            <div className="space-y-3">
              {overviewScores.map((s) => (
                <ScoreRow key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </div>
        )}

        {detailScores.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Technical & Creative
            </p>
            <div className="space-y-3">
              {detailScores.map((s) => (
                <ScoreRow key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
