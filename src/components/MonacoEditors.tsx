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
  renderSideBySide?: boolean
  onToggleSideBySide?: () => void
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
  renderSideBySide = true,
  onToggleSideBySide,
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

  const isEmpty = useMemo(() => !original && !modified, [original, modified])

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
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
        fontSize: 13,
        lineHeight: 20,
        fontLigatures: true,
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
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
        fontSize: 13,
        lineHeight: 20,
        fontLigatures: true,
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
        renderSideBySide,
        renderIndicators: true,
        originalEditable: false,
        readOnly: true,
        enableSplitViewResizing: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          horizontal: 'auto',
          vertical: 'auto',
        },
        minimap: { enabled: false },
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
        fontSize: 13,
        lineHeight: 20,
        fontLigatures: true,
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

  // Update renderSideBySide option dynamically
  useEffect(() => {
    if (mode === 'diff' && diffEditorRef.current) {
      diffEditorRef.current.updateOptions({ renderSideBySide })
    }
  }, [mode, renderSideBySide])

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
    if (mode === 'diff' && !isEmpty) {
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
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className || ''} h-auto lg:h-[var(--editor-height)]`}
        style={{ '--editor-height': `${editorHeight}px` } as React.CSSProperties}
      >
        {/* Original Panel */}
        <div
          className={`editor-panel group relative h-[300px] lg:h-full ${originalDragOver ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter(setOriginalDragOver)}
          onDragLeave={handleDragLeave(setOriginalDragOver)}
          onDrop={(e) => handleFileDrop(e, onChangeOriginal, setOriginalDragOver)}
        >
          <div className="editor-panel-header">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Original
                </span>
              </div>
              <span className="text-[11px] text-surface-400 dark:text-surface-500 font-mono ml-1">
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
          className={`editor-panel group relative h-[300px] lg:h-full ${modifiedDragOver ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter(setModifiedDragOver)}
          onDragLeave={handleDragLeave(setModifiedDragOver)}
          onDrop={(e) => handleFileDrop(e, onChangeModified, setModifiedDragOver)}
        >
          <div className="editor-panel-header">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Modified
                </span>
              </div>
              <span className="text-[11px] text-surface-400 dark:text-surface-500 font-mono ml-1">
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
    <div className={`diff-panel flex-1 flex flex-col min-h-[400px] md:min-h-0 ${isFullscreen ? 'fullscreen-panel' : ''} ${className || ''}`}>
      <div className="diff-panel-header">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 group cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-300 opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-surface-500 dark:text-surface-400">
            Diff Preview
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Hide toggle on mobile since Monaco doesn't support side-by-side on narrow screens */}
          {onToggleSideBySide && (
            <button
              onClick={onToggleSideBySide}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                renderSideBySide
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200/50 dark:border-primary-800/50'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 border border-transparent'
              }`}
              title={renderSideBySide ? 'Switch to Unified View (Cmd+U)' : 'Switch to Side-by-Side View (Cmd+U)'}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {renderSideBySide ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                )}
              </svg>
              {renderSideBySide ? 'Side by Side' : 'Unified'}
            </button>
          )}

          <div className="hidden md:block w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1" />

          {/* Copy Diff Button */}
          {!isEmpty && (
            <button
              onClick={() => copyToClipboard(diffEditorRef.current?.getModifiedEditor().getValue() || '')}
              className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200"
              title="Copy modified text"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
              title={isFullscreen ? 'Exit fullscreen (Cmd+F)' : 'Fullscreen (Cmd+F)'}
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
      </div>

      <div className="flex-1 relative min-h-0 bg-surface-50/30 dark:bg-surface-950/30">
        <div ref={diffEl} className={`absolute inset-0 ${isEmpty ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} />
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary-500/10 dark:bg-primary-400/10 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-white dark:bg-surface-800 shadow-xl shadow-surface-900/5 border border-surface-200 dark:border-surface-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">Compare anything instantly</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 max-w-[280px]">
                Paste your code snippets above or drag and drop files to see the magic happen.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-[10px] font-bold text-surface-400 uppercase tracking-widest">
                <span className="text-surface-900 dark:text-white px-1.5 py-0.5 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">⌘+S</span>
                Swap
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-[10px] font-bold text-surface-400 uppercase tracking-widest">
                <span className="text-surface-900 dark:text-white px-1.5 py-0.5 rounded bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">⌘+E</span>
                Clear
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
