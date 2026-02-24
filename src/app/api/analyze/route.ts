import { spawn } from "node:child_process"
import path from "node:path"
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

    // Update status to processing
    await supabase
      .from("analysis_requests")
      .update({ status: "processing" })
      .eq("id", analysisRequest.id)

    // Fire-and-forget: spawn Python analyzer
    const scriptPath = path.join(process.cwd(), "python", "analyze_video.py")
    const appUrl = process.env.APP_URL ?? "http://localhost:3000"

    const child = spawn(
      "uv",
      [
        "run",
        scriptPath,
        "--request-id", analysisRequest.id,
        "--video-url", videoUrl,
        "--platform", platform,
        "--target-age", targetAge,
        "--target-gender", targetGender,
        "--target-tags", targetTags.join(","),
        "--callback-url", `${appUrl}/api/webhook/results`,
      ],
      {
        detached: true,
        stdio: "ignore",
        env: {
          ...process.env,
          GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
          WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET ?? "",
        },
      }
    )
    child.unref()

    return NextResponse.json({ requestId: analysisRequest.id })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
