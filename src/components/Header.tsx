import { useState, useRef, useEffect } from 'react'

interface HeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
  // Language controls
  language: string
  detectedLanguage: string
  languages: { value: string; label: string }[]
  onLanguageChange: (lang: string) => void
  // Actions
  onSwap: () => void
  onClear: () => void
}

export function Header({
  darkMode,
  onToggleDarkMode,
  language,
  detectedLanguage,
  languages,
  onLanguageChange,
  onSwap,
  onClear,
}: HeaderProps) {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const allLanguages = [{ value: 'auto', label: 'Auto ✨' }, ...languages]
  const currentLanguageLabel = allLanguages.find(l => l.value === language)?.label || language
  const detectedLabel = languages.find(l => l.value === detectedLanguage)?.label || detectedLanguage

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-surface-200/80 dark:border-surface-800/80 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-emerald-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/logo.svg" alt="Live Diff Logo" className="w-7 h-7" />
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-surface-900 via-primary-600 to-emerald-600 dark:from-white dark:via-primary-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Live Diff
          </h1>
          <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-[0.2em] leading-none">
            Real-time Comparison
          </span>
        </div>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
            Language
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-200/80 dark:border-surface-700/80 hover:border-primary-500/50 hover:shadow-md hover:shadow-primary-500/5 transition-all duration-300 w-[200px] text-left group"
            >
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
                {currentLanguageLabel}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {language === 'auto' && detectedLanguage !== 'plaintext' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gradient-to-r from-primary-500/10 to-primary-600/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 whitespace-nowrap animate-fade-in shadow-sm">
                    {detectedLabel}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-surface-400 transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isLanguageOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl border border-surface-200/80 dark:border-surface-700/80 rounded-2xl shadow-2xl shadow-surface-900/10 dark:shadow-black/30 z-50 animate-slide-up max-h-[400px] overflow-auto">
                {allLanguages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      onLanguageChange(lang.value)
                      setIsLanguageOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-all duration-200 flex items-center justify-between ${
                      language === lang.value
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/80'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {language === lang.value && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-gradient-to-b from-transparent via-surface-300 to-transparent dark:via-surface-700" />

        {/* Swap Button */}
        <button
          onClick={onSwap}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-surface-600 dark:text-surface-400 hover:bg-surface-100/80 dark:hover:bg-surface-800/80 hover:text-surface-900 dark:hover:text-white transition-all duration-200 group"
          title="Swap original and modified content"
        >
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Swap
        </button>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200"
          title="Clear all content"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* GitHub link */}
        <a
          href="https://github.com/yhzhu99/live-diff"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100/80 dark:hover:bg-surface-800/80 transition-all duration-200"
          title="View on GitHub"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2.5 rounded-xl text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100/80 dark:hover:bg-surface-800/80 transition-all duration-200"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
