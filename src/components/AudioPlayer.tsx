import { useEffect, useRef } from "react"
import { useAudioStore } from "../store/audio"

export function AudioPlayer() {
  const { queue, nowPlayingIndex, isPlaying, next, setIsPlaying } = useAudioStore()
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
    <audio
      ref={audioRef}
      src={currentDua.audio}
      onEnded={handleEnded}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      className="hidden"
    />
  )
}
