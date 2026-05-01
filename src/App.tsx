import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  DoorOpen,
  HeartHandshake,
  Mail,
  Moon,
  Send,
  Sparkles,
  TimerReset,
  Umbrella,
  Volume2,
  VolumeX,
  Waves,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './App.css'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import { startAmbient } from './lib/ambient'
import { moderateMessage } from './lib/moderation'
import {
  SEND_COOLDOWN_MS,
  getLastSentAt,
  getVisitorId,
  loadHiddenSet,
  markSent,
  persistHiddenSet,
} from './lib/visitor'

type AmbientHandle = ReturnType<typeof startAmbient>

type Room = {
  id: string
  name: string
  place: string
  mood: string
  accent: string
}

type Message = {
  id: string
  roomId: string
  name: string
  text: string
  tone: 'soft' | 'warm' | 'quiet'
  nods: number
  createdAt?: string
}

type Reaction = {
  label: string
  count: number
  hint: string
  Icon: LucideIcon
}

type MessageRow = {
  id: string
  room_id: string
  visitor_id: string
  display_name: string
  body: string
  tone: 'soft' | 'warm' | 'quiet'
  created_at: string
}

type ReactionRow = {
  visitor_id: string
  label: string
}

type NodRow = {
  visitor_id: string
  message_id: string
}

const rooms: Room[] = [
  {
    id: 'bench',
    name: '퇴근 후 벤치',
    place: '아직 식지 않은 가로등 아래',
    mood: '말없이 나란히 앉기',
    accent: '#7c9a76',
  },
  {
    id: 'rain',
    name: '비 오는 창가',
    place: '물방울이 천천히 내려오는 자리',
    mood: '작게 털어놓기',
    accent: '#6f9aa0',
  },
  {
    id: 'store',
    name: '새벽 2시 편의점 앞',
    place: '온장고 불빛이 남아 있는 곳',
    mood: '멍하니 버티기',
    accent: '#c48a61',
  },
  {
    id: 'bus',
    name: '막차 기다리는 곳',
    place: '젖은 노선도 앞',
    mood: '집에 가는 마음',
    accent: '#aa9a76',
  },
]

const initialMessages: Message[] = [
  {
    id: 'local-bench-1',
    roomId: 'bench',
    name: '느린 숨',
    text: '오늘은 설명하지 않아도 되는 쪽에 앉아 있을게요.',
    tone: 'quiet',
    nods: 5,
  },
  {
    id: 'local-bench-2',
    roomId: 'bench',
    name: '주머니 속 손',
    text: '나도 방금 들어왔어요. 대답 없어도 여기 있을게요.',
    tone: 'warm',
    nods: 8,
  },
  {
    id: 'local-rain-1',
    roomId: 'rain',
    name: '젖은 소매',
    text: '비가 오면 마음이 조금 천천히 움직여서 좋아요.',
    tone: 'soft',
    nods: 4,
  },
  {
    id: 'local-store-1',
    roomId: 'store',
    name: '삼각김밥',
    text: '큰일은 아닌데 마음이 좀 늦게 따라오는 날이네요.',
    tone: 'warm',
    nods: 7,
  },
  {
    id: 'local-bus-1',
    roomId: 'bus',
    name: '막차표',
    text: '집에 가는 길이 멀어서 여기서 숨 좀 고르고 갈래요.',
    tone: 'quiet',
    nods: 3,
  },
]

const nameModifiers = [
  '흐린', '옅은', '식은', '느린', '작은', '조용한', '늦은', '흐릿한', '멍한', '가벼운',
  '낮은', '둔한', '비 맞은', '마른', '젖은', '가만한', '먼', '깊은', '잔잔한', '어슴푸레한',
  '차가운', '미지근한', '식어가는', '내려앉은', '흩어진', '흘러가는', '비스듬한', '졸린', '숨죽인', '멈춘',
  '머무는', '새벽의', '늦가을', '한밤의', '뒤처진', '못다 한', '서툰', '낯선', '나직한', '담담한',
  '말없는', '꺼진', '가라앉은', '은은한', '두 번째', '눈치 보는', '뜸한', '처진', '오래된', '잠깐의',
]

const nameNouns = [
  '컵', '목소리', '의자', '라떼', '발걸음', '손', '어깨', '창', '우산', '노선도',
  '가방', '모자', '가로등', '그림자', '숨', '한숨', '노래', '빗소리', '종이컵', '손난로',
  '메모', '표', '코트', '이어폰', '테이블', '페이지', '책장', '빨대', '글씨', '발자국',
  '계단', '벤치', '횡단보도', '우유갑', '삼각김밥', '봉투', '정류장', '신호등', '가방끈', '온장고',
  '담요', '문자', '엽서', '책갈피', '필름', '주머니', '소맷자락', '구두', '운동화', '컵라면',
  '계란빵', '마른 잎', '손잡이', '엘리베이터', '단추', '필통', '사진', '편지', '책상', '스탠드',
  '머그', '티스푼', '식탁', '연필', '지우개', '스티커', '라디오', '플레이리스트', '베개', '담배 연기',
  '커튼', '책 모서리', '문틈', '계산대', '온수기', '머리핀', '사물함', '캔커피', '뒷자리', '파라솔',
]

function randomCompanionName(): string {
  const m = nameModifiers[Math.floor(Math.random() * nameModifiers.length)]
  const n = nameNouns[Math.floor(Math.random() * nameNouns.length)]
  return `${m} ${n}`
}
const baseReactions: Reaction[] = [
  { label: '옆에 있어요', count: 18, hint: '대답 없이 곁에 앉기', Icon: HeartHandshake },
  { label: '말 안 해도 알아요', count: 6, hint: '설명하지 않아도 괜찮기', Icon: Moon },
  { label: '천천히 쉬어가요', count: 9, hint: '서두르지 않게 붙잡기', Icon: Umbrella },
  { label: '오늘도 버텼네', count: 14, hint: '작게 인정해주기', Icon: Sparkles },
]

const ROOM_AMBIENCE: Record<string, string> = {
  bench: '낮은 풀벌레',
  rain: '낮은 빗소리',
  store: '낮은 형광등 소리',
  bus: '낮은 도로 소리',
}

function toMessage(row: MessageRow, nods = 0): Message {
  return {
    id: row.id,
    roomId: row.room_id,
    name: row.display_name,
    text: row.body,
    tone: row.tone,
    nods,
    createdAt: row.created_at,
  }
}

const MESSAGE_LIFE_MS = 24 * 60 * 60 * 1000

function lifeStyle(message: Message, now: number): CSSProperties {
  if (!message.createdAt) return {}
  const created = new Date(message.createdAt).getTime()
  if (Number.isNaN(created)) return {}
  const ratio = (now - created) / MESSAGE_LIFE_MS
  let opacity = 1
  let blur = 0
  if (ratio > 0.83 && ratio <= 0.958) {
    const t = (ratio - 0.83) / (0.958 - 0.83)
    opacity = 1 - t * 0.5
  } else if (ratio > 0.958) {
    const t = Math.min((ratio - 0.958) / 0.042, 1)
    opacity = 0.5 - t * 0.32
    blur = t * 3
  }
  return {
    '--life-opacity': opacity.toFixed(3),
    '--life-blur': `${blur.toFixed(2)}px`,
  } as CSSProperties
}

function App() {
  const [activeRoomId, setActiveRoomId] = useState(rooms[0].id)
  const [messages, setMessages] = useState<Message[]>(() =>
    hasSupabaseConfig ? [] : initialMessages,
  )
  const [draft, setDraft] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(20 * 60)
  const [reactions, setReactions] = useState<Reaction[]>(baseReactions)
  const [lastReaction, setLastReaction] = useState('옆에 있어요')
  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  const [visitorId] = useState(getVisitorId)
  const [companionName] = useState(randomCompanionName)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isAmbientOn, setIsAmbientOn] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isMailboxOpen, setIsMailboxOpen] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false)
  const [suggestionSent, setSuggestionSent] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [sendCooldownLeft, setSendCooldownLeft] = useState(() => {
    const last = getLastSentAt()
    if (!last) return 0
    const left = Math.ceil((last + SEND_COOLDOWN_MS - Date.now()) / 1000)
    return left > 0 ? left : 0
  })
  const [sendError, setSendError] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => loadHiddenSet())
  const messageStreamRef = useRef<HTMLDivElement | null>(null)
  const activeRoomRef = useRef<HTMLElement | null>(null)
  const ambientRef = useRef<AmbientHandle | null>(null)

  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? rooms[0]
  const roomMessages = useMemo(
    () => messages.filter((message) => message.roomId === activeRoom.id && !hiddenIds.has(message.id)),
    [messages, activeRoom.id, hiddenIds],
  )
  const displayedPeople = onlineCount ?? 1
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const ambienceLabel = ROOM_AMBIENCE[activeRoom.id] ?? '낮은 빗소리'
  const isSendDisabled = draft.trim().length === 0 || sendCooldownLeft > 0

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const stream = messageStreamRef.current

    if (!stream) return

    stream.scrollTop = stream.scrollHeight
  }, [roomMessages.length, activeRoomId])

  useEffect(() => {
    if (!supabase) return

    const client = supabase
    let ignore = false

    async function loadRoomMessages() {
      const { data: messageRows, error: messageError } = await client
        .from('messages')
        .select('id, room_id, visitor_id, display_name, body, tone, created_at')
        .eq('room_id', activeRoomId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(40)

      if (ignore) return

      if (messageError) {
        console.warn('Could not load Supabase messages. Falling back to local messages.', messageError)
        return
      }

      const ids = (messageRows ?? []).map((message) => message.id)
      let nodCounts: Record<string, number> = {}

      if (ids.length > 0) {
        const { data: nodRows, error: nodError } = await client
          .from('message_nods')
          .select('message_id')
          .in('message_id', ids)

        if (!nodError) {
          nodCounts = (nodRows ?? []).reduce<Record<string, number>>((counts, nod) => {
            counts[nod.message_id] = (counts[nod.message_id] ?? 0) + 1
            return counts
          }, {})
        }
      }

      if (!ignore) {
        setMessages((messageRows ?? []).map((message) => toMessage(message as MessageRow, nodCounts[message.id] ?? 0)))
      }
    }

    async function loadRoomReactions() {
      const { data, error } = await client
        .from('room_reactions')
        .select('label')
        .eq('room_id', activeRoomId)
        .gt('expires_at', new Date().toISOString())

      if (ignore || error) return

      const counts = (data ?? []).reduce<Record<string, number>>((current, reaction) => {
        current[reaction.label] = (current[reaction.label] ?? 0) + 1
        return current
      }, {})

      setReactions(baseReactions.map((reaction) => ({ ...reaction, count: counts[reaction.label] ?? reaction.count })))
    }

    loadRoomMessages()
    loadRoomReactions()

    return () => {
      ignore = true
    }
  }, [activeRoomId])

  useEffect(() => {
    if (!supabase) return

    const client = supabase
    const channel = client
      .channel(`room-data:${activeRoomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoomId}` },
        (payload) => {
          const next = toMessage(payload.new as MessageRow)
          setMessages((current) => (current.some((message) => message.id === next.id) ? current : [...current, next]))
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_reactions', filter: `room_id=eq.${activeRoomId}` },
        (payload) => {
          const next = payload.new as ReactionRow
          if (next.visitor_id === visitorId) return

          setReactions((current) =>
            current.map((reaction) =>
              reaction.label === next.label ? { ...reaction, count: reaction.count + 1 } : reaction,
            ),
          )
        },
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_nods' }, (payload) => {
        const next = payload.new as NodRow
        if (next.visitor_id === visitorId) return

        setMessages((current) =>
          current.map((message) => (message.id === next.message_id ? { ...message, nods: message.nods + 1 } : message)),
        )
      })
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [activeRoomId, visitorId])

  useEffect(() => {
    if (!supabase) return

    const client = supabase
    const channel = client.channel(`room-presence:${activeRoomId}`, {
      config: { presence: { key: visitorId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineCount(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), room_id: activeRoomId })
        }
      })

    return () => {
      setOnlineCount(null)
      client.removeChannel(channel)
    }
  }, [activeRoomId, visitorId])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (sendCooldownLeft <= 0) return
    const id = window.setTimeout(() => setSendCooldownLeft((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [sendCooldownLeft])

  useEffect(() => {
    const root = document.documentElement
    function applyTint() {
      const hour = new Date().getHours()
      let warm = '0.04'
      let cool = '0.03'
      if (hour >= 0 && hour < 5) {
        warm = '0.025'
        cool = '0.075'
      } else if (hour >= 5 && hour < 10) {
        warm = '0.05'
        cool = '0.05'
      } else if (hour >= 10 && hour < 17) {
        warm = '0.05'
        cool = '0.025'
      } else if (hour >= 17 && hour < 21) {
        warm = '0.085'
        cool = '0.02'
      } else {
        warm = '0.06'
        cool = '0.045'
      }
      root.style.setProperty('--time-warm', `rgba(201, 143, 98, ${warm})`)
      root.style.setProperty('--time-cool', `rgba(85, 126, 112, ${cool})`)
    }
    applyTint()
    const id = window.setInterval(applyTint, 5 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const room = activeRoomRef.current
    if (!room) return

    let raf = 0
    let pendingX = 0
    let pendingY = 0
    let frameQueued = false

    function commit() {
      room?.style.setProperty('--lantern-x', `${pendingX}px`)
      room?.style.setProperty('--lantern-y', `${pendingY}px`)
      frameQueued = false
    }
    function onMove(event: PointerEvent) {
      if (!room) return
      const rect = room.getBoundingClientRect()
      pendingX = event.clientX - rect.left
      pendingY = event.clientY - rect.top
      if (!frameQueued) {
        frameQueued = true
        raf = window.requestAnimationFrame(commit)
      }
      room.style.setProperty('--lantern-opacity', '1')
    }
    function onLeave() {
      room?.style.setProperty('--lantern-opacity', '0')
    }

    room.addEventListener('pointermove', onMove)
    room.addEventListener('pointerleave', onLeave)
    return () => {
      room.removeEventListener('pointermove', onMove)
      room.removeEventListener('pointerleave', onLeave)
      window.cancelAnimationFrame(raf)
    }
  }, [activeRoomId])

  useEffect(() => {
    if (!isAmbientOn) return
    if (ambientRef.current) {
      ambientRef.current.setRoom(activeRoomId)
    }
  }, [activeRoomId, isAmbientOn])

  useEffect(() => {
    if (secondsLeft === 0 && !isLeaving) {
      setIsLeaving(true)
    }
  }, [secondsLeft, isLeaving])

  useEffect(() => {
    return () => {
      ambientRef.current?.stop()
      ambientRef.current = null
    }
  }, [])

  async function submitSuggestion(event: FormEvent) {
    event.preventDefault()
    if (!suggestion.trim() || !supabase) return

    setIsSendingSuggestion(true)
    setSuggestionError(null)
    const { error } = await supabase
      .from('suggestions')
      .insert({
        body: suggestion.trim(),
        visitor_id: visitorId,
      })

    setIsSendingSuggestion(false)
    if (error) {
      setSuggestionError(error.message === 'P0001' ? '잠깐 뒤에 다시 남겨주세요.' : '쪽지를 보내지 못했습니다.')
    } else {
      setSuggestionSent(true)
      setSuggestion('')
      setTimeout(() => {
        setSuggestionSent(false)
        setIsMailboxOpen(false)
      }, 2000)
    }
  }

  async function toggleAmbient() {
    if (isAmbientOn) {
      const handle = ambientRef.current
      ambientRef.current = null
      setIsAmbientOn(false)
      await handle?.stop()
      return
    }
    try {
      const handle = startAmbient(activeRoomId)
      if (handle.ctx.state === 'suspended') {
        await handle.ctx.resume()
      }
      ambientRef.current = handle
      setIsAmbientOn(true)
    } catch (error) {
      console.warn('Could not start ambient layer.', error)
    }
  }

  function leaveRoom() {
    setIsLeaving(true)
  }

  function returnFromLeave() {
    setSecondsLeft(20 * 60)
    setIsLeaving(false)
  }

  function enterRoom(roomId: string) {
    setActiveRoomId(roomId)
    setSecondsLeft(20 * 60)
    if (isLeaving) setIsLeaving(false)
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (sendCooldownLeft > 0) return

    const text = draft.trim()
    const moderation = moderateMessage(text)
    if (!moderation.ok) {
      setSendError(moderation.reason)
      return
    }

    setSendError(null)

    if (!supabase) {
      setMessages((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          roomId: activeRoom.id,
          name: companionName,
          text,
          tone: 'soft',
          nods: 0,
          createdAt: new Date().toISOString(),
        },
      ])
      setDraft('')
      markSent()
      setSendCooldownLeft(Math.ceil(SEND_COOLDOWN_MS / 1000))
      return
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: activeRoom.id,
        visitor_id: visitorId,
        display_name: companionName,
        body: text,
        tone: 'soft',
      })
      .select('id, room_id, visitor_id, display_name, body, tone, created_at')
      .single()

    if (error) {
      const friendly = error.message?.includes('숨을 고르고')
        ? error.message
        : '말을 두지 못했어요. 잠시 뒤에 다시 시도해 주세요.'
      setSendError(friendly)
      return
    }

    if (data) {
      const next = toMessage(data as MessageRow)
      setMessages((current) => (current.some((message) => message.id === next.id) ? current : [...current, next]))
    }

    setDraft('')
    markSent()
    setSendCooldownLeft(Math.ceil(SEND_COOLDOWN_MS / 1000))
  }

  function hideMessage(messageId: string) {
    setHiddenIds((current) => {
      const next = new Set(current)
      next.add(messageId)
      persistHiddenSet(next)
      return next
    })
  }

  async function addReaction(label: string) {
    setLastReaction(label)
    setReactions((current) =>
      current.map((reaction) =>
        reaction.label === label ? { ...reaction, count: reaction.count + 1 } : reaction,
      ),
    )

    if (!supabase) return

    const { error } = await supabase.from('room_reactions').insert({
      room_id: activeRoom.id,
      visitor_id: visitorId,
      label,
    })

    if (error) console.warn('Could not save room reaction.', error)
  }

  async function addNod(messageId: string) {
    if (!supabase || messageId.startsWith('local-')) {
      setMessages((current) =>
        current.map((message) => (message.id === messageId ? { ...message, nods: message.nods + 1 } : message)),
      )
      return
    }

    const { error } = await supabase.from('message_nods').insert({
      message_id: messageId,
      visitor_id: visitorId,
    })

    if (error) {
      console.warn('Could not save message nod.', error)
      return
    }

    setMessages((current) =>
      current.map((message) => (message.id === messageId ? { ...message, nods: message.nods + 1 } : message)),
    )
  }

  return (
    <main className="app-shell">
      <div className="time-veil" aria-hidden="true" />
      <section className="room-stage" aria-label="잠깐 같이 있기">
        <div className="room-grid">
          <aside className="room-list" aria-label="방 목록">
            <div className="topbar">
              <h1>잠깐 같이 있기</h1>
            </div>
            {rooms.map((room) => (
              <button
                className={`room-card ${activeRoom.id === room.id ? 'is-active' : ''}`}
                key={room.id}
                onClick={() => enterRoom(room.id)}
                style={{ '--room-accent': room.accent } as CSSProperties}
                type="button"
              >
                <strong>{room.name}</strong>
                <small>{room.mood}</small>
              </button>
            ))}
          </aside>

          <section
            ref={activeRoomRef}
            className={`active-room active-room--${activeRoom.id}`}
            style={{ '--room-accent': activeRoom.accent } as CSSProperties}
          >
            <div className="lantern" aria-hidden="true" />
            <div className="paper-lines" aria-hidden="true" />
            <div className="pixel-scene" aria-hidden="true">
              {/* ... same pixel scene content ... */}
            </div>
            {/* ... same scene-effect content ... */}
            {/* ... same room-ambience content ... */}

            <div className="room-header">
              <div>
                <p className="room-place">{activeRoom.place}</p>
                <h2>{activeRoom.name}</h2>
              </div>
              <div className="room-header__controls">
                <div className="timer-pill" aria-label={`남은 시간 ${minutes}분 ${seconds}초`}>
                  <TimerReset size={16} />
                  <span>
                    {minutes}:{seconds}
                  </span>
                </div>
              </div>
            </div>

            <div className="presence-strip">
              <div className="presence-strip__group">
                <span>
                  <Moon size={16} />
                  {companionName}로 머무는 중
                </span>
                <span>
                  <Waves size={16} />
                  {displayedPeople}명이 조용히 있음
                </span>
              </div>
              
              <button
                className="room-mute"
                type="button"
                aria-label={isAmbientOn ? '소리 끄기' : '소리 켜기'}
                aria-pressed={isAmbientOn}
                onClick={toggleAmbient}
              >
                {isAmbientOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>{ambienceLabel}</span>
              </button>
            </div>

            <div className="message-stream" ref={messageStreamRef} aria-live="polite">
              {roomMessages.length === 0 ? (
                <div className="message-empty" role="status">
                  <span>아직 아무 말도 없음</span>
                  <p>먼저 한 줄을 놓아도 좋고, 누군가 들어올 때까지 그냥 같이 있어도 됩니다.</p>
                </div>
              ) : (
                roomMessages.map((message, index) => (
                  <article
                    className={`message-bubble message-bubble--${message.tone}`}
                    key={message.id}
                    style={{ '--rise-delay': `${index * 90}ms`, ...lifeStyle(message, now) } as CSSProperties}
                  >
                    <span>{message.name}</span>
                    <p>{message.text}</p>
                    <button
                      className="message-nod"
                      onClick={() => addNod(message.id)}
                      type="button"
                      aria-label={`${message.name}의 말에 공감하기`}
                    >
                      끄덕
                      <small>{message.nods}</small>
                    </button>
                    <button
                      className="message-hide"
                      onClick={() => hideMessage(message.id)}
                      type="button"
                      aria-label="이 말 가리기"
                      title="이 말은 이 기기에서 가립니다"
                    >
                      <X size={12} />
                    </button>
                    <i style={{ animationDelay: `${index * 130}ms` }} />
                  </article>
                ))
              )}
            </div>

            <div className="reaction-dock" aria-live="polite">
              <Sparkles size={15} />
              <span>{lastReaction} 남김</span>
            </div>

            <div className="inline-reactions" aria-label="말 없는 반응">
              {reactions.map(({ Icon, count, hint, label }) => (
                <button key={label} onClick={() => addReaction(label)} title={hint} type="button">
                  <Icon size={16} />
                  <span>{label}</span>
                  <small>{count}</small>
                </button>
              ))}
            </div>

            <form className="message-form" onSubmit={sendMessage}>
              <label htmlFor="message">한 줄만 놓고 가기</label>
              <div>
                <input
                  id="message"
                  maxLength={64}
                  onChange={(event) => {
                    setDraft(event.target.value)
                    if (sendError) setSendError(null)
                  }}
                  placeholder={
                    sendCooldownLeft > 0
                      ? `${sendCooldownLeft}초 뒤에 다시 둘 수 있어요`
                      : '여기에 아주 작은 말 하나'
                  }
                  value={draft}
                />
                <button type="submit" aria-label="보내기" disabled={isSendDisabled}>
                  <Send size={18} />
                </button>
              </div>
              {sendError ? (
                <small className="message-form__error" role="alert">
                  {sendError}
                </small>
              ) : null}
              <small
                className={`message-form__count${
                  sendCooldownLeft > 0 ? ' is-cooldown' : ''
                }${draft.length >= 56 ? ' is-near' : ''}`}
                aria-live="polite"
              >
                {sendCooldownLeft > 0 ? `${sendCooldownLeft}s` : `${draft.length}/64`}
              </small>
            </form>
          </section>

          <aside className="manual-aside" aria-label="사용 설명서">
            <div className="manual-aside__header">
              <p className="eyebrow">공간 사용법</p>
              <h2>해결보다 동행을 위한 곳</h2>
            </div>
            <ol>
              <li>
                <span>01</span>
                <p>지금 마음과 가까운 방을 고릅니다.</p>
              </li>
              <li>
                <span>02</span>
                <p>한 줄만 남기거나, 아무 말 없이 머물러도 됩니다.</p>
              </li>
              <li>
                <span>03</span>
                <p>누군가의 말에 조용히 끄덕이고 지나갑니다.</p>
              </li>
              <li>
                <span>04</span>
                <p>남겨진 말들은 밤이 지나면 천천히 사라집니다.</p>
              </li>
            </ol>
            <div className="manual-aside__closing">
              <span className="horizon" aria-hidden="true" />
              <p>잘 모르고 와도 됩니다. 잘 모른 채 가셔도 됩니다.</p>
            </div>
            <div className="manual-aside__footer">
              <button className="exit-room" type="button" onClick={leaveRoom}>
                <DoorOpen size={16} />
                조용히 나가기
              </button>
              
              <div className="footer-notice">
                <Sparkles size={14} />
                <p>가입 없이 이름 없이, 잠깐만 같이 있기. 이곳의 말들은 24시간이 지나면 새벽 안개처럼 사라집니다.</p>
              </div>

              <div className="footer-links">
                <button
                  className="privacy-link"
                  type="button"
                  onClick={() => setIsPrivacyOpen(true)}
                >
                  이곳의 약속 →
                </button>
                <button
                  className="emotional-mailbox"
                  type="button"
                  onClick={() => setIsMailboxOpen(true)}
                  title="주인장에게 조용히 쪽지 보내기"
                >
                  <div className="emotional-mailbox__icon">
                    <Mail size={16} />
                  </div>
                  <div className="emotional-mailbox__text">
                    <strong>작은 우체통</strong>
                    <span>조용한 제안 남기기</span>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {isMailboxOpen ? (
        <div className="mailbox-veil" role="dialog" aria-modal="true" aria-label="작은 우체통">
          <div className="mailbox-card">
            <p className="eyebrow">small mailbox</p>
            <h3>작은 우체통</h3>
            <p>이곳이 조금 더 따뜻하고 편안해질 수 있는 방법이 있다면 알려주세요. 주인장이 조용히 읽어볼게요.</p>
            
            <form onSubmit={submitSuggestion}>
              <textarea
                maxLength={300}
                placeholder="여기에 조용히 남겨주세요 (300자 이내)"
                value={suggestion}
                onChange={(e) => {
                  setSuggestion(e.target.value)
                  if (suggestionError) setSuggestionError(null)
                }}
                disabled={isSendingSuggestion || suggestionSent}
              />
              {suggestionError ? <p className="mailbox-error">{suggestionError}</p> : null}
              <div className="mailbox-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsMailboxOpen(false)
                    setSuggestion('')
                  }}
                  disabled={isSendingSuggestion}
                >
                  닫기
                </button>
                <button 
                  type="submit" 
                  className="is-primary"
                  disabled={isSendingSuggestion || suggestionSent || !suggestion.trim()}
                >
                  {suggestionSent ? '보냈어요' : isSendingSuggestion ? '보내는 중...' : '보내기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isPrivacyOpen ? (
        <div className="privacy-veil" role="dialog" aria-modal="true" aria-label="이곳의 약속">
          <div className="privacy-card">
            <p className="eyebrow">small promise</p>
            <h3>이곳의 약속</h3>
            <ul>
              <li>가입 없이, 이름 없이 머무를 수 있어요.</li>
              <li>남긴 말은 24시간 뒤에 자리에서 천천히 사라집니다.</li>
              <li>방문자를 구분하기 위해 작은 자국(visitor id)이 이 기기에만 남습니다. 서버에 이름·이메일은 저장되지 않아요.</li>
              <li>한 줄은 64자까지, 12초에 한 번 둘 수 있어요.</li>
              <li>불편한 말은 옆의 "가리기"로 이 기기에서만 가려둘 수 있어요.</li>
            </ul>
            <div className="privacy-actions">
              <button type="button" className="is-primary" onClick={() => setIsPrivacyOpen(false)}>
                알겠어요
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isLeaving ? (
        <div className="departure-veil" role="dialog" aria-modal="true" aria-label="조용히 나가는 중">
          <div className="departure-card">
            <p className="eyebrow">stay until it passes</p>
            <h3>오늘은 여기까지.</h3>
            <p>설명하지 않아도 되는 자리에 잠깐 머물다 갑니다. 내일 다시 같이 있어요.</p>
            <div className="departure-actions">
              <button type="button" className="is-primary" onClick={returnFromLeave}>
                다시 들어가기
              </button>
              <button type="button" onClick={() => window.close()}>
                창 닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App
