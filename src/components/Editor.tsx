import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react'

interface EditorProps {
  title: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  darkMode: boolean
}

export function Editor({ title, placeholder, value, onChange, darkMode }: EditorProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    // Handle text data
    const text = e.dataTransfer.getData('text/plain')
    if (text) {
      onChange(text)
      return
    }

    // Handle file drop
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        onChange(content)
      }
      reader.readAsText(file)
    }
  }, [onChange])

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleClear = useCallback(() => {
    onChange('')
    textareaRef.current?.focus()
  }, [onChange])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange(text)
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }, [onChange])

  return (
    <div
      className={`panel flex flex-col drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="panel-header py-2 px-3">
        <h2 className="panel-title flex items-center gap-1.5 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {title}
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handlePaste}
            className="p-1.5 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Paste from clipboard"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          {value && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Clear content"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          spellCheck={false}
        />

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary-500/10 pointer-events-none">
            <div className={`flex flex-col items-center gap-2 p-6 rounded-xl ${darkMode ? 'bg-surface-800/90' : 'bg-white/90'} shadow-lg`}>
              <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium text-surface-600 dark:text-surface-300">
                Drop to add content
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!value && !isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xs">Drag & drop or paste</p>
            </div>
          </div>
        )}
      </div>

      {/* Character count */}
      <div className="px-3 py-1.5 text-[10px] text-surface-400 dark:text-surface-500 border-t border-surface-200 dark:border-surface-700">
        {value.trim().split(/\s+/).filter(Boolean).length} words • {value.length} chars • {value.split('\n').length} lines
      </div>
    </div>
  )
}
