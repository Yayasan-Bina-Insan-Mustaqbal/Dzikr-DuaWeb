import { HeadContent, Scripts, createRootRoute, useNavigate } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { AudioPlayer } from "../components/AudioPlayer"
import { useEffect } from "react"
import { usePlayerStore } from "../store/usePlayerStore"
import { decompressQueue, compressQueue } from "../lib/url"
import { getInvocationById } from "../lib/data"
import { z } from "zod"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  validateSearch: z.object({
    queue: z.string().optional(),
    idx: z.coerce.number().optional(),
  }),
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Dzikr & Dua | Muslim Media Player",
      },
      {
        name: "description",
        content: "A beautiful, stateless web application for Dzikr and Dua with continuous playback and easy sharing.",
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queue: compressedQueue, idx } = Route.useSearch()
  const { setQueue, queue: currentQueue, currentIndex } = usePlayerStore()
  const navigate = useNavigate()

  // Sync URL -> Store
  useEffect(() => {
    if (compressedQueue && currentQueue.length === 0) {
      const ids = decompressQueue(compressedQueue)
      const invocations = ids.map(id => getInvocationById(id)).filter(Boolean) as any[]
      if (invocations.length > 0) {
        setQueue(invocations, idx || 0)
      }
    }
  }, [compressedQueue, idx])

  // Sync Store -> URL
  useEffect(() => {
    if (currentQueue.length > 0) {
      const ids = currentQueue.map(i => i.id)
      const newCompressed = compressQueue(ids)
      
      if (newCompressed !== compressedQueue || currentIndex !== idx) {
        navigate({
          search: (prev: any) => ({
            ...prev,
            queue: newCompressed,
            idx: currentIndex,
          }),
          replace: true, // Don't clutter history
        })
      }
    }
  }, [currentQueue, currentIndex])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-50 font-sans antialiased">
        <main className="pb-32">
          {children}
        </main>
        <AudioPlayer />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
