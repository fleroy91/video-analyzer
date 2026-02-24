"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Upload, History, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UserMenu } from "./user-menu"
import { ThemeToggle } from "./theme-toggle"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/analyze", label: "Analyze", icon: Upload },
  { href: "/history", label: "History", icon: History },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/analyze"
            className="flex items-center gap-2 font-display font-bold text-lg tracking-tight"
          >
            {/* Logo mark */}
            <img src="/logo-abstract-tech.svg" alt="VideoAnalyzer Logo" className="h-7 w-7" />
            <span className="gradient-text hidden sm:inline">VideoAnalyzer</span>
          </Link>
          <Separator orientation="vertical" className="hidden h-5 sm:block opacity-30" />
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-1.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-muted-foreground hover:text-foreground"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border/50 bg-background/95 px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 font-medium",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                asChild
                onClick={() => setMobileOpen(false)}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
