import { useEffect } from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  lineDiffType: 'word-alt' | 'word' | 'char' | 'none'
  onLineDiffTypeChange: (type: 'word-alt' | 'word' | 'char' | 'none') => void
  showBackgrounds: boolean
  onToggleBackgrounds: () => void
  wrapText: boolean
  onToggleWrap: () => void
  showLineNumbers: boolean
  onToggleLineNumbers: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  lineDiffType,
  onLineDiffTypeChange,
  showBackgrounds,
  onToggleBackgrounds,
  wrapText,
  onToggleWrap,
  showLineNumbers,
  onToggleLineNumbers,
}: SettingsModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-slide-up">
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-base font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Diff Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* Inline Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Inline Diff Mode
              </label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={lineDiffType}
                onChange={(e) => onLineDiffTypeChange(e.target.value as any)}
              >
                <option value="word-alt">Word Alt (Recommended)</option>
                <option value="word">Word</option>
                <option value="char">Character</option>
                <option value="none">None</option>
              </select>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Controls how inline changes are highlighted within each line.
              </p>
            </div>

            {/* Toggle Options */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Display Options
              </label>

              {/* Background */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <div>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Show Backgrounds</span>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Color-coded backgrounds for added/removed lines
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-primary-500 rounded cursor-pointer"
                  checked={showBackgrounds}
                  onChange={onToggleBackgrounds}
                />
              </label>

              {/* Wrapping */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <div>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Line Wrapping</span>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Wrap long lines instead of horizontal scrolling
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-primary-500 rounded cursor-pointer"
                  checked={wrapText}
                  onChange={onToggleWrap}
                />
              </label>

              {/* Line Numbers */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <div>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Line Numbers</span>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Show line numbers in the diff view
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-primary-500 rounded cursor-pointer"
                  checked={showLineNumbers}
                  onChange={onToggleLineNumbers}
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700">
            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
