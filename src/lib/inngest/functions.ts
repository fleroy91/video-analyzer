import { inngest } from "./client"
import {
  downloadVideo,
  uploadToGemini,
  waitForActive,
  geminiGenerate,
  parseJson,
  saveResults,
  updateStep,
  buildExtractPrompt,
  buildScorePrompt,
  type PipelineParams,
} from "@/lib/gemini/pipeline"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"

export const analyzeVideo = inngest.createFunction(
  {
    id: "analyze-video",
    retries: 1,
    onFailure: async ({ event }) => {
      try {
        const { requestId } = event.data.event.data as Pick<PipelineParams, "requestId">
        if (!requestId) return
        const admin = createAdminClient()
        await admin
          .from("analysis_requests")
          .update({ status: "failed", error_message: event.data.error.message })
          .eq("id", requestId)
      } catch (e) {
        console.error("[inngest] onFailure handler error:", e)
      }
    },
  },
  { event: "video/analyze.requested" },
  async ({ event, step }) => {
    const { requestId, videoUrl, platform, targetAge, targetGender, targetTags } =
      event.data as PipelineParams

    const tag = `[pipeline:${requestId.slice(0, 8)}]`

    // Step 1+2: Download video and upload to Gemini (combined — ArrayBuffer is not serializable)
    const upload = await step.run("download-and-upload", async () => {
      console.log(`${tag} [1/5] Downloading video...`)
      await updateStep(requestId, "downloading", { status: "processing" })
      const { data, mimeType } = await downloadVideo(videoUrl)
      console.log(`${tag}       ${(data.byteLength / 1024 / 1024).toFixed(1)} MB  (${mimeType})`)

      console.log(`${tag} [2/5] Uploading to Gemini Files API...`)
      await updateStep(requestId, "uploading")
      const result = await uploadToGemini(data, mimeType)
      console.log(`${tag}       → ${result.fileName}`)
      return result
    })

    // Step 3: Wait for Gemini to process the video
    await step.run("wait-for-active", async () => {
      console.log(`${tag} [3/5] Waiting for Gemini to process video...`)
      await updateStep(requestId, "processing")
      await waitForActive(upload.fileName)
      console.log(`${tag}       ready.`)
    })

    // Step 4: Extract characteristics
    const analysis = await step.run("extract-characteristics", async () => {
      console.log(`${tag} [4/5] Extracting characteristics...`)
      await updateStep(requestId, "extracting")
      const prompt = buildExtractPrompt({ platform, targetAge, targetGender, targetTags })
      const text = await geminiGenerate(prompt, upload.fileUri, upload.fileMime)
      return parseJson(text)
    })

    // Step 5: Score KPIs
    const scoring = await step.run("score-kpis", async () => {
      console.log(`${tag} [5/5] Scoring KPIs...`)
      await updateStep(requestId, "scoring")
      const prompt = buildScorePrompt({ platform, targetAge, targetGender, targetTags, analysis })
      const text = await geminiGenerate(prompt)
      return parseJson(text)
    })

    // Step 6: Save results to Supabase
    await step.run("save-results", async () => {
      console.log(`${tag} Saving results to Supabase...`)
      await updateStep(requestId, "saving")
      await saveResults(
        requestId,
        scoring.results as { kpi_name: string; predicted_value: string; score: number; explanation?: string }[],
        analysis as Json,
      )
      console.log(`${tag} Done!`)
    })
  },
)
