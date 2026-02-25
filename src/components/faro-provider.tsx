"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

let initialized = false
let faroApi: { pushEvent: (name: string, attributes?: Record<string, string>) => void; setView: (view: { name: string }) => void } | null = null

export function FaroProvider() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (initialized) return
    const url = process.env.NEXT_PUBLIC_GRAFANA_FARO_URL
    if (!url) return
    initialized = true

    Promise.all([
      import("@grafana/faro-web-sdk"),
      import("@grafana/faro-web-tracing"),
      import("@grafana/faro-react"),
    ]).then(([faroSdk, faroTracing, faroReact]) => {
      const faro = faroSdk.initializeFaro({
        url,
        app: {
          name: "video-analyzer",
          version: "0.1.0",
          environment: process.env.NODE_ENV,
        },
        instrumentations: [
          ...faroSdk.getWebInstrumentations(),
          new faroTracing.TracingInstrumentation(),
          new faroReact.ReactIntegration(),
        ],
      })
      faroApi = faro.api
      faroApi.setView({ name: prevPathname.current })
    }).catch((err) => {
      console.warn("[Faro] Failed to initialize:", err)
    })
  }, [pathname])

  useEffect(() => {
    if (prevPathname.current === pathname) return
    prevPathname.current = pathname

    if (faroApi) {
      faroApi.setView({ name: pathname })
      faroApi.pushEvent("route_change", { pathname })
    }
  }, [pathname])

  return null
}
