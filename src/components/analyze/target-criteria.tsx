"use client"

import { AGE_RANGES, GENDERS } from "@/lib/constants"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TargetCriteriaProps {
  ageValues: string[]
  genderValues: string[]
  tagsValue?: string
  onAgeChange: (values: string[]) => void
  onGenderChange: (values: string[]) => void
  onTagsChange: (value: string) => void
  ageError?: string
  genderError?: string
}

function toggle(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value]
}

export function TargetCriteria({
  ageValues,
  genderValues,
  tagsValue,
  onAgeChange,
  onGenderChange,
  onTagsChange,
  ageError,
  genderError,
}: TargetCriteriaProps) {
  return (
    <div className="grid gap-5">
      <Label className="text-sm font-semibold font-display uppercase tracking-wider text-muted-foreground">
        Target Audience
      </Label>

      {/* Age Range — multi-select pills */}
      <div className="grid gap-2">
        <Label className="text-sm font-medium">Age Range</Label>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((age) => {
            const isSelected = ageValues.includes(age.value)
            return (
              <button
                key={age.value}
                type="button"
                onClick={() => onAgeChange(toggle(ageValues, age.value))}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all duration-150",
                  isSelected
                    ? "bg-primary/15 border-primary/60 text-primary ring-1 ring-primary/30"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-secondary/30"
                )}
              >
                {age.label}
              </button>
            )
          })}
        </div>
        {ageError && <p className="text-sm text-destructive">{ageError}</p>}
      </div>

      {/* Gender — multi-select pills */}
      <div className="grid gap-2">
        <Label className="text-sm font-medium">Gender</Label>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((gender) => {
            const isSelected = genderValues.includes(gender.value)
            return (
              <button
                key={gender.value}
                type="button"
                onClick={() => onGenderChange(toggle(genderValues, gender.value))}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all duration-150",
                  isSelected
                    ? "bg-primary/15 border-primary/60 text-primary ring-1 ring-primary/30"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-secondary/30"
                )}
              >
                {gender.label}
              </button>
            )
          })}
        </div>
        {genderError && <p className="text-sm text-destructive">{genderError}</p>}
      </div>

      {/* Tags */}
      <div className="grid gap-2">
        <Label htmlFor="tags" className="text-sm font-medium">
          Tags / Interests
        </Label>
        <Input
          id="tags"
          placeholder="e.g. fitness, cooking, comedy (comma-separated)"
          value={tagsValue || ""}
          onChange={(e) => onTagsChange(e.target.value)}
          className="bg-secondary/50 border-border/60 focus:border-primary/60"
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple tags with commas
        </p>
      </div>
    </div>
  )
}
