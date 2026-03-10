const DB_NAME = 'live-diff-storage'
const DB_VERSION = 1
const WORKSPACE_STORE = 'workspace'
const HISTORY_STORE = 'history'
const WORKSPACE_KEY = 'active-workspace'
const WORKSPACE_CACHE_KEY = 'live-diff-workspace-cache'
const HISTORY_FALLBACK_KEY = 'live-diff-history-fallback'
const MAX_HISTORY_ITEMS = 50
const SUMMARY_MAX_LENGTH = 72

export type PersistedDiffState = {
  original: string
  modified: string
  language: string
  detectedLanguage: string
}

export interface WorkspaceDraft extends PersistedDiffState {
  id: typeof WORKSPACE_KEY
  updatedAt: string
}

export interface HistorySnapshot extends PersistedDiffState {
  id: string
  savedAt: string
  summaryOriginal: string
  summaryModified: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function isBrowserEnvironment() {
  return typeof window !== 'undefined'
}

function isIndexedDbAvailable() {
  return isBrowserEnvironment() && typeof indexedDB !== 'undefined'
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function isPersistedDiffState(value: unknown): value is PersistedDiffState {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.original === 'string' &&
    typeof candidate.modified === 'string' &&
    typeof candidate.language === 'string' &&
    typeof candidate.detectedLanguage === 'string'
  )
}

function isWorkspaceDraft(value: unknown): value is WorkspaceDraft {
  if (!isPersistedDiffState(value)) return false

  const candidate = value as Record<string, unknown>
  return candidate.id === WORKSPACE_KEY && typeof candidate.updatedAt === 'string'
}

function isHistorySnapshot(value: unknown): value is HistorySnapshot {
  if (!isPersistedDiffState(value)) return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.savedAt === 'string' &&
    typeof candidate.summaryOriginal === 'string' &&
    typeof candidate.summaryModified === 'string'
  )
}

function toTimestamp(value: string | undefined) {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function pickLatestDraft(
  primary: WorkspaceDraft | null,
  secondary: WorkspaceDraft | null
) {
  if (!primary) return secondary
  if (!secondary) return primary
  return toTimestamp(primary.updatedAt) >= toTimestamp(secondary.updatedAt) ? primary : secondary
}

function normalizeSummary(text: string, emptyLabel: string) {
  const firstMeaningfulLine = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .find(Boolean)

  const normalized = (firstMeaningfulLine ?? text.replace(/\s+/g, ' ').trim()).trim()

  if (!normalized) return emptyLabel
  if (normalized.length <= SUMMARY_MAX_LENGTH) return normalized

  return `${normalized.slice(0, SUMMARY_MAX_LENGTH - 1)}…`
}

function createDraft(payload: PersistedDiffState): WorkspaceDraft {
  return {
    id: WORKSPACE_KEY,
    original: payload.original,
    modified: payload.modified,
    language: payload.language,
    detectedLanguage: payload.detectedLanguage,
    updatedAt: new Date().toISOString(),
  }
}

function createSnapshot(payload: PersistedDiffState): HistorySnapshot {
  return {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    original: payload.original,
    modified: payload.modified,
    language: payload.language,
    detectedLanguage: payload.detectedLanguage,
    savedAt: new Date().toISOString(),
    summaryOriginal: normalizeSummary(payload.original, 'Empty original'),
    summaryModified: normalizeSummary(payload.modified, 'Empty modified'),
  }
}

function getWorkspaceCache() {
  if (!isBrowserEnvironment()) return null

  try {
    return parseJson<WorkspaceDraft>(localStorage.getItem(WORKSPACE_CACHE_KEY))
  } catch {
    return null
  }
}

function setWorkspaceCache(draft: WorkspaceDraft | null) {
  if (!isBrowserEnvironment()) return

  try {
    if (!draft) {
      localStorage.removeItem(WORKSPACE_CACHE_KEY)
      return
    }

    localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(draft))
  } catch {
    // Ignore storage quota or privacy mode failures.
  }
}

function getHistoryFallback() {
  if (!isBrowserEnvironment()) return [] as HistorySnapshot[]

  let parsed: HistorySnapshot[] | null = null

  try {
    parsed = parseJson<HistorySnapshot[]>(localStorage.getItem(HISTORY_FALLBACK_KEY))
  } catch {
    return []
  }

  if (!Array.isArray(parsed)) return []

  return parsed.filter(isHistorySnapshot).sort((left, right) => toTimestamp(right.savedAt) - toTimestamp(left.savedAt))
}

function setHistoryFallback(history: HistorySnapshot[]) {
  if (!isBrowserEnvironment()) return

  try {
    localStorage.setItem(HISTORY_FALLBACK_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)))
  } catch {
    // Ignore storage quota or privacy mode failures.
  }
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })
}

function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available'))
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result

        if (!database.objectStoreNames.contains(WORKSPACE_STORE)) {
          database.createObjectStore(WORKSPACE_STORE, { keyPath: 'id' })
        }

        if (!database.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = database.createObjectStore(HISTORY_STORE, { keyPath: 'id' })
          historyStore.createIndex('savedAt', 'savedAt')
        }
      }

      request.onsuccess = () => {
        const database = request.result
        database.onversionchange = () => database.close()
        resolve(database)
      }

      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
    }).catch((error) => {
      dbPromise = null
      throw error
    })
  }

  return dbPromise
}

async function withDatabase<T>(work: (database: IDBDatabase) => Promise<T>) {
  const database = await openDatabase()
  return work(database)
}

async function trimHistory(database: IDBDatabase) {
  const existing = await listHistoryFromDatabase(database)
  const overflow = existing.slice(MAX_HISTORY_ITEMS)
  if (overflow.length === 0) return

  const transaction = database.transaction(HISTORY_STORE, 'readwrite')
  const store = transaction.objectStore(HISTORY_STORE)

  overflow.forEach(item => {
    store.delete(item.id)
  })

  await transactionToPromise(transaction)
}

async function listHistoryFromDatabase(database: IDBDatabase) {
  const transaction = database.transaction(HISTORY_STORE, 'readonly')
  const store = transaction.objectStore(HISTORY_STORE)
  const items = await requestToPromise<HistorySnapshot[]>(store.getAll())
  await transactionToPromise(transaction)

  return items
    .filter(isHistorySnapshot)
    .sort((left, right) => toTimestamp(right.savedAt) - toTimestamp(left.savedAt))
}

export function getCachedWorkspaceDraft() {
  const cached = getWorkspaceCache()
  return cached && isWorkspaceDraft(cached) ? cached : null
}

export async function loadWorkspace() {
  const cached = getCachedWorkspaceDraft()

  try {
    const stored = await withDatabase(async (database) => {
      const transaction = database.transaction(WORKSPACE_STORE, 'readonly')
      const store = transaction.objectStore(WORKSPACE_STORE)
      const result = await requestToPromise<WorkspaceDraft | undefined>(store.get(WORKSPACE_KEY))
      await transactionToPromise(transaction)
      return result && isWorkspaceDraft(result) ? result : null
    })

    const latest = pickLatestDraft(stored, cached)
    if (latest) setWorkspaceCache(latest)
    return latest
  } catch {
    return cached
  }
}

export async function saveWorkspaceDraft(payload: PersistedDiffState) {
  const draft = createDraft(payload)
  setWorkspaceCache(draft)

  try {
    await withDatabase(async (database) => {
      const transaction = database.transaction(WORKSPACE_STORE, 'readwrite')
      transaction.objectStore(WORKSPACE_STORE).put(draft)
      await transactionToPromise(transaction)
    })
  } catch {
    // Keep the cache as the fallback source of truth when IndexedDB is unavailable.
  }

  return draft
}

export async function clearWorkspaceDraft() {
  return saveWorkspaceDraft({
    original: '',
    modified: '',
    language: 'auto',
    detectedLanguage: 'plaintext',
  })
}

export async function listHistory() {
  try {
    const history = await withDatabase(listHistoryFromDatabase)
    setHistoryFallback(history)
    return history
  } catch {
    return getHistoryFallback()
  }
}

export async function loadHistoryItem(id: string) {
  try {
    return await withDatabase(async (database) => {
      const transaction = database.transaction(HISTORY_STORE, 'readonly')
      const store = transaction.objectStore(HISTORY_STORE)
      const item = await requestToPromise<HistorySnapshot | undefined>(store.get(id))
      await transactionToPromise(transaction)
      return item && isHistorySnapshot(item) ? item : null
    })
  } catch {
    return getHistoryFallback().find(item => item.id === id) ?? null
  }
}

export async function deleteHistorySnapshot(id: string) {
  try {
    await withDatabase(async (database) => {
      const transaction = database.transaction(HISTORY_STORE, 'readwrite')
      transaction.objectStore(HISTORY_STORE).delete(id)
      await transactionToPromise(transaction)
    })

    const history = await listHistory()
    return history
  } catch {
    const nextHistory = getHistoryFallback().filter(item => item.id !== id)
    setHistoryFallback(nextHistory)
    return nextHistory
  }
}

export async function saveHistorySnapshot(payload: PersistedDiffState) {
  const snapshot = createSnapshot(payload)

  try {
    await withDatabase(async (database) => {
      const transaction = database.transaction(HISTORY_STORE, 'readwrite')
      transaction.objectStore(HISTORY_STORE).put(snapshot)
      await transactionToPromise(transaction)
      await trimHistory(database)
    })

    const history = await listHistory()
    return history.find(item => item.id === snapshot.id) ?? snapshot
  } catch {
    const nextHistory = [snapshot, ...getHistoryFallback()]
      .sort((left, right) => toTimestamp(right.savedAt) - toTimestamp(left.savedAt))
      .slice(0, MAX_HISTORY_ITEMS)
    setHistoryFallback(nextHistory)
    return snapshot
  }
}
