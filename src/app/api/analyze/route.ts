import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeApiSchema } from "@/lib/validators"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = analyzeApiSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoUrl, videoSource, platform, targetAge, targetGender, targetTags } =
      parsed.data

    // Create analysis request record (status starts as "processing")
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
      return NextResponse.json(
        { error: "Failed to create analysis request" },
        { status: 500 }
      )
    }

    // Derive base URL from the incoming request so it works in every environment
    const { origin } = new URL(request.url)
    const appUrl = process.env.APP_URL ?? origin

    // Fire-and-forget: trigger the worker (TypeScript Gemini pipeline)
    fetch(`${appUrl}/api/analyze/worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: analysisRequest.id,
        videoUrl,
        platform,
        targetAge,
        targetGender,
        targetTags,
        callbackUrl: `${appUrl}/api/webhook/results`,
      }),
    }).catch((err) => console.error("[analyze] Failed to trigger worker:", err))

    return NextResponse.json({ requestId: analysisRequest.id })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
