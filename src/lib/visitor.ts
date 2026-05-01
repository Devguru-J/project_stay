const VISITOR_KEY = 'project-stay-visitor-id'
const COOLDOWN_KEY = 'project-stay-last-send'
const HIDDEN_KEY = 'project-stay-hidden-messages'

export const SEND_COOLDOWN_MS = 12 * 1000
const MAX_HIDDEN = 200

export function getVisitorId(): string {
  const current = window.localStorage.getItem(VISITOR_KEY)
  if (current) return current
  const next = window.crypto.randomUUID()
  window.localStorage.setItem(VISITOR_KEY, next)
  return next
}

export function getLastSentAt(): number {
  const raw = window.localStorage.getItem(COOLDOWN_KEY)
  if (!raw) return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

export function markSent(at: number = Date.now()): void {
  window.localStorage.setItem(COOLDOWN_KEY, String(at))
}

export function loadHiddenSet(): Set<string> {
  try {
    const raw = window.localStorage.getItem(HIDDEN_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

export function persistHiddenSet(set: Set<string>): void {
  const list = Array.from(set).slice(-MAX_HIDDEN)
  window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(list))
}
