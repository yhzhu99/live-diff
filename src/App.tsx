import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
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

const toMonacoLanguage = (lang: string) => {
  if (!lang || lang === 'auto' || lang === 'plaintext') return 'plaintext'
  if (lang === 'dockerfile') return 'dockerfile'
  if (lang === 'csharp') return 'csharp'
  return lang
}

export default function App() {
  const [language, setLanguage] = useState('auto')
  const [detectedLanguage, setDetectedLanguage] = useState('plaintext')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [renderSideBySide, setRenderSideBySide] = useState(true)

  // Create shared Monaco models ONCE — stable across React Strict Mode re-mounts.
  // useRef with lazy init: models are never disposed, they live for the app's lifetime.
  const originalModelRef = useRef<monaco.editor.ITextModel | null>(null)
  const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null)
  if (!originalModelRef.current || originalModelRef.current.isDisposed()) {
    originalModelRef.current = monaco.editor.createModel('', 'plaintext')
  }
  if (!modifiedModelRef.current || modifiedModelRef.current.isDisposed()) {
    modifiedModelRef.current = monaco.editor.createModel('', 'plaintext')
  }
  const originalModel = originalModelRef.current
  const modifiedModel = modifiedModelRef.current

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

  // Debounced language auto-detection via model change events
  useEffect(() => {
    if (language !== 'auto') {
      setDetectedLanguage(language)
      return
    }

    let timer: ReturnType<typeof setTimeout> | null = null

    const detect = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        // Only sample the first 2000 chars to avoid heavy computation
        const origSample = originalModel.getValue(monaco.editor.EndOfLinePreference.LF, false).substring(0, 1000)
        const modSample = modifiedModel.getValue(monaco.editor.EndOfLinePreference.LF, false).substring(0, 1000)
        const contentToDetect = `${origSample}\n${modSample}`.trim()
        if (!contentToDetect) {
          setDetectedLanguage('plaintext')
          return
        }

        try {
          const languageSubset = LANGUAGES.map(l => l.value).filter(v => v !== 'plaintext')
          const result = hljs.highlightAuto(contentToDetect, languageSubset)
          setDetectedLanguage(result.language || 'plaintext')
        } catch {
          setDetectedLanguage('plaintext')
        }
      }, 500) // 500ms debounce
    }

    // Initial detection
    detect()

    // Listen to model changes for re-detection
    const d1 = originalModel.onDidChangeContent(detect)
    const d2 = modifiedModel.onDidChangeContent(detect)

    return () => {
      if (timer) clearTimeout(timer)
      d1.dispose()
      d2.dispose()
    }
  }, [language, originalModel, modifiedModel])

  const effectiveLanguage = useMemo(() => {
    return language === 'auto' ? detectedLanguage : language
  }, [language, detectedLanguage])

  const monacoLang = useMemo(() => toMonacoLanguage(effectiveLanguage), [effectiveLanguage])

  // Keep language in sync on shared models
  useEffect(() => {
    monaco.editor.setModelLanguage(originalModel, monacoLang)
    monaco.editor.setModelLanguage(modifiedModel, monacoLang)
  }, [monacoLang, originalModel, modifiedModel])

  // Handle swap — directly swap model values
  const handleSwap = useCallback(() => {
    const origVal = originalModel.getValue()
    const modVal = modifiedModel.getValue()
    originalModel.setValue(modVal)
    modifiedModel.setValue(origVal)
  }, [originalModel, modifiedModel])

  // Handle clear — directly clear model values
  const handleClear = useCallback(() => {
    originalModel.setValue('')
    modifiedModel.setValue('')
  }, [originalModel, modifiedModel])

  const handleClearOriginal = useCallback(() => {
    originalModel.setValue('')
  }, [originalModel])

  const handleClearModified = useCallback(() => {
    modifiedModel.setValue('')
  }, [modifiedModel])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const toggleRenderSideBySide = useCallback(() => {
    setRenderSideBySide(prev => !prev)
  }, [])

  // Intentionally no global keyboard shortcuts.

  return (
    <div className={`min-h-screen md:h-screen flex flex-col overflow-y-auto md:overflow-hidden ${darkMode ? 'bg-surface-950' : 'bg-surface-50'}`}>
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

      <main ref={containerRef} className="flex-1 flex flex-col p-2 md:p-4 gap-0 overflow-visible md:overflow-hidden">
        {/* Top: Monaco Editors */}
        {!isFullscreen && (
          <>
            <MonacoEditors
              originalModel={originalModel}
              modifiedModel={modifiedModel}
              darkMode={darkMode}
              editorHeight={editorHeight}
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
          originalModel={originalModel}
          modifiedModel={modifiedModel}
          darkMode={darkMode}
          editorHeight={editorHeight}
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
