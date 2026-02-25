'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function SignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    router.push('/analyze')
    router.refresh()
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
                stroke="url(#grad-auth)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="grad-auth"
                  x1="2"
                  y1="10.5"
                  x2="11"
                  y2="5"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="oklch(0.623 0.17 253)" />
                  <stop offset="1" stopColor="oklch(0.714 0.134 225)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold gradient-text">
            VideoAnalyzer
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 shadow-xl shadow-black/20">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
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
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="border-border/60"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-2 glow-btn font-semibold"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
