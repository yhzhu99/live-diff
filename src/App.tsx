import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import hljs from 'highlight.js'
import { Header } from './components/Header'
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
  EDITOR_HEIGHT: 'live-diff-editor-height',
}

// Constraints for editor height
const MIN_EDITOR_HEIGHT = 100
const MAX_EDITOR_HEIGHT_RATIO = 0.6 // Max 60% of viewport
const HEADER_HEIGHT = 56

export default function App() {
  const [originalContent, setOriginalContent] = useState('')
  const [modifiedContent, setModifiedContent] = useState('')
  const [language, setLanguage] = useState('auto')
  const [detectedLanguage, setDetectedLanguage] = useState('plaintext')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [renderSideBySide, setRenderSideBySide] = useState(true)

  // Initialize settings from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.DARK_MODE)
    return stored === 'true'
  })

  // Layout states (top editors vs bottom diff)
  const [editorHeight, setEditorHeight] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.EDITOR_HEIGHT)
    const parsed = parseInt(stored || '', 10)
    return !isNaN(parsed) && parsed >= MIN_EDITOR_HEIGHT ? parsed : 220
  })

  const isResizing = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
    const containerTop = HEADER_HEIGHT + 16 // header + padding
    const newHeight = e.clientY - containerTop

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

  // Persist settings to localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(darkMode))
  }, [darkMode])

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
      } catch {
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

  const handleClearOriginal = useCallback(() => {
    setOriginalContent('')
  }, [])

  const handleClearModified = useCallback(() => {
    setModifiedContent('')
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const toggleRenderSideBySide = useCallback(() => {
    setRenderSideBySide(prev => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSwap()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        handleClear()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        toggleFullscreen()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
        e.preventDefault()
        toggleRenderSideBySide()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSwap, handleClear, toggleFullscreen, toggleRenderSideBySide])

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${darkMode ? 'bg-surface-950' : 'bg-surface-50'}`}>
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        language={language}
        detectedLanguage={detectedLanguage}
        languages={LANGUAGES}
        onLanguageChange={setLanguage}
        onSwap={handleSwap}
        onClear={handleClear}
      />

      <main ref={containerRef} className="flex-1 flex flex-col p-4 gap-0 overflow-hidden">
        {/* Top: Monaco Editors */}
        {!isFullscreen && (
          <>
            <MonacoEditors
              original={originalContent}
              modified={modifiedContent}
              language={effectiveLanguage}
              darkMode={darkMode}
              editorHeight={editorHeight}
              onChangeOriginal={setOriginalContent}
              onChangeModified={setModifiedContent}
              onClearOriginal={handleClearOriginal}
              onClearModified={handleClearModified}
              mode="editors"
            />

            {/* Resize Handle */}
            <div className="resize-handle-container">
              <div
                className="resize-handle"
                onMouseDown={startResizing}
                title="Drag to resize (Hint: Double-click to reset)"
                onDoubleClick={() => setEditorHeight(220)}
              >
                <div className="resize-handle-bar" />
              </div>
            </div>
          </>
        )}

        {/* Bottom: Diff Preview */}
        <MonacoEditors
          original={originalContent}
          modified={modifiedContent}
          language={effectiveLanguage}
          darkMode={darkMode}
          editorHeight={editorHeight}
          onChangeOriginal={setOriginalContent}
          onChangeModified={setModifiedContent}
          onClearOriginal={handleClearOriginal}
          onClearModified={handleClearModified}
          mode="diff"
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          renderSideBySide={renderSideBySide}
          onToggleSideBySide={toggleRenderSideBySide}
        />
      </main>
    </div>
  )
}
