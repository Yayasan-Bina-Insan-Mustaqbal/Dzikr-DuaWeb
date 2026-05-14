import { create } from 'zustand';
import type { Invocation } from '../types/data';

interface AudioState {
  queue: Invocation[];
  nowPlayingIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  repeatMode: 'off' | 'one' | 'all';
  selectedVersion: string; // Key for audio_versions, e.g. 'mishary'
  setQueue: (queue: Invocation[]) => void;
  play: (index: number) => void;
  next: () => void;
  previous: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBufferedTime: (time: number) => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  setSelectedVersion: (version: string) => void;
  seek: (time: number) => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  queue: [],
  nowPlayingIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  bufferedTime: 0,
  repeatMode: 'off',
  selectedVersion: 'default',

  setQueue: (queue) => set({ 
    queue: queue.map(item => ({...item, queueId: item.queueId || Math.random().toString(36).substring(2, 9)})), 
    nowPlayingIndex: queue.length > 0 ? 0 : -1, 
    currentTime: 0,
    bufferedTime: 0
  }),
  
  play: (index) => set({ nowPlayingIndex: index, isPlaying: true, currentTime: 0, bufferedTime: 0 }),
  
  next: () => set((state) => {
    if (state.nowPlayingIndex < state.queue.length - 1) {
      return { nowPlayingIndex: state.nowPlayingIndex + 1, isPlaying: true, currentTime: 0, bufferedTime: 0 };
    }
    if (state.repeatMode === 'all' && state.queue.length > 0) {
      return { nowPlayingIndex: 0, isPlaying: true, currentTime: 0, bufferedTime: 0 };
    }
    return { isPlaying: false }; // Reached end of queue
  }),

  previous: () => set((state) => {
    if (state.nowPlayingIndex > 0) {
      return { nowPlayingIndex: state.nowPlayingIndex - 1, isPlaying: true, currentTime: 0, bufferedTime: 0 };
    }
    if (state.repeatMode === 'all' && state.queue.length > 0) {
      return { nowPlayingIndex: state.queue.length - 1, isPlaying: true, currentTime: 0, bufferedTime: 0 };
    }
    return state;
  }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setBufferedTime: (bufferedTime) => set({ bufferedTime }),
  setRepeatMode: (repeatMode) => set({ repeatMode }),
  setSelectedVersion: (selectedVersion) => set({ selectedVersion }),
  seek: (time) => set({ currentTime: time }), // This will be used to signal the player to seek
  
  clearQueue: () => set({ queue: [], nowPlayingIndex: -1, isPlaying: false, currentTime: 0, duration: 0 }),
  
  removeFromQueue: (index) => set((state) => {
    const newQueue = state.queue.filter((_, i) => i !== index);
    if (newQueue.length === 0) {
      return { queue: [], nowPlayingIndex: -1, isPlaying: false, currentTime: 0, duration: 0 };
    }
    let newIndex = state.nowPlayingIndex;
    if (index < state.nowPlayingIndex) {
      newIndex = state.nowPlayingIndex - 1;
    } else if (index === state.nowPlayingIndex) {
      // If we deleted the currently playing item, go to next (or previous if at end)
      newIndex = Math.min(state.nowPlayingIndex, newQueue.length - 1);
    }
    return { queue: newQueue, nowPlayingIndex: newIndex, currentTime: 0 };
  }),
}));
