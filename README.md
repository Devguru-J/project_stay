# 잠깐 같이 있기

해결이 아니라, **동행**.

`잠깐 같이 있기`는 가입 없이, 이름 없이, 한 줄만 남기거나 아무 말 없이 머물다 갈 수 있는 익명 감성 채팅 서비스입니다. 누군가의 고민을 해결해주기보다, 말하지 않아도 되는 자리를 잠깐 빌려주는 것이 목표입니다.

> 설명하지 않아도 되는 쪽에 앉아 있을게요.

---

## 우리가 만들고 싶은 것

이 서비스는 상담 서비스도, 커뮤니티도, 생산성 도구도 아닙니다.

누군가 하루 끝에 들어와서 잠깐 숨을 고르고, 굳이 길게 설명하지 않아도 되는 작은 공간입니다. 사용자는 방을 고르고, 한 줄을 놓거나, 다른 사람의 말에 조용히 끄덕이거나, 그냥 방 안에 머물 수 있습니다.

핵심 방향은 세 가지입니다.

- **말을 강요하지 않기**: 질문, 답장, 프로필, 팔로우 같은 구조를 두지 않습니다.
- **해결보다 동행하기**: 조언이나 평가보다 “옆에 있음”을 표현하는 작은 반응을 둡니다.
- **오래 남기지 않기**: 말은 24시간이 지나면 새벽 안개처럼 사라집니다.

---

## 사이트의 정서

전체 톤은 늦은 밤, 낮은 조도, 픽셀 풍경, 조용한 사운드, 오래된 종이 질감에 가깝습니다.

밝고 화려한 서비스가 아니라, 혼자 있어도 너무 혼자 같지 않은 웹 공간을 지향합니다. 버튼과 문구는 되도록 작고 조용하게, 화면은 기능보다 분위기가 먼저 느껴지도록 구성했습니다.

디자인 원칙은 다음과 같습니다.

- **큰 목소리를 내지 않기**: 과한 CTA, 공격적인 컬러, 강한 마케팅 카피를 피합니다.
- **작은 상호작용만 두기**: 끄덕, 공감, 조용히 나가기처럼 부담 없는 행동만 둡니다.
- **한국어가 편안하게 읽히기**: Pretendard 기반의 단정한 한글 타이포그래피를 사용합니다.
- **낭만은 있되 요란하지 않기**: 픽셀 아트, 빛 번짐, ambient sound는 배경처럼 머무르게 합니다.

---

## 네 개의 방

| 방 | 장소감 | 사용자가 하는 일 |
| --- | --- | --- |
| 퇴근 후 벤치 | 아직 식지 않은 가로등 아래 | 말없이 나란히 앉기 |
| 비 오는 창가 | 물방울이 천천히 내려오는 자리 | 작게 털어놓기 |
| 새벽 2시 편의점 앞 | 온장고 불빛이 남아 있는 곳 | 멍하니 버티기 |
| 막차 기다리는 곳 | 젖은 노선도 앞 | 집에 가는 마음을 잠깐 내려놓기 |

각 방은 고유한 배경 이미지, 색감, ambient sound, 문구를 갖습니다. 방을 선택하면 타이머가 다시 시작되고, 현재 몇 명과 몇 분째 머무는 중인지 표시됩니다.

---

## 주요 기능

### 익명 한 줄 남기기

- 64자까지 짧은 말을 남길 수 있습니다.
- 사용자는 랜덤한 익명 이름으로 표시됩니다.
- 메시지는 Supabase에 저장되고, 24시간 뒤 만료됩니다.
- 화면에서는 시간이 오래 지난 말이 점점 흐려지는 방식으로 표현됩니다.

### 끄덕

- 다른 사람의 말에 답장 대신 `끄덕`으로 공감할 수 있습니다.
- 같은 방문자는 같은 메시지에 한 번만 끄덕일 수 있습니다.
- 누른 뒤에는 `끄덕함`으로 표시되어 중복 클릭을 막습니다.
- 서버 저장 실패 시에는 숫자를 되돌려 UI와 데이터가 어긋나지 않게 처리합니다.

### 말 없는 공감

방 전체에 남기는 작은 반응입니다.

- `옆에 있어요`
- `말 안 해도 알아요`
- `천천히 쉬어가요`
- `오늘도 버텼네`

모바일에서는 공간을 아끼기 위해 `공감 남기기 +` 버튼으로 접혀 있다가, 누르면 작은 칩들이 펼쳐집니다.

### 작은 의식들

방마다 부담 없이 머물 수 있도록 작은 의식을 추가했습니다.

- 방마다 하루에 하나씩 `오늘의 작은 문장`이 보입니다.
- 누군가 방금 다녀간 듯한 작은 흔적 문장이 방 안에 남습니다.
- 말을 남기지 않고도 `작은 사물 놓기`로 종이컵, 우산, 막차표 같은 오브젝트를 놓고 갈 수 있습니다.
- `작은 사물 놓기`를 누르면 방 안에 작은 픽셀 사물이 무작위 위치로 떨어졌다가 몇 초 뒤 사라집니다.
- 공감을 누르면 방 배경이 아주 작게 밝아집니다.
- 조용히 나갈 때 방마다 다른 마무리 문장이 표시됩니다.

### 실시간 숫자

Supabase Realtime을 사용해 다음 숫자가 실시간으로 갱신됩니다.

- 방별 현재 접속 인원
- 전체 같이 있는 사람 수
- 방 공감 수
- 메시지별 끄덕 수
- 새 메시지 도착

인원수는 Presence 기반이라 네트워크 상태, 탭 비활성화, 브라우저 환경에 따라 몇 초 정도 차이가 날 수 있습니다.

### 조용히 나가기

방을 떠나는 행동도 갑작스러운 종료가 아니라 하나의 감성적 흐름으로 처리합니다. 사용자는 `조용히 나가기`를 눌러 잠깐 머무름을 끝낼 수 있고, 타이머가 끝나도 자연스럽게 나가기 화면으로 이어집니다.

### 작은 우체통

사용자는 사이트 하단의 우체통을 통해 조용한 제안을 남길 수 있습니다. 이 기능은 별도의 `suggestions` 테이블을 사용합니다.

### 안전 장치

- 클라이언트에서 12초 메시지 전송 쿨다운을 둡니다.
- 욕설, 링크, 이메일, 전화번호처럼 보이는 패턴, 반복 글자 스팸을 막습니다.
- 서버에서는 RLS, rate-limit trigger, 길이 제한을 둡니다.
- 서버에서는 익명 입력값의 길이와 허용 공감 라벨을 한 번 더 제한합니다.
- 정적 배포에는 MIME 스니핑, iframe 삽입, 과한 브라우저 권한을 막는 보안 헤더를 둡니다.
- 메시지는 로컬에서 `가리기` 할 수 있습니다.
- 신고/관리 흐름을 위한 `message_reports` 테이블이 준비되어 있습니다.

---

## 지금까지 작업한 내용

초기 아이디어에서 실제 런칭 가능한 형태까지 다음 작업을 진행했습니다.

- Vite + React + TypeScript 기반 앱 구축
- 네 개의 감성 방 구성
- 픽셀 아트 배경과 방별 컬러 팔레트 적용
- 방별 ambient sound 구현
- Supabase 메시지, 반응, 끄덕, presence 연동
- 24시간 메시지 만료 구조와 흐려지는 시각 효과 구현
- 모바일 채팅창 높이/스크롤 문제 수정
- 모바일 공감 버튼을 접히는 미니멀 트레이로 개선
- 메시지 끄덕 즉시 반응 및 중복 클릭 방지
- 방 카드 문구와 체류 시간 표시 개선
- 데스크톱 레이아웃 여백과 footer 위치 정리
- 방 카드 표면감 개선
- 오늘의 작은 문장, 작은 사물 놓기, 방문 흔적, 나가기 문장 추가
- 작은 사물 놓기 클릭 시 픽셀 사물이 떨어졌다 사라지는 장면 효과 추가
- Pretendard 기반 한글 폰트 적용
- 하단 사용 설명서/서비스 목적 문구 추가
- `Created by Devguru-J` 크레딧 정리
- Open Graph, Twitter card, JSON-LD, sitemap, robots 설정
- Googlebot 메타, canonical 정렬, Search Console 등록 절차 정리
- 정적 보안 헤더와 Supabase 입력 제약 강화
- GitHub repository 연결 및 push

---

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | CSS, Pretendard, CSS variables |
| Realtime / DB | Supabase |
| Icons | lucide-react |
| Audio | Web Audio API |
| Deployment target | Cloudflare Pages |
| SEO / Share | Open Graph, Twitter Card, JSON-LD, sitemap.xml, robots.txt |

---

## 구조

```txt
.
├── README.md
├── docs/
│   └── launch-checklist.md
├── public/
│   ├── _headers
│   ├── _redirects
│   ├── favicon.svg
│   ├── manifest.json
│   ├── og-image.png
│   ├── robots.txt
│   ├── sitemap.xml
│   └── scenes/
│       ├── bench.svg
│       ├── bus.svg
│       ├── rain.svg
│       └── store.svg
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── components/
│   │   └── ErrorBoundary.tsx
│   └── lib/
│       ├── ambient.ts
│       ├── moderation.ts
│       ├── supabase.ts
│       └── visitor.ts
└── supabase/
    ├── mailbox_setup.sql
    └── schema.sql
```

주요 파일 역할은 다음과 같습니다.

- `src/App.tsx`: 서비스의 핵심 상태, 방 전환, 메시지, 공감, 끄덕, Supabase Realtime 처리
- `src/App.css`: 전체 UI, 데스크톱/모바일 레이아웃, 픽셀 씬, 카드/채팅/설명서 스타일
- `src/lib/ambient.ts`: 방별 ambient sound 생성 및 전환
- `src/lib/moderation.ts`: 클라이언트 사이드 soft moderation
- `src/lib/supabase.ts`: Supabase client 생성
- `src/lib/visitor.ts`: 방문자 ID, 전송 쿨다운, 가린 메시지, 끄덕 기록 localStorage 관리
- `supabase/schema.sql`: rooms, messages, reactions, nods, reports, RLS, trigger, cleanup function
- `docs/launch-checklist.md`: Supabase, Cloudflare Pages, 운영 전 점검 항목

---

## Supabase 데이터 모델

핵심 테이블은 다음과 같습니다.

- `rooms`: 네 개 방의 기본 정보
- `messages`: 사용자가 남긴 한 줄
- `room_reactions`: 방 전체에 남기는 말 없는 공감
- `message_nods`: 메시지별 끄덕
- `message_reports`: 신고/운영 검토용
- `suggestions`: 작은 우체통 제안

Realtime을 켜야 하는 테이블은 다음과 같습니다.

- `messages`
- `room_reactions`
- `message_nods`

Presence는 `global-presence` channel을 사용해 방별 현재 인원을 계산합니다.

---

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에는 다음 값이 필요합니다.

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase 없이 실행하면 로컬 샘플 메시지로 기본 화면을 확인할 수 있습니다. 실제 실시간 기능을 확인하려면 Supabase 프로젝트에 `supabase/schema.sql`을 적용하고 Realtime을 활성화해야 합니다.

---

## 빌드와 검증

```bash
npm run lint
npm run build
npm run preview
```

현재 작업 흐름에서는 변경 후 `npm run lint`와 `npm run build`를 통과한 뒤 커밋합니다.

---

## 배포

Cloudflare Pages 기준 설정입니다.

- Repository: `Devguru-J/project_stay`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `NODE_VERSION=20`

SPA fallback은 `public/_redirects`에서 처리합니다.

---

## SEO와 공유 썸네일

링크 공유 시 썸네일이 잘 보이도록 다음을 설정했습니다.

- `public/og-image.png`
- Open Graph meta tags
- Twitter card meta tags
- `og:image:width`, `og:image:height`, `og:image:alt`
- canonical URL
- Googlebot indexing hint
- JSON-LD structured data
- `public/sitemap.xml`
- `public/robots.txt`

현재 기준 대표 URL은 `https://staytogether.net/`입니다.

구글 검색 노출을 위해서는 코드 준비와 별개로 Google Search Console에서 도메인 소유권을 인증하고 `https://staytogether.net/sitemap.xml`을 제출해야 합니다. 자세한 절차는 [`docs/launch-checklist.md`](./docs/launch-checklist.md)에 정리했습니다.

---

## 운영 철학

이 프로젝트는 많은 기능을 넣는 것보다, 필요 없는 것을 빼는 쪽에 더 가깝습니다.

넣지 않기로 한 것들도 중요합니다.

- 댓글 스레드
- 좋아요 경쟁
- 프로필 페이지
- 팔로우
- 알림
- 긴 글쓰기
- 랭킹
- 추천 알고리즘
- 광고

이 공간은 체류 시간이 길수록 성공하는 서비스가 아닙니다. 들어온 사람이 조금 편해져서 조용히 나갈 수 있다면 그것으로 충분합니다.

---

## 앞으로 준비하면 좋은 것

- 실제 운영용 Supabase cleanup schedule 활성화
- Cloudflare Web Analytics 또는 Plausible 같은 privacy-friendly analytics 연결
- `message_reports` 운영 루틴 정하기
- Pretendard self-hosting 여부 결정
- OG 이미지를 서비스 화면 기준으로 주기적으로 갱신
- 모바일 Safari / Chrome / KakaoTalk 인앱 브라우저 공유 테스트
- 실제 사용자 유입 후 카피 톤 조정

자세한 항목은 [`docs/launch-checklist.md`](./docs/launch-checklist.md)를 참고합니다.

---

## 기여할 때 지켜야 할 것

이 프로젝트의 가장 중요한 규칙은 **큰 목소리를 내지 않는 것**입니다.

카피를 고칠 때도, 버튼을 추가할 때도, 애니메이션을 넣을 때도 사용자가 부담 없이 머물 수 있는지를 먼저 봅니다. 예쁘지만 시끄러운 것보다, 작지만 오래 남는 쪽을 선택합니다.

문구는 짧고 조용하게.
상호작용은 작고 분명하게.
공간은 낭만적이되 과장하지 않게.

— 잠깐, 같이 있기.
