import { z } from "zod"

export const analyzeFormSchema = z
  .object({
    videoFile: z
      .instanceof(File)
      .refine((f) => f.size <= 50 * 1024 * 1024, "File must be less than 50MB")
      .refine(
        (f) => f.type.startsWith("video/"),
        "File must be a video"
      )
      .optional(),
    videoUrl: z.string().url("Please enter a valid URL").optional(),
    platform: z.enum(["tiktok", "instagram", "youtube"], {
      message: "Please select a platform",
    }),
    targetAge: z
      .array(z.enum(["13-17", "18-24", "25-34", "35-44", "45-54", "55+"]))
      .min(1, "Please select at least one age range"),
    targetGender: z
      .array(z.enum(["male", "female", "all"]))
      .min(1, "Please select at least one gender"),
    targetTags: z.string().optional(),
  })
  .refine((data) => data.videoFile || data.videoUrl, {
    message: "Please upload a video file or provide a URL",
    path: ["videoUrl"],
  })

export type AnalyzeFormValues = z.infer<typeof analyzeFormSchema>

export const analyzeApiSchema = z.object({
  videoUrl: z.string().url(),
  videoSource: z.enum(["upload", "link"]),
  platform: z.enum(["tiktok", "instagram", "youtube"]),
  targetAge: z.string(),
  targetGender: z.string(),
  targetTags: z.array(z.string()).default([]),
})

const videoCharacteristicsSchema = z.object({
  tags: z.array(z.string()).optional(),
  quality_score: z.number().optional(),
  hook_strength: z.number().optional(),
  audience_relevance: z.number().optional(),
  content_summary: z.string().optional(),
  characteristics: z.object({
    objective: z.string().optional(),
    storytelling: z.number().optional(),
    audio_quality: z.number().optional(),
    visual_quality: z.number().optional(),
    editing_pacing: z.number().optional(),
    audience_awareness: z.number().optional(),
    cta_present: z.boolean().optional(),
    lighting: z.number().optional(),
    stability: z.number().optional(),
    format_fit: z.number().optional(),
  }).optional(),
}).optional()

export const webhookResultsSchema = z.object({
  requestId: z.string(),
  results: z.array(
    z.object({
      kpi_name: z.string(),
      predicted_value: z.coerce.string(),
      score: z.number().min(0).max(100),
      explanation: z.string().optional(),
    })
  ),
  characteristics: videoCharacteristicsSchema,
})
