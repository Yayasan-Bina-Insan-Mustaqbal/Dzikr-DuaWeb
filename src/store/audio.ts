import { create } from 'zustand';
import type { Invocation } from '../types/data';

interface AudioState {
  queue: Array<Invocation>;
  nowPlayingIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  repeatMode: 'off' | 'one' | 'all';
  selectedVersion: string;
  translationLang: 'none' | 'english' | 'indonesian' | 'albanian';
  transliterationLang: 'none' | 'latin';
  theme: 'auto' | 'light' | 'dark' | 'sepia' | 'emerald';
  audioElement: HTMLAudioElement | null;
  setAudioElement: (el: HTMLAudioElement | null) => void;
  setQueue: (queue: Array<Invocation>, shouldPlay?: boolean) => void;
  play: (index: number) => void;
  next: () => void;
  previous: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBufferedTime: (time: number) => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  setSelectedVersion: (version: string) => void;
  setTranslationLang: (lang: 'none' | 'english' | 'indonesian' | 'albanian') => void;
  setTransliterationLang: (lang: 'none' | 'latin') => void;
  setTheme: (theme: 'auto' | 'light' | 'dark' | 'sepia' | 'emerald') => void;
  seek: (time: number) => void;
  clearQueue: () => void;
  addToQueue: (items: Array<Invocation>) => void;
  reorderQueue: (newQueue: Array<Invocation>) => void;
  removeFromQueue: (index: number) => void;
  updateQueueItem: (id: number, fields: Partial<Invocation>) => void;
}

const applyTheme = (theme: 'auto' | 'light' | 'dark' | 'sepia' | 'emerald') => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Manage .dark class for Tailwind
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Manage data-theme attribute
  if (theme === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = useAudioStore.getState().theme;
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}

const getInitialLanguage = (): 'english' | 'indonesian' | 'albanian' => {
  if (typeof window === 'undefined') return 'english';
  
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('id')) return 'indonesian';
  if (lang.startsWith('sq')) return 'albanian';
  
  // Secondary check: Timezone for country-based detection
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith('Asia/Jakarta') || tz.startsWith('Asia/Makassar') || tz.startsWith('Asia/Jayapura')) {
      return 'indonesian';
    }
    if (tz.startsWith('Europe/Tirane')) {
      return 'albanian';
    }
  } catch (e) {
    // Ignore
  }
  
  return 'english';
};

export const useAudioStore = create<AudioState>((set) => ({
  queue: [],
  nowPlayingIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  bufferedTime: 0,
  repeatMode: 'off',
  selectedVersion: 'default',
  translationLang: getInitialLanguage(),
  transliterationLang: 'latin',
  theme: 'auto',
  audioElement: null,

  setAudioElement: (audioElement) => set({ audioElement }),

  setQueue: (queue, shouldPlay = true) => set({ 
    queue: queue.map(item => ({...item, queueId: item.queueId || Math.random().toString(36).substring(2, 9)})), 
    nowPlayingIndex: queue.length > 0 ? 0 : -1, 
    isPlaying: queue.length > 0 && shouldPlay,
    currentTime: 0,
    bufferedTime: 0
  }),

  addToQueue: (items) => set((state) => {
    const newItems = items.map(item => ({...item, queueId: item.queueId || Math.random().toString(36).substring(2, 9)}));
    const newQueue = [...state.queue, ...newItems];
    const wasEmpty = state.queue.length === 0;
    
    return {
      queue: newQueue,
      nowPlayingIndex: wasEmpty ? 0 : state.nowPlayingIndex,
      isPlaying: wasEmpty ? true : state.isPlaying,
      currentTime: wasEmpty ? 0 : state.currentTime,
      bufferedTime: wasEmpty ? 0 : state.bufferedTime
    };
  }),
  
  reorderQueue: (newQueue) => set((state) => {
    // If something is playing, we need to find its new index
    let newIndex = state.nowPlayingIndex;
    if (state.nowPlayingIndex !== -1 && state.queue[state.nowPlayingIndex]) {
      const currentItem = state.queue[state.nowPlayingIndex];
      newIndex = newQueue.findIndex(item => item.queueId === currentItem.queueId);
    }
    return { queue: newQueue, nowPlayingIndex: newIndex };
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
  setTranslationLang: (translationLang) => set({ translationLang }),
  setTransliterationLang: (transliterationLang) => set({ transliterationLang }),
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
  },
  seek: (time) => set({ currentTime: time }),
  
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

  updateQueueItem: (id, fields) => set((state) => {
    const newQueue = state.queue.map(item => {
      if (item.id === id) {
        return { ...item, ...fields };
      }
      return item;
    });
    return { queue: newQueue };
  }),
}));
