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
    targetAge: z.enum(["13-17", "18-24", "25-34", "35-44", "45-54", "55+"], {
      message: "Please select an age range",
    }),
    targetGender: z.enum(["male", "female", "all"], {
      message: "Please select a gender",
    }),
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
  targetGender: z.enum(["male", "female", "all"]),
  targetTags: z.array(z.string()).default([]),
})

export const webhookResultsSchema = z.object({
  requestId: z.string().uuid(),
  results: z.array(
    z.object({
      kpi_name: z.string(),
      predicted_value: z.string(),
      score: z.number().min(0).max(100),
      explanation: z.string().optional(),
    })
  ),
})
