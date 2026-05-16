import { HeadContent, Outlet, Scripts, createRootRoute, useNavigate } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { useEffect } from "react"
import { z } from "zod"
import { AudioPlayer } from "../components/AudioPlayer"
import { useAudioStore } from "../store/audio"
import { compressQueue, decompressQueue } from "../lib/url"
import { getInvocationById } from "../lib/data"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  validateSearch: z.object({
    queue: z.string().optional(),
    idx: z.coerce.number().optional(),
  }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dzikr & Dua | Muslim Media Player" },
      { name: "description", content: "A beautiful, stateless web application for Dzikr and Dua." }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" }
    ],
  }),
  notFoundComponent: () => (
    <main className="flex items-center justify-center h-screen bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-heading font-bold mb-2">404</h1>
        <p className="text-muted-foreground">The requested page could not be found.</p>
      </div>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queue: compressedQueue, idx } = Route.useSearch()
  const { setQueue, queue: currentQueue, nowPlayingIndex, play, theme, setTheme } = useAudioStore()
  const navigate = useNavigate()

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    setTheme(theme)
  }, [])

  // Sync URL -> Store
  useEffect(() => {
    if (compressedQueue && currentQueue.length === 0) {
      // Direct ID parsing for simplicity first, or decompress if using lz-string
      const ids = compressedQueue.split(',').map(Number)
      const invocations = ids.map(id => getInvocationById(id)).filter(Boolean) as Array<any>
      if (invocations.length > 0) {
        setQueue(invocations)
        if (idx !== undefined && idx < invocations.length) {
          play(idx)
        }
      }
    }
  }, [compressedQueue, idx])

  // Sync Store -> URL
  useEffect(() => {
    if (currentQueue.length > 0) {
      const ids = currentQueue.map(i => i.id).join(',')
      
      if (ids !== compressedQueue || nowPlayingIndex !== idx) {
        navigate({
          search: (prev: any) => ({
            ...prev,
            queue: ids,
            idx: nowPlayingIndex,
          }),
          replace: true,
        })
      }
    } else if (compressedQueue) {
      navigate({
        search: (prev: any) => ({
          ...prev,
          queue: undefined,
          idx: undefined,
        }),
        replace: true,
      })
    }
  }, [currentQueue, nowPlayingIndex])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/30">
        <Outlet />
        <AudioPlayer />
        <TanStackDevtools
          config={{ position: "bottom-left" }}
          plugins={[
            { name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
