interface ToolbarProps {
  language: string
  detectedLanguage: string
  languages: { value: string; label: string }[]
  onLanguageChange: (lang: string) => void
  diffStyle: 'split' | 'unified'
  onDiffStyleChange: (style: 'split' | 'unified') => void

  // New options
  lineDiffType: 'word-alt' | 'word' | 'char' | 'none'
  onLineDiffTypeChange: (type: 'word-alt' | 'word' | 'char' | 'none') => void
  showBackgrounds: boolean
  onToggleBackgrounds: () => void
  wrapText: boolean
  onToggleWrap: () => void
  showLineNumbers: boolean
  onToggleLineNumbers: () => void

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
  lineDiffType,
  onLineDiffTypeChange,
  showBackgrounds,
  onToggleBackgrounds,
  wrapText,
  onToggleWrap,
  showLineNumbers,
  onToggleLineNumbers,
  onSwap,
  onClear,
}: ToolbarProps) {
  const allLanguages = [{ value: 'auto', label: 'Auto Detect ✨' }, ...languages]

  // Find the label for detected language
  const detectedLabel = languages.find(l => l.value === detectedLanguage)?.label || detectedLanguage

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm animate-slide-up">
      {/* Primary Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {/* Language selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400">
              Language:
            </label>
            <div className="relative flex flex-col">
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
                <span className="text-[10px] text-primary-500 mt-0.5 ml-1 animate-fade-in absolute -bottom-4 whitespace-nowrap">
                  Detected: {detectedLabel}
                </span>
              )}
            </div>
          </div>

          {/* Diff style toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400">
              View:
            </label>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${diffStyle === 'split' ? 'active' : ''}`}
                onClick={() => onDiffStyleChange('split')}
              >
                Split
              </button>
              <button
                className={`toggle-btn ${diffStyle === 'unified' ? 'active' : ''}`}
                onClick={() => onDiffStyleChange('unified')}
              >
                Unified
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={onSwap}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Swap
          </button>
          <button className="btn btn-secondary text-red-500 hover:text-red-600" onClick={onClear}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        </div>
      </div>

      {/* Secondary Row (Advanced Options) */}
      <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-surface-100 dark:border-surface-800">
        {/* Word-Alt Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-surface-500 dark:text-surface-400">
            Inline Mode:
          </label>
          <select
            className="select py-1 text-xs"
            value={lineDiffType}
            onChange={(e) => onLineDiffTypeChange(e.target.value as any)}
          >
            <option value="word-alt">Word Alt (Better)</option>
            <option value="word">Word</option>
            <option value="char">Character</option>
            <option value="none">None</option>
          </select>
        </div>

        {/* Option Toggles */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-primary-500 rounded"
              checked={showBackgrounds}
              onChange={onToggleBackgrounds}
            />
            <span className="text-xs text-surface-600 dark:text-surface-400">Backgrounds</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-primary-500 rounded"
              checked={wrapText}
              onChange={onToggleWrap}
            />
            <span className="text-xs text-surface-600 dark:text-surface-400">Wrapping</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-primary-500 rounded"
              checked={showLineNumbers}
              onChange={onToggleLineNumbers}
            />
            <span className="text-xs text-surface-600 dark:text-surface-400">Line Numbers</span>
          </label>
        </div>
      </div>
    </div>
  )
}
