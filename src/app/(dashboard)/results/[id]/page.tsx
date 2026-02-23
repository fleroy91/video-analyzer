import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ResultsDisplay } from "@/components/results/results-display"

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: request } = await supabase
    .from("analysis_requests")
    .select("*")
    .eq("id", id)
    .single()

  if (!request) {
    notFound()
  }

  const { data: results } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true })

  return (
    <ResultsDisplay request={request} initialResults={results || []} />
  )
}
