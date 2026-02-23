import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

    const { requestId, results } = parsed.data
    const supabase = createAdminClient()

    // Insert all results
    const { error: insertError } = await supabase
      .from("analysis_results")
      .insert(
        results.map((r) => ({
          request_id: requestId,
          kpi_name: r.kpi_name,
          predicted_value: r.predicted_value,
          score: r.score,
          explanation: r.explanation || null,
        }))
      )

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to insert results" },
        { status: 500 }
      )
    }

    // Update request status to completed
    await supabase
      .from("analysis_requests")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", requestId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
