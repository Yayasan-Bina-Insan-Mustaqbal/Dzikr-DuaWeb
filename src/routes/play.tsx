import { createFileRoute } from "@tanstack/react-router"
import { useAudioStore } from "../store/audio"
import { useState, useEffect } from "react"
import { searchDhikr } from "../lib/search"
import type { Invocation } from "../types/data"

export const Route = createFileRoute("/play")({
  component: PlayRoute,
})

function PlayRoute() {
  const { queue, nowPlayingIndex, play } = useAudioStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Invocation[]>([])

  const currentDua = queue[nowPlayingIndex]
  const nextDua = queue[nowPlayingIndex + 1]

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      searchDhikr(searchQuery).then(setSearchResults)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  return (
    <div className="flex flex-1 overflow-hidden h-screen bg-background">
      {/* Main Area (Left) */}
      <main className="flex-1 overflow-y-auto relative flex flex-col items-center justify-center px-6 lg:px-20 scroll-smooth pt-24">
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="font-heading font-semibold text-lg tracking-tight text-foreground">
              Dzikr <span className="text-primary">& Dua</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
              <span className="material-symbols-outlined">side_navigation</span>
            </button>
          </div>
        </div>

        {currentDua ? (
          <div className="max-w-4xl w-full flex flex-col gap-12 text-center relative z-10">
            <div className="flex flex-col gap-8 transition-opacity duration-500 opacity-100 p-8 rounded-2xl bg-card border border-border shadow-sm">
              <p className="font-arabic text-[48px] leading-[1.8] text-foreground select-text" dir="rtl">
                {currentDua.arabic}
              </p>
              <div className="h-px w-24 bg-border mx-auto rounded-full"></div>
              <p className="text-lg md:text-xl text-primary font-medium tracking-wide">
                {currentDua.latin}
              </p>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                "{currentDua.albanian}"
              </p>
            </div>
            
            {nextDua && (
              <div className="flex flex-col gap-6 opacity-30 scale-95 blur-[1px] pointer-events-none transition-all duration-500 p-8">
                <p className="font-arabic text-3xl md:text-4xl leading-[1.8] text-foreground" dir="rtl">
                  {nextDua.arabic}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Your queue is empty. Search to add Duas.</p>
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="hidden lg:flex w-[320px] flex-shrink-0 flex-col bg-card border-l border-border z-10">
        <div className="p-5 border-b border-border bg-card flex flex-col gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">search</span>
            <input 
              className="w-full bg-input/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" 
              placeholder="Search Duas to add..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
            {searchResults.map((res) => (
              <div key={res.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer" onClick={() => {
                useAudioStore.getState().setQueue([...queue, res])
              }}>
                <span className="text-sm text-foreground truncate max-w-[200px]">{res.latin}</span>
                <button className="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-card transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-base font-bold">add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Queue list */}
        <div className="p-5 pb-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Up Next</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {queue.map((item, idx) => (
            <div key={idx} 
                 className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer group ${
                   idx === nowPlayingIndex 
                   ? 'bg-primary/10 border border-primary/20' 
                   : idx < nowPlayingIndex 
                     ? 'opacity-50 hover:bg-muted' 
                     : 'hover:bg-muted'
                 }`}
                 onClick={() => play(idx)}
            >
              <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden ${
                idx === nowPlayingIndex ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
              }`}>
                {idx === nowPlayingIndex ? (
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
                ) : idx < nowPlayingIndex ? (
                  <span className="material-symbols-outlined text-lg">check</span>
                ) : (
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold truncate ${idx === nowPlayingIndex ? 'text-foreground' : 'text-foreground/80'}`}>{item.latin}</h4>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
