import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  ListMusic,
  ChevronUp
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AudioPlayer = () => {
  const { 
    queue, 
    currentIndex, 
    isPlaying, 
    play, 
    pause, 
    next, 
    prev, 
    togglePlay 
  } = usePlayerStore();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const currentInvocation = queue[currentIndex];

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error("Playback failed:", err);
        pause();
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      if (!isNaN(total)) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      const seekTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = seekTime;
      setProgress(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentInvocation) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
          {/* Progress Bar (at the top edge of the player) */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="h-1 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between px-6 py-4 gap-4">
            {/* Invocation Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <span className="font-bold text-lg">{currentIndex + 1}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">
                  {currentInvocation.albanian}
                </h4>
                <p className="text-xs text-white/50 truncate">
                  {currentInvocation.reference || "Dhikr & Dua"}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={prev}
                  disabled={currentIndex === 0}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button 
                  size="icon" 
                  onClick={togglePlay}
                  className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90 shadow-lg transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={next}
                  disabled={currentIndex === queue.length - 1}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
              <div className="text-[10px] text-white/40 font-mono">
                {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
              </div>
            </div>

            {/* Secondary Controls (Volume, Queue) */}
            <div className="flex items-center justify-end gap-3 flex-1">
              <div className="hidden sm:flex items-center gap-2 w-24">
                <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-white/50 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider 
                  value={[isMuted ? 0 : volume * 100]} 
                  max={100} 
                  onValueChange={(v) => {
                    setVolume(v[0] / 100);
                    if (v[0] > 0) setIsMuted(false);
                  }}
                  className="w-16"
                />
              </div>
              
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                <ListMusic className="h-5 w-5" />
              </Button>
              
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white sm:hidden">
                <ChevronUp className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={currentInvocation.audio}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={next}
        hidden
      />
    </div>
  );
};
