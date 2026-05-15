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
  const lastSrcRef = useRef<string>("")
  const isFadingRef = useRef<boolean>(false)

  const currentDua = queue[nowPlayingIndex]
  
  // Resolve audio source based on selected version
  const audioSrc = currentDua ? (
    (selectedVersion !== 'default' && currentDua.audio_versions?.[selectedVersion]) 
      ? currentDua.audio_versions[selectedVersion] 
      : currentDua.audio
  ) : ""

  // Handle source changes with fade-out
  useEffect(() => {
    const handleSrcChange = async () => {
      if (!audioRef.current) return
      
      const audio = audioRef.current
      const newSrc = audioSrc
      
      // If already playing and src changes, fade out first
      if (lastSrcRef.current && lastSrcRef.current !== newSrc && !audio.paused && !isFadingRef.current) {
        isFadingRef.current = true
        const startVolume = audio.volume
        const fadeDuration = 300 // ms
        const steps = 20
        const volumeStep = startVolume / steps
        
        for (let i = 0; i < steps; i++) {
          await new Promise(r => setTimeout(r, fadeDuration / steps))
          audio.volume = Math.max(0, audio.volume - volumeStep)
        }
        
        audio.pause()
        audio.src = newSrc
        audio.volume = startVolume
        isFadingRef.current = false
        
        if (isPlaying) {
          audio.play().catch(e => console.error("Playback failed after fade", e))
        }
      } else {
        audio.src = newSrc
        if (isPlaying) {
          audio.play().catch(e => console.error("Playback failed", e))
        }
      }
      
      lastSrcRef.current = newSrc
    }

    handleSrcChange()
  }, [audioSrc, isPlaying])

  // Handle Play/Pause (simple toggle if src is same)
  useEffect(() => {
    if (audioRef.current && audioRef.current.src.includes(audioSrc)) {
      if (isPlaying) {
        if (audioRef.current.paused && !isFadingRef.current) {
          audioRef.current.play().catch(e => console.error("Play failed", e))
        }
      } else {
        if (!audioRef.current.paused) {
          audioRef.current.pause()
        }
      }
    }
  }, [isPlaying, audioSrc])

  // Handle Seeking
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime
    }
  }, [currentTime])

  const handleTimeUpdate = () => {
    if (audioRef.current && !isFadingRef.current) {
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
