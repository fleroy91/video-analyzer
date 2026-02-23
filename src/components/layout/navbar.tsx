"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Upload, History, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UserMenu } from "./user-menu"
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
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/analyze" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5" />
            <span className="hidden sm:inline">VideoAnalyzer</span>
          </Link>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-1.5 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t px-4 py-2 sm:hidden">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
              onClick={() => setMobileOpen(false)}
            >
              <Link href={item.href}>
                <item.icon className={cn("mr-2 h-4 w-4")} />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      )}
    </header>
  )
}
