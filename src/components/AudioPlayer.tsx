import { useEffect, useRef } from "react"
import { useAudioStore } from "../store/audio"

export function AudioPlayer() {
  const { 
    queue, 
    nowPlayingIndex, 
    isPlaying, 
    currentTime, 
    repeatMode,
    selectedVersion,
    next, 
    setIsPlaying, 
    setCurrentTime, 
    setDuration,
    setBufferedTime
  } = useAudioStore()
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentDua = queue[nowPlayingIndex]
  
  // Resolve audio source based on selected version
  const audioSrc = currentDua ? (
    (selectedVersion !== 'default' && currentDua.audio_versions?.[selectedVersion]) 
      ? currentDua.audio_versions[selectedVersion] 
      : currentDua.audio
  ) : ""

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
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.error("Replay failed", e))
    } else {
      next()
    }
  }

  const handleProgress = () => {
    if (audioRef.current && audioRef.current.buffered.length > 0) {
      const bufferedEnd = audioRef.current.buffered.end(audioRef.current.buffered.length - 1)
      setBufferedTime(bufferedEnd)
    }
  }

  if (!currentDua) return null

  return (
    <audio
      ref={audioRef}
      src={audioSrc}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onProgress={handleProgress}
      onEnded={handleEnded}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      className="hidden"
    />
  )
}
