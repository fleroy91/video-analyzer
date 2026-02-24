"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { analyzeFormSchema, type AnalyzeFormValues } from "@/lib/validators"
import type { Platform } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { VideoUpload } from "./video-upload"
import { PlatformSelect } from "./platform-select"
import { TargetCriteria } from "./target-criteria"

export function AnalyzeForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [videoFile, setVideoFile] = useState<File | undefined>()
  const [videoUrl, setVideoUrl] = useState("")
  const [platform, setPlatform] = useState<Platform | undefined>()
  const [targetAge, setTargetAge] = useState<string[]>([])
  const [targetGender, setTargetGender] = useState<string[]>([])
  const [targetTags, setTargetTags] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const formData: AnalyzeFormValues = {
      videoFile,
      videoUrl: videoUrl || undefined,
      platform: platform as "tiktok" | "instagram" | "youtube",
      targetAge: targetAge as AnalyzeFormValues["targetAge"],
      targetGender: targetGender as AnalyzeFormValues["targetGender"],
      targetTags,
    }

    const result = analyzeFormSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".")
        fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)

    try {
      let finalVideoUrl = videoUrl
      let videoSource: "upload" | "link" = "link"

      // Upload file to Supabase Storage if present
      if (videoFile) {
        videoSource = "upload"
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        const ext = videoFile.name.split(".").pop()
        const filePath = `${user!.id}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("videos")
          .upload(filePath, videoFile)

        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}`)
          setLoading(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("videos").getPublicUrl(filePath)

        finalVideoUrl = publicUrl
      }

      // Call API to create analysis request
      const tagsArray = targetTags
        ? targetTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: finalVideoUrl,
          videoSource,
          platform,
          targetAge: targetAge.join(", "),
          targetGender: targetGender.join(", "),
          targetTags: tagsArray,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to create analysis")
        setLoading(false)
        return
      }

      const { requestId } = await res.json()
      toast.success("Analysis started!")
      router.push(`/results/${requestId}`)
    } catch {
      toast.error("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Analyze Video Performance
        </CardTitle>
        <CardDescription>
          Upload a short video (max 15s) and get AI-powered performance
          predictions for your target platform and audience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <VideoUpload
            onFileChange={setVideoFile}
            onUrlChange={setVideoUrl}
            fileError={errors["videoFile"]}
            urlError={errors["videoUrl"]}
          />

          <Separator />

          <PlatformSelect
            value={platform}
            onChange={setPlatform}
            error={errors["platform"]}
          />

          <Separator />

          <TargetCriteria
            ageValues={targetAge}
            genderValues={targetGender}
            tagsValue={targetTags}
            onAgeChange={setTargetAge}
            onGenderChange={setTargetGender}
            onTagsChange={setTargetTags}
            ageError={errors["targetAge"]}
            genderError={errors["targetGender"]}
          />

          <Button type="submit" size="lg" disabled={loading} className="w-full glow-btn">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting analysis...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
