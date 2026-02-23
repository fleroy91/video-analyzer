"use client"

import Link from "next/link"
import { PLATFORMS } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowRight } from "lucide-react"
import type { Tables } from "@/types/database"

interface HistoryTableProps {
  requests: Tables<"analysis_requests">[]
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  processing: "secondary",
  pending: "secondary",
  failed: "destructive",
}

export function HistoryTable({ requests }: HistoryTableProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
        <p className="text-muted-foreground">No analyses yet</p>
        <Button className="mt-4" asChild>
          <Link href="/analyze">Start Your First Analysis</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => {
            const platform =
              PLATFORMS[req.platform as keyof typeof PLATFORMS]
            return (
              <TableRow key={req.id}>
                <TableCell className="text-sm">
                  {new Date(req.created_at!).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{platform?.label}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {req.target_age} &middot;{" "}
                  <span className="capitalize">{req.target_gender}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[req.status] || "secondary"}>
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/results/${req.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
