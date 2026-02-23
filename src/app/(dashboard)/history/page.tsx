import { createClient } from "@/lib/supabase/server"
import { HistoryTable } from "@/components/history/history-table"

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from("analysis_requests")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analysis History</h1>
        <p className="text-muted-foreground">
          View your past video performance analyses
        </p>
      </div>
      <HistoryTable requests={requests || []} />
    </div>
  )
}
