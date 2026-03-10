import { useState, useRef, useEffect, useMemo } from 'react'
import type { HistorySnapshot } from '../utils/persistence'

interface HeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
  language: string
  detectedLanguage: string
  languages: { value: string; label: string }[]
  onLanguageChange: (lang: string) => void
  onSwap: () => void
  onSave: () => void
  saveStatus: 'idle' | 'saving' | 'saved'
  isSaveDisabled: boolean
  historyItems: HistorySnapshot[]
  isHistoryLoading: boolean
  onSelectHistory: (snapshotId: string) => void
  onDeleteHistory: (snapshotId: string) => void
  onClear: () => void
}

function HistoryCard({
  item,
  savedAtLabel,
  onSelect,
  onDelete,
}: {
  item: HistorySnapshot
  savedAtLabel: string
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <article className="rounded-[28px] border border-surface-200/80 dark:border-surface-700/80 bg-surface-50/80 dark:bg-surface-900/60 shadow-sm p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
          {savedAtLabel}
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-900 text-white dark:bg-primary-500 dark:text-surface-950 text-[11px] font-semibold hover:bg-primary-600 dark:hover:bg-primary-400 transition-colors"
          >
            <span>Restore</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16m0 0l-6-6m6 6l-6 6" />
            </svg>
          </button>

          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-300 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete this history entry"
            aria-label="Delete this history entry"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-surface-200/80 dark:border-surface-800 bg-white/90 dark:bg-surface-950/60 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-400 dark:text-surface-500">
            Original
          </div>
          <p className="mt-1 text-[11px] leading-4.5 font-mono text-surface-700 dark:text-surface-200 min-h-[3.25rem] break-all">
            {item.summaryOriginal}
          </p>
        </div>

        <div className="rounded-2xl border border-surface-200/80 dark:border-surface-800 bg-white/90 dark:bg-surface-950/60 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-400 dark:text-surface-500">
            Modified
          </div>
          <p className="mt-1 text-[11px] leading-4.5 font-mono text-surface-700 dark:text-surface-200 min-h-[3.25rem] break-all">
            {item.summaryModified}
          </p>
        </div>
      </div>
    </article>
  )
}

export function Header({
  darkMode,
  onToggleDarkMode,
  language,
  detectedLanguage,
  languages,
  onLanguageChange,
  onSwap,
  onSave,
  saveStatus,
  isSaveDisabled,
  historyItems,
  isHistoryLoading,
  onSelectHistory,
  onDeleteHistory,
  onClear,
}: HeaderProps) {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const allLanguages = [{ value: 'auto', label: 'Auto ✨' }, ...languages]
  const currentLanguageLabel = allLanguages.find(item => item.value === language)?.label || language
  const detectedLabel = languages.find(item => item.value === detectedLanguage)?.label || detectedLanguage
  const isAutoLanguage = language === 'auto'
  const compactLanguageMetaLabel = isAutoLanguage ? 'Auto' : 'Language'
  const compactLanguageLabel = isAutoLanguage
    ? detectedLanguage !== 'plaintext'
      ? detectedLabel
      : 'Plain Text'
    : currentLanguageLabel
  const saveLabel = saveStatus === 'saving' ? 'Saving' : saveStatus === 'saved' ? 'Saved' : 'Save'
  const savedAtFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    []
  )

  const filteredHistoryItems = useMemo(() => {
    const query = historyQuery.trim().toLowerCase()
    if (!query) return historyItems

    return historyItems.filter((item) => {
      const haystack = [item.summaryOriginal, item.summaryModified].join(' ').toLowerCase()

      return haystack.includes(query)
    })
  }, [historyItems, historyQuery])

  useEffect(() => {
    if (!isHistoryModalOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsHistoryModalOpen(false)
        setHistoryQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    searchInputRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isHistoryModalOpen])

  const openHistoryModal = () => {
    setIsLanguageOpen(false)
    setIsHistoryModalOpen(true)
  }

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false)
    setHistoryQuery('')
  }

  const historySummaryLabel = isHistoryLoading
    ? 'Loading...'
    : historyQuery
      ? `${filteredHistoryItems.length} result${filteredHistoryItems.length === 1 ? '' : 's'}`
      : `${historyItems.length} saved`

  return (
    <>
      <header className="flex items-center justify-between px-3 md:px-5 py-3 border-b border-surface-200/80 dark:border-surface-800/80 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl sticky top-0 z-50 overflow-x-auto md:overflow-visible no-scrollbar gap-3">
        <div className="flex items-center gap-3 select-none shrink-0">
          <div className="relative group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-emerald-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-center overflow-hidden shadow-sm group-active:scale-95 transition-transform">
              <img src="/logo.svg" alt="Live Diff Logo" className="w-7 h-7 group-hover:rotate-12 transition-transform duration-500" />
            </div>
          </div>
          <div className="flex-col hidden sm:flex">
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-surface-900 via-primary-600 to-emerald-600 dark:from-white dark:via-primary-400 dark:to-emerald-400 bg-clip-text text-transparent leading-tight">
              Live Diff
            </h1>
            <span className="text-[10px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-[0.2em] leading-none">
              Real-time Comparison
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-100/50 dark:bg-surface-800/50 p-1 rounded-2xl border border-surface-200/50 dark:border-surface-700/50 shrink-0">
          <div className="relative shrink-0">
            <button
              onClick={() => setIsLanguageOpen(current => !current)}
              className="flex items-center gap-2 px-3 py-1.5 h-11 rounded-xl hover:bg-white dark:hover:bg-surface-700 shadow-sm hover:shadow-md transition-all duration-300 w-[136px] sm:w-[156px] text-left group border border-transparent hover:border-surface-200 dark:hover:border-surface-600"
              title={isAutoLanguage && detectedLanguage !== 'plaintext' ? `Language: Auto (${detectedLabel})` : 'Select language'}
            >
              <div className="min-w-0 flex-1">
                <div className={`text-[9px] font-bold uppercase tracking-[0.14em] leading-none ${
                  isAutoLanguage
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-400 dark:text-surface-500'
                }`}>
                  {compactLanguageMetaLabel}
                </div>
                <div className="mt-0.5 text-sm font-bold text-surface-700 dark:text-surface-200 truncate leading-tight">
                  {compactLanguageLabel}
                </div>
              </div>
              <div className="shrink-0">
                <svg
                  className={`w-4 h-4 text-surface-400 transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isLanguageOpen && (
              <div className="absolute top-full left-0 mt-2 py-2 bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl border border-surface-200/80 dark:border-surface-700/80 rounded-2xl shadow-2xl shadow-surface-900/10 dark:shadow-black/30 z-50 w-[240px] max-h-[400px] overflow-auto">
                <div className="px-3 py-1.5 mb-1 border-b border-surface-100 dark:border-surface-800">
                  <span className="text-[10px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest">Select Language</span>
                </div>
                {allLanguages.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      onLanguageChange(item.value)
                      setIsLanguageOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-all duration-200 flex items-center justify-between ${
                      language === item.value
                        ? 'bg-primary-500 text-white font-bold'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/80'
                    }`}
                  >
                    <span>{item.label}</span>
                    {language === item.value && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-surface-200 dark:bg-surface-700" />

          <button
            onClick={onSwap}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 group border border-transparent hover:border-surface-200 dark:hover:border-surface-600"
            title="Swap content"
          >
            <div className="p-1 rounded-lg bg-surface-200/50 dark:bg-surface-800 group-hover:bg-primary-500/10 transition-colors">
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="hidden sm:block text-xs font-bold uppercase tracking-wider">Swap</span>
          </button>

          <button
            onClick={onSave}
            disabled={isSaveDisabled || saveStatus === 'saving'}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 rounded-xl shadow-sm transition-all duration-300 active:scale-95 group border w-11 sm:w-[96px] ${
              isSaveDisabled
                ? 'cursor-not-allowed border-transparent text-surface-400 dark:text-surface-500 bg-transparent'
                : 'border-transparent hover:border-surface-200 dark:hover:border-surface-600 hover:bg-white dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-md'
            }`}
            title="Save current diff to history"
          >
            <div className={`p-1 rounded-lg transition-colors ${
              isSaveDisabled
                ? 'bg-surface-200/50 dark:bg-surface-800'
                : 'bg-surface-200/50 dark:bg-surface-800 group-hover:bg-emerald-500/10'
            }`}>
              {saveStatus === 'saving' ? (
                <div className="diff-loading-spinner" aria-hidden="true" />
              ) : saveStatus === 'saved' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5h14v14H5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v5h8V5m-6 9h4" />
                </svg>
              )}
            </div>
            <span className="hidden sm:block text-xs font-bold uppercase tracking-wider">{saveLabel}</span>
          </button>

          <button
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 hover:text-red-500 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 group border border-transparent hover:border-surface-200 dark:hover:border-surface-600"
            title="Clear current diff"
          >
            <div className="p-1 rounded-lg bg-surface-200/50 dark:bg-surface-800 group-hover:bg-red-500/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <span className="hidden sm:block text-xs font-bold uppercase tracking-wider">Clear</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openHistoryModal}
            className="relative flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 group overflow-visible w-11 sm:w-[118px] border border-transparent hover:border-surface-200 dark:hover:border-surface-600"
            title="Open history manager"
          >
            <div className="p-1 rounded-lg bg-surface-200/50 dark:bg-surface-800 group-hover:bg-primary-500/10 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="hidden sm:block text-xs font-bold uppercase tracking-wider">History</span>
            {isHistoryLoading ? (
              <span className="absolute -top-1 -right-1">
                <span className="diff-loading-spinner" aria-hidden="true" />
              </span>
            ) : historyItems.length > 0 ? (
              <span className="absolute -top-1.5 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-primary-500/20">
                {historyItems.length > 99 ? '99+' : historyItems.length}
              </span>
            ) : null}
          </button>

          <a
            href="https://github.com/yhzhu99/live-diff"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-300 group"
            title="View on GitHub"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <div className="hidden md:flex flex-col items-start leading-none gap-0.5">
              <span className="text-[10px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest">Star on</span>
              <span className="text-xs font-bold text-surface-700 dark:text-surface-200">GitHub</span>
            </div>
          </a>

          <button
            onClick={onToggleDarkMode}
            className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-amber-400 hover:shadow-lg transition-all duration-300 group overflow-hidden"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className={`transition-all duration-500 transform ${darkMode ? 'rotate-[360deg] scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div className={`absolute transition-all duration-500 transform ${darkMode ? 'rotate-0 scale-100 opacity-100' : 'rotate-[-360deg] scale-0 opacity-0'}`}>
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </button>
        </div>
      </header>

      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 md:p-6">
          <div
            className="absolute inset-0 bg-surface-950/50 backdrop-blur-sm"
            onClick={closeHistoryModal}
          />

          <div className="relative w-full max-w-5xl mt-4 md:mt-10 rounded-[32px] border border-surface-200/70 dark:border-surface-700/70 bg-white/95 dark:bg-surface-900/95 shadow-2xl shadow-surface-950/20 dark:shadow-black/40 overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-surface-200/70 dark:border-surface-800/80 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white">
                  History
                </h2>
                <span className="inline-flex items-center rounded-full bg-surface-100 dark:bg-surface-800 px-2.5 py-1 text-xs font-semibold text-surface-500 dark:text-surface-300 whitespace-nowrap">
                  {historySummaryLabel}
                </span>
              </div>

              <div className="flex items-center gap-2 md:ml-auto">
                <div className="relative w-full md:w-[320px]">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={historyQuery}
                    onChange={(event) => setHistoryQuery(event.target.value)}
                    placeholder="Search original or modified"
                    className="w-full rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-950 px-4 py-3 pl-11 text-sm text-surface-700 dark:text-surface-200 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.6-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {!isHistoryLoading && historyQuery && (
                  <button
                    onClick={() => setHistoryQuery('')}
                    className="hidden sm:inline-flex items-center justify-center px-3 py-2 rounded-2xl text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                  >
                    Clear
                  </button>
                )}

                <button
                  onClick={closeHistoryModal}
                  className="flex items-center justify-center w-11 h-11 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors shrink-0"
                  title="Close history"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-180px)] overflow-auto px-5 md:px-6 py-5">
              {isHistoryLoading ? (
                <div className="min-h-[280px] flex flex-col items-center justify-center text-center">
                  <div className="diff-loading-spinner diff-loading-spinner--lg" aria-hidden="true" />
                  <p className="mt-4 text-sm font-semibold text-surface-700 dark:text-surface-200">Loading saved history</p>
                  <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">Preparing your previously saved diffs.</p>
                </div>
              ) : filteredHistoryItems.length === 0 ? (
                <div className="min-h-[280px] flex flex-col items-center justify-center text-center px-4">
                  <div className="w-14 h-14 rounded-3xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <svg className="w-7 h-7 text-surface-400 dark:text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-base font-semibold text-surface-900 dark:text-white">
                    {historyQuery ? 'No matching history found' : 'No saved history yet'}
                  </p>
                  <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 max-w-md">
                    {historyQuery
                      ? 'Try a different keyword, or clear the search to browse all saved diffs.'
                      : 'Use SAVE in the header to keep a diff that you want to revisit later.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredHistoryItems.map((item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      savedAtLabel={savedAtFormatter.format(new Date(item.savedAt))}
                      onSelect={() => {
                        onSelectHistory(item.id)
                        closeHistoryModal()
                      }}
                      onDelete={() => onDeleteHistory(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
