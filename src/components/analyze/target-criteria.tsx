"use client"

import { AGE_RANGES, GENDERS } from "@/lib/constants"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TargetCriteriaProps {
  ageValue?: string
  genderValue?: string
  tagsValue?: string
  onAgeChange: (value: string) => void
  onGenderChange: (value: string) => void
  onTagsChange: (value: string) => void
  ageError?: string
  genderError?: string
}

export function TargetCriteria({
  ageValue,
  genderValue,
  tagsValue,
  onAgeChange,
  onGenderChange,
  onTagsChange,
  ageError,
  genderError,
}: TargetCriteriaProps) {
  return (
    <div className="grid gap-4">
      <Label className="text-base font-medium">Target Audience</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="age" className="text-sm">
            Age Range
          </Label>
          <Select value={ageValue} onValueChange={onAgeChange}>
            <SelectTrigger id="age">
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              {AGE_RANGES.map((age) => (
                <SelectItem key={age.value} value={age.value}>
                  {age.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {ageError && (
            <p className="text-sm text-destructive">{ageError}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="gender" className="text-sm">
            Gender
          </Label>
          <Select value={genderValue} onValueChange={onGenderChange}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((gender) => (
                <SelectItem key={gender.value} value={gender.value}>
                  {gender.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {genderError && (
            <p className="text-sm text-destructive">{genderError}</p>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tags" className="text-sm">
          Tags / Interests
        </Label>
        <Input
          id="tags"
          placeholder="e.g. fitness, cooking, comedy (comma-separated)"
          value={tagsValue || ""}
          onChange={(e) => onTagsChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple tags with commas
        </p>
      </div>
    </div>
  )
}
