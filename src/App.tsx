import { type CSSProperties, type FormEvent, useEffect, useState } from 'react'
import {
  DoorOpen,
  HeartHandshake,
  Moon,
  Music2,
  Send,
  Sparkles,
  TimerReset,
  Umbrella,
  Volume2,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './App.css'

type Room = {
  id: string
  name: string
  place: string
  mood: string
  people: number
  minutes: number
  accent: string
}

type Message = {
  id: number
  roomId: string
  name: string
  text: string
  tone: 'soft' | 'warm' | 'quiet'
  nods: number
}

type Reaction = {
  label: string
  count: number
  hint: string
  Icon: LucideIcon
}

const rooms: Room[] = [
  {
    id: 'bench',
    name: '퇴근 후 벤치',
    place: '아직 식지 않은 가로등 아래',
    mood: '말없이 나란히 앉기',
    people: 7,
    minutes: 18,
    accent: '#7c9a76',
  },
  {
    id: 'rain',
    name: '비 오는 창가',
    place: '물방울이 천천히 내려오는 자리',
    mood: '작게 털어놓기',
    people: 4,
    minutes: 22,
    accent: '#6f9aa0',
  },
  {
    id: 'store',
    name: '새벽 2시 편의점 앞',
    place: '온장고 불빛이 남아 있는 곳',
    mood: '멍하니 버티기',
    people: 11,
    minutes: 12,
    accent: '#c48a61',
  },
  {
    id: 'bus',
    name: '막차 기다리는 곳',
    place: '젖은 노선도 앞',
    mood: '집에 가는 마음',
    people: 3,
    minutes: 27,
    accent: '#aa9a76',
  },
]

const initialMessages: Message[] = [
  {
    id: 1,
    roomId: 'bench',
    name: '느린 숨',
    text: '오늘은 설명하지 않아도 되는 쪽에 앉아 있을게요.',
    tone: 'quiet',
    nods: 5,
  },
  {
    id: 2,
    roomId: 'bench',
    name: '주머니 속 손',
    text: '나도 방금 들어왔어요. 대답 없어도 여기 있을게요.',
    tone: 'warm',
    nods: 8,
  },
  {
    id: 3,
    roomId: 'rain',
    name: '젖은 소매',
    text: '비가 오면 마음이 조금 천천히 움직여서 좋아요.',
    tone: 'soft',
    nods: 4,
  },
  {
    id: 4,
    roomId: 'store',
    name: '삼각김밥',
    text: '큰일은 아닌데 마음이 좀 늦게 따라오는 날이네요.',
    tone: 'warm',
    nods: 7,
  },
  {
    id: 5,
    roomId: 'bus',
    name: '막차표',
    text: '집에 가는 길이 멀어서 여기서 숨 좀 고르고 갈래요.',
    tone: 'quiet',
    nods: 3,
  },
]

const names = ['흐린 컵', '옅은 목소리', '두 번째 의자', '식은 라떼', '느린 발걸음']

function App() {
  const [activeRoomId, setActiveRoomId] = useState(rooms[0].id)
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(20 * 60)
  const [reactions, setReactions] = useState<Reaction[]>([
    { label: '옆에 있어요', count: 18, hint: '대답 없이 곁에 앉기', Icon: HeartHandshake },
    { label: '말 안 해도 알아요', count: 6, hint: '설명하지 않아도 괜찮기', Icon: Moon },
    { label: '천천히 쉬어가요', count: 9, hint: '서두르지 않게 붙잡기', Icon: Umbrella },
    { label: '오늘도 버텼네', count: 14, hint: '작게 인정해주기', Icon: Sparkles },
  ])
  const [lastReaction, setLastReaction] = useState('옆에 있어요')
  const [companionName] = useState(() => names[Math.floor(Math.random() * names.length)])

  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? rooms[0]
  const roomMessages = messages.filter((message) => message.roomId === activeRoom.id)
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  function enterRoom(roomId: string) {
    setActiveRoomId(roomId)
    setSecondsLeft(20 * 60)
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()

    if (!text) return

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        roomId: activeRoom.id,
        name: companionName,
        text,
        tone: 'soft',
        nods: 0,
      },
    ])
    setDraft('')
  }

  function addReaction(label: string) {
    setLastReaction(label)
    setReactions((current) =>
      current.map((reaction) =>
        reaction.label === label ? { ...reaction, count: reaction.count + 1 } : reaction,
      ),
    )
  }

  function addNod(messageId: number) {
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? { ...message, nods: message.nods + 1 } : message)),
    )
  }

  return (
    <main className="app-shell">
      <section className="room-stage" aria-label="잠깐 같이 있기">
        <div className="topbar">
          <div>
            <p className="eyebrow">stay until it passes</p>
            <h1>잠깐 같이 있기</h1>
          </div>
          <button className="quiet-button" type="button" aria-label="소리 켜기">
            <Volume2 size={18} />
          </button>
        </div>

        <div className="room-grid">
          <aside className="room-list" aria-label="방 목록">
            {rooms.map((room) => (
              <button
                className={`room-card ${activeRoom.id === room.id ? 'is-active' : ''}`}
                key={room.id}
                onClick={() => enterRoom(room.id)}
                style={{ '--room-accent': room.accent } as CSSProperties}
                type="button"
              >
                <span className="room-card__meta">
                  <span>{room.people}명</span>
                  <span>{room.minutes}분째</span>
                </span>
                <strong>{room.name}</strong>
                <small>{room.mood}</small>
              </button>
            ))}
          </aside>

          <section
            className={`active-room active-room--${activeRoom.id}`}
            style={{ '--room-accent': activeRoom.accent } as CSSProperties}
          >
            <div className="paper-lines" aria-hidden="true" />
            <div className="pixel-scene" aria-hidden="true">
              <div className="pixel-sky">
                <span className="pixel-star pixel-star--one" />
                <span className="pixel-star pixel-star--two" />
                <span className="pixel-star pixel-star--three" />
              </div>
              <div className="pixel-rain">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="pixel-building">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="pixel-window" />
              <div className="pixel-awning" />
              <div className="pixel-sign">24</div>
              <div className="pixel-stop" />
              <div className="pixel-bench" />
              <div className="pixel-lamp" />
              <div className="pixel-person pixel-person--one" />
              <div className="pixel-person pixel-person--two" />
              <div className="pixel-bus">
                <span />
                <span />
              </div>
              <div className="pixel-ground" />
            </div>
            <div className="scene-effect" aria-hidden="true">
              <span className="scene-glow scene-glow--one" />
              <span className="scene-glow scene-glow--two" />
              <span className="scene-line scene-line--one" />
              <span className="scene-line scene-line--two" />
              <span className="scene-post" />
              <span className="scene-shelter" />
            </div>
            <div className="room-ambience" aria-hidden="true">
              <span className="window-light window-light--one" />
              <span className="window-light window-light--two" />
              <span className="window-light window-light--three" />
            </div>

            <div className="room-header">
              <div>
                <p className="room-place">{activeRoom.place}</p>
                <h2>{activeRoom.name}</h2>
              </div>
              <div className="timer-pill" aria-label={`남은 시간 ${minutes}분 ${seconds}초`}>
                <TimerReset size={16} />
                <span>
                  {minutes}:{seconds}
                </span>
              </div>
            </div>

            <div className="presence-strip">
              <span>
                <Moon size={16} />
                {companionName}로 머무는 중
              </span>
              <span>
                <Waves size={16} />
                {activeRoom.people + 1}명이 조용히 있음
              </span>
              <span>
                <Music2 size={16} />
                낮은 빗소리
              </span>
            </div>

            <div className="message-stream" aria-live="polite">
              {roomMessages.map((message, index) => (
                <article className={`message-bubble message-bubble--${message.tone}`} key={message.id}>
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
                  <i style={{ animationDelay: `${index * 130}ms` }} />
                </article>
              ))}
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
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="여기에 아주 작은 말 하나"
                  value={draft}
                />
                <button type="submit" aria-label="보내기">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>

      <div className="ambient-note">
        <button className="exit-room" type="button">
          <DoorOpen size={16} />
          조용히 나가기
        </button>
        <Sparkles size={15} />
        <span>밤이 지나면 천천히 사라지는 말들</span>
      </div>
    </main>
  )
}

export default App
