export const PLATFORMS = {
  tiktok: {
    label: "TikTok",
    value: "tiktok" as const,
    kpis: ["Views", "Likes", "Comments", "Shares", "Watch Time", "Completion Rate"],
  },
  instagram: {
    label: "Instagram",
    value: "instagram" as const,
    kpis: ["Reach", "Impressions", "Likes", "Comments", "Saves", "Shares"],
  },
  youtube: {
    label: "YouTube",
    value: "youtube" as const,
    kpis: ["Views", "Watch Time", "Likes", "Comments", "CTR", "Subscriber Gain"],
  },
} as const

export type Platform = keyof typeof PLATFORMS

export const AGE_RANGES = [
  { label: "13-17", value: "13-17" },
  { label: "18-24", value: "18-24" },
  { label: "25-34", value: "25-34" },
  { label: "35-44", value: "35-44" },
  { label: "45-54", value: "45-54" },
  { label: "55+", value: "55+" },
] as const

export const GENDERS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "All", value: "all" },
] as const

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
}
