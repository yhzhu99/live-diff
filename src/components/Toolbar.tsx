interface ToolbarProps {
  language: string
  detectedLanguage: string
  languages: { value: string; label: string }[]
  onLanguageChange: (lang: string) => void
  diffStyle: 'split' | 'unified'
  onDiffStyleChange: (style: 'split' | 'unified') => void
  onSwap: () => void
  onClear: () => void
}

export function Toolbar({
  language,
  detectedLanguage,
  languages,
  onLanguageChange,
  diffStyle,
  onDiffStyleChange,
  onSwap,
  onClear,
}: ToolbarProps) {
  const allLanguages = [{ value: 'auto', label: 'Auto Detect ✨' }, ...languages]

  // Find the label for detected language
  const detectedLabel = languages.find(l => l.value === detectedLanguage)?.label || detectedLanguage

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Language selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-surface-600 dark:text-surface-400">
            Language:
          </label>
          <div className="flex flex-col">
            <select
              className="select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {allLanguages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            {language === 'auto' && detectedLanguage !== 'plaintext' && (
              <span className="text-[10px] text-primary-500 mt-0.5 ml-1 animate-fade-in absolute -bottom-4">
                Detected: {detectedLabel}
              </span>
            )}
          </div>
        </div>

        {/* Diff style toggle */}
        <div className="toggle-group">
          <button
            className={`toggle-btn ${diffStyle === 'split' ? 'active' : ''}`}
            onClick={() => onDiffStyleChange('split')}
            title="Side by side view"
          >
            <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Split
          </button>
          <button
            className={`toggle-btn ${diffStyle === 'unified' ? 'active' : ''}`}
            onClick={() => onDiffStyleChange('unified')}
            title="Unified view"
          >
            <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Unified
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Swap button */}
        <button
          className="btn btn-secondary"
          onClick={onSwap}
          title="Swap original and modified content"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Swap
        </button>

        {/* Clear button */}
        <button
          className="btn btn-secondary text-red-500 hover:text-red-600 hover:border-red-300 dark:hover:border-red-700"
          onClick={onClear}
          title="Clear all content"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear All
        </button>
      </div>
    </div>
  )
}
