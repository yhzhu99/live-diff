import { useEffect, useMemo, useRef } from 'react'
import * as monaco from 'monaco-editor'

type MonacoEditorsProps = {
  original: string
  modified: string
  language: string
  darkMode: boolean
  editorHeight: number
  onChangeOriginal(value: string): void
  onChangeModified(value: string): void
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
  mode,
  isFullscreen = false,
  onToggleFullscreen,
  className,
}: MonacoEditorsProps) {
  const originalEl = useRef<HTMLDivElement | null>(null)
  const modifiedEl = useRef<HTMLDivElement | null>(null)
  const diffEl = useRef<HTMLDivElement | null>(null)

  const monacoLang = useMemo(() => toMonacoLanguage(language), [language])

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
        <div className="editor-panel group">
          <div className="editor-panel-header">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Original
              </span>
            </div>
          </div>
          <div ref={originalEl} className="flex-1" />
        </div>

        <div className="editor-panel group">
          <div className="editor-panel-header">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Modified
              </span>
            </div>
          </div>
          <div ref={modifiedEl} className="flex-1" />
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
