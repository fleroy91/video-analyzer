import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeApiSchema } from "@/lib/validators"
import { runGeminiPipeline } from "@/lib/gemini/pipeline"

export async function POST(request: Request) {
  const start = Date.now()
  console.log("[analyze] POST received")

  try {
    const body = await request.json()
    const parsed = analyzeApiSchema.safeParse(body)

    if (!parsed.success) {
      console.warn("[analyze] Invalid request body:", parsed.error.issues)
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn("[analyze] Unauthenticated request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoUrl, videoSource, platform, targetAge, targetGender, targetTags } =
      parsed.data

    console.log(`[analyze] user=${user.email} platform=${platform} source=${videoSource}`)
    console.log(`[analyze] videoUrl=${videoUrl.slice(0, 80)}`)

    // Create analysis request record
    const { data: analysisRequest, error: insertError } = await supabase
      .from("analysis_requests")
      .insert({
        user_id: user.id,
        video_url: videoUrl,
        video_source: videoSource,
        platform,
        target_age: targetAge,
        target_gender: targetGender,
        target_tags: targetTags,
        status: "processing",
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("[analyze] DB insert failed:", insertError.message)
      return NextResponse.json(
        { error: "Failed to create analysis request" },
        { status: 500 }
      )
    }

    const { id: requestId } = analysisRequest
    console.log(`[analyze] Request created — id=${requestId} (${Date.now() - start}ms)`)

    // Fire-and-forget: run pipeline directly, saves results to Supabase
    runGeminiPipeline({ requestId, videoUrl, platform, targetAge, targetGender, targetTags })
      .catch(async (err) => {
        console.error(`[analyze] Pipeline failed for ${requestId}:`, err)
        await supabase
          .from("analysis_requests")
          .update({ status: "failed", error_message: String(err) })
          .eq("id", requestId)
      })

    console.log(`[analyze] Pipeline launched — responding in ${Date.now() - start}ms`)
    return NextResponse.json({ requestId })
  } catch (err) {
    console.error("[analyze] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
