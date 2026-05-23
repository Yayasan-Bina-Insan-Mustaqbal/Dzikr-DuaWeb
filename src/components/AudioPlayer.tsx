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

  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current)
    }
    return () => setAudioElement(null)
  }, [setAudioElement])

  const currentDua = queue[nowPlayingIndex]
  
  // Resolve audio source and metadata based on selected version
  const audioMetadata = currentDua?.audio_versions?.[selectedVersion]
  const isObjectMetadata = typeof audioMetadata === 'object' && audioMetadata !== null
  
  const sanitizeName = (name: string): string => {
    let sanitized = name.replace(/[\(\)]/g, '');
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s_\-]/g, '');
    sanitized = sanitized.replace(/[\s\-]+/g, '_');
    sanitized = sanitized.replace(/_+/g, '_');
    return sanitized.trim().replace(/^_+|_+$/g, '');
  };

  const getAudioSrc = () => {
    if (!currentDua) return ""
    
    const id = currentDua.id
    const name = currentDua.name || currentDua.internal_id || `Invocation ${id}`
    const sanitized = sanitizeName(name)
    
    if (isObjectMetadata) {
      return (audioMetadata as any).src
    }
    
    if (selectedVersion !== 'default') {
      if (typeof audioMetadata === 'string') {
        return audioMetadata
      }
      if (selectedVersion === 'Mishary') {
        return `/invocations/${id}_${sanitized}/${id}_${sanitized}_Mishary_1.mp3`
      }
    }
    
    const defaultPath = currentDua.audio
    if (defaultPath && defaultPath.startsWith('/audios/')) {
      return `/invocations/${id}_${sanitized}/${id}_${sanitized}_default_1.mp3`
    }
    
    return defaultPath || ""
  }

  const audioSrc = getAudioSrc()

  const startTime = isObjectMetadata ? (audioMetadata as any).startTime : undefined
  const endTime = isObjectMetadata ? (audioMetadata as any).endTime : undefined

  // Handle Seek to StartTime when track changes
  useEffect(() => {
    if (audioRef.current && startTime !== undefined) {
      audioRef.current.currentTime = startTime
    }
  }, [audioSrc, startTime])

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

  // Handle Seeking from store
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1.5) {
      audioRef.current.currentTime = currentTime
    }
  }, [currentTime])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime
      setCurrentTime(current)
      
      // Handle endTime
      if (endTime !== undefined && current >= endTime) {
        handleEnded()
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      // If we have startTime, ensure we start there
      if (startTime !== undefined) {
        audioRef.current.currentTime = startTime
      }
    }
  }

  const handleEnded = () => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = startTime || 0
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
