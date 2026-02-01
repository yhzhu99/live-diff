import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as monaco from 'monaco-editor'
import { getTextStats, TextStats } from '../utils/textStats'

type MonacoEditorsProps = {
  original: string
  modified: string
  language: string
  darkMode: boolean
  editorHeight: number
  onChangeOriginal(value: string): void
  onChangeModified(value: string): void
  onClearOriginal(): void
  onClearModified(): void
  mode: 'editors' | 'diff'
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  className?: string
}

const toMonacoLanguage = (lang: string) => {
  if (!lang || lang === 'auto' || lang === 'plaintext') return 'plaintext'
  if (lang === 'dockerfile') return 'dockerfile'
  if (lang === 'csharp') return 'csharp'
  return lang
}

export function MonacoEditors({
  original,
  modified,
  language,
  darkMode,
  editorHeight,
  onChangeOriginal,
  onChangeModified,
  onClearOriginal,
  onClearModified,
  mode,
  isFullscreen = false,
  onToggleFullscreen,
  className,
}: MonacoEditorsProps) {
  const originalEl = useRef<HTMLDivElement | null>(null)
  const modifiedEl = useRef<HTMLDivElement | null>(null)
  const diffEl = useRef<HTMLDivElement | null>(null)

  const monacoLang = useMemo(() => toMonacoLanguage(language), [language])

  // Drag states for file upload
  const [originalDragOver, setOriginalDragOver] = useState(false)
  const [modifiedDragOver, setModifiedDragOver] = useState(false)

  // Text statistics
  const originalStats = useMemo<TextStats>(() => getTextStats(original), [original])
  const modifiedStats = useMemo<TextStats>(() => getTextStats(modified), [modified])

  // Copy text to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }, [])

  // Handle file drop
  const handleFileDrop = useCallback((
    e: React.DragEvent<HTMLDivElement>,
    setContent: (value: string) => void,
    setDragOver: (value: boolean) => void
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length === 0) return

    const file = files[0]
    // Only accept text files
    if (!file.type.startsWith('text/') && !file.name.match(/\.(txt|md|json|js|ts|tsx|jsx|py|java|c|cpp|h|hpp|css|html|xml|yaml|yml|sh|go|rs|rb|php|swift|kt|sql|dockerfile)$/i)) {
      console.warn('File type not supported for text parsing')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        setContent(text)
      }
    }
    reader.readAsText(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((setDragOver: (value: boolean) => void) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((setDragOver: (value: boolean) => void) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const originalEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const modifiedEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)

  const originalModelRef = useRef<monaco.editor.ITextModel | null>(null)
  const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null)
  const diffOriginalModelRef = useRef<monaco.editor.ITextModel | null>(null)
  const diffModifiedModelRef = useRef<monaco.editor.ITextModel | null>(null)

  const theme = useMemo(() => (darkMode ? 'vs-dark' : 'vs'), [darkMode])

  // Initialize editors
  useEffect(() => {
    if (mode === 'editors') {
      if (!originalEl.current || !modifiedEl.current) return

      originalModelRef.current = monaco.editor.createModel(original, monacoLang)
      modifiedModelRef.current = monaco.editor.createModel(modified, monacoLang)

      originalEditorRef.current = monaco.editor.create(originalEl.current, {
        model: originalModelRef.current,
        theme,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        fontFamily: "Consolas, 'Courier New', monospace",
        fontSize: 13,
        lineHeight: 20,
        fontLigatures: false,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'line',
        smoothScrolling: true,
        cursorSmoothCaretAnimation: 'on',
        cursorBlinking: 'smooth',
      })

      modifiedEditorRef.current = monaco.editor.create(modifiedEl.current, {
        model: modifiedModelRef.current,
        theme,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        fontFamily: "Consolas, 'Courier New', monospace",
        fontSize: 13,
        lineHeight: 20,
        fontLigatures: false,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'line',
        smoothScrolling: true,
        cursorSmoothCaretAnimation: 'on',
        cursorBlinking: 'smooth',
      })

      const d1 = originalModelRef.current.onDidChangeContent(() => {
        onChangeOriginal(originalModelRef.current?.getValue() ?? '')
      })
      const d2 = modifiedModelRef.current.onDidChangeContent(() => {
        onChangeModified(modifiedModelRef.current?.getValue() ?? '')
      })

      return () => {
        d1.dispose()
        d2.dispose()
        originalEditorRef.current?.dispose()
        modifiedEditorRef.current?.dispose()
        originalModelRef.current?.dispose()
        modifiedModelRef.current?.dispose()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode === 'editors'])

  // Initialize diff editor
  useEffect(() => {
    if (mode === 'diff') {
      if (!diffEl.current) return

      diffOriginalModelRef.current = monaco.editor.createModel(original, monacoLang)
      diffModifiedModelRef.current = monaco.editor.createModel(modified, monacoLang)

      diffEditorRef.current = monaco.editor.createDiffEditor(diffEl.current, {
        theme,
        ignoreTrimWhitespace: false,
        renderSideBySide: true,
        renderIndicators: true,
        originalEditable: false,
        readOnly: true,
        enableSplitViewResizing: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontal: 'auto',
          vertical: 'auto',
        },
        minimap: { enabled: false },
        fontFamily: "Consolas, 'Courier New', monospace",
        fontSize: 13,
        lineHeight: 20,
        fontLigatures: false,
        padding: { top: 12, bottom: 12 },
        smoothScrolling: true,
      })

      diffEditorRef.current.setModel({
        original: diffOriginalModelRef.current,
        modified: diffModifiedModelRef.current,
      })

      return () => {
        diffEditorRef.current?.dispose()
        diffOriginalModelRef.current?.dispose()
        diffModifiedModelRef.current?.dispose()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode === 'diff'])

  // Keep theme in sync
  useEffect(() => {
    monaco.editor.setTheme(theme)
  }, [theme])

  // Keep language in sync
  useEffect(() => {
    const models = [
      originalModelRef.current,
      modifiedModelRef.current,
      diffOriginalModelRef.current,
      diffModifiedModelRef.current,
    ]
    for (const m of models) {
      if (!m) continue
      monaco.editor.setModelLanguage(m, monacoLang)
    }
  }, [monacoLang])

  // Sync content for editors mode
  useEffect(() => {
    if (mode === 'editors') {
      if (originalModelRef.current && originalModelRef.current.getValue() !== original) {
        originalModelRef.current.setValue(original)
      }
      if (modifiedModelRef.current && modifiedModelRef.current.getValue() !== modified) {
        modifiedModelRef.current.setValue(modified)
      }
    }
  }, [original, modified, mode])

  // Sync content for diff mode
  useEffect(() => {
    if (mode === 'diff') {
      if (diffOriginalModelRef.current && diffOriginalModelRef.current.getValue() !== original) {
        diffOriginalModelRef.current.setValue(original)
      }
      if (diffModifiedModelRef.current && diffModifiedModelRef.current.getValue() !== modified) {
        diffModifiedModelRef.current.setValue(modified)
      }
    }
  }, [original, modified, mode])

  if (mode === 'editors') {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className || ''}`} style={{ height: editorHeight }}>
        {/* Original Panel */}
        <div
          className={`editor-panel group relative ${originalDragOver ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter(setOriginalDragOver)}
          onDragLeave={handleDragLeave(setOriginalDragOver)}
          onDrop={(e) => handleFileDrop(e, onChangeOriginal, setOriginalDragOver)}
        >
          <div className="editor-panel-header">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Original
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500 font-mono ml-1">
                {originalStats.chars} chars · {originalStats.words} words
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => copyToClipboard(original)}
                className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200"
                title="Copy text"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={onClearOriginal}
                className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                title="Clear text"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div ref={originalEl} className="flex-1" />
          {originalDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-primary-400/15 to-primary-600/20 dark:from-primary-400/20 dark:via-primary-500/15 dark:to-primary-400/20 backdrop-blur-[2px]" />
              <div className="absolute inset-2 border-2 border-dashed border-primary-400 dark:border-primary-500 rounded-xl animate-pulse" />
              <div className="relative flex flex-col items-center gap-3 bg-white/90 dark:bg-surface-800/90 px-6 py-4 rounded-2xl shadow-xl border border-primary-200 dark:border-primary-700">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">Drop file to upload</p>
                  <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">Supports text files</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modified Panel */}
        <div
          className={`editor-panel group relative ${modifiedDragOver ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter(setModifiedDragOver)}
          onDragLeave={handleDragLeave(setModifiedDragOver)}
          onDrop={(e) => handleFileDrop(e, onChangeModified, setModifiedDragOver)}
        >
          <div className="editor-panel-header">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Modified
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500 font-mono ml-1">
                {modifiedStats.chars} chars · {modifiedStats.words} words
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => copyToClipboard(modified)}
                className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200"
                title="Copy text"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={onClearModified}
                className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                title="Clear text"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div ref={modifiedEl} className="flex-1" />
          {modifiedDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-primary-400/15 to-primary-600/20 dark:from-primary-400/20 dark:via-primary-500/15 dark:to-primary-400/20 backdrop-blur-[2px]" />
              <div className="absolute inset-2 border-2 border-dashed border-primary-400 dark:border-primary-500 rounded-xl animate-pulse" />
              <div className="relative flex flex-col items-center gap-3 bg-white/90 dark:bg-surface-800/90 px-6 py-4 rounded-2xl shadow-xl border border-primary-200 dark:border-primary-700">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">Drop file to upload</p>
                  <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">Supports text files</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`diff-panel flex-1 flex flex-col ${isFullscreen ? 'fullscreen-panel' : ''} ${className || ''}`}>
      <div className="diff-panel-header">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-300" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
            Diff Preview
          </span>
        </div>

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div ref={diffEl} className="flex-1 min-h-0" />
    </div>
  )
}
