import { createFileRoute, Link } from "@tanstack/react-router"
import { getChapterById } from "../../lib/data"
import { usePlayerStore } from "../../store/usePlayerStore"
import { Button } from "../../components/ui/button"
import { Play, ArrowLeft, Share2, Copy } from "lucide-react"
import { cn } from "../../lib/utils"

export const Route = createFileRoute("/chapters/$chapterId")({
  component: ChapterPage,
})

function ChapterPage() {
  const { chapterId } = Route.useParams()
  const chapter = getChapterById(parseInt(chapterId))
  const { setQueue, currentIndex, queue, isPlaying } = usePlayerStore()

  if (!chapter) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-2xl font-bold">Kapitulli nuk u gjet</h1>
        <Link to="/" className="text-emerald-500 hover:underline mt-4 inline-block">
          Kthehu në fillim
        </Link>
      </div>
    )
  }

  const handlePlayAll = () => {
    setQueue(chapter.invocations, 0)
  }

  const handlePlayInvocation = (index: number) => {
    setQueue(chapter.invocations, index)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Kthehu
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {chapter.title}
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {chapter.invocations.length} Lutje në këtë kategori
            </p>
          </div>
          <Button 
            onClick={handlePlayAll}
            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 h-12 px-8 rounded-full shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Play className="h-5 w-5 fill-current" />
            Dëgjo të gjitha
          </Button>
        </div>
      </div>

      {/* Invocations List */}
      <div className="space-y-8 max-w-4xl mx-auto">
        {chapter.invocations.map((invocation, index) => {
          const isCurrentlyPlaying = isPlaying && 
                                   queue[currentIndex]?.id === invocation.id;
          
          return (
            <div 
              key={invocation.id}
              className={cn(
                "group relative p-6 md:p-8 rounded-3xl border transition-all duration-500",
                isCurrentlyPlaying 
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]" 
                  : "bg-white/5 border-white/5 hover:border-white/10"
              )}
            >
              {/* Top Bar with Number and Actions */}
              <div className="flex justify-between items-center mb-8">
                <span className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400">
                  {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white rounded-full">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white rounded-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Arabic Text */}
              <div className="mb-10">
                <p className="text-right font-arabic text-3xl md:text-5xl leading-[1.8] text-white" dir="rtl">
                  {invocation.arabic}
                </p>
              </div>

              {/* Latin Transliteration */}
              <div className="mb-6 italic text-emerald-400/80 text-lg leading-relaxed">
                {invocation.latin}
              </div>

              {/* Albanian Translation */}
              <div className="text-slate-300 text-lg leading-relaxed mb-8">
                {invocation.albanian}
              </div>

              {/* Reference & Play Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-white/5">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-400">Referenca:</span> {invocation.reference || "Transmeton Buhariu dhe Muslimi"}
                </p>
                <Button 
                  onClick={() => handlePlayInvocation(index)}
                  variant={isCurrentlyPlaying ? "default" : "outline"}
                  className={cn(
                    "rounded-full gap-2 transition-all active:scale-95",
                    isCurrentlyPlaying ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400"
                  )}
                >
                  <Play className={cn("h-4 w-4", isCurrentlyPlaying && "fill-current")} />
                  {isCurrentlyPlaying ? "Duke u dëgjuar..." : "Dëgjo"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
