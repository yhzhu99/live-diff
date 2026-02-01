import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import hljs from 'highlight.js'
import { Header } from './components/Header'
import { SettingsModal } from './components/SettingsModal'
import { MonacoEditors } from './components/MonacoEditors'

// Supported languages for syntax highlighting
const LANGUAGES = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'latex', label: 'TeX/LaTeX' },
  { value: 'sql', label: 'SQL' },
  { value: 'shell', label: 'Shell' },
  { value: 'dockerfile', label: 'Dockerfile' },
]


// LocalStorage keys
const STORAGE_KEYS = {
  DARK_MODE: 'live-diff-dark-mode',
  // DIFF_STYLE is deprecated (split only)
  DIFF_STYLE: 'live-diff-diff-style',
  LINE_DIFF_TYPE: 'live-diff-line-diff-type',
  SHOW_BACKGROUNDS: 'live-diff-show-backgrounds',
  WRAP_TEXT: 'live-diff-wrap-text',
  SHOW_LINE_NUMBERS: 'live-diff-show-line-numbers',
  EDITOR_HEIGHT: 'live-diff-editor-height',
}

// Constraints for editor height
const MIN_EDITOR_HEIGHT = 120
const MAX_EDITOR_HEIGHT_RATIO = 0.5 // Max 50% of viewport

export default function App() {
  const [originalContent, setOriginalContent] = useState('')
  const [modifiedContent, setModifiedContent] = useState('')
  const [language, setLanguage] = useState('auto')
  const [detectedLanguage, setDetectedLanguage] = useState('plaintext')

  // Initialize settings from localStorage
  // Diff style is fixed to split.

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.DARK_MODE)
    return stored === 'true'
  })

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Advanced Options from the previous renderer are deprecated with Monaco.

  // Layout states (top editors vs bottom diff)
  const [editorHeight, setEditorHeight] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.EDITOR_HEIGHT)
    const parsed = parseInt(stored || '', 10)
    return !isNaN(parsed) && parsed >= MIN_EDITOR_HEIGHT ? parsed : 250
  })

  // Fullscreen currently disabled in Monaco layout.
  const isFullscreen = false
  const isResizing = useRef(false)

  const startResizing = useCallback(() => {
    isResizing.current = true
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const stopResizing = useCallback(() => {
    isResizing.current = false
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
  }, [])

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return

    const maxHeight = Math.floor(window.innerHeight * MAX_EDITOR_HEIGHT_RATIO)
    const headerHeight = 52
    const containerPadding = 12
    const newHeight = e.clientY - headerHeight - containerPadding

    if (newHeight >= MIN_EDITOR_HEIGHT && newHeight <= maxHeight) {
      setEditorHeight(newHeight)
    } else if (newHeight < MIN_EDITOR_HEIGHT) {
      setEditorHeight(MIN_EDITOR_HEIGHT)
    } else if (newHeight > maxHeight) {
      setEditorHeight(maxHeight)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleResize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', handleResize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [handleResize, stopResizing])

  // Persist all settings to localStorage
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(darkMode))
  }, [darkMode])

  // diffStyle is now fixed to split (Monaco diff editor).

  // (deprecated settings persistence removed)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EDITOR_HEIGHT, String(editorHeight))
  }, [editorHeight])

  // Auto detection effect
  useEffect(() => {
    if (language !== 'auto') {
      setDetectedLanguage(language)
      return
    }

    const timer = setTimeout(() => {
      const contentToDetect = `${originalContent}\n${modifiedContent}`.trim()
      if (!contentToDetect) {
        setDetectedLanguage('plaintext')
        return
      }

      try {
        const languageSubset = LANGUAGES.map(l => l.value).filter(v => v !== 'plaintext')
        const result = hljs.highlightAuto(contentToDetect, languageSubset)
        const detected = result.language || 'plaintext'
        setDetectedLanguage(detected)
      } catch (e) {
        setDetectedLanguage('plaintext')
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [language, originalContent, modifiedContent])

  const effectiveLanguage = useMemo(() => {
    return language === 'auto' ? detectedLanguage : language
  }, [language, detectedLanguage])

  // Handle swap
  const handleSwap = useCallback(() => {
    const temp = originalContent
    setOriginalContent(modifiedContent)
    setModifiedContent(temp)
  }, [originalContent, modifiedContent])

  // Handle clear
  const handleClear = useCallback(() => {
    setOriginalContent('')
    setModifiedContent('')
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  // Old resize/fullscreen controls were for the textarea-based editor.
  // Monaco handles layout internally.

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-surface-950' : 'bg-surface-50'}`}>
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        language={language}
        detectedLanguage={detectedLanguage}
        languages={LANGUAGES}
        onLanguageChange={setLanguage}
        diffStyle={'split'}
        onDiffStyleChange={() => {}}
        onSwap={handleSwap}
        onClear={handleClear}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col p-3 gap-3 max-w-[1800px] mx-auto w-full">
        {/* Editors + Diff (Monaco) */}
        <div className="flex-none">
          <MonacoEditors
            original={originalContent}
            modified={modifiedContent}
            language={effectiveLanguage}
            darkMode={darkMode}
            editorHeight={editorHeight}
            diffHeight={diffHeight}
            onChangeOriginal={setOriginalContent}
            onChangeModified={setModifiedContent}
          />
        </div>

        {/* Resize Handle (restored) */}
        {!isFullscreen && (
          <div className="flex-none -my-1.5 py-1.5 z-20">
            <div className="resize-handle" onMouseDown={startResizing} />
          </div>
        )}
      </main>

      {/* Fullscreen disabled */}

      {/* Footer */}


      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
  const diffHeight = 420
