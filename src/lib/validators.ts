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

