"use client"

import { PLATFORMS, type Platform } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface PlatformSelectProps {
  value?: string
  onChange: (value: Platform) => void
  error?: string
}

const platformIcons: Record<Platform, string> = {
  tiktok: "TT",
  instagram: "IG",
  youtube: "YT",
}

const platformColors: Record<Platform, string> = {
  tiktok: "border-pink-500/50 bg-pink-500/5 text-pink-700",
  instagram: "border-purple-500/50 bg-purple-500/5 text-purple-700",
  youtube: "border-red-500/50 bg-red-500/5 text-red-700",
}

export function PlatformSelect({ value, onChange, error }: PlatformSelectProps) {
  return (
    <div className="grid gap-3">
      <Label className="text-base font-medium">Platform</Label>
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(PLATFORMS) as Platform[]).map((key) => {
          const platform = PLATFORMS[key]
          const isSelected = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                isSelected
                  ? cn(platformColors[key], "ring-2 ring-offset-2 ring-current")
                  : "border-muted hover:border-muted-foreground/50"
              )}
            >
              <span className="text-2xl font-bold">{platformIcons[key]}</span>
              <span className="text-sm font-medium">{platform.label}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
