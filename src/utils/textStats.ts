/**
 * Text statistics utilities for character and word counting
 * Handles mixed Chinese/English text properly
 */

export interface TextStats {
  chars: number
  words: number
}

/**
 * Count words in a text string, handling mixed Chinese/English content
 * - English words are counted by spaces
 * - Chinese characters are counted individually as words
 * - Other CJK characters (Japanese, Korean) are also counted individually
 */
export function countWords(text: string): number {
  if (!text.trim()) return 0

  // Regex for CJK characters (Chinese, Japanese, Korean)
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g

  // Count CJK characters (each counts as one word)
  const cjkMatches = text.match(cjkRegex)
  const cjkCount = cjkMatches ? cjkMatches.length : 0

  // Remove CJK characters and count remaining words by whitespace
  const nonCjkText = text.replace(cjkRegex, ' ')
  const words = nonCjkText.trim().split(/\s+/).filter(word => word.length > 0)
  const nonCjkWordCount = words.length

  return cjkCount + nonCjkWordCount
}

/**
 * Count characters in a text string (excluding newlines for display purposes)
 */
export function countChars(text: string): number {
  return text.length
}

/**
 * Get complete text statistics
 */
export function getTextStats(text: string): TextStats {
  return {
    chars: countChars(text),
    words: countWords(text),
  }
}
