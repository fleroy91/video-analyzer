"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PLATFORMS } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { KpiCard } from "./kpi-card"
import type { Tables } from "@/types/database"

interface ResultsDisplayProps {
  request: Tables<"analysis_requests">
  initialResults: Tables<"analysis_results">[]
}

export function ResultsDisplay({
  request: initialRequest,
  initialResults,
}: ResultsDisplayProps) {
  const [request, setRequest] = useState(initialRequest)
  const [results, setResults] = useState(initialResults)

  useEffect(() => {
    if (request.status === "completed" || request.status === "failed") return

    const supabase = createClient()

    // Subscribe to request status changes
    const requestChannel = supabase
      .channel(`request-${request.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "analysis_requests",
          filter: `id=eq.${request.id}`,
        },
        (payload) => {
          setRequest(payload.new as Tables<"analysis_requests">)
        }
      )
      .subscribe()

    // Subscribe to new results
    const resultsChannel = supabase
      .channel(`results-${request.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analysis_results",
          filter: `request_id=eq.${request.id}`,
        },
        (payload) => {
          setResults((prev) => [...prev, payload.new as Tables<"analysis_results">])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(requestChannel)
      supabase.removeChannel(resultsChannel)
    }
  }, [request.id, request.status])

  const platform = PLATFORMS[request.platform as keyof typeof PLATFORMS]
  const isProcessing = request.status === "pending" || request.status === "processing"
  const isCompleted = request.status === "completed"
  const isFailed = request.status === "failed"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/history">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Analysis Results</h1>
          <p className="text-sm text-muted-foreground">
            {platform?.label} &middot;{" "}
            {new Date(request.created_at!).toLocaleDateString()}
          </p>
        </div>
        <Badge
          variant={
            isCompleted ? "default" : isFailed ? "destructive" : "secondary"
          }
        >
          {request.status}
        </Badge>
      </div>

      {/* Request summary */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div>
            <p className="text-xs text-muted-foreground">Platform</p>
            <p className="font-medium">{platform?.label}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target Age</p>
            <p className="font-medium">{request.target_age}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target Gender</p>
            <p className="font-medium capitalize">{request.target_gender}</p>
          </div>
          {request.target_tags && request.target_tags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {request.target_tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing state */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing your video...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Our AI is analyzing your video and predicting performance metrics.
              This usually takes 1-2 minutes.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {isFailed && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <XCircle className="h-5 w-5" />
              Analysis Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {request.error_message || "Something went wrong during analysis."}
            </p>
            <Button className="mt-4" asChild>
              <Link href="/analyze">Try Again</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isCompleted && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">
              Performance Predictions
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <KpiCard
                key={result.id}
                kpiName={result.kpi_name}
                predictedValue={result.predicted_value}
                score={result.score ?? 0}
                explanation={result.explanation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
