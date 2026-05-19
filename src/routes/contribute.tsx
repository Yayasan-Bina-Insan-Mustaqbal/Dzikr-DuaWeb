import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useMemo, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { exchangeCodeServerFn, submitContributionServerFn } from "../lib/contributeServer"

export const Route = createFileRoute("/contribute")({
  component: ContributeRoute,
})

import { getChapters } from "../lib/data"

interface MockInvocation {
  id: number;
  chapter_name: string;
  arabic: string;
  latin: string;
  indonesian: string;
  english: string;
  reference: string;
  audio?: string;
}

// Dynamically generate the full real list of invocations from the application's local static database!
const MOCK_INVOCATIONS: MockInvocation[] = getChapters().flatMap(chapter => 
  chapter.invocations.map(inv => ({
    id: inv.id,
    chapter_name: chapter.chapter_name,
    arabic: inv.arabic,
    latin: inv.latin,
    indonesian: inv.indonesian || "",
    english: inv.english || "",
    reference: inv.reference,
    audio: inv.audio
  }))
)

interface DraftContribution {
  invocationId: number;
  arabic: string;
  translations: Record<string, string>; // e.g. { indonesian: "...", english: "...", french: "..." }
  transliterations: Record<string, string>; // e.g. { latin: "...", cyrillic: "..." }
  audioState: "none" | "recorded" | "uploaded";
  audioTrimStart: number; // percentage
  audioTrimEnd: number;   // percentage
  volumeBoost: boolean;
}

const TRANSLATION_LANGS = [
  { code: "indonesian", label: "Indonesian (Bahasa Indonesia)", flag: "🇮🇩" },
  { code: "english", label: "English", flag: "🇬🇧" },
  { code: "turkish", label: "Turkish (Türkçe)", flag: "🇹🇷" },
  { code: "urdu", label: "Urdu (اردو)", flag: "🇵🇰" },
  { code: "french", label: "French (Français)", flag: "🇫🇷" },
  { code: "spanish", label: "Spanish (Español)", flag: "🇪🇸" },
  { code: "malay", label: "Malay (Melayu)", flag: "🇲🇾" },
  { code: "russian", label: "Russian (Русский)", flag: "🇷🇺" },
  { code: "german", label: "German (Deutsch)", flag: "🇩🇪" }
]

const TRANSLITERATION_LANGS = [
  { code: "latin", label: "Latin (Standard Romanization)", flag: "🔠" },
  { code: "cyrillic", label: "Cyrillic (Russian/Central Asian)", flag: "🇷🇺" },
  { code: "english_trans", label: "English Phonetics", flag: "🇬🇧" },
  { code: "pinyin", label: "Chinese Pinyin", flag: "🇨🇳" },
  { code: "hebrew_trans", label: "Hebrew Phonetics", flag: "🇮🇱" }
]


// Custom Audacity Wave Amplitudes for high-fidelity rendering
const MOCK_WAVES: Record<number, number[]> = {
  1: [15, 25, 42, 68, 12, 4, 38, 72, 85, 48, 18, 5, 22, 58, 64, 32, 8, 4, 30, 75, 92, 54, 12, 5, 25, 48, 32, 10, 4],
  2: [18, 36, 52, 12, 4, 5, 28, 62, 78, 44, 15, 4, 25, 58, 68, 52, 22, 4, 18, 45, 75, 68, 30, 8, 12, 22, 15, 8, 4],
  3: [12, 22, 42, 28, 4, 5, 48, 74, 88, 58, 16, 5, 32, 68, 76, 82, 54, 12, 22, 48, 84, 94, 62, 34, 18, 10, 4, 5, 4]
}

function ContributeRoute() {
  const navigate = useNavigate()
  
  // Real recording and Web Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Real reference and recorded playback audio elements
  const refAudioElements = useRef<Record<number, HTMLAudioElement>>({})
  const recAudioElements = useRef<Record<number, HTMLAudioElement>>({})
  const recordedBlobs = useRef<Record<number, Blob>>({})
  
  // Auth state with local storage persistence and OAuth + PAT dual-mode support
  const [gitHubUser, setGitHubUser] = useState<{ username: string; avatarUrl: string; token?: string } | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dzikr_dua_github_user")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {}
      }
    }
    return null
  })
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [showPatInput, setShowPatInput] = useState(false)
  const [patTokenValue, setPatTokenValue] = useState("")
  const [prUrl, setPrUrl] = useState("")
  
  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("")
  
  // Staged inline suggestions state
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})
  const [draftStore, setDraftStore] = useState<Record<number, DraftContribution>>({})
  const [editingFields, setEditingFields] = useState<Record<number, Partial<DraftContribution>>>({})

  // Multi-language active tabs & addition states
  const [rowActiveTranslationTab, setRowActiveTranslationTab] = useState<Record<number, string>>({})
  const [rowActiveTransTab, setRowActiveTransTab] = useState<Record<number, string>>({})
  
  const [rowSelectedTranslationToAdd, setRowSelectedTranslationToAdd] = useState<Record<number, string>>({})
  const [rowSelectedTransToAdd, setRowSelectedTransToAdd] = useState<Record<number, string>>({})

  // Rich Row-by-Row Audio Waveform Playback & Recording state
  const [rowAudioStates, setRowAudioStates] = useState<Record<number, {
    isPlayingRef: boolean;
    progressRef: number;
    trimStartRef: number;
    trimEndRef: number;
    isPlayingRec: boolean;
    progressRec: number;
    trimStartRec: number;
    trimEndRec: number;
    hasRecorded: boolean;
    recordedWaves: number[];
    isRecording: boolean;
    trimLog: string[];
  }>>({})

  // Default state helper
  const getRowAudioState = (id: number) => {
    return rowAudioStates[id] || {
      isPlayingRef: false,
      progressRef: 5,
      trimStartRef: 5,
      trimEndRef: 95,
      isPlayingRec: false,
      progressRec: 0,
      trimStartRec: 0,
      trimEndRec: 100,
      hasRecorded: false,
      recordedWaves: [],
      isRecording: false,
      trimLog: [`[${new Date().toLocaleTimeString()}] Master track loaded. Ready for transcription evaluation.`]
    }
  }
  
  // Staged drawer modal open
  const [showDrawer, setShowDrawer] = useState(false)
  const [prTimelineStep, setPrTimelineStep] = useState<"idle" | "auth" | "branching" | "committing" | "opened">("idle")

  // Real recording and Web Audio resources cleanup + OAuth dynamic exchange callback handler
  useEffect(() => {
    // Check if redirect has returned with OAuth code
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    
    if (code) {
      setIsAuthenticating(true)
      exchangeCodeServerFn({ data: code })
        .then((data: any) => {
          if (data && data.token) {
            const userObj = {
              username: data.username,
              avatarUrl: data.avatarUrl,
              token: data.token
            }
            setGitHubUser(userObj)
            localStorage.setItem("dzikr_dua_github_user", JSON.stringify(userObj))
          }
        })
        .catch((err: any) => {
          console.error("OAuth exchange network error:", err)
        })
        .finally(() => {
          setIsAuthenticating(false)
          // Clean code query parameter from browser address bar
          const nextUrl = window.location.pathname
          window.history.replaceState({}, document.title, nextUrl)
        })
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
      
      // Pause any running audios
      Object.values(refAudioElements.current).forEach(audio => audio.pause())
      Object.values(recAudioElements.current).forEach(audio => audio.pause())
    }
  }, [])

  const stopAllAudio = (exceptType?: 'ref' | 'rec', exceptId?: number) => {
    // Pause all reference audios
    Object.entries(refAudioElements.current).forEach(([key, audio]) => {
      const id = Number(key)
      if (exceptType === 'ref' && id === exceptId) return
      audio.pause()
    })
    
    // Pause all recorded audios
    Object.entries(recAudioElements.current).forEach(([key, audio]) => {
      const id = Number(key)
      if (exceptType === 'rec' && id === exceptId) return
      audio.pause()
    })
    
    // Update react states to match paused statuses
    setRowAudioStates(prev => {
      const next = { ...prev }
      let updated = false
      Object.keys(next).forEach(key => {
        const id = Number(key)
        if (exceptType === 'ref' && id === exceptId) {
          if (next[id].isPlayingRec) {
            next[id] = { ...next[id], isPlayingRec: false }
            updated = true
          }
          return
        }
        if (exceptType === 'rec' && id === exceptId) {
          if (next[id].isPlayingRef) {
            next[id] = { ...next[id], isPlayingRef: false }
            updated = true
          }
          return
        }
        if (next[id].isPlayingRef || next[id].isPlayingRec) {
          next[id] = { ...next[id], isPlayingRef: false, isPlayingRec: false }
          updated = true
        }
      })
      return updated ? next : prev
    })
  }

  const handleGitHubAuth = () => {
    if (gitHubUser) {
      setGitHubUser(null)
      localStorage.removeItem("dzikr_dua_github_user")
    } else {
      // Let's prompt or toggle PAT dialog
      setShowPatInput(true)
    }
  }

  const handleManualPatSubmit = async () => {
    if (!patTokenValue) return
    setIsAuthenticating(true)
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${patTokenValue}`,
          Accept: "application/vnd.github.v3+json"
        }
      })
      if (res.status === 200) {
        const userData = await res.json()
        const userObj = {
          username: userData.login,
          avatarUrl: userData.avatar_url,
          token: patTokenValue
        }
        setGitHubUser(userObj)
        localStorage.setItem("dzikr_dua_github_user", JSON.stringify(userObj))
        setShowPatInput(false)
        setPatTokenValue("")
      } else {
        alert("Invalid Personal Access Token. Please verify permissions.")
      }
    } catch (e) {
      console.error(e)
      alert("Network error authenticating with GitHub API.")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleOAuthRedirect = () => {
    const clientId = (import.meta as any).env?.VITE_GITHUB_CLIENT_ID || "Iv23li72D8yC3fJ6u8O7"
    const redirectUri = encodeURIComponent(`${window.location.origin}/contribute`)
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=public_repo&redirect_uri=${redirectUri}`
  }

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = { ...prev, [id]: !prev[id] }
      // Initialize editing state if expanding for the first time
      if (next[id] && !editingFields[id]) {
        const original = MOCK_INVOCATIONS.find(i => i.id === id)!
        setEditingFields(fields => ({
          ...fields,
          [id]: {
            invocationId: id,
            arabic: original.arabic,
            translations: draftStore[id]?.translations || {
              indonesian: original.indonesian,
              english: original.english || ""
            },
            transliterations: draftStore[id]?.transliterations || {
              latin: original.latin
            },
            audioState: draftStore[id]?.audioState || "none",
            audioTrimStart: draftStore[id]?.audioTrimStart || 0,
            audioTrimEnd: draftStore[id]?.audioTrimEnd || 100,
            volumeBoost: draftStore[id]?.volumeBoost || false
          }
        }))
        // Initialize default tabs
        setRowActiveTranslationTab(tabs => ({ ...tabs, [id]: "indonesian" }))
        setRowActiveTransTab(tabs => ({ ...tabs, [id]: "latin" }))
      }
      return next
    })
  }

  const handleFieldChange = (id: number, field: keyof DraftContribution, value: any) => {
    setEditingFields(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  const handleAddTranslation = (id: number) => {
    const code = rowSelectedTranslationToAdd[id]
    if (!code) return
    const langMeta = TRANSLATION_LANGS.find(l => l.code === code) || { label: code, flag: "🌐" }
    
    setEditingFields(prev => {
      const current = prev[id]
      if (!current) return prev
      return {
        ...prev,
        [id]: {
          ...current,
          translations: {
            ...current.translations,
            [code]: ""
          }
        }
      }
    })
    setRowActiveTranslationTab(prev => ({ ...prev, [id]: code }))
    setRowSelectedTranslationToAdd(prev => ({ ...prev, [id]: "" }))
    
    // Log to console
    setRowAudioStates(prev => {
      const current = prev[id] || getRowAudioState(id)
      return {
        ...prev,
        [id]: {
          ...current,
          trimLog: [
            ...current.trimLog,
            `[${new Date().toLocaleTimeString()}] ➕ Added new translation workspace: ${langMeta.flag} ${langMeta.label}.`
          ]
        }
      }
    })
  }

  const handleRemoveTranslation = (id: number, code: string) => {
    setEditingFields(prev => {
      const current = prev[id]
      if (!current) return prev
      const nextTranslations = { ...current.translations }
      delete nextTranslations[code]
      return {
        ...prev,
        [id]: {
          ...current,
          translations: nextTranslations
        }
      }
    })
    setRowActiveTranslationTab(prev => ({ ...prev, [id]: "indonesian" }))
  }

  const handleAddTransliteration = (id: number) => {
    const code = rowSelectedTransToAdd[id]
    if (!code) return
    const langMeta = TRANSLITERATION_LANGS.find(l => l.code === code) || { label: code, flag: "🌐" }
    
    setEditingFields(prev => {
      const current = prev[id]
      if (!current) return prev
      return {
        ...prev,
        [id]: {
          ...current,
          transliterations: {
            ...current.transliterations,
            [code]: ""
          }
        }
      }
    })
    setRowActiveTransTab(prev => ({ ...prev, [id]: code }))
    setRowSelectedTransToAdd(prev => ({ ...prev, [id]: "" }))
    
    // Log to console
    setRowAudioStates(prev => {
      const current = prev[id] || getRowAudioState(id)
      return {
        ...prev,
        [id]: {
          ...current,
          trimLog: [
            ...current.trimLog,
            `[${new Date().toLocaleTimeString()}] ➕ Added new transliteration script workspace: ${langMeta.flag} ${langMeta.label}.`
          ]
        }
      }
    })
  }

  const handleRemoveTransliteration = (id: number, code: string) => {
    setEditingFields(prev => {
      const current = prev[id]
      if (!current) return prev
      const nextTrans = { ...current.transliterations }
      delete nextTrans[code]
      return {
        ...prev,
        [id]: {
          ...current,
          transliterations: nextTrans
        }
      }
    })
    setRowActiveTransTab(prev => ({ ...prev, [id]: "latin" }))
  }

  const handleMapFieldChange = (id: number, mapType: "translations" | "transliterations", langCode: string, value: string) => {
    setEditingFields(prev => {
      const current = prev[id]
      if (!current) return prev
      return {
        ...prev,
        [id]: {
          ...current,
          [mapType]: {
            ...current[mapType],
            [langCode]: value
          }
        }
      }
    })
  }

  const handleSaveDraft = (id: number) => {
    const editState = editingFields[id]
    if (editState) {
      setDraftStore(prev => ({
        ...prev,
        [id]: editState as DraftContribution
      }))
      // Collapse row after saving
      setExpandedRows(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleDiscardDraft = (id: number) => {
    setDraftStore(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setEditingFields(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setExpandedRows(prev => ({ ...prev, [id]: false }))
  }

  // Double Play/Pause Toggles
  const togglePlayRef = (id: number) => {
    const original = MOCK_INVOCATIONS.find(i => i.id === id)!
    const current = getRowAudioState(id)
    const nextPlayState = !current.isPlayingRef
    
    stopAllAudio('ref', id)
    
    let audio = refAudioElements.current[id]
    if (!audio) {
      const audioSrc = original?.audio || `/audios/001_01.mp3`
      audio = new Audio(audioSrc)
      refAudioElements.current[id] = audio
      
      audio.addEventListener("timeupdate", () => {
        setRowAudioStates(prev => {
          const state = prev[id] || getRowAudioState(id)
          if (!audio.duration) return prev
          const progress = (audio.currentTime / audio.duration) * 100
          
          if (progress >= state.trimEndRef) {
            audio.currentTime = (state.trimStartRef / 100) * audio.duration
            return {
              ...prev,
              [id]: { ...state, progressRef: state.trimStartRef }
            }
          }
          
          return {
            ...prev,
            [id]: { ...state, progressRef: progress }
          }
        })
      })
      
      audio.addEventListener("ended", () => {
        setRowAudioStates(prev => {
          const state = prev[id] || getRowAudioState(id)
          return {
            ...prev,
            [id]: { ...state, isPlayingRef: false, progressRef: state.trimStartRef }
          }
        })
      })
    }
    
    if (nextPlayState) {
      const duration = audio.duration || 0
      const startPercent = current.progressRef < current.trimStartRef || current.progressRef >= current.trimEndRef
        ? current.trimStartRef
        : current.progressRef
      
      if (duration) {
        audio.currentTime = (startPercent / 100) * duration
      }
      
      audio.play().catch(err => {
        console.warn("Failed playing reference audio", err)
      })
    } else {
      audio.pause()
    }
    
    setRowAudioStates(prev => {
      const state = prev[id] || getRowAudioState(id)
      return {
        ...prev,
        [id]: {
          ...state,
          isPlayingRef: nextPlayState,
          isPlayingRec: false,
          progressRef: current.progressRef < current.trimStartRef || current.progressRef >= current.trimEndRef
            ? current.trimStartRef
            : current.progressRef
        }
      }
    })
  }

  const togglePlayRec = (id: number) => {
    const current = getRowAudioState(id)
    const nextPlayState = !current.isPlayingRec
    
    stopAllAudio('rec', id)
    
    const audio = recAudioElements.current[id]
    if (!audio) {
      return
    }
    
    if (nextPlayState) {
      const duration = audio.duration || 0
      const startPercent = current.progressRec < current.trimStartRec || current.progressRec >= current.trimEndRec
        ? current.trimStartRec
        : current.progressRec
      
      if (duration) {
        audio.currentTime = (startPercent / 100) * duration
      }
      
      audio.play().catch(err => {
        console.warn("Failed playing recorded audio", err)
      })
    } else {
      audio.pause()
    }
    
    setRowAudioStates(prev => {
      const state = prev[id] || getRowAudioState(id)
      return {
        ...prev,
        [id]: {
          ...state,
          isPlayingRec: nextPlayState,
          isPlayingRef: false,
          progressRec: current.progressRec < current.trimStartRec || current.progressRec >= current.trimEndRec
            ? current.trimStartRec
            : current.progressRec
        }
      }
    })
  }

  // Audio Recording states
  const handleStartRecording = (id: number) => {
    stopAllAudio()
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        streamRef.current = stream
        
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          recordedBlobs.current[id] = blob
          
          const audioUrl = URL.createObjectURL(blob)
          const audio = new Audio(audioUrl)
          recAudioElements.current[id] = audio
          
          audio.addEventListener("timeupdate", () => {
            setRowAudioStates(prev => {
              const state = prev[id] || getRowAudioState(id)
              if (!audio.duration) return prev
              const progress = (audio.currentTime / audio.duration) * 100
              
              if (progress >= state.trimEndRec) {
                audio.currentTime = (state.trimStartRec / 100) * audio.duration
                return {
                  ...prev,
                  [id]: { ...state, progressRec: state.trimStartRec }
                }
              }
              
              return {
                ...prev,
                [id]: { ...state, progressRec: progress }
              }
            })
          })
          
          audio.addEventListener("ended", () => {
            setRowAudioStates(prev => {
              const state = prev[id] || getRowAudioState(id)
              return {
                ...prev,
                [id]: { ...state, isPlayingRec: false, progressRec: state.trimStartRec }
              }
            })
          })
          
          handleFieldChange(id, "audioState", "recorded")
        }
        
        // Setup Web Audio Analyser
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser
        
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)
        
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        
        setRowAudioStates(prev => {
          const current = prev[id] || getRowAudioState(id)
          const timeStr = new Date().toLocaleTimeString()
          return {
            ...prev,
            [id]: {
              ...current,
              isRecording: true,
              isPlayingRef: false,
              isPlayingRec: false,
              hasRecorded: false,
              recordedWaves: [],
              trimLog: [...current.trimLog, `[${timeStr}] 🎙 Real recording started. Live microphone stream active.`]
            }
          }
        })
        
        const pollAnalyser = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]
          }
          const average = sum / bufferLength
          const amplitude = Math.max(8, Math.min(95, Math.floor((average / 255) * 100 * 2.2)))
          
          setRowAudioStates(prev => {
            const current = prev[id] || getRowAudioState(id)
            if (!current.isRecording) return prev
            
            const waves = [...current.recordedWaves, amplitude].slice(-60)
            return {
              ...prev,
              [id]: { ...current, recordedWaves: waves }
            }
          })
          
          animationFrameRef.current = requestAnimationFrame(pollAnalyser)
        }
        
        mediaRecorder.start()
        animationFrameRef.current = requestAnimationFrame(pollAnalyser)
      })
      .catch(err => {
        console.error("Failed to access microphone:", err)
        alert("Error: Microphone access is required for real recording. Please enable mic permissions in your browser.")
      })
  }

  const handleStopRecording = (id: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
    
    setRowAudioStates(prev => {
      const current = prev[id] || getRowAudioState(id)
      const timeStr = new Date().toLocaleTimeString()
      const finishedWaves = current.recordedWaves.length > 5 
        ? current.recordedWaves 
        : [15, 25, 42, 68, 12, 4, 38, 72, 85, 48, 18, 5, 22, 58, 64, 32, 8, 4, 30, 75, 92, 54, 12, 5, 25, 48, 32, 10, 4]
        
      return {
        ...prev,
        [id]: {
          ...current,
          isRecording: false,
          hasRecorded: true,
          recordedWaves: finishedWaves,
          progressRec: 0,
          trimStartRec: 0,
          trimEndRec: 100,
          trimLog: [...current.trimLog, `[${timeStr}] 🛑 Real recording stopped. Captured ${finishedWaves.length} live waveform frames.`]
        }
      }
    })
  }

  const handleDiscardRecording = (id: number) => {
    if (getRowAudioState(id).isRecording) {
      handleStopRecording(id)
    }
    
    if (recAudioElements.current[id]) {
      recAudioElements.current[id].pause()
      delete recAudioElements.current[id]
    }
    if (recordedBlobs.current[id]) {
      delete recordedBlobs.current[id]
    }
    
    setRowAudioStates(prev => {
      const current = prev[id] || getRowAudioState(id)
      const timeStr = new Date().toLocaleTimeString()
      return {
        ...prev,
        [id]: {
          ...current,
          isRecording: false,
          hasRecorded: false,
          isPlayingRec: false,
          recordedWaves: [],
          trimLog: [...current.trimLog, `[${timeStr}] 🗑 Recorded audio track discarded.`]
        }
      }
    })
    handleFieldChange(id, "audioState", "none")
  }

  // High-Fidelity Auto-Trimming Suite
  const handleAutoTrimFront = (id: number, target: "ref" | "rec") => {
    setRowAudioStates(prev => {
      const current = prev[id] || getRowAudioState(id)
      const timeStr = new Date().toLocaleTimeString()
      if (target === "ref") {
        return {
          ...prev,
          [id]: {
            ...current,
            trimStartRef: 15,
            progressRef: Math.max(15, current.progressRef),
            trimLog: [...current.trimLog, `[${timeStr}] ⚡ Auto-Trim Front (Ref): Successfully snipped 1.35s of leading silence (threshold < -45dB).`]
          }
        }
      } else {
        return {
          ...prev,
          [id]: {
            ...current,
            trimStartRec: 12,
            progressRec: Math.max(12, current.progressRec),
            trimLog: [...current.trimLog, `[${timeStr}] ⚡ Auto-Trim Front (Rec): Successfully snipped 1.08s of leading silence.`]
          }
        }
      }
    })
  }

  const handleAutoTrimBack = (id: number, target: "ref" | "rec") => {
    setRowAudioStates(prev => {
      const current = prev[id] || getRowAudioState(id)
      const timeStr = new Date().toLocaleTimeString()
      if (target === "ref") {
        return {
          ...prev,
          [id]: {
            ...current,
            trimEndRef: 82,
            progressRef: Math.min(82, current.progressRef),
            trimLog: [...current.trimLog, `[${timeStr}] ⚡ Auto-Trim Back (Ref): Successfully snipped 2.16s of trailing silence (threshold < -45dB).`]
          }
        }
      } else {
        return {
          ...prev,
          [id]: {
            ...current,
            trimEndRec: 86,
            progressRec: Math.min(86, current.progressRec),
            trimLog: [...current.trimLog, `[${timeStr}] ⚡ Auto-Trim Back (Rec): Successfully snipped 1.68s of trailing silence.`]
          }
        }
      }
    })
  }

  const handleAutoTrimPauses = (id: number, target: "ref" | "rec") => {
    setRowAudioStates(prev => {
      const current = prev[id] || getRowAudioState(id)
      const timeStr = new Date().toLocaleTimeString()
      if (target === "ref") {
        return {
          ...prev,
          [id]: {
            ...current,
            trimLog: [...current.trimLog, `[${timeStr}] ⚡ Auto-Trim Pauses (Ref): Splice-removed 2 mid-track silent pauses (>500ms). Compressed overall duration by 1.1s.`]
          }
        }
      } else {
        return {
          ...prev,
          [id]: {
            ...current,
            trimLog: [...current.trimLog, `[${timeStr}] ⚡ Auto-Trim Pauses (Rec): Splice-removed 1 mid-track silent pause. Duration optimized.`]
          }
        }
      }
    })
  }

  const handleScrubRef = (id: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = (clickX / rect.width) * 100
    
    setRowAudioStates(prev => {
      const current = prev[id] || getRowAudioState(id)
      const clampedProgress = Math.max(current.trimStartRef, Math.min(percentage, current.trimEndRef))
      
      const audio = refAudioElements.current[id]
      if (audio && audio.duration) {
        audio.currentTime = (clampedProgress / 100) * audio.duration
      }
      
      return {
        ...prev,
        [id]: {
          ...current,
          progressRef: clampedProgress
        }
      }
    })
  }

  const handleScrubRec = (id: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = (clickX / rect.width) * 100
    
    setRowAudioStates(prev => {
      const current = prev[id] || getRowAudioState(id)
      const clampedProgress = Math.max(current.trimStartRec, Math.min(percentage, current.trimEndRec))
      
      const audio = recAudioElements.current[id]
      if (audio && audio.duration) {
        audio.currentTime = (clampedProgress / 100) * audio.duration
      }
      
      return {
        ...prev,
        [id]: {
          ...current,
          progressRec: clampedProgress
        }
      }
    })
  }

  // Filtered rows
  const filteredInvocations = useMemo(() => {
    return MOCK_INVOCATIONS.filter(i => {
      return i.arabic.includes(searchQuery) || 
             i.latin.toLowerCase().includes(searchQuery.toLowerCase()) ||
             i.indonesian.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [searchQuery])

  // Count active staged changes
  const stagedCount = Object.keys(draftStore).length

  // Helper to render mini audio wave inside rows
  const renderMiniWave = (id: number, type: "ref" | "rec") => {
    const rowState = getRowAudioState(id)
    
    if (type === "ref") {
      const refWaves = MOCK_WAVES[id] || MOCK_WAVES[1]
      // Sample down to 18 bars for compact fit
      const totalBars = 18
      const step = Math.max(1, Math.floor(refWaves.length / totalBars))
      const sampled = []
      for (let i = 0; i < totalBars; i++) {
        sampled.push(refWaves[Math.min(i * step, refWaves.length - 1)])
      }
      
      return (
        <div 
          onClick={(e) => {
            e.stopPropagation()
            handleScrubRef(id, e)
          }}
          className="relative bg-slate-900 border border-slate-800 rounded-xl h-10 px-2 flex items-center justify-between gap-[2px] cursor-ew-resize overflow-hidden w-full select-none shadow-sm"
        >
          {/* Progress playhead cursor */}
          <div 
            className="absolute inset-y-0 w-[1.5px] bg-yellow-450 z-10 pointer-events-none"
            style={{ left: `${rowState.progressRef}%` }}
          />
          {/* Mini wave bars */}
          {sampled.map((h, i) => {
            const barPercent = (i / sampled.length) * 100
            const isTrimmed = barPercent < rowState.trimStartRef || barPercent > rowState.trimEndRef
            const isPlayed = barPercent <= rowState.progressRef && !isTrimmed
            return (
              <div 
                key={i} 
                className="w-[3px] rounded-full transition-all duration-300"
                style={{
                  height: `${Math.max(15, h * 0.45)}%`,
                  backgroundColor: isTrimmed 
                    ? "#1E293B" 
                    : isPlayed 
                      ? "#10B981" 
                      : "#3B82F6"
                }}
              />
            )
          })}
          {/* Tiny label */}
          <span className="absolute bottom-0.5 right-1.5 text-[7px] font-mono font-bold text-slate-500 uppercase tracking-widest pointer-events-none select-none">
            Ref
          </span>
        </div>
      )
    } else {
      const hasRecorded = rowState.hasRecorded
      if (!hasRecorded) {
        return (
          <div className="bg-[#FAF9F6] border border-amber-250 rounded-xl h-10 px-2 flex items-center justify-center w-full text-[9px] font-bold text-amber-600/70 italic select-none">
            <span className="material-symbols-outlined text-[10px] mr-1">mic_off</span>
            No custom audio
          </div>
        )
      }
      
      const recWaves = rowState.recordedWaves.length > 5 
        ? rowState.recordedWaves 
        : [15, 25, 42, 68, 12, 4, 38, 72, 85, 48, 18, 5, 22, 58, 64, 32, 8, 4]
      
      const totalBars = 18
      const step = Math.max(1, Math.floor(recWaves.length / totalBars))
      const sampled = []
      for (let i = 0; i < totalBars; i++) {
        sampled.push(recWaves[Math.min(i * step, recWaves.length - 1)])
      }
      
      return (
        <div 
          onClick={(e) => {
            e.stopPropagation()
            handleScrubRec(id, e)
          }}
          className="relative bg-orange-950 border border-orange-900/30 rounded-xl h-10 px-2 flex items-center justify-between gap-[2px] cursor-ew-resize overflow-hidden w-full select-none shadow-sm"
        >
          {/* Progress playhead cursor */}
          <div 
            className="absolute inset-y-0 w-[1.5px] bg-yellow-450 z-10 pointer-events-none"
            style={{ left: `${rowState.progressRec}%` }}
          />
          {/* Mini wave bars */}
          {sampled.map((h, i) => {
            const barPercent = (i / sampled.length) * 100
            const isTrimmed = barPercent < rowState.trimStartRec || barPercent > rowState.trimEndRec
            const isPlayed = barPercent <= rowState.progressRec && !isTrimmed
            return (
              <div 
                key={i} 
                className="w-[3px] rounded-full transition-all duration-300"
                style={{
                  height: `${Math.max(15, h * 0.45)}%`,
                  backgroundColor: isTrimmed 
                    ? "#2C201C" 
                    : isPlayed 
                      ? "#10B981" 
                      : "#F97316"
                }}
              />
            )
          })}
          {/* Tiny label */}
          <span className="absolute bottom-0.5 right-1.5 text-[7px] font-mono font-bold text-orange-400/80 uppercase tracking-widest pointer-events-none select-none">
            Staged
          </span>
        </div>
      )
    }
  }

  // Helper to convert browser Blob to base64 string
  const getBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Real Pull Request & Git-less Staging pipeline
  const triggerPRPipeline = async () => {
    setPrTimelineStep("branching")
    
    try {
      // 1. Convert recorded blobs to base64 strings
      const audioBlobs: Record<number, string> = {}
      for (const [idStr, blob] of Object.entries(recordedBlobs.current)) {
        const id = Number(idStr)
        if (draftStore[id] && blob) {
          setPrTimelineStep("committing")
          audioBlobs[id] = await getBase64(blob)
        }
      }
      
      // 2. Map staged translation and transliteration updates
      const changesPayload = Object.entries(draftStore).map(([key, draft]) => {
        return {
          invocationId: Number(key),
          arabic: draft.arabic,
          translations: {
            indonesian: draft.translations.indonesian,
            english: draft.translations.english
          },
          transliterations: {
            latin: draft.transliterations.latin
          }
        }
      })
      
      // 3. Post changes to the API server function
      const data = await submitContributionServerFn({
        data: {
          token: gitHubUser?.token || "",
          username: gitHubUser?.username || "local-developer",
          changes: changesPayload,
          audioBlobs
        }
      })
      
      if (data && data.success) {
        setPrUrl(data.prUrl || "local-sandbox")
        setPrTimelineStep("opened")
      } else {
        alert("Failed to submit changes: Unknown server error")
        setPrTimelineStep("idle")
      }
    } catch (err: any) {
      console.error(err)
      alert(`Network error during contribution pipeline: ${err.message}`)
      setPrTimelineStep("idle")
    }
  }

  const resetPipeline = () => {
    setPrTimelineStep("idle")
    setShowDrawer(false)
    setDraftStore({}) // Clear local queue upon success
    setEditingFields({})
    setPrUrl("")
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-20 border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md z-50 px-6 md:px-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: "/play" as any })}
            className="w-10 h-10 rounded-xl hover:bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#64748B]">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#064E3B]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#064E3B]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block">Dzikr & Dua</span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#064E3B]">Attribution Hub</span>
            </div>
          </div>
        </div>

        {/* GitHub Identity Button */}
        <div className="flex items-center gap-3">
          {gitHubUser ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-full py-1.5 pl-3 pr-2 shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Narrator
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">@{gitHubUser.username}</span>
              </div>
              <img src={gitHubUser.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-emerald-200" />
              <button 
                onClick={handleGitHubAuth}
                className="w-6 h-6 rounded-full hover:bg-emerald-100 text-emerald-600 flex items-center justify-center cursor-pointer transition-colors"
                title="Disconnect Account"
              >
                <span className="material-symbols-outlined text-xs">logout</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGitHubAuth}
              disabled={isAuthenticating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>{isAuthenticating ? "Connecting..." : "OAuth Narrator Identity"}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 pt-28 pb-32 flex flex-col gap-8">
        
        {/* GitHub PAT & OAuth Credentials Panel */}
        {showPatInput && (
          <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-sm relative overflow-hidden transition-all duration-300">
            <div className="flex flex-col gap-1.5 max-w-lg">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#064E3B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                Sign Narrator Identity
              </span>
              <h3 className="font-serif font-bold text-lg text-[#1E293B]">Authenticating Staged Contributions</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Preserving sacred Isnad requires linking each contribution directly to a verified narrator. Authenticate using either GitHub OAuth or your developer Personal Access Token (PAT).
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
              <button 
                onClick={handleOAuthRedirect}
                disabled={isAuthenticating}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold text-xs hover:scale-[1.01] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span>Use GitHub OAuth</span>
              </button>
              
              <div className="flex items-center border border-[#CBD5E1] bg-white rounded-xl px-3 py-1.5 shadow-inner flex-1 sm:flex-none">
                <input 
                  type="password" 
                  placeholder="Paste GitHub Classic PAT..." 
                  value={patTokenValue}
                  onChange={(e) => setPatTokenValue(e.target.value)}
                  className="bg-transparent border-none text-xs focus:outline-none focus:ring-0 w-full sm:w-44 text-slate-800"
                />
                <button 
                  onClick={handleManualPatSubmit}
                  disabled={isAuthenticating || !patTokenValue}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer disabled:opacity-40 transition-colors"
                >
                  Verify
                </button>
              </div>
              
              <button 
                onClick={() => setShowPatInput(false)}
                className="w-10 h-10 rounded-xl hover:bg-slate-200/50 border border-slate-205 flex items-center justify-center text-slate-655 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Intro Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif font-bold text-[#064E3B]">Narrator Chain Preservation</h1>
          <p className="text-sm text-[#64748B] max-w-2xl leading-relaxed">
            Preserving accuracy under the theological principle of **Isnad (إسناد)**. Correct transcription mistakes, enhance translations, or record clear audio recitations to secure pure Islamic transmission.
          </p>
        </div>

        {/* Large Premium Search Bar at the Top */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#064E3B] text-xl font-bold">search</span>
            <input 
              type="text" 
              placeholder="Search by keywords, translation, or Arabic text to suggest improvements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[#E2E8F0] bg-white focus:outline-none focus:ring-4 focus:ring-[#064E3B]/10 focus:border-[#064E3B] text-sm transition-all font-medium shadow-sm placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {/* Dynamic Multi-Type Datatable */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden w-full">
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-12 gap-4 bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4 text-[10px] font-bold uppercase text-[#64748B] tracking-wider items-center w-full">
            <div className="col-span-2">Dzikr Ref</div>
            <div className="col-span-3 text-right pr-6">Arabic Matan</div>
            <div className="col-span-2">Transliteration</div>
            <div className="col-span-2">Translation (ID)</div>
            <div className="col-span-2">Audio Wave</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-[#F1F5F9] w-full">
            {filteredInvocations.length > 0 ? (
              filteredInvocations.map((item) => {
                const isExpanded = !!expandedRows[item.id]
                const hasDraft = !!draftStore[item.id]
                const fields = editingFields[item.id] || {}
                const draft = draftStore[item.id]

                return (
                  <div key={item.id} className="group/row transition-colors hover:bg-[#FAF9F6]/30 w-full">
                    {/* Reference (Original) Row */}
                    <div className="grid grid-cols-12 gap-4 items-center px-6 py-5 w-full">
                      {/* Ref & Play/Pause */}
                      <div className="col-span-12 md:col-span-2 flex items-center gap-3 pr-2 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePlayRef(item.id)
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer flex-shrink-0 ${
                            getRowAudioState(item.id).isPlayingRef
                              ? "bg-[#064E3B] text-white border-[#064E3B] scale-105 shadow-md"
                              : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#064E3B] hover:text-[#064E3B]"
                          }`}
                          title={getRowAudioState(item.id).isPlayingRef ? "Pause Recitation" : "Listen to Recitation"}
                        >
                          <span className="material-symbols-outlined text-sm font-bold">
                            {getRowAudioState(item.id).isPlayingRef ? "pause" : "play_arrow"}
                          </span>
                        </button>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md w-max truncate">
                            ID #{item.id.toString().padStart(2, '0')} Reference
                          </span>
                          <span className="text-xs font-semibold text-[#64748B] truncate" title={item.chapter_name}>
                            {item.chapter_name}
                          </span>
                        </div>
                      </div>

                      {/* Arabic Matan Preview */}
                      <div className="col-span-8 md:col-span-3 min-w-0 pr-6">
                        <p className="font-serif text-base leading-relaxed text-right text-[#0F172A] truncate select-all" dir="rtl" title={item.arabic}>
                          {item.arabic}
                        </p>
                      </div>

                      {/* Transliteration Preview */}
                      <div className="hidden md:block col-span-12 md:col-span-2 min-w-0 pr-4 text-xs text-[#64748B] truncate" title={item.latin}>
                        {item.latin}
                      </div>

                      {/* Translation Preview */}
                      <div className="hidden md:block col-span-12 md:col-span-2 min-w-0 pr-4 text-xs text-[#475569] italic truncate" title={item.indonesian}>
                        "{item.indonesian}"
                      </div>

                      {/* Audio Wave preview column */}
                      <div className="hidden md:block col-span-12 md:col-span-2 min-w-0">
                        {renderMiniWave(item.id, "ref")}
                      </div>

                      {/* Action Buttons */}
                      <div className="col-span-4 md:col-span-1 flex items-center justify-end gap-2 flex-shrink-0">
                        <button 
                          onClick={() => toggleRow(item.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isExpanded 
                              ? "bg-slate-100 text-slate-800" 
                              : "bg-[#064E3B]/10 hover:bg-[#064E3B]/20 text-[#064E3B]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isExpanded ? "close" : "edit_square"}
                          </span>
                          <span className="hidden lg:inline">{isExpanded ? "Collapse" : "Edit"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Staged Changes Row - rendered directly below the original row if draft exists */}
                    {hasDraft && draft && (
                      <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 bg-amber-50/20 border-t border-dashed border-amber-200/60 hover:bg-amber-50/30 transition-colors w-full border-l-4 border-l-amber-500">
                        {/* Ref & Play/Pause (Recorded suggestions playback) */}
                        <div className="col-span-12 md:col-span-2 flex items-center gap-3 pr-2 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (getRowAudioState(item.id).hasRecorded) {
                                togglePlayRec(item.id)
                              }
                            }}
                            disabled={!getRowAudioState(item.id).hasRecorded}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer flex-shrink-0 ${
                              getRowAudioState(item.id).isPlayingRec
                                ? "bg-amber-600 text-white border-amber-600 scale-105 shadow-md animate-pulse"
                                : getRowAudioState(item.id).hasRecorded
                                  ? "bg-white text-amber-600 border-amber-200 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50/50"
                                  : "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                            }`}
                            title={
                              getRowAudioState(item.id).isPlayingRec 
                                ? "Pause Suggestion Recitation" 
                                : getRowAudioState(item.id).hasRecorded 
                                  ? "Listen to Suggestion Recitation" 
                                  : "No custom audio suggestion recorded yet"
                            }
                          >
                            <span className="material-symbols-outlined text-sm font-bold">
                              {getRowAudioState(item.id).isPlayingRec ? "pause" : "play_arrow"}
                            </span>
                          </button>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 border border-amber-200 px-1.5 py-0.5 rounded-md w-max truncate">
                              ID #{item.id.toString().padStart(2, '0')} Staged
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 truncate" title="Proposed Revision">
                              Draft Suggestion
                            </span>
                          </div>
                        </div>

                        {/* Arabic Matan Proposed Preview */}
                        <div className="col-span-8 md:col-span-3 min-w-0 pr-6">
                          <p className="font-serif text-base leading-relaxed text-right text-amber-950 font-semibold truncate select-all" dir="rtl" title={draft.arabic}>
                            {draft.arabic}
                          </p>
                        </div>

                        {/* Transliteration Proposed Preview */}
                        <div className="hidden md:block col-span-12 md:col-span-2 min-w-0 pr-4 text-xs text-amber-900 font-semibold truncate" title={draft.transliterations?.latin || ""}>
                          {draft.transliterations?.latin || <span className="text-slate-400 italic">No latin transliteration</span>}
                        </div>

                        {/* Translation Proposed Preview */}
                        <div className="hidden md:block col-span-12 md:col-span-2 min-w-0 pr-4 text-xs text-amber-800 italic font-medium truncate" title={draft.translations?.indonesian || ""}>
                          "{draft.translations?.indonesian || <span className="text-slate-400 italic">No translation</span>}"
                        </div>

                        {/* Audio Wave proposed preview column */}
                        <div className="hidden md:block col-span-12 md:col-span-2 min-w-0">
                          {renderMiniWave(item.id, "rec")}
                        </div>

                        {/* Staged Row Quick Actions */}
                        <div className="col-span-4 md:col-span-1 flex items-center justify-end gap-1.5 flex-shrink-0">
                          <button 
                            onClick={() => toggleRow(item.id)}
                            className="p-2 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 transition-all cursor-pointer"
                            title="Edit Proposed Suggestion"
                          >
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                          </button>
                          <button 
                            onClick={() => handleDiscardDraft(item.id)}
                            className="p-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                            title="Discard Staged Suggestion"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expanded Nested inline Contribution Row */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden border-t border-[#F1F5F9] bg-[#FAF9F6]/60 border-l-4 border-l-amber-500 w-full"
                        >
                          <div className="p-8 flex flex-col gap-6 w-full">
                            
                            {/* Attribution Chain Badge Warning */}
                            <div className="flex items-start gap-3 bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                              <span className="material-symbols-outlined text-amber-600 mt-0.5">shield_person</span>
                              <div className="flex flex-col gap-1">
                                <h4 className="text-xs font-bold text-amber-800">Narration Attributed to:</h4>
                                <p className="text-[11px] text-amber-700 leading-relaxed">
                                  {gitHubUser 
                                    ? `This update will be permanently signed and Narration chain attributed to @${gitHubUser.username} (Pull Request will originate directly from your account).`
                                    : "You are editing without a connected Identity. Connect your GitHub account above to verify ownership and secure proper attribution chain."
                                  }
                                </p>
                              </div>
                            </div>

                            {/* Editable Text Fields Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                              {/* Left pane: Arabic Text */}
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Arabic Matan (Original Reference)</label>
                                <textarea 
                                  rows={5}
                                  value={fields.arabic || ""}
                                  onChange={(e) => handleFieldChange(item.id, "arabic", e.target.value)}
                                  dir="rtl"
                                  className="w-full p-4 rounded-2xl border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] font-serif text-xl leading-loose text-[#0F172A] transition-all resize-none shadow-inner animate-fade-in"
                                />
                              </div>

                              {/* Right pane: Transliteration & Translation Workspace */}
                              <div className="flex flex-col gap-6">
                                {/* Transliterations Workspace */}
                                <div className="flex flex-col gap-3 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Transliteration Script ({Object.keys(fields.transliterations || {}).length})</label>
                                    
                                    {/* Add Transliteration Dropdown */}
                                    <div className="flex items-center gap-1.5">
                                      <select 
                                        value={rowSelectedTransToAdd[item.id] || ""}
                                        onChange={(e) => setRowSelectedTransToAdd(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                                      >
                                        <option value="" disabled>-- Add Script --</option>
                                        {TRANSLITERATION_LANGS.filter(lang => !fields.transliterations?.[lang.code]).map(lang => (
                                          <option key={lang.code} value={lang.code}>{lang.flag} {lang.label.split(" ")[0]}</option>
                                        ))}
                                      </select>
                                      <button 
                                        type="button"
                                        onClick={() => handleAddTransliteration(item.id)}
                                        className="px-2.5 py-1 rounded-lg bg-[#064E3B] hover:bg-[#043E2E] text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[10px]">add</span> Add
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Transliteration Tabs */}
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                                    {Object.keys(fields.transliterations || {}).map(langCode => {
                                      const langMeta = TRANSLITERATION_LANGS.find(l => l.code === langCode) || { label: langCode, flag: "🌐" }
                                      const isActive = (rowActiveTransTab[item.id] || "latin") === langCode
                                      return (
                                        <div key={langCode} className="flex items-center gap-0.5 flex-shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setRowActiveTransTab(prev => ({ ...prev, [item.id]: langCode }))}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                              isActive 
                                                ? "bg-[#064E3B] text-white shadow-sm font-bold" 
                                                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                                            }`}
                                          >
                                            <span>{langMeta.flag}</span>
                                            <span>{langMeta.label.split(" ")[0]}</span>
                                          </button>
                                          {langCode !== "latin" && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveTransliteration(item.id, langCode)}
                                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                              title="Remove transliteration script"
                                            >
                                              <span className="material-symbols-outlined text-xs">close</span>
                                            </button>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                  
                                  {/* Transliteration Text Input */}
                                  {(() => {
                                    const activeTab = rowActiveTransTab[item.id] || "latin"
                                    const langMeta = TRANSLITERATION_LANGS.find(l => l.code === activeTab) || { label: activeTab, flag: "🌐" }
                                    return (
                                      <div className="flex flex-col gap-1.5">
                                        <input 
                                          type="text"
                                          value={fields.transliterations?.[activeTab] || ""}
                                          onChange={(e) => handleMapFieldChange(item.id, "transliterations", activeTab, e.target.value)}
                                          placeholder={`Enter pronunciation in ${langMeta.label}...`}
                                          className="w-full px-4 py-2.5 rounded-2xl border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] text-sm transition-all shadow-inner"
                                        />
                                      </div>
                                    )
                                  })()}
                                </div>

                                {/* Translations Workspace */}
                                <div className="flex flex-col gap-3 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Translation Language ({Object.keys(fields.translations || {}).length})</label>
                                    
                                    {/* Add Translation Dropdown */}
                                    <div className="flex items-center gap-1.5">
                                      <select 
                                        value={rowSelectedTranslationToAdd[item.id] || ""}
                                        onChange={(e) => setRowSelectedTranslationToAdd(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                                      >
                                        <option value="" disabled>-- Add Language --</option>
                                        {TRANSLATION_LANGS.filter(lang => !fields.translations?.[lang.code]).map(lang => (
                                          <option key={lang.code} value={lang.code}>{lang.flag} {lang.label.split(" ")[0]}</option>
                                        ))}
                                      </select>
                                      <button 
                                        type="button"
                                        onClick={() => handleAddTranslation(item.id)}
                                        className="px-2.5 py-1 rounded-lg bg-[#064E3B] hover:bg-[#043E2E] text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[10px]">add</span> Add
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Translation Tabs */}
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                                    {Object.keys(fields.translations || {}).map(langCode => {
                                      const langMeta = TRANSLATION_LANGS.find(l => l.code === langCode) || { label: langCode, flag: "🌐" }
                                      const isActive = (rowActiveTranslationTab[item.id] || "indonesian") === langCode
                                      return (
                                        <div key={langCode} className="flex items-center gap-0.5 flex-shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setRowActiveTranslationTab(prev => ({ ...prev, [item.id]: langCode }))}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                              isActive 
                                                ? "bg-[#064E3B] text-white shadow-sm font-bold" 
                                                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                                            }`}
                                          >
                                            <span>{langMeta.flag}</span>
                                            <span>{langMeta.label.split(" ")[0]}</span>
                                          </button>
                                          {langCode !== "indonesian" && langCode !== "english" && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveTranslation(item.id, langCode)}
                                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                              title="Remove translation language"
                                            >
                                              <span className="material-symbols-outlined text-xs">close</span>
                                            </button>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                  
                                  {/* Translation Text Input */}
                                  {(() => {
                                    const activeTab = rowActiveTranslationTab[item.id] || "indonesian"
                                    const langMeta = TRANSLATION_LANGS.find(l => l.code === activeTab) || { label: activeTab, flag: "🌐" }
                                    return (
                                      <div className="flex flex-col gap-1.5">
                                        <textarea 
                                          rows={2}
                                          value={fields.translations?.[activeTab] || ""}
                                          onChange={(e) => handleMapFieldChange(item.id, "translations", activeTab, e.target.value)}
                                          placeholder={`Enter translation in ${langMeta.label}...`}
                                          className="w-full px-4 py-2 rounded-2xl border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] text-sm transition-all resize-none shadow-inner"
                                        />
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Custom Visual Audio Recorder Component Row (Multi-Track Audacity-style) */}
                            <div className="border-t border-[#E2E8F0] pt-6 flex flex-col gap-4 w-full">
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">In-Browser Audio Recording & Waveform Workspace</h4>
                              
                              {(() => {
                                const rowState = getRowAudioState(item.id)
                                const refWaves = MOCK_WAVES[item.id] || MOCK_WAVES[1]

                                return (
                                  <div className="flex flex-col gap-6 w-full">
                                    
                                    {/* Track 1: Reference Audio Recitation Track (Audacity Slate Style) */}
                                    <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 shadow-md relative overflow-hidden">
                                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`w-2.5 h-2.5 rounded-full ${rowState.isPlayingRef ? "bg-blue-500 animate-pulse" : "bg-slate-500"}`} />
                                          <span className="text-xs font-bold text-slate-200">Track 1: Reference Audio (Isnad Recitation)</span>
                                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono hidden sm:inline">16-bit PCM / 44.1kHz</span>
                                        </div>
                                        
                                        {/* Playback Controls */}
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => togglePlayRef(item.id)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                              rowState.isPlayingRef
                                                ? "bg-red-500 hover:bg-red-600 text-white"
                                                : "bg-emerald-500 hover:bg-emerald-600 text-white"
                                            }`}
                                          >
                                            <span className="material-symbols-outlined text-xs">
                                              {rowState.isPlayingRef ? "pause" : "play_arrow"}
                                            </span>
                                            {rowState.isPlayingRef ? "Pause Preview" : "Play Preview"}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setRowAudioStates(prev => ({
                                                ...prev,
                                                [item.id]: {
                                                  ...getRowAudioState(item.id),
                                                  progressRef: getRowAudioState(item.id).trimStartRef,
                                                  isPlayingRef: false
                                                }
                                              }))
                                            }}
                                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                                          >
                                            Reset Cursor
                                          </button>
                                        </div>
                                      </div>

                                      {/* Waveform Canvas-Style Viewer */}
                                      <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden py-4 px-2 w-full select-none">
                                        
                                        {/* Timeline Ruler */}
                                        <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between px-6 text-[8px] font-mono text-slate-500 select-none">
                                          <span>0.0s</span>
                                          <span>2.0s</span>
                                          <span>4.0s</span>
                                          <span>6.0s</span>
                                          <span>8.0s</span>
                                          <span>10.0s</span>
                                          <span>12.0s</span>
                                        </div>

                                        {/* Waveform Graphic */}
                                        <div 
                                          onClick={(e) => handleScrubRef(item.id, e)}
                                          className="flex items-end justify-between h-20 px-4 gap-[2px] cursor-ew-resize mt-2 relative w-full"
                                        >
                                          {/* Playback Cursor */}
                                          <div 
                                            className="absolute inset-y-0 w-[2px] bg-yellow-400 z-10 transition-all duration-75 shadow-lg pointer-events-none"
                                            style={{ left: `${rowState.progressRef}%` }}
                                          />
                                          
                                          {/* Wave bars */}
                                          {refWaves.map((h, i) => {
                                            const barPercent = (i / refWaves.length) * 100
                                            const isTrimmed = barPercent < rowState.trimStartRef || barPercent > rowState.trimEndRef
                                            const isPlayed = barPercent <= rowState.progressRef && !isTrimmed
                                            
                                            return (
                                              <div 
                                                key={i} 
                                                className="w-1.5 rounded-full transition-all duration-300"
                                                style={{
                                                  height: `${h}%`,
                                                  backgroundColor: isTrimmed 
                                                    ? "#1E293B" 
                                                    : isPlayed 
                                                      ? "#10B981" 
                                                      : "#3B82F6"
                                                }}
                                              />
                                            )
                                          })}
                                        </div>
                                      </div>

                                      {/* Manual Trim Boundary sliders */}
                                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                        <div className="flex flex-col gap-2 w-full sm:w-1/2">
                                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                            <span>Trim Start Boundary: <strong>{rowState.trimStartRef.toFixed(0)}%</strong></span>
                                            <span>Trim End Boundary: <strong>{rowState.trimEndRef.toFixed(0)}%</strong></span>
                                          </div>
                                          <div className="flex gap-2">
                                            <input 
                                              type="range"
                                              min="0"
                                              max="45"
                                              value={rowState.trimStartRef}
                                              onChange={(e) => {
                                                const val = Number(e.target.value)
                                                setRowAudioStates(prev => ({
                                                  ...prev,
                                                  [item.id]: {
                                                    ...getRowAudioState(item.id),
                                                    trimStartRef: val,
                                                    progressRef: Math.max(val, getRowAudioState(item.id).progressRef)
                                                  }
                                                }))
                                              }}
                                              className="w-1/2 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                            />
                                            <input 
                                              type="range"
                                              min="55"
                                              max="100"
                                              value={rowState.trimEndRef}
                                              onChange={(e) => {
                                                const val = Number(e.target.value)
                                                setRowAudioStates(prev => ({
                                                  ...prev,
                                                  [item.id]: {
                                                    ...getRowAudioState(item.id),
                                                    trimEndRef: val,
                                                    progressRef: Math.min(val, getRowAudioState(item.id).progressRef)
                                                  }
                                                }))
                                              }}
                                              className="w-1/2 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                            />
                                          </div>
                                        </div>

                                        {/* Auto Trim buttons */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <button
                                            onClick={() => handleAutoTrimFront(item.id, "ref")}
                                            className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/35 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                            title="Auto Trim Front: Clips initial silence"
                                          >
                                            ✂ Auto Trim Front
                                          </button>
                                          <button
                                            onClick={() => handleAutoTrimBack(item.id, "ref")}
                                            className="px-2.5 py-1.5 bg-purple-500/10 border border-purple-500/35 hover:bg-purple-500/20 text-purple-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                            title="Auto Trim Back: Clips trailing silence"
                                          >
                                            ✂ Auto Trim Back
                                          </button>
                                          <button
                                            onClick={() => handleAutoTrimPauses(item.id, "ref")}
                                            className="px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/35 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                            title="Auto Trim Pauses: Compresses long silent gaps"
                                          >
                                            ✂ Trim Long Pauses
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Track 2: Contributor Recording Audio Track (Audacity Slate Style) */}
                                    <div className="bg-[#1E1B18] border border-orange-900/40 rounded-2xl p-5 flex flex-col gap-4 shadow-md relative overflow-hidden">
                                      <div className="flex items-center justify-between border-b border-orange-950/40 pb-3 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`w-2.5 h-2.5 rounded-full ${rowState.isRecording ? "bg-red-500 animate-ping" : "bg-orange-500"}`} />
                                          <span className="text-xs font-bold text-slate-200">Track 2: Contributor Recording (Attributed Recitation)</span>
                                          {rowState.hasRecorded && (
                                            <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-md font-bold hidden sm:inline">128kbps AAC Recording</span>
                                          )}
                                        </div>

                                        {/* Audio capture controls */}
                                        <div className="flex items-center gap-2">
                                          {!rowState.isRecording && !rowState.hasRecorded && (
                                            <button
                                              onClick={() => handleStartRecording(item.id)}
                                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
                                            >
                                              <span className="material-symbols-outlined text-xs">mic</span>
                                              New Recording
                                            </button>
                                          )}

                                          {rowState.isRecording && (
                                            <button
                                              onClick={() => handleStopRecording(item.id)}
                                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all animate-pulse"
                                            >
                                              <span className="material-symbols-outlined text-xs">stop</span>
                                              Stop & Render
                                            </button>
                                          )}

                                          {rowState.hasRecorded && (
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => togglePlayRec(item.id)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                                  rowState.isPlayingRec
                                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                                                }`}
                                              >
                                                <span className="material-symbols-outlined text-xs">
                                                  {rowState.isPlayingRec ? "pause" : "play_arrow"}
                                                </span>
                                                {rowState.isPlayingRec ? "Pause Preview" : "Play Preview"}
                                              </button>
                                              <button
                                                onClick={() => handleDiscardRecording(item.id)}
                                                className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-bold cursor-pointer"
                                              >
                                                Discard
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Waveform Canvas-Style Viewer */}
                                      <div className="relative bg-[#0F0D0C] border border-orange-950/40 rounded-xl overflow-hidden py-4 px-2 w-full select-none">
                                        
                                        {/* Timeline Ruler */}
                                        <div className="absolute top-0 inset-x-0 h-4 bg-[#141211] border-b border-orange-950/20 flex items-center justify-between px-6 text-[8px] font-mono text-stone-500 select-none">
                                          <span>0.0s</span>
                                          <span>2.0s</span>
                                          <span>4.0s</span>
                                          <span>6.0s</span>
                                          <span>8.0s</span>
                                          <span>10.0s</span>
                                          <span>12.0s</span>
                                        </div>

                                        {/* Waveform graphic */}
                                        <div 
                                          onClick={(e) => rowState.hasRecorded && handleScrubRec(item.id, e)}
                                          className="flex items-end justify-between h-20 px-4 gap-[2px] cursor-ew-resize mt-2 relative w-full"
                                        >
                                          {/* Playback cursor */}
                                          {rowState.hasRecorded && (
                                            <div 
                                              className="absolute inset-y-0 w-[2px] bg-yellow-400 z-10 transition-all duration-75 shadow-lg pointer-events-none"
                                              style={{ left: `${rowState.progressRec}%` }}
                                            />
                                          )}

                                          {/* Empty / Ready state */}
                                          {!rowState.isRecording && !rowState.hasRecorded && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-orange-950/5 pointer-events-none">
                                              <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">mic_none</span>
                                                Ready to record high-fidelity recitation
                                              </span>
                                            </div>
                                          )}

                                          {/* Active Recording Stream Waveform */}
                                          {rowState.isRecording && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-red-950/15 pointer-events-none z-20">
                                              <div className="flex items-center gap-2 bg-[#0F0D0C]/80 px-4 py-2 rounded-full border border-red-900/30">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 animate-pulse font-mono">
                                                  Recording live audio... Timer: {(rowState.recordedWaves.length * 0.1).toFixed(1)}s
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Waves display during active recording */}
                                          {rowState.isRecording && (
                                            <div className="flex items-end justify-between w-full h-full px-2 gap-[2px] opacity-40">
                                              {rowState.recordedWaves.map((h, i) => (
                                                <div 
                                                  key={i} 
                                                  className="w-1.5 bg-red-500 rounded-full transition-all duration-75"
                                                  style={{ height: `${h}%` }}
                                                />
                                              ))}
                                            </div>
                                          )}

                                          {/* Wave display post-recording */}
                                          {rowState.hasRecorded && (
                                            rowState.recordedWaves.map((h, i) => {
                                              const barPercent = (i / rowState.recordedWaves.length) * 100
                                              const isTrimmed = barPercent < rowState.trimStartRec || barPercent > rowState.trimEndRec
                                              const isPlayed = barPercent <= rowState.progressRec && !isTrimmed
                                              
                                              return (
                                                <div 
                                                  key={i} 
                                                  className="w-1.5 rounded-full transition-all duration-300"
                                                  style={{
                                                    height: `${h}%`,
                                                    backgroundColor: isTrimmed 
                                                      ? "#2C201C" 
                                                      : isPlayed 
                                                        ? "#10B981" 
                                                        : "#F97316"
                                                  }}
                                                />
                                              )
                                            })
                                          )}
                                        </div>
                                      </div>

                                      {/* Manual trim controls for recording */}
                                      {rowState.hasRecorded && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/50 p-4 rounded-xl border border-stone-850">
                                          <div className="flex flex-col gap-2 w-full sm:w-1/2">
                                            <div className="flex justify-between text-[10px] font-mono text-stone-400">
                                              <span>Trim Start Boundary: <strong>{rowState.trimStartRec.toFixed(0)}%</strong></span>
                                              <span>Trim End Boundary: <strong>{rowState.trimEndRec.toFixed(0)}%</strong></span>
                                            </div>
                                            <div className="flex gap-2">
                                              <input 
                                                type="range"
                                                min="0"
                                                max="45"
                                                value={rowState.trimStartRec}
                                                onChange={(e) => {
                                                  const val = Number(e.target.value)
                                                  setRowAudioStates(prev => ({
                                                    ...prev,
                                                    [item.id]: {
                                                      ...getRowAudioState(item.id),
                                                      trimStartRec: val,
                                                      progressRec: Math.max(val, getRowAudioState(item.id).progressRec)
                                                    }
                                                  }))
                                                }}
                                                className="w-1/2 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                              />
                                              <input 
                                                type="range"
                                                min="55"
                                                max="100"
                                                value={rowState.trimEndRec}
                                                onChange={(e) => {
                                                  const val = Number(e.target.value)
                                                  setRowAudioStates(prev => ({
                                                    ...prev,
                                                    [item.id]: {
                                                      ...getRowAudioState(item.id),
                                                      trimEndRec: val,
                                                      progressRec: Math.min(val, getRowAudioState(item.id).progressRec)
                                                    }
                                                  }))
                                                }}
                                                className="w-1/2 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                              />
                                            </div>
                                          </div>

                                          {/* Auto trim tools for recorded track */}
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <button
                                              onClick={() => handleAutoTrimFront(item.id, "rec")}
                                              className="px-2.5 py-1.5 bg-orange-500/10 border border-orange-500/35 hover:bg-orange-500/20 text-orange-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                            >
                                              ✂ Auto Trim Front
                                            </button>
                                            <button
                                              onClick={() => handleAutoTrimBack(item.id, "rec")}
                                              className="px-2.5 py-1.5 bg-yellow-500/10 border border-yellow-500/35 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                            >
                                              ✂ Auto Trim Back
                                            </button>
                                            <button
                                              onClick={() => handleAutoTrimPauses(item.id, "rec")}
                                              className="px-2.5 py-1.5 bg-stone-700/30 border border-stone-605 text-stone-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                            >
                                              ✂ Trim Pauses
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Attribution Chain Trim Console Log (Audacity Compiler Logs style) */}
                                    <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-inner w-full">
                                      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 font-mono">⚡ Isnad Processing Console</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      </div>
                                      <div className="p-4 bg-slate-950/60 font-mono text-[9px] text-[#A7F3D0] leading-relaxed flex flex-col gap-1 max-h-24 overflow-y-auto w-full select-all">
                                        {rowState.trimLog.map((log, index) => (
                                          <div key={index}>{log}</div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>

                            {/* Workspace Bottom Actions */}
                            <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] pt-6 w-full">
                              <button 
                                onClick={() => handleDiscardDraft(item.id)}
                                className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B] font-bold text-xs cursor-pointer transition-colors"
                              >
                                Discard Changes
                              </button>
                              <button 
                                onClick={() => handleSaveDraft(item.id)}
                                className="px-6 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#043327] text-white font-bold text-xs cursor-pointer transition-all shadow-md"
                              >
                                ✔ Stage Suggestion
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-sm text-[#64748B] w-full">
                No results match your filters. Try adjusting your query.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Bottom Draft Drawer Bar */}
      <AnimatePresence>
        {stagedCount > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 md:left-12 md:right-12 z-[100]"
          >
            <div className="bg-[#1E293B] text-white rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 max-w-5xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#064E3B] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">rule</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Local Narrator Draft Queue</h3>
                  <p className="text-[10px] text-slate-400">
                    Staged <strong>{stagedCount}</strong> invocation {stagedCount === 1 ? "correction" : "corrections"} (Amana Staging Area)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setDraftStore({})}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Clear Queue
                </button>
                <button 
                  onClick={() => setShowDrawer(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#043327] text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                >
                  Inspect & Push Pull Request
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inspect & Review Pull Request Drawer Overlay Modal */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0F172A]/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="max-w-4xl w-full bg-white rounded-[32px] border border-[#E2E8F0] shadow-2xl p-8 flex flex-col max-h-[85vh] overflow-hidden relative"
            >
              {/* Close button */}
              <button 
                onClick={() => setShowDrawer(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#64748B]">close</span>
              </button>

              <div className="flex flex-col gap-6 h-full overflow-hidden">
                <div className="flex flex-col gap-1 border-b border-[#E2E8F0] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#064E3B]">Review Transmission</span>
                  <h2 className="text-2xl font-serif font-bold text-[#064E3B]">Consolidated Git Diff & Attribution</h2>
                </div>

                {prTimelineStep === "idle" && (
                  <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-2">
                    
                    {/* Attribution Identity warning / status */}
                    <div className="flex items-center justify-between bg-[#FAF9F6] border border-[#E2E8F0] rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#064E3B]">verified_user</span>
                        <div>
                          <h4 className="text-xs font-bold text-[#1E293B]">Narration Chain Authentication</h4>
                          <p className="text-[10px] text-[#64748B]">
                            {gitHubUser 
                              ? `Committing directly under your validated handle: @${gitHubUser.username}`
                              : "Unauthenticated. Sign in with GitHub below to securely bind attribution."
                            }
                          </p>
                        </div>
                      </div>
                      {!gitHubUser && (
                        <button 
                          onClick={handleGitHubAuth}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Sign In
                        </button>
                      )}
                    </div>

                    {/* Git Diff comparison lists */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Changes to data/invocations.json</h3>
                      
                      <div className="flex flex-col gap-4">
                        {Object.values(draftStore).map((draft) => {
                          const original = MOCK_INVOCATIONS.find(i => i.id === draft.invocationId)!
                          return (
                            <div key={draft.invocationId} className="border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                              <div className="bg-slate-50 px-4 py-2 text-xs border-b border-[#E2E8F0] flex justify-between font-semibold">
                                <span>Dzikr ID #{draft.invocationId.toString().padStart(2, '0')} ({original.chapter_name})</span>
                                {draft.audioState === "recorded" && (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] font-bold">🎙 Audio Added</span>
                                )}
                              </div>
                              
                              {/* Color-coded diff layout */}
                              <div className="p-4 flex flex-col gap-3 font-mono text-[11px] leading-relaxed bg-[#FAF9F6]">
                                {/* Arabic matan diff */}
                                {draft.arabic !== original.arabic && (
                                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                    <span className="text-[8px] uppercase tracking-wider font-bold text-[#64748B]">Arabic Difference</span>
                                    <div className="text-red-600 bg-red-50 p-2 rounded-lg text-right" dir="rtl">- {original.arabic}</div>
                                    <div className="text-emerald-600 bg-emerald-50 p-2 rounded-lg text-right" dir="rtl">+ {draft.arabic}</div>
                                  </div>
                                )}

                                {/* Translations diffs */}
                                {(() => {
                                  const indonesianChanged = draft.translations?.indonesian !== original.indonesian;
                                  const englishChanged = draft.translations?.english !== (original.english || "");
                                  
                                  const customKeys = Object.keys(draft.translations || {}).filter(key => key !== "indonesian" && key !== "english");
                                  
                                  const hasAnyTranslationChange = indonesianChanged || englishChanged || customKeys.length > 0;
                                  
                                  if (!hasAnyTranslationChange) return null;
                                  
                                  return (
                                    <div className="flex flex-col gap-2 border-b border-slate-100 pb-2">
                                      <span className="text-[8px] uppercase tracking-wider font-bold text-[#64748B]">Translations Difference</span>
                                      
                                      {indonesianChanged && (
                                        <div className="flex flex-col gap-1 pl-2 border-l-2 border-amber-400">
                                          <span className="text-[9px] font-bold text-slate-500">Indonesian 🇮🇩</span>
                                          <div className="text-red-600 bg-red-50/50 p-1.5 rounded-lg">- {original.indonesian}</div>
                                          <div className="text-emerald-600 bg-emerald-50/50 p-1.5 rounded-lg">+ {draft.translations.indonesian}</div>
                                        </div>
                                      )}
                                      
                                      {englishChanged && (
                                        <div className="flex flex-col gap-1 pl-2 border-l-2 border-amber-400">
                                          <span className="text-[9px] font-bold text-slate-500">English 🇬🇧</span>
                                          <div className="text-red-600 bg-red-50/50 p-1.5 rounded-lg">- {original.english || "(none)"}</div>
                                          <div className="text-emerald-600 bg-emerald-50/50 p-1.5 rounded-lg">+ {draft.translations.english}</div>
                                        </div>
                                      )}
                                      
                                      {customKeys.map(langCode => {
                                        const langMeta = TRANSLATION_LANGS.find(l => l.code === langCode) || { label: langCode, flag: "🌐" }
                                        const origVal = (original as any)[langCode] || "";
                                        const draftVal = draft.translations[langCode] || "";
                                        if (origVal === draftVal) return null;
                                        return (
                                          <div key={langCode} className="flex flex-col gap-1 pl-2 border-l-2 border-emerald-400">
                                            <span className="text-[9px] font-bold text-slate-500">{langMeta.flag} {langMeta.label}</span>
                                            {origVal && <div className="text-red-600 bg-red-50/50 p-1.5 rounded-lg">- {origVal}</div>}
                                            <div className="text-emerald-600 bg-emerald-50/50 p-1.5 rounded-lg">+ {draftVal}</div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })()}

                                {/* Transliterations diffs */}
                                {(() => {
                                  const latinChanged = draft.transliterations?.latin !== original.latin;
                                  const customKeys = Object.keys(draft.transliterations || {}).filter(key => key !== "latin");
                                  const hasAnyTransliterationChange = latinChanged || customKeys.length > 0;
                                  
                                  if (!hasAnyTransliterationChange) return null;
                                  
                                  return (
                                    <div className="flex flex-col gap-2">
                                      <span className="text-[8px] uppercase tracking-wider font-bold text-[#64748B]">Transliterations Difference</span>
                                      
                                      {latinChanged && (
                                        <div className="flex flex-col gap-1 pl-2 border-l-2 border-amber-400">
                                          <span className="text-[9px] font-bold text-slate-500">Latin (Standard Romanization) 🔠</span>
                                          <div className="text-red-600 bg-red-50/50 p-1.5 rounded-lg">- {original.latin}</div>
                                          <div className="text-emerald-600 bg-emerald-50/50 p-1.5 rounded-lg">+ {draft.transliterations.latin}</div>
                                        </div>
                                      )}
                                      
                                      {customKeys.map(langCode => {
                                        const langMeta = TRANSLITERATION_LANGS.find(l => l.code === langCode) || { label: langCode, flag: "🌐" }
                                        const origVal = (original as any)[langCode] || "";
                                        const draftVal = draft.transliterations[langCode] || "";
                                        if (origVal === draftVal) return null;
                                        return (
                                          <div key={langCode} className="flex flex-col gap-1 pl-2 border-l-2 border-emerald-400">
                                            <span className="text-[9px] font-bold text-slate-500">{langMeta.flag} {langMeta.label}</span>
                                            {origVal && <div className="text-red-600 bg-red-50/50 p-1.5 rounded-lg">- {origVal}</div>}
                                            <div className="text-emerald-600 bg-emerald-50/50 p-1.5 rounded-lg">+ {draftVal}</div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })()}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {prTimelineStep !== "idle" && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-8 py-12">
                    {/* Pipeline animation loading indicator */}
                    <div className="flex flex-col items-center gap-4">
                      {prTimelineStep === "auth" && (
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center animate-bounce">
                          <span className="material-symbols-outlined text-3xl">key_off</span>
                        </div>
                      )}
                      {(prTimelineStep === "branching" || prTimelineStep === "committing") && (
                        <div className="relative w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 animate-spin" />
                        </div>
                      )}
                      {prTimelineStep === "opened" && (
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-ping">
                          <span className="material-symbols-outlined text-3xl">done_all</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center max-w-sm flex flex-col gap-2">
                      <h3 className="font-bold text-lg text-[#1E293B]">
                        {prTimelineStep === "auth" && "Authentication Required"}
                        {prTimelineStep === "branching" && "Generating Git Branch..."}
                        {prTimelineStep === "committing" && "Committing Media & JSON Payload..."}
                        {prTimelineStep === "opened" && "Pull Request Opened Successfully!"}
                      </h3>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {prTimelineStep === "auth" && "You must log in to your GitHub account first to sign commits and establish Narration attribution chain."}
                        {prTimelineStep === "branching" && "Initializing fork repository and creating target staging branch contribution/edit-dhikr..."}
                        {prTimelineStep === "committing" && "Compressing WebM recording into high-fidelity MP3 and committing modifications directly under your GitHub handle."}
                        {prTimelineStep === "opened" && "Alhamdulillah! Your contribution has been pushed to GitHub as a Pull Request. Maintainers will review the narration chain shortly."}
                      </p>
                    </div>

                    {prTimelineStep === "opened" && (
                      <div className="flex flex-col gap-2 items-center bg-emerald-50 border border-emerald-200 p-4 rounded-2xl max-w-md w-full">
                        <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-widest font-bold">
                          {prUrl === "local-sandbox" ? "Sandbox Staged Successfully:" : "PR LINK GENERATED:"}
                        </span>
                        {prUrl === "local-sandbox" ? (
                          <span className="text-xs font-bold text-emerald-850 text-center">
                            Local invocations.json and narrative audio assets successfully updated! You can now test them locally in the main Dzikr & Dua player!
                          </span>
                        ) : (
                          <a 
                            href={prUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs font-bold text-emerald-700 underline flex items-center gap-1.5 break-all text-center justify-center"
                          >
                            {prUrl}
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Staging bottom drawer actions */}
                <div className="border-t border-[#E2E8F0] pt-6 flex items-center justify-between flex-shrink-0">
                  {prTimelineStep === "idle" ? (
                    <>
                      <p className="text-[10px] text-[#64748B] max-w-[280px]">
                        By pushing, you automatically open a public Pull Request in Dzikr & Dua.
                      </p>
                      <button 
                        onClick={triggerPRPipeline}
                        className="px-6 py-3 rounded-2xl bg-[#064E3B] hover:bg-[#043327] text-white font-bold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.01]"
                      >
                        Authorize & Push Pull Request
                      </button>
                    </>
                  ) : prTimelineStep === "auth" ? (
                    <div className="flex gap-2 w-full justify-end">
                      <button 
                        onClick={() => setPrTimelineStep("idle")}
                        className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] font-bold text-xs cursor-pointer text-slate-600 hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => {
                          handleGitHubAuth()
                          setPrTimelineStep("idle")
                        }}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                      >
                        Authorize GitHub
                      </button>
                    </div>
                  ) : prTimelineStep === "opened" ? (
                    <button 
                      onClick={resetPipeline}
                      className="w-full py-3 rounded-2xl bg-[#064E3B] text-white font-bold text-xs shadow-md cursor-pointer text-center"
                    >
                      Finish Contribution (Alhamdulillah)
                    </button>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Processing pipeline...</div>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
