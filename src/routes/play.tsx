import { createFileRoute } from "@tanstack/react-router"
import { useAudioStore } from "../store/audio"
import { useState, useEffect } from "react"
import { searchDhikr } from "../lib/search"
import type { Invocation } from "../types/data"

export const Route = createFileRoute("/play")({
  component: PlayRoute,
})

function PlayRoute() {
  const { queue, nowPlayingIndex, play, isPlaying, setIsPlaying, next, previous } = useAudioStore()
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
            <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
              <span className="material-symbols-outlined">right_panel_open</span>
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

      {/* Center Sidebar (320px) - Player & Queue */}
      <aside className="hidden lg:flex w-[320px] flex-shrink-0 flex-col bg-card border-l border-border z-10 shadow-[0_0_20px_rgba(0,0,0,0.05)]">
        <div className="p-5 border-b border-border flex flex-col gap-5">
          {currentDua ? (
            <>
              {/* Now Playing Info */}
              <div className="flex flex-col items-center text-center gap-1 mt-4">
                <h3 className="text-base font-bold text-foreground leading-tight px-2">{currentDua.latin}</h3>
                <p className="text-xs text-muted-foreground">{currentDua.chapter_name}</p>
              </div>
              
              {/* Playback Controls */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <span className="material-symbols-outlined text-lg">shuffle</span>
                  </button>
                  <div className="flex items-center gap-5">
                    <button onClick={previous} className="text-muted-foreground hover:text-foreground transition-colors">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>skip_previous</span>
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    >
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isPlaying ? "pause" : "play_arrow"}
                      </span>
                    </button>
                    <button onClick={next} className="text-muted-foreground hover:text-foreground transition-colors">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>skip_next</span>
                    </button>
                  </div>
                  <button className="text-primary relative">
                    <span className="material-symbols-outlined text-lg">repeat</span>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
                  </button>
                </div>
                
                {/* Progress Scrubber (Static for now) */}
                <div className="flex flex-col gap-1.5">
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[35%]"></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">Select a Dzikr to play</div>
          )}
        </div>
        
        {/* Queue list */}
        <div className="p-5 pb-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Up Next</h2>
          <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-xl">more_horiz</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {queue.map((item, idx) => (
            <div key={idx} 
                 className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer group relative overflow-hidden ${
                   idx === nowPlayingIndex 
                   ? 'bg-primary/10 border border-primary/20' 
                   : idx < nowPlayingIndex 
                     ? 'opacity-50 hover:bg-muted' 
                     : 'hover:bg-muted'
                 }`}
                 onClick={() => play(idx)}
            >
              {idx === nowPlayingIndex && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>
              )}
              <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden transition-colors ${
                idx === nowPlayingIndex 
                ? 'bg-primary/20 text-primary' 
                : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
              }`}>
                {idx === nowPlayingIndex ? (
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
                ) : idx < nowPlayingIndex ? (
                  <span className="material-symbols-outlined text-lg">check</span>
                ) : (
                  <span className="material-symbols-outlined text-lg transition-transform group-hover:scale-110">play_arrow</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold truncate transition-colors ${
                  idx === nowPlayingIndex ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
                }`}>{item.latin}</h4>
                <p className={`text-xs truncate transition-colors ${
                  idx === nowPlayingIndex ? 'text-primary/80' : 'text-muted-foreground group-hover:text-foreground/60'
                }`}>{item.chapter_name}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right Sidebar (320px) - Search */}
      <aside className="hidden lg:flex w-[320px] flex-shrink-0 flex-col bg-card border-l border-border z-10 shadow-[0_0_20px_rgba(0,0,0,0.05)]">
        <div className="p-5 border-b border-border bg-card/50 flex flex-col gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">search</span>
            <input 
              className="w-full bg-input/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" 
              placeholder="Search Duas to add..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-100px)]">
            {searchResults.map((res) => (
              <div key={res.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                <span className="text-sm text-foreground/80 truncate w-4/5">{res.latin}</span>
                <button 
                  onClick={() => useAudioStore.getState().setQueue([...queue, res])}
                  className="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-card transition-all flex items-center justify-center flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base font-bold">add</span>
                </button>
              </div>
            ))}
            {searchResults.length === 0 && searchQuery.trim().length > 2 && (
              <p className="text-sm text-muted-foreground text-center py-4">No results found.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
