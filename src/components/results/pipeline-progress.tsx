"use client"

import { PIPELINE_STEPS, type PipelineStep } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Check, Loader2, Download, Upload, Cpu, ScanSearch, BarChart3, Database } from "lucide-react"

const STEP_ICONS: Record<PipelineStep, React.ComponentType<{ className?: string }>> = {
  downloading: Download,
  uploading: Upload,
  processing: Cpu,
  extracting: ScanSearch,
  scoring: BarChart3,
  saving: Database,
}

interface PipelineProgressProps {
  currentStep: string | null
}

export function PipelineProgress({ currentStep }: PipelineProgressProps) {
  const currentIndex = PIPELINE_STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="space-y-1">
      {PIPELINE_STEPS.map((step, i) => {
        const isCompleted = currentIndex > i
        const isActive = currentIndex === i
        const isPending = currentIndex < i
        const Icon = STEP_ICONS[step.key]

        return (
          <div key={step.key} className="flex items-center gap-3 py-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                isCompleted && "bg-emerald-500/15 text-emerald-500",
                isActive && "bg-primary/15 text-primary ring-2 ring-primary/30",
                isPending && "bg-muted text-muted-foreground/40"
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isCompleted && "text-emerald-500",
                  isActive && "text-foreground",
                  isPending && "text-muted-foreground/50"
                )}
              >
                {step.label}
              </p>
            </div>

            {isCompleted && (
              <span className="text-xs text-emerald-500/70 font-medium">Done</span>
            )}
            {isActive && (
              <span className="text-xs text-primary/70 font-medium animate-pulse">In progress…</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
