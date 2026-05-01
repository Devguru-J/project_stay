// Soft-moderation guard for outgoing messages.
// Goal: keep the room calm. Not exhaustive — paired with server-side rate
// limit and report queue.

const RAW_BLOCK_TERMS = [
  '시발', '씨발', 'ㅅㅂ', '시바', '씨바', '쒸발', '쉬발',
  '병신', '븅신', 'ㅂㅅ',
  '개새끼', '개색기', '개쉑', '쌍놈', '쌍년',
  '존나', '졸라', 'ㅈㄴ',
  '좆', '좃',
  '엠창', '느금마', '니애미', '니에미',
  '죽어', '죽여', '뒈져',
  'fuck', 'shit', 'bitch', 'asshole',
]

const SPAM_PATTERNS: { test: RegExp; reason: string }[] = [
  { test: /(.)\1{6,}/u, reason: '같은 글자가 너무 많이 이어졌어요.' },
  { test: /(https?:\/\/|www\.)/i, reason: '여기는 링크 없이 두는 자리예요.' },
  { test: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, reason: '이곳에 이메일은 두지 않아도 돼요.' },
  { test: /(\d{2,4}[\s-]?\d{2,4}[\s-]?\d{4})/, reason: '전화번호처럼 보이는 자국이 있어요.' },
]

function normalize(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase()
}

export type ModerationResult = { ok: true } | { ok: false; reason: string }

export function moderateMessage(text: string): ModerationResult {
  const trimmed = text.trim()
  if (trimmed.length === 0) return { ok: false, reason: '빈 자리는 그대로 둬도 됩니다.' }
  if (trimmed.length > 64) return { ok: false, reason: '한 줄은 64자까지 둘 수 있어요.' }

  const norm = normalize(trimmed)
  for (const term of RAW_BLOCK_TERMS) {
    if (norm.includes(normalize(term))) {
      return { ok: false, reason: '조금 더 조용한 말로 다시 놓아주세요.' }
    }
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test.test(trimmed)) {
      return { ok: false, reason: pattern.reason }
    }
  }

  return { ok: true }
}
