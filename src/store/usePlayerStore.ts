import { create } from 'zustand';
import type { Invocation } from '../types/data';

interface PlayerState {
  queue: Array<Invocation>;
  currentIndex: number;
  isPlaying: boolean;
  
  // Actions
  setQueue: (queue: Array<Invocation>, startIndex?: number) => void;
  addToQueue: (invocation: Invocation) => void;
  removeFromQueue: (index: number) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  setCurrentIndex: (index: number) => void;
  togglePlay: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,

  setQueue: (queue, startIndex = 0) => {
    set({ queue, currentIndex: startIndex, isPlaying: true });
  },

  addToQueue: (invocation) => {
    set((state) => ({ queue: [...state.queue, invocation] }));
  },

  removeFromQueue: (index) => {
    set((state) => {
      const newQueue = state.queue.filter((_, i) => i !== index);
      let newIndex = state.currentIndex;
      if (index === state.currentIndex) {
        newIndex = -1; // Or handle next
      } else if (index < state.currentIndex) {
        newIndex--;
      }
      return { queue: newQueue, currentIndex: newIndex };
    });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  next: () => {
    const { queue, currentIndex } = get();
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, isPlaying: true });
    }
  },

  prev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isPlaying: true });
    }
  },

  setCurrentIndex: (index) => {
    set({ currentIndex: index, isPlaying: true });
  },
}));
