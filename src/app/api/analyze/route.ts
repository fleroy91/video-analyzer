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
        status: "pending",
      })
      .select("id")
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create analysis request" },
        { status: 500 }
      )
    }

    // Fire-and-forget: trigger n8n webhook
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: analysisRequest.id,
          videoUrl,
          platform,
          targetAge,
          targetGender,
          targetTags,
        }),
      }).catch(() => {
        // Fire-and-forget — errors logged server-side but don't block response
      })

      // Update status to processing
      await supabase
        .from("analysis_requests")
        .update({ status: "processing" })
        .eq("id", analysisRequest.id)
    }

    return NextResponse.json({ requestId: analysisRequest.id })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
