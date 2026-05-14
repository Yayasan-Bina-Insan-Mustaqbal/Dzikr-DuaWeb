import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { getChapters } from "../lib/data"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const navigate = useNavigate()
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const hour = new Date().getHours()
    let chapterId = 1 // default to morning

    if (hour >= 4 && hour < 12) {
      setGreeting("Good Morning")
      chapterId = 1 // Morning Dhikr
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Good Afternoon")
      chapterId = 2 // Afternoon/Evening Dhikr
    } else {
      setGreeting("Good Evening")
      chapterId = 2 // Evening Dhikr
    }

    // Auto-play by navigating to /play with the appropriate chapter queue
    // In our simplified json, chapter 1 = morning, 2 = evening.
    const chapter = getChapters().find(c => c.id === chapterId)
    if (chapter) {
      const ids = chapter.invocations.map(i => i.id).join(",")
      // Optional: Delay the redirect slightly so user sees the intro
      const timer = setTimeout(() => {
        navigate({ to: "/play", search: { queue: ids, idx: 0 } })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8">
        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
        Dzikr <span className="text-primary">& Dua</span>
      </h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
        {greeting}. Preparing your Dhikr for this time of day...
      </p>
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}
