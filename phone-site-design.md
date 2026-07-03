# 휴대폰 종합 정보 사이트 — 전체 설계 문서

> 목표: "휴대폰의 모든 것"을 다루되, 롱테일 SEO로 트래픽을 확보하고
> 인터랙티브 도구로 체류시간·재방문을 만드는 사이트.

---

## 1. 서비스 개요

| 항목 | 내용 |
|---|---|
| 콘셉트 | 휴대폰 리뷰·비교·문제해결·요금제 정보 허브 |
| 핵심 차별화 | 인터랙티브 도구 (스펙 비교기, 요금제 계산기, 중고 시세) |
| 초기 집중 카테고리 | 문제 해결 (검색량 꾸준 + 경쟁 낮음) |
| 수익 모델 | 제휴 마케팅(쿠팡 파트너스 등) → 애드센스 → 제휴 요금제 CPA |
| 타깃 검색엔진 | 구글 + 네이버 (네이버 서치어드바이저 등록 필수) |

---

## 2. 정보 구조 (IA) / 사이트맵

```
/                          홈 (허브, 최신글 + 도구 진입점)
├── /review                리뷰·비교 (필러 페이지)
│   ├── /review/[slug]         개별 리뷰 (예: galaxy-s25-3month)
│   └── /compare/[a]-vs-[b]    비교글 (예: galaxy-s25-vs-iphone-16)
├── /guide                 구매 가이드 (필러 페이지)
│   ├── /guide/[slug]          요금제·자급제·알뜰폰·중고폰
├── /fix                   문제 해결 (필러 페이지) ★ 초기 집중
│   └── /fix/[slug]            배터리·발열·침수·오류 해결
├── /tips                  활용 팁 (필러 페이지)
│   └── /tips/[slug]           카메라·저장공간·숨은기능
├── /tools                 인터랙티브 도구
│   ├── /tools/spec-compare    스펙 비교기
│   ├── /tools/plan-calculator 요금제 계산기
│   └── /tools/resale-price    중고 시세 조회
├── /phones/[model]        기종별 허브 페이지 (해당 기종 관련 글 자동 집계)
├── /sitemap.xml           동적 생성
└── /rss.xml
```

**토픽 클러스터 원칙**
- 각 카테고리 루트(`/fix` 등)는 3,000자 이상의 종합 가이드 = 필러 페이지
- 하위 글은 필러 페이지와 상호 내부 링크
- `/phones/[model]` 허브가 리뷰·문제해결·팁을 기종 단위로 재묶음 → 내부 링크 밀도 상승

---

## 3. 기술 스택

### 3.1 결론 요약

| 레이어 | 선택 | 이유 |
|---|---|---|
| 프론트 | **Next.js 15 (App Router)** | SSG/ISR로 SEO 최적, Vercel 네이티브 |
| 백엔드 | **별도 서버 없음** — Next.js Route Handlers | 아래 3.2 참고 |
| 콘텐츠 | **MDX 파일 (Git 기반)** → 성장 시 헤드리스 CMS | 초기 비용 0, 버전관리 공짜 |
| DB (필요 시) | **Turso(SQLite) 또는 Supabase(Postgres)** | 서버리스 친화, 무료 티어 넉넉 |
| 검색 | 초기: 클라이언트 검색(Fuse.js) → 성장 시 Algolia | 글 수백 개까지는 충분 |
| 배포 | Vercel | ISR·이미지 최적화·Edge 캐싱 내장 |
| 분석 | GA4 + Google Search Console + 네이버 서치어드바이저 | |

### 3.2 백엔드: Express를 쓰지 않는 이유

Vercel에서 Express를 돌리려면 서버리스 함수로 감싸야 하는데,
그 시점에 Express의 장점(미들웨어 체인, 상시 실행 서버)이 대부분 사라짐.
Next.js **Route Handlers**(`app/api/*/route.ts`)가 같은 일을 더 가볍게 처리:

- 배포·스케일링·콜드스타트 관리 전부 Vercel이 담당
- 프론트와 같은 레포·같은 타입 공유 (모노레포 불필요)
- Edge Runtime 선택 가능 → 지연시간 최소화

**Express가 실제로 필요해지는 경우** (그때 분리해도 늦지 않음):
- WebSocket 상시 연결 (실시간 채팅 등)
- 수 분 이상 걸리는 장기 작업 (크롤링 파이프라인 등)
- → 이 경우도 Express보다 **Hono**(초경량, Vercel/Edge 호환)를 권장

### 3.3 API가 필요한 지점

| API | 용도 | 데이터 소스 |
|---|---|---|
| `GET /api/phones` | 스펙 비교기용 기종 데이터 | 초기: JSON 파일 / 성장 시: DB |
| `GET /api/plans` | 요금제 계산기 데이터 | JSON (분기별 수동 갱신) |
| `GET /api/resale?model=` | 중고 시세 | 초기: 수동 입력 테이블 |
| `POST /api/subscribe` | 뉴스레터 구독 | Resend/Buttondown 연동 |
| `GET /api/search?q=` | 검색 (글 많아지면) | Fuse.js 인덱스 → Algolia |

> 원칙: **읽기 전용 데이터는 API 없이 빌드 타임에 정적으로 굽는다.**
> 스펙 데이터도 자주 안 바뀌므로 JSON import + ISR로 충분한 경우가 많음.

---

## 4. 프로젝트 구조 (Next.js App Router)

```
phone-site/
├── app/
│   ├── layout.tsx              # 공통 레이아웃 + 메타데이터 기본값
│   ├── page.tsx                # 홈
│   ├── (content)/
│   │   ├── review/[slug]/page.tsx
│   │   ├── compare/[slug]/page.tsx
│   │   ├── fix/[slug]/page.tsx
│   │   ├── guide/[slug]/page.tsx
│   │   └── tips/[slug]/page.tsx
│   ├── phones/[model]/page.tsx # 기종 허브
│   ├── tools/
│   │   ├── spec-compare/page.tsx
│   │   ├── plan-calculator/page.tsx
│   │   └── resale-price/page.tsx
│   ├── api/                    # Route Handlers (백엔드)
│   │   ├── phones/route.ts
│   │   ├── plans/route.ts
│   │   └── subscribe/route.ts
│   ├── sitemap.ts              # 동적 sitemap.xml
│   ├── robots.ts
│   └── rss.xml/route.ts
├── content/                    # MDX 콘텐츠 (Git 관리)
│   ├── fix/
│   │   ├── galaxy-s25-overheating.mdx
│   │   └── iphone-battery-drain.mdx
│   ├── review/
│   ├── guide/
│   └── tips/
├── data/
│   ├── phones.json             # 기종 스펙 DB (도구용)
│   └── plans.json              # 요금제 데이터
├── components/
│   ├── mdx/                    # MDX 커스텀 컴포넌트 (표, 장단점 박스 등)
│   ├── tools/                  # 비교기·계산기 UI
│   └── seo/JsonLd.tsx          # 구조화 데이터 컴포넌트
└── lib/
    ├── content.ts              # MDX 로딩·frontmatter 파싱
    └── schema.ts               # JSON-LD 생성 헬퍼
```

### MDX frontmatter 스키마

```yaml
---
title: "갤럭시 S25 발열 해결법 7가지 (2026년 최신)"
description: "게임·충전 중 발열 원인과 즉시 효과 보는 해결 순서"
category: fix
phones: [galaxy-s25]          # 기종 허브 자동 연결
keywords: [갤럭시 S25 발열, 갤럭시 발열 해결]
publishedAt: 2026-07-01
updatedAt: 2026-07-01          # 갱신일 노출 = SEO 신호
faq:                           # FAQ 스키마 자동 생성용
  - q: "갤럭시 S25 발열은 불량인가요?"
    a: "..."
---
```

---

## 5. SEO 설계

### 5.1 렌더링 전략

| 페이지 | 전략 |
|---|---|
| 콘텐츠 글 | **SSG** (빌드 시 정적 생성) |
| 기종 허브, 홈 | **ISR** (revalidate: 3600) |
| 도구 페이지 | SSG 셸 + 클라이언트 인터랙션 |
| API | Route Handler (Edge) |

### 5.2 메타데이터 (Next.js Metadata API)

- 페이지별 `generateMetadata()` — title/description/OG 이미지
- OG 이미지: `next/og`로 글 제목 자동 렌더링 (공유 클릭률↑)
- canonical URL 필수 (비교글은 A-vs-B 한 방향으로 통일)

### 5.3 구조화 데이터 (JSON-LD)

| 콘텐츠 | 스키마 |
|---|---|
| 리뷰 | `Product` + `Review` (별점 리치 스니펫) |
| 문제 해결 | `FAQPage` + `HowTo` |
| 비교/가이드 | `Article` + `BreadcrumbList` |
| 전체 | `WebSite` + `Organization` |

### 5.4 성능 (Core Web Vitals)

- `next/image` 필수, 히어로 이미지 `priority`
- 폰트는 `next/font`로 셀프호스팅 (CLS 방지)
- 도구 컴포넌트는 `dynamic import`로 지연 로딩
- 목표: LCP < 2.5s, CLS < 0.1 — 방문자 대부분이 모바일임을 전제

### 5.5 제목 공식

```
[기종/키워드] + [구체적 상황] + [숫자/연도]
예: "아이폰 16 프로 3개월 사용 후기: 사기 전 알아야 할 단점 5가지"
예: "갤럭시 S25 발열 해결법 7가지 (2026년 최신)"
```

---

## 6. 콘텐츠 로드맵

### Phase 1 — 기반 (1~2개월)
- [ ] Next.js 셋업, MDX 파이프라인, 기본 레이아웃
- [ ] `/fix` 필러 페이지 1개 + 문제 해결 글 30개
- [ ] sitemap/robots/RSS, Search Console·네이버 등록
- [ ] FAQ 스키마 적용

### Phase 2 — 확장 + 도구 (3~4개월)
- [ ] 스펙 비교기 (phones.json 30개 기종)
- [ ] `/review`, `/compare` 시작 (신제품 출시 일정 맞춤)
- [ ] 기종 허브 페이지 오픈
- [ ] 쿠팡 파트너스 연동

### Phase 3 — 리텐션 (5~6개월)
- [ ] 요금제 계산기 + 중고 시세 도구
- [ ] 뉴스레터 (신제품 알림·꿀팁)
- [ ] 성과 좋은 글 리라이팅 (updatedAt 갱신)
- [ ] 글 100개 도달 시 Algolia 검색 검토

### 운영 루틴
- 주 2~3개 신규 글, 월 1회 기존 글 갱신
- Search Console에서 노출 있는데 CTR 낮은 글 → 제목 개선
- 순위 5~15위 글 → 내부 링크·내용 보강으로 밀어올리기

---

## 7. 확장 시나리오 (미리 결정만 해두기)

| 시점 | 전환 |
|---|---|
| 글 200개+ / 비개발자 필진 합류 | MDX → 헤드리스 CMS (Sanity/Payload) |
| 시세 데이터 자동화 필요 | Vercel Cron + Turso DB |
| 커뮤니티/댓글 | giscus(GitHub 기반, 무료) → 자체 구현 |
| 실시간 기능 필요 | 그때 Hono 서버 분리 (Express 대신) |
