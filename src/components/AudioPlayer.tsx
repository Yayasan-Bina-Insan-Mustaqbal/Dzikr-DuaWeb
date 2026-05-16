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
    setBufferedTime,
    setAudioElement
  } = useAudioStore()
  const audioRef = useRef<HTMLAudioElement>(null)
  const isTransitioningRef = useRef<boolean>(false)

  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current)
    }
    return () => setAudioElement(null)
  }, [setAudioElement])

  const currentDua = queue[nowPlayingIndex]
  
  // Resolve audio source based on selected version
  const audioSrc = currentDua ? (
    (selectedVersion !== 'default' && currentDua.audio_versions?.[selectedVersion]) 
      ? currentDua.audio_versions[selectedVersion] 
      : currentDua.audio
  ) : ""

  // Handle Play/Pause state changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioSrc) return

    if (isPlaying) {
      if (audio.paused) {
        audio.play().catch(error => {
          // Only log real errors, not the "interrupted by new load" ones
          if (error.name !== 'AbortError') {
            console.error("Playback failed:", error)
          }
        })
      }
    } else {
      if (!audio.paused) {
        audio.pause()
      }
    }
  }, [isPlaying, audioSrc])

  // Handle Seeking
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1.5) {
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

  const handleError = (e: any) => {
    const error = audioRef.current?.error
    if (error?.code !== 4) { // Ignore abort errors
      console.error("Audio Error:", {
        code: error?.code,
        message: error?.message,
        src: audioRef.current?.src,
        event: e
      })
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
      onError={handleError}
      className="hidden"
    />
  )
}
