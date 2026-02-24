import { Navbar } from "@/components/layout/navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen mesh-bg grid-pattern">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
