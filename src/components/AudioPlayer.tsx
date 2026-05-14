import { useEffect, useRef } from "react"
import { useAudioStore } from "../store/audio"

export function AudioPlayer() {
  const { queue, nowPlayingIndex, isPlaying, currentTime, next, setIsPlaying, setCurrentTime, setDuration } = useAudioStore()
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentDua = queue[nowPlayingIndex]

  // Handle Play/Pause
  useEffect(() => {
    if (audioRef.current && currentDua) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed", e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [currentDua, isPlaying])

  // Handle Seeking (when currentTime in store is updated from outside)
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime
    }
  }, [currentTime])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    next()
  }

  if (!currentDua) return null

  return (
    <audio
      ref={audioRef}
      src={currentDua.audio}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      className="hidden"
    />
  )
}
