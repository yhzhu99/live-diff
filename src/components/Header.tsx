interface HeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
  // Language controls
  language: string
  detectedLanguage: string
  languages: { value: string; label: string }[]
  onLanguageChange: (lang: string) => void
  // View controls
  diffStyle: 'split' | 'unified'
  onDiffStyleChange: (style: 'split' | 'unified') => void
  // Actions
  onSwap: () => void
  onClear: () => void
  // Settings
  onOpenSettings: () => void
}

export function Header({
  darkMode,
  onToggleDarkMode,
  language,
  detectedLanguage,
  languages,
  onLanguageChange,
  diffStyle,
  onDiffStyleChange,
  onSwap,
  onClear,
  onOpenSettings,
}: HeaderProps) {
  const allLanguages = [{ value: 'auto', label: 'Auto ✨' }, ...languages]
  const detectedLabel = languages.find(l => l.value === detectedLanguage)?.label || detectedLanguage

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20">
          <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-surface-900 dark:text-white">
          Live Diff
        </h1>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-surface-500 dark:text-surface-400">
            Language
          </label>
          <div className="flex items-center gap-1.5 px-1 pb-1.5 pt-1 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <select
              className="bg-transparent text-sm text-surface-700 dark:text-surface-300 focus:outline-none cursor-pointer pl-1.5 pr-1 py-0.5 min-w-[80px]"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {allLanguages.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-surface-100 dark:bg-surface-800">
                  {lang.label}
                </option>
              ))}
            </select>
            {language === 'auto' && detectedLanguage !== 'plaintext' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 whitespace-nowrap animate-fade-in mr-1">
                {detectedLabel}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-surface-200 dark:bg-surface-700" />

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-surface-500 dark:text-surface-400">
            View
          </label>
          <div className="inline-flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                diffStyle === 'split'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
              onClick={() => onDiffStyleChange('split')}
            >
              Split
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                diffStyle === 'unified'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
              onClick={() => onDiffStyleChange('unified')}
            >
              Unified
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-surface-200 dark:bg-surface-700" />

        {/* Swap Button */}
        <button
          onClick={onSwap}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title="Swap original and modified content"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Swap
        </button>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Clear all content"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title="Diff Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title="View on GitHub"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
