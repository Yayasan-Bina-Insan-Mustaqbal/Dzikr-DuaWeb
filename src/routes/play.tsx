import { createFileRoute } from "@tanstack/react-router"
import { useAudioStore } from "../store/audio"
import { useState, useEffect, useMemo, useRef } from "react"
import { searchDhikr, type SearchResults } from "../lib/search"
import type { Invocation, Chapter } from "../types/data"
import { getChapters } from "../lib/data"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"

export const Route = createFileRoute("/play")({
  component: PlayRoute,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      queue: (search.queue as string) || undefined,
    }
  },
})

function PlayRoute() {
  const { 
    queue, 
    nowPlayingIndex, 
    setQueue,
    play, 
    isPlaying, 
    setIsPlaying, 
    next, 
    previous, 
    currentTime, 
    duration, 
    bufferedTime,
    repeatMode,
    selectedVersion,
    translationLang,
    transliterationLang,
    theme,
    setRepeatMode,
    setSelectedVersion,
    setTranslationLang,
    setTransliterationLang,
    setTheme,
    seek, 
    clearQueue, 
    addToQueue,
    removeFromQueue 
  } = useAudioStore()
  const search = Route.useSearch()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResults>({ chapters: [], invocations: [] })
  const [showQueue, setShowQueue] = useState(true)
  const [showSearch, setShowSearch] = useState(true)
  const [showVersionDropdown, setShowVersionDropdown] = useState(false)

  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isProgrammaticScroll = useRef(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)
  const [showCopied, setShowCopied] = useState(false)
  
  // Accordion state
  const [openSections, setOpenSections] = useState<string[]>(['suggested-playlists', 'suggested-zikr'])
  
  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const currentDua = queue[nowPlayingIndex]

  // Auto-populate queue based on time of day if it's empty
  useEffect(() => {
    // Auto close sidebars on mobile
    if (window.innerWidth < 1024) {
      setShowQueue(false)
      setShowSearch(false)
    }

    if (queue.length === 0) {
      const queueIds = search.queue?.split(',').map(Number) || []
       
      if (queueIds.length > 0) {
        const items = queueIds.map(id => {
          for (const chapter of getChapters()) {
            const invocation = chapter.invocations.find(i => i.id === id)
            if (invocation) return { ...invocation, chapter_name: chapter.chapter_name }
          }
          return undefined
        }).filter(Boolean) as Invocation[]
        
        if (items.length > 0) {
          setQueue(items, false)
          return
        }
      }

      // Fallback to time-based auto-population if no queue in URL
      const hour = new Date().getHours()
      // Morning: 4:00 to 13:59. Evening: 14:00 to 3:59.
      const isMorning = hour >= 4 && hour < 14
      const targetChapterId = isMorning ? 27 : 133
      
      const allChapters = getChapters()
      const targetChapter = allChapters.find(c => c.id === targetChapterId)
      
      if (targetChapter) {
        setQueue(targetChapter.invocations, false)
      }
    }
  }, [search.queue])

  const handleStartPlayback = () => {
    setShowWelcomeModal(false)
    setIsPlaying(true)
  }

  // Auto-scroll to the currently playing Dua
  useEffect(() => {
    if (carouselRef.current && queue.length > 0 && nowPlayingIndex >= 0) {
      // Calculate target scroll position
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
    const curatedIds = [27, 133, 96, 1, 28]
    
    const suggestedPlaylists = curatedIds
      .map(id => allChapters.find(c => c.id === id))
      .filter(Boolean) as Chapter[]
    
    const allPlaylists = allChapters.filter(c => !curatedIds.includes(c.id))
    
    const suggestedZikr: Invocation[] = []
    const allZikr: Invocation[] = []
    
    for (const c of allChapters) {
      if (c.invocations.length > 0) {
        const chapterZikr = c.invocations.map(i => ({ ...i, chapter_name: c.chapter_name }))
        if (curatedIds.includes(c.id)) {
          suggestedZikr.push(...chapterZikr)
        } else {
          allZikr.push(...chapterZikr)
        }
      }
    }
    
    return { 
      suggestedPlaylists, 
      suggestedZikr: suggestedZikr.slice(0, 10),
      allPlaylists,
      allZikr 
    }
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchDhikr(searchQuery).then(setSearchResults)
    } else {
      setSearchResults({ chapters: [], invocations: [] })
    }
  }, [searchQuery])

  const formatArabic = (text: string) => {
    const parts = text.split(/([\[\]\(\)])/);
    return parts.map((part, i) => {
      if (['[', ']', '(', ')'].includes(part)) {
        return <span key={i} className="opacity-30 text-[0.8em] font-sans">{part}</span>;
      }
      const prev = parts[i-1];
      const next = parts[i+1];
      if ((prev === '(' || prev === '[') && (next === ')' || next === ']')) {
        return <span key={i} className="opacity-60">{part}</span>;
      }
      return <span key={i} className="matan text-primary drop-shadow-[0_2px_10px_rgba(var(--primary),0.2)]">{part}</span>;
    });
  };

  return (
    <div className="flex flex-1 overflow-hidden h-screen bg-background">
      {/* Welcome Modal / Auto-play Overlay */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-card border border-border/50 shadow-2xl rounded-[32px] p-8 flex flex-col items-center text-center gap-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-foreground">Bismillah</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to <span className="text-foreground font-semibold">Dzikr & Dua</span>. Your playlist is ready. Tap play to begin your remembrance.
                </p>
              </div>
              
              <button 
                onClick={handleStartPlayback}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                <span>Start Recitation</span>
              </button>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[280px]">
                  Note: Browsers require a manual click to enable high-fidelity audio playback.
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">
                  Remembrance of Allah is the Greatest
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Area (Left) */}
      <main className="flex-1 overflow-y-auto relative flex flex-col items-center justify-center px-6 lg:px-20 scroll-smooth pt-24 landscape:pt-16">
        <div className="absolute top-0 left-0 right-0 h-16 landscape:h-12 flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <span className="font-heading font-semibold text-lg tracking-tight text-foreground">
                Dzikr <span className="text-primary">& Dua</span>
              </span>
            </div>
            
            <AnimatePresence mode="wait">
              {currentDua && (
                <motion.div 
                  key={currentDua.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10"
                >
                  <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>label</span>
                  <span className="text-xs font-bold text-foreground/80 tracking-wide uppercase">{currentDua.chapter_name}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground`}
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>App Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg">language</span>
                        <span>Translation</span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-40">
                      {[
                        { id: 'none', name: 'None' },
                        { id: 'english', name: 'English' },
                        { id: 'indonesian', name: 'Indonesian' },
                        { id: 'albanian', name: 'Albanian' }
                      ].map((lang) => (
                        <DropdownMenuItem 
                          key={lang.id} 
                          onClick={() => setTranslationLang(lang.id as any)}
                          className={translationLang === lang.id ? "bg-primary/10 text-primary font-bold" : ""}
                        >
                          {lang.name}
                          {translationLang === lang.id && <span className="material-symbols-outlined ml-auto text-xs">check</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg">subtitles</span>
                        <span>Transliteration</span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-40">
                      {[
                        { id: 'none', name: 'None' },
                        { id: 'latin', name: 'Latin' }
                      ].map((lang) => (
                        <DropdownMenuItem 
                          key={lang.id} 
                          onClick={() => setTransliterationLang(lang.id as any)}
                          className={transliterationLang === lang.id ? "bg-primary/10 text-primary font-bold" : ""}
                        >
                          {lang.name}
                          {transliterationLang === lang.id && <span className="material-symbols-outlined ml-auto text-xs">check</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg">palette</span>
                        <span>Theme</span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-40">
                      {[
                        { id: 'auto', name: 'Auto', color: 'bg-gradient-to-tr from-zinc-900 to-zinc-100 border' },
                        { id: 'light', name: 'Light', color: 'bg-white border' },
                        { id: 'dark', name: 'Dark', color: 'bg-zinc-900' },
                        { id: 'sepia', name: 'Sepia', color: 'bg-[#f4ecd8]' },
                        { id: 'emerald', name: 'Emerald', color: 'bg-[#064e3b]' }
                      ].map((t) => (
                        <DropdownMenuItem 
                          key={t.id} 
                          onClick={() => setTheme(t.id as any)}
                          className={theme === t.id ? "bg-primary/10 text-primary font-bold" : ""}
                        >
                          <div className={`w-3 h-3 rounded-full mr-2 ${t.color}`} />
                          {t.name}
                          {theme === t.id && <span className="material-symbols-outlined ml-auto text-xs">check</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-4 bg-border mx-1"></div>

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
                      {formatArabic(dua.arabic)}
                    </p>
                    {transliterationLang !== 'none' && dua.latin && (
                      <p className="text-sm md:text-base text-primary/60 font-medium tracking-wide">
                        {dua.latin}
                      </p>
                    )}
                    <div className="h-px w-24 bg-border mx-auto rounded-full flex-shrink-0"></div>
                    {translationLang !== 'none' && (
                      <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto italic">
                        "{translationLang === 'english' ? dua.english : 
                          translationLang === 'indonesian' ? (dua as any).indonesian || dua.english :
                          translationLang === 'albanian' ? dua.albanian || dua.english : 
                          dua.english}"
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 opacity-30">
            <div className="w-24 h-24 rounded-[32px] bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <p className="text-xl font-medium">Add some Dzikr to start</p>
          </div>
        )}
      </main>

      {/* Mobile Overlay Backdrop */}
      <div 
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-[90] lg:hidden transition-opacity duration-300 ${
          showQueue || showSearch ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          setShowQueue(false)
          setShowSearch(false)
        }}
      />

      {/* Sidebars Container (Right) */}
      <div className="absolute lg:relative right-0 flex h-full flex-shrink-0 z-[100] max-w-[100vw] overflow-visible shadow-2xl lg:shadow-none">
        {/* Sidebar 1 - Player & Queue */}
        <AnimatePresence>
          {showQueue && (
            <motion.aside 
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: 320, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="flex flex-col bg-card border-l border-border z-10 shadow-[0_0_20px_rgba(0,0,0,0.05)] overflow-visible relative h-full"
            >
              {/* Tab Ear (Mobile Close Button) */}
              <button 
                onClick={() => setShowQueue(false)}
                className="absolute -left-10 top-24 w-10 h-16 bg-card border border-r-0 border-border rounded-l-2xl flex items-center justify-center text-muted-foreground hover:text-primary transition-all lg:hidden shadow-[-4px_0_10px_rgba(0,0,0,0.1)]"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>

              <div className="p-5 border-b border-border flex flex-col gap-5 flex-shrink-0">
                {/* Sidebar Switcher (Mobile/Tablet focus) */}
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl lg:hidden">
                  <button 
                    onClick={() => { setShowQueue(true); setShowSearch(false); }}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${showQueue ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Queue
                  </button>
                  <button 
                    onClick={() => { setShowSearch(true); setShowQueue(false); }}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${showSearch ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Search
                  </button>
                </div>

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
                        <div className="relative">
                          <button 
                            onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer font-bold text-xs ${showVersionDropdown ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                            title="Switch Reciter"
                          >
                            {selectedVersion === 'default' ? 'D' : 
                             selectedVersion === 'rodja' ? 'R' : 
                             selectedVersion === 'mburoja-api' ? 'M' : 
                             selectedVersion.charAt(0).toUpperCase()}
                          </button>
                          
                          <AnimatePresence>
                            {showVersionDropdown && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute top-full left-0 mt-2 w-48 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 p-1"
                              >
                                <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 mb-1">Select Reciter</div>
                                {[
                                  { id: 'default', name: 'Original' },
                                  { id: 'rodja', name: 'Rodja' },
                                  { id: 'mburoja-api', name: 'Mburoja API' }
                                ].map((v) => {
                                  const isAvailable = v.id === 'default' || (currentDua.audio_versions && currentDua.audio_versions[v.id])
                                  const isSelected = selectedVersion === v.id
                                  
                                  return (
                                    <button 
                                      key={v.id}
                                      disabled={!isAvailable}
                                      onClick={() => {
                                        setSelectedVersion(v.id)
                                        setShowVersionDropdown(false)
                                      }}
                                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all ${
                                        isSelected 
                                          ? 'bg-primary/10 text-primary font-bold' 
                                          : isAvailable 
                                            ? 'text-foreground hover:bg-muted' 
                                            : 'text-muted-foreground/40 cursor-not-allowed'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary animate-pulse' : 'bg-transparent'}`} />
                                        <span>{v.name}</span>
                                      </div>
                                      {!isAvailable && <span className="text-[9px] opacity-60">N/A</span>}
                                    </button>
                                  )
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

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
                        
                        <button 
                          onClick={() => {
                            const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all']
                            const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length
                            setRepeatMode(modes[nextIndex])
                          }}
                          className={`relative cursor-pointer transition-colors ${repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                          title={`Repeat: ${repeatMode}`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
                          </span>
                          {repeatMode !== 'off' && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
                          )}
                        </button>
                      </div>
                      
                      {/* Progress Scrubber */}
                      <div className="flex flex-col gap-1.5">
                        <div 
                          className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden cursor-pointer group relative"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = e.clientX - rect.left
                            const percentage = x / rect.width
                            seek(percentage * duration)
                          }}
                        >
                          {/* Buffered Progress */}
                          <motion.div 
                            className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-300" 
                            style={{ width: `${(bufferedTime / duration) * 100 || 0}%` }}
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          {/* Current Progress */}
                          <div 
                            className="absolute inset-y-0 left-0 bg-primary transition-all duration-150 z-10" 
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                          />
                          {/* Handle */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            style={{ left: `${(currentTime / duration) * 100 || 0}%`, marginLeft: '-6px' }}
                          />
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
              <div className="p-5 pb-3 border-b border-border flex items-center justify-between flex-shrink-0">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Up Next</h2>
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button 
                      onClick={async () => {
                        const shareData = {
                          title: 'Dzikr & Dua Playlist',
                          text: `Check out this remembrance playlist: ${currentDua?.chapter_name || 'My Playlist'}`,
                          url: window.location.href,
                        };
                        
                        if (navigator.share && navigator.canShare?.(shareData)) {
                          try {
                            await navigator.share(shareData);
                          } catch (err) {
                            if ((err as Error).name !== 'AbortError') {
                              console.error('Error sharing:', err);
                            }
                          }
                        } else {
                          try {
                            await navigator.clipboard.writeText(window.location.href);
                            setShowCopied(true);
                            setTimeout(() => setShowCopied(false), 2000);
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        }
                      }}
                      className={`p-1.5 transition-all cursor-pointer rounded-lg ${showCopied ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                      title={showCopied ? "Copied!" : "Share Playlist"}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showCopied ? 'check_circle' : 'share'}
                      </span>
                    </button>
                    
                    <AnimatePresence>
                      {showCopied && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: -30, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className="absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-emerald-500 text-white text-[10px] font-bold whitespace-nowrap shadow-lg pointer-events-none"
                        >
                          Copied to clipboard!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    onClick={() => clearQueue()}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded-lg hover:bg-destructive/10"
                    title="Clear Playlist"
                  >
                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 overflow-x-hidden min-h-0 custom-scrollbar">
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
                        className={`flex items-center flex-shrink-0 gap-3 p-2.5 rounded-xl transition-colors cursor-pointer group relative overflow-hidden ${
                          isNowPlaying ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-muted border border-transparent'
                        }`}
                        onClick={() => play(idx)}
                      >
                        {/* Progress background for now playing */}
                        {isNowPlaying && (
                          <div 
                            className="absolute inset-0 bg-primary/10 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        )}

                        {/* Status icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10 ${
                          isNowPlaying ? 'bg-primary text-primary-foreground' : 
                          isPlayed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
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

        {/* Sidebar 2 - Search & Browse */}
        <AnimatePresence>
          {showSearch && (
            <motion.aside 
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: 320, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="flex flex-col bg-card border-l border-border z-10 shadow-[0_0_20px_rgba(0,0,0,0.05)] overflow-visible relative h-full"
            >
              {/* Tab Ear (Mobile Close Button) */}
              <button 
                onClick={() => setShowSearch(false)}
                className="absolute -left-10 top-24 w-10 h-16 bg-card border border-r-0 border-border rounded-l-2xl flex items-center justify-center text-muted-foreground hover:text-primary transition-all lg:hidden shadow-[-4px_0_10px_rgba(0,0,0,0.1)]"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>

              <div className="p-5 border-b border-border bg-card/50 flex flex-col gap-4 flex-shrink-0">
                {/* Sidebar Switcher (Mobile/Tablet focus) */}
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl lg:hidden">
                  <button 
                    onClick={() => { setShowQueue(true); setShowSearch(false); }}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${showQueue ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Queue
                  </button>
                  <button 
                    onClick={() => { setShowSearch(true); setShowQueue(false); }}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${showSearch ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Search
                  </button>
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">search</span>
                  <input 
                    className="w-full bg-input/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" 
                    placeholder="Search Duas to add..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1 pr-1 custom-scrollbar pb-20">
                {searchQuery.trim().length > 2 ? (
                  <div className="flex flex-col gap-6 p-4">
                    {/* Search Results */}
                    {searchResults.chapters.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Playlists</h3>
                        {searchResults.chapters.map(chapter => (
                          <PlaylistCard key={chapter.id} chapter={chapter} />
                        ))}
                      </div>
                    )}
                    {searchResults.invocations.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Direct Results</h3>
                        {searchResults.invocations.map(res => (
                          <ZikrCard key={res.id} zikr={res} />
                        ))}
                      </div>
                    )}
                    {searchResults.chapters.length === 0 && searchResults.invocations.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-muted-foreground/30 mb-2">search_off</span>
                        <p className="text-sm text-muted-foreground">No matches found.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-0">
                    {/* Accordions */}
                    <AccordionSection 
                      id="suggested-playlists" 
                      title="Suggested Playlists" 
                      isOpen={openSections.includes('suggested-playlists')} 
                      onToggle={() => toggleSection('suggested-playlists')}
                    >
                      {defaultSuggestions.suggestedPlaylists.map(chapter => (
                        <PlaylistCard key={chapter.id} chapter={chapter} />
                      ))}
                    </AccordionSection>

                    <AccordionSection 
                      id="suggested-zikr" 
                      title="Suggested Zikr" 
                      isOpen={openSections.includes('suggested-zikr')} 
                      onToggle={() => toggleSection('suggested-zikr')}
                    >
                      {defaultSuggestions.suggestedZikr.map(zikr => (
                        <ZikrCard key={zikr.id} zikr={zikr} />
                      ))}
                    </AccordionSection>

                    <AccordionSection 
                      id="all-playlists" 
                      title="All Playlists" 
                      isOpen={openSections.includes('all-playlists')} 
                      onToggle={() => toggleSection('all-playlists')}
                    >
                      {defaultSuggestions.allPlaylists.map(chapter => (
                        <PlaylistCard key={chapter.id} chapter={chapter} />
                      ))}
                    </AccordionSection>

                    <AccordionSection 
                      id="all-zikr" 
                      title="All Zikr" 
                      isOpen={openSections.includes('all-zikr')} 
                      onToggle={() => toggleSection('all-zikr')}
                    >
                      {defaultSuggestions.allZikr.map(zikr => (
                        <ZikrCard key={zikr.id} zikr={zikr} />
                      ))}
                    </AccordionSection>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Helper Components for Accordion and Cards
function AccordionSection({ id, title, isOpen, onToggle, children }: { id: string, title: string, isOpen: boolean, onToggle: () => void, children: React.ReactNode }) {
  return (
    <div className="flex flex-col border-b border-border/30 last:border-0">
      <button 
        onClick={onToggle}
        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
      >
        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
          {title}
        </span>
        <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'}`}>
          expand_more
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 p-3 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlaylistCard({ chapter }: { chapter: Chapter }) {
  const { setQueue, addToQueue } = useAudioStore()
  return (
    <div className="group flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer shadow-sm">
      <div className="flex-1 min-w-0" onClick={() => setQueue(chapter.invocations)}>
        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{chapter.chapter_name}</h4>
        <p className="text-[11px] text-muted-foreground">{chapter.invocations.length} Duas</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button 
          onClick={() => setQueue(chapter.invocations)}
          className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
          title="Play Playlist"
        >
          <span className="material-symbols-outlined text-lg">playlist_play</span>
        </button>
        <button 
          onClick={() => addToQueue(chapter.invocations)}
          className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center"
          title="Add to Queue"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>
    </div>
  )
}

function ZikrCard({ zikr }: { zikr: Invocation }) {
  const { setQueue, addToQueue } = useAudioStore()
  return (
    <div className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-border/50">
      <div className="flex-1 min-w-0" onClick={() => setQueue([zikr])}>
        <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{zikr.name || zikr.latin}</h4>
        <p className="text-[11px] text-muted-foreground truncate">{zikr.chapter_name}</p>
      </div>
      <button 
        onClick={() => addToQueue([zikr])}
        className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center flex-shrink-0"
      >
        <span className="material-symbols-outlined text-lg">add</span>
      </button>
    </div>
  )
}
