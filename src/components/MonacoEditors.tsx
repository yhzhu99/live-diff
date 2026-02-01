import { useEffect, useMemo, useRef } from 'react'
import * as monaco from 'monaco-editor'

type MonacoEditorsProps = {
  original: string
  modified: string
  language: string
  darkMode: boolean
  editorHeight: number
  diffHeight: number
  onChangeOriginal(value: string): void
  onChangeModified(value: string): void
  className?: string
}

const toMonacoLanguage = (lang: string) => {
  // Keep existing UI options; map unknowns to plaintext.
  if (!lang || lang === 'auto' || lang === 'plaintext') return 'plaintext'
  // Monaco uses 'shell' as 'shell'/'shellscript' depending on contrib; 'shell' works in many builds.
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
  diffHeight,
  onChangeOriginal,
  onChangeModified,
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

  useEffect(() => {
    if (!originalEl.current || !modifiedEl.current || !diffEl.current) return

    // Models
    originalModelRef.current = monaco.editor.createModel(original, monacoLang)
    modifiedModelRef.current = monaco.editor.createModel(modified, monacoLang)

    diffOriginalModelRef.current = monaco.editor.createModel(original, monacoLang)
    diffModifiedModelRef.current = monaco.editor.createModel(modified, monacoLang)

    // Editors
    originalEditorRef.current = monaco.editor.create(originalEl.current, {
      model: originalModelRef.current,
      theme,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      fontSize: 12,
    })

    modifiedEditorRef.current = monaco.editor.create(modifiedEl.current, {
      model: modifiedModelRef.current,
      theme,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      fontSize: 12,
    })

    diffEditorRef.current = monaco.editor.createDiffEditor(diffEl.current, {
      theme,
      // These options are the closest knobs to VSCode behavior.
      ignoreTrimWhitespace: false,
      renderSideBySide: true,
      renderIndicators: true,
      originalEditable: false,
      readOnly: true,
      enableSplitViewResizing: false,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      // This is the “scrollbar minimap markers” style you mentioned.
      scrollbar: {
        verticalScrollbarSize: 12,
        vertical: 'auto',
      },
      minimap: { enabled: false },
    })

    diffEditorRef.current.setModel({
      original: diffOriginalModelRef.current,
      modified: diffModifiedModelRef.current,
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
      diffEditorRef.current?.dispose()

      originalModelRef.current?.dispose()
      modifiedModelRef.current?.dispose()
      diffOriginalModelRef.current?.dispose()
      diffModifiedModelRef.current?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep theme in sync.
  useEffect(() => {
    monaco.editor.setTheme(theme)
  }, [theme])

  // Keep language in sync.
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

  // Keep diff models in sync with current values.
  useEffect(() => {
    if (originalModelRef.current && originalModelRef.current.getValue() !== original) {
      originalModelRef.current.setValue(original)
    }
    if (modifiedModelRef.current && modifiedModelRef.current.getValue() !== modified) {
      modifiedModelRef.current.setValue(modified)
    }

    if (diffOriginalModelRef.current && diffOriginalModelRef.current.getValue() !== original) {
      diffOriginalModelRef.current.setValue(original)
    }
    if (diffModifiedModelRef.current && diffModifiedModelRef.current.getValue() !== modified) {
      diffModifiedModelRef.current.setValue(modified)
    }
  }, [original, modified])

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-none">
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="px-4 py-2 text-sm font-semibold bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
            Original
          </div>
          <div ref={originalEl} style={{ height: editorHeight }} />
        </div>

        <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="px-4 py-2 text-sm font-semibold bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
            Modified
          </div>
          <div ref={modifiedEl} style={{ height: editorHeight }} />
        </div>
      </div>

      <div className="panel flex-1 min-h-[200px] flex flex-col animate-fade-in mt-3">
        <div className="panel-header py-2">
          <h2 className="panel-title flex items-center gap-2 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Diff Preview
          </h2>
        </div>

        <div ref={diffEl} style={{ height: diffHeight }} />
      </div>
    </div>
  )
}
