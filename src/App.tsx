import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { MultiFileDiff, type FileContents } from '@pierre/diffs/react'
import hljs from 'highlight.js'
import { Editor } from './components/Editor'
import { Toolbar } from './components/Toolbar'
import { Header } from './components/Header'
import { SettingsModal } from './components/SettingsModal'

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
  { value: 'sql', label: 'SQL' },
  { value: 'shell', label: 'Shell' },
  { value: 'dockerfile', label: 'Dockerfile' },
]

type DiffStyle = 'split' | 'unified'

// LocalStorage key for dark mode
const DARK_MODE_KEY = 'live-diff-dark-mode'

export default function App() {
  const [originalContent, setOriginalContent] = useState('')
  const [modifiedContent, setModifiedContent] = useState('')
  const [language, setLanguage] = useState('auto')
  const [detectedLanguage, setDetectedLanguage] = useState('plaintext')
  const [diffStyle, setDiffStyle] = useState<DiffStyle>('split')

  // Initialize darkMode from localStorage, default to false (light mode)
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
    return false // Default to light mode
  })

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Advanced Options
  const [lineDiffType, setLineDiffType] = useState<'word-alt' | 'word' | 'char' | 'none'>('word-alt')
  const [showBackgrounds, setShowBackgrounds] = useState(true)
  const [wrapText, setWrapText] = useState(true)
  const [showLineNumbers, setShowLineNumbers] = useState(true)

  // Layout states
  const [editorHeight, setEditorHeight] = useState(280)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isResizing = useRef(false)

  // Sync dark mode with document and localStorage
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
    localStorage.setItem(DARK_MODE_KEY, String(darkMode))
  }, [darkMode])

  // Auto detection effect
  useEffect(() => {
    if (language !== 'auto') {
      setDetectedLanguage(language)
      return
    }

    const contentToDetect = modifiedContent || originalContent
    if (!contentToDetect) {
      setDetectedLanguage('plaintext')
      return
    }

    try {
      const result = hljs.highlightAuto(contentToDetect)
      const detected = result.language || 'plaintext'
      setDetectedLanguage(detected)
    } catch (e) {
      setDetectedLanguage('plaintext')
    }
  }, [language, originalContent, modifiedContent])

  // Get file extension from language
  const getExtension = (lang: string): string => {
    const extMap: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
      ruby: 'rb',
      php: 'php',
      swift: 'swift',
      kotlin: 'kt',
      html: 'html',
      css: 'css',
      json: 'json',
      yaml: 'yaml',
      markdown: 'md',
      sql: 'sql',
      shell: 'sh',
      dockerfile: 'dockerfile',
      plaintext: 'txt',
    }
    return extMap[lang] || 'txt'
  }

  // Create stable file objects
  const oldFile: FileContents = useMemo(() => ({
    name: `original.${getExtension(detectedLanguage)}`,
    contents: originalContent,
  }), [originalContent, detectedLanguage])

  const newFile: FileContents = useMemo(() => ({
    name: `modified.${getExtension(detectedLanguage)}`,
    contents: modifiedContent,
  }), [modifiedContent, detectedLanguage])

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

  // Resizing logic
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
    // Adjust editor height based on mouse position (header is ~60px)
    const newHeight = e.clientY - 100
    if (newHeight > 120 && newHeight < window.innerHeight - 200) {
      setEditorHeight(newHeight)
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

  // Check if there's content to diff
  const hasDiff = originalContent.length > 0 || modifiedContent.length > 0

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-surface-950' : 'bg-surface-50'}`}>
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        language={language}
        detectedLanguage={detectedLanguage}
        languages={LANGUAGES}
        onLanguageChange={setLanguage}
        diffStyle={diffStyle}
        onDiffStyleChange={setDiffStyle}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col p-3 gap-3 max-w-[1800px] mx-auto w-full">
        {/* Action Bar */}
        <Toolbar onSwap={handleSwap} onClear={handleClear} />

        {/* Editor Section */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-none"
          style={{ height: `${editorHeight}px` }}
        >
          <Editor
            title="Original"
            placeholder="Paste or drag your original content here..."
            value={originalContent}
            onChange={setOriginalContent}
            darkMode={darkMode}
          />
          <Editor
            title="Modified"
            placeholder="Paste or drag your modified content here..."
            value={modifiedContent}
            onChange={setModifiedContent}
            darkMode={darkMode}
          />
        </div>

        {/* Resize Handle */}
        {!isFullscreen && (
          <div className="resize-handle" onMouseDown={startResizing} />
        )}

        {/* Diff Preview Section */}
        <div className={`panel flex-1 min-h-[200px] flex flex-col animate-fade-in ${isFullscreen ? 'panel-fullscreen' : ''}`}>
          <div className="panel-header py-2">
            <h2 className="panel-title flex items-center gap-2 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Diff Preview
            </h2>
            <div className="flex items-center gap-2">
              {hasDiff && (
                <span className="text-[10px] text-surface-500 dark:text-surface-400">
                  {diffStyle === 'split' ? 'Split' : 'Unified'}
                </span>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              >
                {isFullscreen ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {hasDiff ? (
              <MultiFileDiff
                oldFile={oldFile}
                newFile={newFile}
                options={{
                  theme: darkMode
                    ? { dark: 'github-dark', light: 'github-light' }
                    : { dark: 'github-dark', light: 'github-light' },
                  diffStyle: diffStyle,
                  overflow: wrapText ? 'wrap' : 'scroll',
                  lineDiffType: lineDiffType,
                  disableBackground: !showBackgrounds,
                  disableLineNumbers: !showLineNumbers,
                }}
                style={{
                  '--diffs-font-family': "'JetBrains Mono', monospace",
                  '--diffs-font-size': '12px',
                } as React.CSSProperties}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-surface-400 dark:text-surface-500">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <p className="text-sm font-medium mb-1">No content to compare</p>
                  <p className="text-xs">Enter or paste content in the editors above</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Backdrop for fullscreen mode */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      {/* Footer */}
      {!isFullscreen && (
        <footer className="text-center py-2 text-xs text-surface-500 dark:text-surface-500 border-t border-surface-200 dark:border-surface-800">
          Built with{' '}
          <a href="https://diffs.com" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
            @pierre/diffs
          </a>
        </footer>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lineDiffType={lineDiffType}
        onLineDiffTypeChange={setLineDiffType}
        showBackgrounds={showBackgrounds}
        onToggleBackgrounds={() => setShowBackgrounds(!showBackgrounds)}
        wrapText={wrapText}
        onToggleWrap={() => setWrapText(!wrapText)}
        showLineNumbers={showLineNumbers}
        onToggleLineNumbers={() => setShowLineNumbers(!showLineNumbers)}
      />
    </div>
  )
}
