import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runGeminiPipeline } from "@/lib/gemini/pipeline"

// Allow up to 5 minutes on Vercel Pro / self-hosted
export const maxDuration = 300

export async function POST(request: Request) {
  const body = await request.json()
  const { requestId, videoUrl, platform, targetAge, targetGender, targetTags, callbackUrl } = body

  if (!requestId || !videoUrl || !callbackUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    await runGeminiPipeline({ requestId, videoUrl, platform, targetAge, targetGender, targetTags, callbackUrl })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`[worker] Pipeline failed for ${requestId}:`, err)

    // Mark the request as failed in the DB
    try {
      const supabase = await createClient()
      await supabase
        .from("analysis_requests")
        .update({ status: "failed", error_message: String(err) })
        .eq("id", requestId)
    } catch (dbErr) {
      console.error("[worker] Failed to update error status:", dbErr)
    }

    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
