import { create } from 'zustand';
import type { Invocation } from '../types/data';

interface AudioState {
  queue: Invocation[];
  nowPlayingIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  setQueue: (queue: Invocation[]) => void;
  play: (index: number) => void;
  next: () => void;
  previous: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  seek: (time: number) => void;
  clearQueue: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  queue: [],
  nowPlayingIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,

  setQueue: (queue) => set({ queue, nowPlayingIndex: queue.length > 0 ? 0 : -1, currentTime: 0 }),
  
  play: (index) => set({ nowPlayingIndex: index, isPlaying: true, currentTime: 0 }),
  
  next: () => set((state) => {
    if (state.nowPlayingIndex < state.queue.length - 1) {
      return { nowPlayingIndex: state.nowPlayingIndex + 1, isPlaying: true, currentTime: 0 };
    }
    return { isPlaying: false }; // Reached end of queue
  }),

  previous: () => set((state) => {
    if (state.nowPlayingIndex > 0) {
      return { nowPlayingIndex: state.nowPlayingIndex - 1, isPlaying: true, currentTime: 0 };
    }
    return state;
  }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  seek: (time) => set({ currentTime: time }), // This will be used to signal the player to seek
  
  clearQueue: () => set({ queue: [], nowPlayingIndex: -1, isPlaying: false, currentTime: 0, duration: 0 }),
}));
