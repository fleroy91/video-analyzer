"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const displayName = formData.get("displayName") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Check your email to confirm your account!")
    router.push("/sign-in")
  }

  return (
    <div className="mesh-bg grid-pattern flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 10.5L5.5 6.5L8 9L11 5"
                stroke="url(#grad-signup)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="grad-signup" x1="2" y1="10.5" x2="11" y2="5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="oklch(0.623 0.17 253)" />
                  <stop offset="1" stopColor="oklch(0.714 0.134 225)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold gradient-text">VideoAnalyzer</h1>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 shadow-xl shadow-black/20">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Your name"
                className="border-border/60"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="border-border/60"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                className="border-border/60"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-2 glow-btn font-semibold"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
