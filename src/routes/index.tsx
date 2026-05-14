import { createFileRoute, Link } from "@tanstack/react-router"
import { getChapters } from "../lib/data"
import { ChevronRight, Play } from "lucide-react"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const chapters = getChapters()

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          Dzikr & Dua
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Ushqeni shpirtin tuaj me përkujtimin e Allahut. 
          Një koleksion i thjeshtë dhe i bukur i lutjeve ditore.
        </p>
      </section>

      {/* Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chapters.map((chapter) => (
          <Link
            key={chapter.id}
            to="/chapters/$chapterId"
            params={{ chapterId: chapter.id.toString() }}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-emerald-500/30 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                {chapter.id}
              </div>
              <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-emerald-400 transition-colors" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              {chapter.title}
            </h3>
            
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                {chapter.invocations.length} Lutje
              </span>
            </div>

            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
