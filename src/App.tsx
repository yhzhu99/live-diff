import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import hljs from 'highlight.js'
import { Header } from './components/Header'
import { MonacoEditors } from './components/MonacoEditors'
import {
  deleteHistorySnapshot,
  getCachedWorkspaceDraft,
  listHistory,
  loadHistoryItem,
  loadWorkspace,
  saveHistorySnapshot,
  saveWorkspaceDraft,
  type HistorySnapshot,
  type PersistedDiffState,
  type WorkspaceDraft,
} from './utils/persistence'

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

const STORAGE_KEYS = {
  DARK_MODE: 'live-diff-dark-mode',
  EDITOR_HEIGHT: 'live-diff-editor-height',
}

const MIN_EDITOR_HEIGHT = 100
const MAX_EDITOR_HEIGHT_RATIO = 0.6
const HEADER_HEIGHT = 56
const DRAFT_SAVE_DEBOUNCE_MS = 400
const SAVE_FEEDBACK_MS = 1600

const toMonacoLanguage = (lang: string) => {
  if (!lang || lang === 'auto' || lang === 'plaintext') return 'plaintext'
  if (lang === 'dockerfile') return 'dockerfile'
  if (lang === 'csharp') return 'csharp'
  return lang
}

function readBooleanSetting(key: string, fallback = false) {
  try {
    return localStorage.getItem(key) === 'true'
  } catch {
    return fallback
  }
}

function readNumberSetting(key: string, fallback: number) {
  try {
    const parsed = parseInt(localStorage.getItem(key) || '', 10)
    return !Number.isNaN(parsed) && parsed >= MIN_EDITOR_HEIGHT ? parsed : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const initialWorkspaceRef = useRef<WorkspaceDraft | null | undefined>(undefined)
  if (initialWorkspaceRef.current === undefined) {
    initialWorkspaceRef.current = getCachedWorkspaceDraft()
  }
  const initialWorkspace = initialWorkspaceRef.current ?? null

  const [language, setLanguage] = useState(initialWorkspace?.language ?? 'auto')
  const [detectedLanguage, setDetectedLanguage] = useState(initialWorkspace?.detectedLanguage ?? 'plaintext')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [renderSideBySide, setRenderSideBySide] = useState(true)
  const [darkMode, setDarkMode] = useState(() => readBooleanSetting(STORAGE_KEYS.DARK_MODE))
  const [editorHeight, setEditorHeight] = useState(() => readNumberSetting(STORAGE_KEYS.EDITOR_HEIGHT, 220))
  const [historyItems, setHistoryItems] = useState<HistorySnapshot[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [workspaceVersion, setWorkspaceVersion] = useState(0)
  const [isWorkspaceHydrated, setIsWorkspaceHydrated] = useState(false)

  const originalModelRef = useRef<monaco.editor.ITextModel | null>(null)
  const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null)
  if (!originalModelRef.current || originalModelRef.current.isDisposed()) {
    originalModelRef.current = monaco.editor.createModel(initialWorkspace?.original ?? '', 'plaintext')
  }
  if (!modifiedModelRef.current || modifiedModelRef.current.isDisposed()) {
    modifiedModelRef.current = monaco.editor.createModel(initialWorkspace?.modified ?? '', 'plaintext')
  }
  const originalModel = originalModelRef.current
  const modifiedModel = modifiedModelRef.current

  const isResizing = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isApplyingPersistedStateRef = useRef(false)
  const didMutateBeforeHydrationRef = useRef(false)

  const applyWorkspace = useCallback((
    workspace: PersistedDiffState,
    options?: { syncLanguage?: boolean }
  ) => {
    const syncLanguage = options?.syncLanguage ?? true

    isApplyingPersistedStateRef.current = true

    try {
      if (originalModel.getValue() !== workspace.original) {
        originalModel.setValue(workspace.original)
      }
      if (modifiedModel.getValue() !== workspace.modified) {
        modifiedModel.setValue(workspace.modified)
      }
      if (syncLanguage) {
        setLanguage(workspace.language)
        setDetectedLanguage(workspace.detectedLanguage)
      }
    } finally {
      isApplyingPersistedStateRef.current = false
    }
  }, [originalModel, modifiedModel])

  const getCurrentWorkspaceState = useCallback((): PersistedDiffState => ({
    original: originalModel.getValue(),
    modified: modifiedModel.getValue(),
    language,
    detectedLanguage,
  }), [originalModel, modifiedModel, language, detectedLanguage])

  const persistWorkspaceNow = useCallback((override?: PersistedDiffState) => {
    const nextState = override ?? getCurrentWorkspaceState()
    return saveWorkspaceDraft(nextState)
  }, [getCurrentWorkspaceState])

  const scheduleWorkspacePersist = useCallback(() => {
    if (!isWorkspaceHydrated || isApplyingPersistedStateRef.current) return

    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current)
    draftSaveTimerRef.current = setTimeout(() => {
      draftSaveTimerRef.current = null
      void persistWorkspaceNow()
    }, DRAFT_SAVE_DEBOUNCE_MS)
  }, [isWorkspaceHydrated, persistWorkspaceNow])

  const refreshHistory = useCallback(async () => {
    setIsHistoryLoading(true)

    try {
      const items = await listHistory()
      setHistoryItems(items)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  const resetSaveFeedback = useCallback(() => {
    if (saveFeedbackTimerRef.current) {
      clearTimeout(saveFeedbackTimerRef.current)
      saveFeedbackTimerRef.current = null
    }

    setSaveStatus(current => (current === 'saved' ? 'idle' : current))
  }, [])

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

  const handleResize = useCallback((event: MouseEvent) => {
    if (!isResizing.current) return

    const maxHeight = Math.floor(window.innerHeight * MAX_EDITOR_HEIGHT_RATIO)
    const containerTop = HEADER_HEIGHT + 16
    const newHeight = event.clientY - containerTop

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)

    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(darkMode))
    } catch {
      // Ignore LocalStorage failures and keep the in-memory toggle working.
    }
  }, [darkMode])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EDITOR_HEIGHT, String(editorHeight))
    } catch {
      // Ignore LocalStorage failures and keep the in-memory size working.
    }
  }, [editorHeight])

  useEffect(() => {
    let isCancelled = false

    const hydrateWorkspace = async () => {
      const persisted = await loadWorkspace()
      if (isCancelled) return

      if (persisted && !didMutateBeforeHydrationRef.current) {
        applyWorkspace(persisted, { syncLanguage: initialWorkspace == null })
      }

      setIsWorkspaceHydrated(true)

      if (didMutateBeforeHydrationRef.current) {
        void persistWorkspaceNow()
      }
    }

    void hydrateWorkspace()

    return () => {
      isCancelled = true
    }
  }, [applyWorkspace, persistWorkspaceNow])

  useEffect(() => {
    void refreshHistory()
  }, [refreshHistory])

  useEffect(() => {
    const handleModelChange = () => {
      resetSaveFeedback()

      if (!isApplyingPersistedStateRef.current && !isWorkspaceHydrated) {
        didMutateBeforeHydrationRef.current = true
      }

      setWorkspaceVersion(version => version + 1)
      scheduleWorkspacePersist()
    }

    const originalSubscription = originalModel.onDidChangeContent(handleModelChange)
    const modifiedSubscription = modifiedModel.onDidChangeContent(handleModelChange)

    return () => {
      originalSubscription.dispose()
      modifiedSubscription.dispose()
    }
  }, [isWorkspaceHydrated, originalModel, modifiedModel, resetSaveFeedback, scheduleWorkspacePersist])

  useEffect(() => {
    if (!isWorkspaceHydrated || isApplyingPersistedStateRef.current) return
    scheduleWorkspacePersist()
  }, [detectedLanguage, isWorkspaceHydrated, language, scheduleWorkspacePersist])

  useEffect(() => {
    if (language !== 'auto') {
      setDetectedLanguage(language)
      return
    }

    let timer: ReturnType<typeof setTimeout> | null = null

    const detect = () => {
      if (timer) clearTimeout(timer)

      timer = setTimeout(() => {
        const originalSample = originalModel.getValue(monaco.editor.EndOfLinePreference.LF, false).substring(0, 1000)
        const modifiedSample = modifiedModel.getValue(monaco.editor.EndOfLinePreference.LF, false).substring(0, 1000)
        const contentToDetect = `${originalSample}\n${modifiedSample}`.trim()

        if (!contentToDetect) {
          setDetectedLanguage('plaintext')
          return
        }

        try {
          const languageSubset = LANGUAGES.map(item => item.value).filter(value => value !== 'plaintext')
          const result = hljs.highlightAuto(contentToDetect, languageSubset)
          setDetectedLanguage(result.language || 'plaintext')
        } catch {
          setDetectedLanguage('plaintext')
        }
      }, 500)
    }

    detect()

    const originalSubscription = originalModel.onDidChangeContent(detect)
    const modifiedSubscription = modifiedModel.onDidChangeContent(detect)

    return () => {
      if (timer) clearTimeout(timer)
      originalSubscription.dispose()
      modifiedSubscription.dispose()
    }
  }, [language, originalModel, modifiedModel])

  const effectiveLanguage = useMemo(
    () => (language === 'auto' ? detectedLanguage : language),
    [language, detectedLanguage]
  )

  const monacoLanguage = useMemo(
    () => toMonacoLanguage(effectiveLanguage),
    [effectiveLanguage]
  )

  const isWorkspaceEmpty = useMemo(
    () => originalModel.getValueLength() === 0 && modifiedModel.getValueLength() === 0,
    [originalModel, modifiedModel, workspaceVersion]
  )

  useEffect(() => {
    monaco.editor.setModelLanguage(originalModel, monacoLanguage)
    monaco.editor.setModelLanguage(modifiedModel, monacoLanguage)
  }, [monacoLanguage, originalModel, modifiedModel])

  useEffect(() => {
    const handlePageHide = () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current)
        draftSaveTimerRef.current = null
      }

      if (isWorkspaceHydrated) {
        void persistWorkspaceNow()
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handlePageHide)
    }
  }, [isWorkspaceHydrated, persistWorkspaceNow])

  useEffect(() => {
    return () => {
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current)
      if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current)
    }
  }, [])

  const handleLanguageChange = useCallback((nextLanguage: string) => {
    resetSaveFeedback()

    if (!isApplyingPersistedStateRef.current && !isWorkspaceHydrated) {
      didMutateBeforeHydrationRef.current = true
    }

    setLanguage(nextLanguage)
  }, [isWorkspaceHydrated, resetSaveFeedback])

  const handleSwap = useCallback(() => {
    const originalValue = originalModel.getValue()
    const modifiedValue = modifiedModel.getValue()

    originalModel.setValue(modifiedValue)
    modifiedModel.setValue(originalValue)
  }, [originalModel, modifiedModel])

  const handleClear = useCallback(() => {
    originalModel.setValue('')
    modifiedModel.setValue('')

    if (language === 'auto') {
      setDetectedLanguage('plaintext')
    }
  }, [language, originalModel, modifiedModel])

  const handleClearOriginal = useCallback(() => {
    originalModel.setValue('')
  }, [originalModel])

  const handleClearModified = useCallback(() => {
    modifiedModel.setValue('')
  }, [modifiedModel])

  const handleSaveSnapshot = useCallback(async () => {
    if (isWorkspaceEmpty || saveStatus === 'saving') return

    setSaveStatus('saving')

    try {
      await saveHistorySnapshot(getCurrentWorkspaceState())
      await refreshHistory()

      if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current)
      setSaveStatus('saved')
      saveFeedbackTimerRef.current = setTimeout(() => {
        setSaveStatus('idle')
        saveFeedbackTimerRef.current = null
      }, SAVE_FEEDBACK_MS)
    } catch (error) {
      console.error('[live-diff] failed to save history snapshot', error)
      setSaveStatus('idle')
    }
  }, [getCurrentWorkspaceState, isWorkspaceEmpty, refreshHistory, saveStatus])

  const handleSelectHistory = useCallback(async (snapshotId: string) => {
    const snapshot = await loadHistoryItem(snapshotId) ?? historyItems.find(item => item.id === snapshotId)
    if (!snapshot) return

    applyWorkspace(snapshot)
    void persistWorkspaceNow(snapshot)
  }, [applyWorkspace, historyItems, persistWorkspaceNow])

  const handleDeleteHistory = useCallback(async (snapshotId: string) => {
    try {
      const nextHistory = await deleteHistorySnapshot(snapshotId)
      setHistoryItems(nextHistory)
    } catch (error) {
      console.error('[live-diff] failed to delete history snapshot', error)
      await refreshHistory()
    }
  }, [refreshHistory])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(current => !current)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(current => !current)
  }, [])

  const toggleRenderSideBySide = useCallback(() => {
    setRenderSideBySide(current => !current)
  }, [])

  return (
    <div className={`min-h-screen md:h-screen flex flex-col overflow-y-auto md:overflow-hidden ${darkMode ? 'bg-surface-950' : 'bg-surface-50'}`}>
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        language={language}
        detectedLanguage={detectedLanguage}
        languages={LANGUAGES}
        onLanguageChange={handleLanguageChange}
        onSwap={handleSwap}
        onSave={handleSaveSnapshot}
        saveStatus={saveStatus}
        isSaveDisabled={isWorkspaceEmpty}
        historyItems={historyItems}
        isHistoryLoading={isHistoryLoading}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onClear={handleClear}
      />

      <main ref={containerRef} className="flex-1 flex flex-col p-2 md:p-4 gap-0 overflow-visible md:overflow-hidden">
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
