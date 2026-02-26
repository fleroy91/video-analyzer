/**
 * Gemini video analysis pipeline helpers — pure TypeScript, no Python dependency.
 *
 * Individual steps (orchestrated by Inngest in src/lib/inngest/functions.ts):
 *   1. downloadVideo — Download video → ArrayBuffer
 *   2. uploadToGemini — Upload to Gemini Files API
 *   3. waitForActive — Poll until ACTIVE
 *   4. geminiGenerate + buildExtractPrompt — Extract characteristics
 *   5. geminiGenerate + buildScorePrompt — Score KPIs
 *   6. saveResults — Save results directly to Supabase
 */

import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"
import type { PipelineStep } from "@/lib/constants"

const GEMINI_BASE = "https://generativelanguage.googleapis.com"

export const KPIS = [
  "Impressions", "Reach", "CPM", "CTR", "CPC",
  "Completion Rate", "Conversions", "CPA", "ROAS", "View Duration",
]

function geminiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY is not set")
  return key
}

// ---------------------------------------------------------------------------
// Step 1: Download
// ---------------------------------------------------------------------------

export async function downloadVideo(url: string): Promise<{ data: ArrayBuffer; mimeType: string }> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; VideoAnalyzer/1.0)" },
    redirect: "follow",
  })
  if (!resp.ok) throw new Error(`Video download failed (${resp.status}): ${url}`)

  const contentType = resp.headers.get("content-type") ?? "video/mp4"
  let mimeType = contentType.split(";")[0].trim()

  if (mimeType.includes("html")) {
    throw new Error(
      "The URL returned an HTML page, not a video file. " +
      "Social media page URLs (TikTok, Instagram, YouTube) don't serve raw video. " +
      "Please upload the video file directly instead."
    )
  }
  if (!mimeType.startsWith("video/")) mimeType = "video/mp4"

  const data = await resp.arrayBuffer()
  return { data, mimeType }
}

// ---------------------------------------------------------------------------
// Step 2: Upload to Gemini Files API
// ---------------------------------------------------------------------------

export async function uploadToGemini(
  data: ArrayBuffer,
  mimeType: string,
): Promise<{ fileName: string; fileUri: string; fileMime: string }> {
  const url = `${GEMINI_BASE}/upload/v1beta/files?uploadType=media&key=${geminiKey()}`

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
      "X-Goog-Upload-Protocol": "raw",
    },
    body: data,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Gemini upload failed (${resp.status}): ${text}`)
  }

  const result = await resp.json()
  const file = result.file ?? {}
  const fileName: string = file.name
  const fileUri: string = file.uri
  const fileMime: string = file.mimeType ?? mimeType

  if (!fileUri) throw new Error(`No file URI in Gemini upload response: ${JSON.stringify(result)}`)
  return { fileName, fileUri, fileMime }
}

// ---------------------------------------------------------------------------
// Step 3: Poll until ACTIVE
// ---------------------------------------------------------------------------

export async function waitForActive(fileName: string, timeoutMs = 180_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  const interval = 5_000

  while (Date.now() < deadline) {
    const resp = await fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${geminiKey()}`)
    if (!resp.ok) throw new Error(`File status check failed (${resp.status})`)

    const data = await resp.json()
    const state: string = data.state ?? "UNKNOWN"

    if (state === "ACTIVE") return
    if (state === "FAILED") throw new Error(`Gemini file processing failed: ${JSON.stringify(data)}`)

    await new Promise((r) => setTimeout(r, interval))
  }

  throw new Error(`File not ACTIVE after ${timeoutMs / 1000}s`)
}

// ---------------------------------------------------------------------------
// Step 4 & 5: generateContent
// ---------------------------------------------------------------------------

type Part =
  | { text: string }
  | { fileData: { mimeType: string; fileUri: string } }

export async function geminiGenerate(
  prompt: string,
  fileUri?: string,
  fileMime?: string,
): Promise<string> {
  const url = `${GEMINI_BASE}/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey()}`

  const parts: Part[] = [{ text: prompt }]
  if (fileUri && fileMime) {
    parts.push({ fileData: { mimeType: fileMime, fileUri } })
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Gemini generateContent failed (${resp.status}): ${text}`)
  }

  const data = await resp.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== "string") {
    throw new Error(`Unexpected Gemini response shape: ${JSON.stringify(data)}`)
  }
  return text
}

export function parseJson(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/)
  return JSON.parse(match ? match[0] : text)
}

// ---------------------------------------------------------------------------
// Step 6: Save results to Supabase
// ---------------------------------------------------------------------------

export async function saveResults(
  requestId: string,
  results: { kpi_name: string; predicted_value: string; score: number; explanation?: string }[],
  characteristics: Json,
): Promise<void> {
  const supabase = createAdminClient()

  const rows = results.map((r) => ({
    request_id: requestId,
    kpi_name: r.kpi_name,
    predicted_value: r.predicted_value,
    score: r.score,
    explanation: r.explanation || null,
  }))

  const { error: insertError } = await supabase
    .from("analysis_results")
    .insert(rows)

  if (insertError) {
    throw new Error(`Failed to insert results: ${insertError.message}`)
  }

  const { error: updateError } = await supabase
    .from("analysis_requests")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
      ...(characteristics ? { characteristics } : {}),
    })
    .eq("id", requestId)

  if (updateError) {
    throw new Error(`Failed to update request status: ${updateError.message}`)
  }
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export function buildExtractPrompt(params: {
  platform: string
  targetAge: string
  targetGender: string
  targetTags: string[]
}): string {
  const { platform, targetAge, targetGender, targetTags } = params
  const kpisStr = KPIS.join(", ")

  return `You are a social media video analysis expert.

Target platform: ${platform}
Target audience age: ${targetAge}
Target audience gender: ${targetGender}
Target interests: ${targetTags.join(", ") || "none"}
KPIs to evaluate: ${kpisStr}

Watch this video carefully and evaluate ALL of the following:

CONTENT (up to 10 tags max, no more):
- Up to 10 tags covering topics, themes, visual style, audio, mood

SCORES (0-100 each):
- quality_score: overall production quality
- hook_strength: how engaging are the first 3 seconds
- audience_relevance: relevance to the target demographic

VIDEO CHARACTERISTICS (score each 0-100 unless noted):
- objective: one of "educate", "sell", "entertain", "inspire", "inform"
- storytelling: narrative strength and emotional connection
- audio_quality: clarity of speech/music, no distracting noise
- visual_quality: resolution, brightness, colour grading
- editing_pacing: rhythm of cuts, transitions, avoids lag
- audience_awareness: tone and style match the target demographic
- cta_present: true or false — is there a clear call to action
- lighting: proper lighting, well-lit scene
- stability: steady footage, no unwanted shake
- format_fit: how well aspect ratio and length suit the platform (0-100)

Your response must be a raw JSON object. Do not use markdown, do not wrap in code fences, do not add any text before or after the JSON. Start your response with { and end with }.
{
  "tags": ["tag1", "tag2"],
  "quality_score": 75,
  "hook_strength": 80,
  "audience_relevance": 70,
  "content_summary": "brief one-sentence description",
  "characteristics": {
    "objective": "educate",
    "storytelling": 70,
    "audio_quality": 85,
    "visual_quality": 80,
    "editing_pacing": 75,
    "audience_awareness": 80,
    "cta_present": false,
    "lighting": 85,
    "stability": 90,
    "format_fit": 80
  }
}`
}

export function buildScorePrompt(params: {
  platform: string
  targetAge: string
  targetGender: string
  targetTags: string[]
  analysis: Record<string, unknown>
}): string {
  const { platform, targetAge, targetGender, targetTags, analysis } = params
  const kpisStr = KPIS.join(", ")
  const tagsStr = Array.isArray(analysis.tags)
    ? (analysis.tags as string[]).join(", ")
    : "N/A"

  return `You are a social media performance prediction expert for ${platform}.

Video analysis:
- Summary: ${analysis.content_summary ?? "N/A"}
- Tags: ${tagsStr}
- Production quality: ${analysis.quality_score ?? 50}/100
- Hook strength: ${analysis.hook_strength ?? 50}/100
- Audience relevance: ${analysis.audience_relevance ?? 50}/100

Target audience:
- Platform: ${platform}
- Age: ${targetAge}
- Gender: ${targetGender}
- Interests: ${targetTags.join(", ") || "none"}

For each KPI, predict realistic performance for a new creator account posting this video:
- predicted_value: realistic value with units (e.g. "8.5K", "3.2%", "$0.45")
- For "View Duration" specifically: return an integer in milliseconds only, no units (e.g. "45000")
- score: 0-100 (50=average, 80+=strong, 100=viral)
- explanation: one sentence

KPIs: ${kpisStr}

Your response must be a raw JSON object. Do not use markdown, do not wrap in code fences, do not add any text before or after the JSON. Start your response with { and end with }.
{
  "results": [
    {"kpi_name": "Impressions", "predicted_value": "12.5K", "score": 68, "explanation": "Good hook drives solid impressions."}
  ]
}`
}

// ---------------------------------------------------------------------------
// Public types & helpers
// ---------------------------------------------------------------------------

export interface PipelineParams {
  requestId: string
  videoUrl: string
  platform: string
  targetAge: string
  targetGender: string
  targetTags: string[]
}

export async function updateStep(
  requestId: string,
  step: PipelineStep,
  extra?: { status?: string },
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from("analysis_requests")
    .update({ pipeline_step: step, ...extra })
    .eq("id", requestId)
}
