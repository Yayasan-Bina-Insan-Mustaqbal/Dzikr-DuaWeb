import { useEffect, useRef } from "react"
import { useAudioStore } from "../store/audio"

export function AudioPlayer() {
  const { queue, nowPlayingIndex, isPlaying, next, previous, setIsPlaying } = useAudioStore()
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentDua = queue[nowPlayingIndex]

  useEffect(() => {
    if (audioRef.current && currentDua) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed", e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [currentDua, isPlaying])

  const handleEnded = () => {
    next()
  }

  if (!currentDua) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50 flex items-center justify-between shadow-[0_-4px_20px_rgba(46,50,48,0.06)]">
      <audio
        ref={audioRef}
        src={currentDua.audio}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
        </div>
        <div className="flex-1 min-w-0 hidden md:block">
          <h4 className="text-sm font-semibold text-foreground truncate">{currentDua.latin}</h4>
          <p className="text-xs text-muted-foreground truncate">{currentDua.chapter_name}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 justify-center flex-1">
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

      <div className="flex-1 flex justify-end">
         <div className="flex items-center gap-2 px-1 w-32 hidden md:flex">
          <span className="material-symbols-outlined text-muted-foreground text-base">volume_up</span>
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-[70%]"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
