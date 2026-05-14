import { create } from 'zustand';
import { Invocation } from '../types/data';

interface AudioState {
  queue: Invocation[];
  nowPlayingIndex: number;
  isPlaying: boolean;
  setQueue: (queue: Invocation[]) => void;
  play: (index: number) => void;
  next: () => void;
  previous: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  clearQueue: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  queue: [],
  nowPlayingIndex: -1,
  isPlaying: false,

  setQueue: (queue) => set({ queue, nowPlayingIndex: queue.length > 0 ? 0 : -1 }),
  
  play: (index) => set({ nowPlayingIndex: index, isPlaying: true }),
  
  next: () => set((state) => {
    if (state.nowPlayingIndex < state.queue.length - 1) {
      return { nowPlayingIndex: state.nowPlayingIndex + 1, isPlaying: true };
    }
    return { isPlaying: false }; // Reached end of queue
  }),

  previous: () => set((state) => {
    if (state.nowPlayingIndex > 0) {
      return { nowPlayingIndex: state.nowPlayingIndex - 1, isPlaying: true };
    }
    return state;
  }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  clearQueue: () => set({ queue: [], nowPlayingIndex: -1, isPlaying: false }),
}));
