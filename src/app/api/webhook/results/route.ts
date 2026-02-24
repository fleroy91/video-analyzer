import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { webhookResultsSchema } from "@/lib/validators"

export async function POST(request: Request) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get("authorization")
    const expectedToken = process.env.N8N_WEBHOOK_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = webhookResultsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { requestId, results, characteristics } = parsed.data

    const supabase = await createClient()

    // Insert all KPI results
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
      console.error("Insert results error:", insertError)
      return NextResponse.json(
        { error: "Failed to insert results", detail: insertError.message },
        { status: 500 }
      )
    }

    // Update request status and store video characteristics
    const { error: updateError } = await supabase
      .from("analysis_requests")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
        ...(characteristics ? { characteristics } : {}),
      })
      .eq("id", requestId)

    if (updateError) {
      console.error("Update request error:", updateError)
      return NextResponse.json(
        { error: "Failed to update request", detail: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Webhook error:", err)
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    )
  }
}
