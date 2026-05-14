import { createFileRoute } from "@tanstack/react-router"
import { useAudioStore } from "../store/audio"
import { useState, useEffect, useMemo, useRef } from "react"
import { searchDhikr, type SearchResults } from "../lib/search"
import type { Invocation, Chapter } from "../types/data"
import { getChapters } from "../lib/data"
import { motion, AnimatePresence } from "framer-motion"

export const Route = createFileRoute("/play")({
  component: PlayRoute,
})

function PlayRoute() {
  const { queue, nowPlayingIndex, play, isPlaying, setIsPlaying, next, previous, currentTime, duration, seek, clearQueue, removeFromQueue } = useAudioStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResults>({ chapters: [], invocations: [] })
  const [showQueue, setShowQueue] = useState(true)
  const [showSearch, setShowSearch] = useState(true)

  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isProgrammaticScroll = useRef(false)

  // Auto-populate queue based on time of day if it's empty
  useEffect(() => {
    if (useAudioStore.getState().queue.length === 0) {
      const hour = new Date().getHours()
      // Morning: 4:00 to 13:59. Evening: 14:00 to 3:59.
      const isMorning = hour >= 4 && hour < 14
      const targetChapterId = isMorning ? 27 : 133
      
      const allChapters = getChapters()
      const targetChapter = allChapters.find(c => c.id === targetChapterId)
      
      if (targetChapter) {
        useAudioStore.getState().setQueue(targetChapter.invocations)
      }
    }
  }, [])

  // Auto-scroll to the currently playing Dua
  useEffect(() => {
    if (carouselRef.current && queue.length > 0 && nowPlayingIndex >= 0) {
      // Calculate target scroll position (assuming each item is 80vh + some padding, but easier is to just use scrollIntoView)
      const targetElement = document.getElementById(`dua-box-${nowPlayingIndex}`)
      if (targetElement) {
        isProgrammaticScroll.current = true
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Reset flag after animation
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScroll.current = false
        }, 800)
      }
    }
  }, [nowPlayingIndex, queue.length])

  const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return

    const container = e.currentTarget
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)

    // Debounce to wait for scroll snap to finish
    scrollTimeoutRef.current = setTimeout(() => {
      // Find the element closest to the center
      const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2
      let closestIdx = nowPlayingIndex
      let minDistance = Infinity

      for (let i = 0; i < queue.length; i++) {
        const el = document.getElementById(`dua-box-${i}`)
        if (el) {
          const rect = el.getBoundingClientRect()
          const elCenter = rect.top + rect.height / 2
          const distance = Math.abs(containerCenter - elCenter)
          if (distance < minDistance) {
            minDistance = distance
            closestIdx = i
          }
        }
      }

      if (closestIdx !== nowPlayingIndex && closestIdx >= 0 && closestIdx < queue.length) {
        play(closestIdx)
      }
    }, 150)
  }

  const defaultSuggestions = useMemo(() => {
    const allChapters = getChapters()
    const popularChapters = allChapters.filter(c => [27, 28, 1].includes(c.id)).slice(0, 3)
    if (popularChapters.length === 0) popularChapters.push(...allChapters.slice(0, 3))

    const randomDuas = []
    for (const c of allChapters) {
      if (c.invocations.length > 0 && !popularChapters.includes(c)) {
        randomDuas.push({ ...c.invocations[0], chapter_name: c.chapter_name })
        if (randomDuas.length >= 4) break
      }
    }
    return { chapters: popularChapters, invocations: randomDuas }
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const currentDua = queue[nowPlayingIndex]

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      searchDhikr(searchQuery).then(setSearchResults)
    } else {
      setSearchResults({ chapters: [], invocations: [] })
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
            <button 
              onClick={() => setShowQueue(!showQueue)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer ${showQueue ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              <span className="material-symbols-outlined">side_navigation</span>
            </button>
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer ${showSearch ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>

        {currentDua && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card/50 border border-border backdrop-blur-md flex items-center gap-2 z-10 transition-all duration-300">
            <span className="material-symbols-outlined text-primary text-sm">wb_sunny</span>
            <span className="text-sm font-medium text-foreground/80 tracking-wide uppercase">{currentDua.chapter_name}</span>
          </div>
        )}

        {queue.length > 0 ? (
          <div 
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="max-w-4xl w-full h-[80vh] flex flex-col relative z-10 overflow-y-auto snap-y snap-mandatory custom-scrollbar pt-[20vh] pb-[40vh] gap-[10vh] scroll-smooth"
          >
            {queue.map((dua, idx) => {
              const isActive = idx === nowPlayingIndex
              return (
                <div 
                  key={dua.queueId || `${dua.id}-${idx}`}
                  id={`dua-box-${idx}`}
                  className={`w-full flex-shrink-0 snap-center snap-always flex flex-col justify-center py-6 transition-all duration-700 ease-out ${
                    isActive ? 'opacity-100 scale-100 blur-0' : 'opacity-30 scale-95 blur-[2px]'
                  }`}
                >
                  <div className={`flex flex-col gap-8 transition-all duration-500 p-8 rounded-3xl bg-card border shadow-xl ${
                    isActive ? 'border-primary/20 shadow-primary/5' : 'border-border/50'
                  }`}>
                    <p 
                      className="font-arabic leading-[1.8] text-foreground select-text" 
                      dir="rtl"
                      style={{ 
                        fontSize: dua.arabic.length > 500 ? '24px' : 
                                  dua.arabic.length > 200 ? '32px' : 
                                  dua.arabic.length > 100 ? '40px' : '48px' 
                      }}
                    >
                      {dua.arabic}
                    </p>
                    <div className="h-px w-24 bg-border mx-auto rounded-full flex-shrink-0"></div>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto italic">
                      "{dua.english || dua.albanian}"
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Your queue is empty. Search to add Duas.</p>
          </div>
        )}
      </main>

      {/* Sidebars Container (Right) */}
      <div className="flex h-full flex-shrink-0">
        {/* Sidebar 1 - Player & Queue */}
        <AnimatePresence>
          {showQueue && (
            <motion.aside 
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: 320, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden lg:flex flex-col bg-card border-l border-border z-10 shadow-[0_0_20px_rgba(0,0,0,0.05)] overflow-hidden"
            >
              <div className="p-5 border-b border-border flex flex-col gap-5">
                {currentDua ? (
                  <>
                    {/* Now Playing Info */}
                    <div className="flex flex-col items-center text-center gap-1 mt-4">
                      <h3 className="text-base font-bold text-foreground leading-tight px-2">{currentDua.name || currentDua.latin}</h3>
                      <p className="text-xs text-muted-foreground">{currentDua.chapter_name_en || currentDua.chapter_name}</p>
                    </div>
                    
                    {/* Playback Controls */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between px-2">
                        <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-lg">shuffle</span>
                        </button>
                        <div className="flex items-center gap-5">
                          <button onClick={previous} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>skip_previous</span>
                          </button>
                          <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {isPlaying ? "pause" : "play_arrow"}
                            </span>
                          </button>
                          <button onClick={next} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>skip_next</span>
                          </button>
                        </div>
                        <button className="text-primary relative cursor-pointer">
                          <span className="material-symbols-outlined text-lg">repeat</span>
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
                        </button>
                      </div>
                      
                      {/* Progress Scrubber */}
                      <div className="flex flex-col gap-1.5">
                        <div 
                          className="h-1.5 w-full bg-border rounded-full overflow-hidden cursor-pointer group relative"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = e.clientX - rect.left
                            const percentage = x / rect.width
                            seek(percentage * duration)
                          }}
                        >
                          <div 
                            className="h-full bg-primary transition-all duration-150" 
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                          ></div>
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `${(currentTime / duration) * 100 || 0}%`, marginLeft: '-6px' }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium tabular-nums">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
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
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      // Optional: Add toast notification here
                    }}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-primary/10"
                    title="Share Playlist"
                  >
                    <span className="material-symbols-outlined text-lg">share</span>
                  </button>
                  <button 
                    onClick={() => clearQueue()}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded-lg hover:bg-destructive/10"
                    title="Clear Playlist"
                  >
                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 overflow-x-hidden">
                <AnimatePresence initial={false}>
                  {queue.map((item, idx) => {
                    const isNowPlaying = idx === nowPlayingIndex
                    const isPlayed = idx < nowPlayingIndex
                    const progressPct = isNowPlaying && duration > 0 ? (currentTime / duration) * 100 : 0

                    return (
                      <motion.div
                        key={item.queueId || `${item.id}-${idx}`}
                        layout
                        initial={{ opacity: 0, x: -20, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, x: 20, height: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer group relative overflow-hidden ${
                          isNowPlaying
                            ? 'border border-primary/20'
                            : isPlayed
                              ? 'opacity-50 hover:bg-muted'
                              : 'hover:bg-muted'
                        }`}
                        onClick={() => play(idx)}
                      >
                        {/* Progress fill background for now-playing */}
                        {isNowPlaying && (
                          <>
                            {/* Full bg tint */}
                            <div className="absolute inset-0 bg-primary/10" />
                            {/* Animated progress fill */}
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-primary/20 transition-[width] duration-300 ease-linear"
                              style={{ width: `${progressPct}%` }}
                            />
                            {/* Left accent bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
                          </>
                        )}

                        {/* Icon */}
                        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 relative z-10 transition-colors ${
                          isNowPlaying
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
                        }`}>
                          {isNowPlaying ? (
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
                          ) : isPlayed ? (
                            <span className="material-symbols-outlined text-lg">check</span>
                          ) : (
                            <span className="material-symbols-outlined text-lg transition-transform group-hover:scale-110">play_arrow</span>
                          )}
                        </div>

                        {/* Track info */}
                        <div className="flex-1 min-w-0 relative z-10">
                          <h4 className={`text-sm font-semibold truncate transition-colors ${
                            isNowPlaying ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
                          }`}>{item.name || item.latin}</h4>
                          <p className={`text-xs truncate transition-colors ${
                            isNowPlaying ? 'text-primary/80' : 'text-muted-foreground group-hover:text-foreground/60'
                          }`}>{item.chapter_name}</p>
                        </div>

                        {/* Delete button — visible on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromQueue(idx)
                          }}
                          className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remove from queue"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar 2 - Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.aside 
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: 320, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden lg:flex flex-col bg-card border-l border-border z-10 shadow-[0_0_20px_rgba(0,0,0,0.05)] overflow-hidden"
            >
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
                
                <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1 custom-scrollbar">
                  {/* Render Results or Suggestions based on search query */}
                  {(() => {
                    const isSearching = searchQuery.trim().length > 2;
                    const displayData = isSearching ? searchResults : defaultSuggestions;
                    const showPlaylists = displayData.chapters.length > 0;
                    const showDuas = displayData.invocations.length > 0;
                    
                    if (isSearching && !showPlaylists && !showDuas) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <span className="material-symbols-outlined text-4xl text-muted-foreground/30 mb-2">search_off</span>
                          <p className="text-sm text-muted-foreground">No matches found for your search.</p>
                        </div>
                      )
                    }

                    return (
                      <>
                        {showPlaylists && (
                          <div className="flex flex-col gap-3">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                              {isSearching ? "Playlists" : "Suggested Playlists"}
                            </h3>
                            <div className="flex flex-col gap-1.5">
                              {displayData.chapters.map((chapter) => (
                                <div key={`ch-${chapter.id}`} className="group flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer shadow-sm">
                                  <div className="flex-1 min-w-0" onClick={() => useAudioStore.getState().setQueue(chapter.invocations)}>
                                    <h4 className="text-sm font-semibold text-foreground truncate">{chapter.chapter_name}</h4>
                                    <p className="text-[11px] text-muted-foreground">{chapter.invocations.length} Duas</p>
                                  </div>
                                  <button 
                                    onClick={() => useAudioStore.getState().setQueue(chapter.invocations)}
                                    className="w-8 h-8 rounded-lg bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
                                  >
                                    <span className="material-symbols-outlined text-lg">playlist_play</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {showDuas && (
                          <div className="flex flex-col gap-3">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                              {isSearching ? "Direct Results" : "Suggested Duas"}
                            </h3>
                            <div className="flex flex-col gap-1.5">
                              {displayData.invocations.map((res) => (
                                <div key={`inv-${res.id}`} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-border/50">
                                  <div className="flex-1 min-w-0" onClick={() => useAudioStore.getState().setQueue([...queue, res])}>
                                    <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{res.name || res.latin}</h4>
                                    <p className="text-[11px] text-muted-foreground truncate">{res.chapter_name}</p>
                                  </div>
                                  <button 
                                    onClick={() => useAudioStore.getState().setQueue([...queue, res])}
                                    className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center flex-shrink-0"
                                  >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
