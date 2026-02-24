"use client"

import { PLATFORMS, type Platform } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface PlatformSelectProps {
  value?: string
  onChange: (value: Platform) => void
  error?: string
}

const platformConfig: Record<
  Platform,
  { icon: React.ReactNode; selectedBg: string; selectedRing: string; selectedText: string; hoverBg: string }
> = {
  tiktok: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <path
          d="M21.5 6C21.5 6 22 10 26 11V15C26 15 23.5 15 21.5 13.5V21C21.5 25.5 17.5 29 13 28C8.5 27 5.5 22.5 7 18C8.5 13.5 13.5 11.5 18 13V17C18 17 15.5 16 13.5 17.5C11.5 19 11.5 22 13.5 23C15.5 24 18 22.5 18 20V6H21.5Z"
          fill="currentColor"
        />
      </svg>
    ),
    selectedBg: "bg-pink-500/10",
    selectedRing: "ring-pink-500/60 border-pink-500/60",
    selectedText: "text-pink-400",
    hoverBg: "hover:bg-pink-500/5 hover:border-pink-500/30",
  },
  instagram: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect x="6" y="6" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="22.5" cy="9.5" r="1.5" fill="currentColor" />
      </svg>
    ),
    selectedBg: "bg-purple-500/10",
    selectedRing: "ring-purple-500/60 border-purple-500/60",
    selectedText: "text-purple-400",
    hoverBg: "hover:bg-purple-500/5 hover:border-purple-500/30",
  },
  youtube: {
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M13 12L21 16L13 20V12Z" fill="currentColor" />
      </svg>
    ),
    selectedBg: "bg-red-500/10",
    selectedRing: "ring-red-500/60 border-red-500/60",
    selectedText: "text-red-400",
    hoverBg: "hover:bg-red-500/5 hover:border-red-500/30",
  },
}

export function PlatformSelect({ value, onChange, error }: PlatformSelectProps) {
  return (
    <div className="grid gap-3">
      <Label className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground">
        Platform
      </Label>
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(PLATFORMS) as Platform[]).map((key) => {
          const platform = PLATFORMS[key]
          const config = platformConfig[key]
          const isSelected = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all duration-200",
                isSelected
                  ? cn(config.selectedBg, config.selectedRing, "ring-2 ring-offset-0", config.selectedText)
                  : cn("border-border/50 text-muted-foreground", config.hoverBg, "hover:text-foreground")
              )}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-current opacity-80" />
              )}
              <span className="transition-transform duration-200 group-hover:scale-110">
                {config.icon}
              </span>
              <span className="text-sm font-semibold font-display tracking-wide">
                {platform.label}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
