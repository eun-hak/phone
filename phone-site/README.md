# 폰덱스 (Phondex) — 휴대폰 결정 사전

기종별 "이 폰, 사도 될까?"에 답하는 데이터 사이트. 스펙 나열 대신 **결정에 필요한 것**만 다룬다 —
지원종료일 · 공식 수리비 · 알려진 이슈 · 구매 루트 · 잔존가치 · 총소유비용(TCO) · 케어 유불리 · 판매 타이밍.

- 수록 기종 89종, 전 기종 동일 구조의 문서 8종
- 도구: 폰 추천 마법사(`/finder`) · 결정 랭킹(`/best`) · 기종 비교(`/compare`) · 적정가 판독(`/price-check`) · 지원종료 캘린더(`/calendar`) · 수리비 비교(`/repair-cost`) · 이슈 센터(`/issues`) · 내 폰(`/my`)

## 아키텍처

```
phone/                         ← git 저장소 루트 (모노레포)
├── .github/workflows/         ← 데이터 자동 갱신 크론
├── phone-site/                ← Next.js 앱 (★ Vercel Root Directory)
│   ├── app/                   ← 라우트 (App Router, SSG + ISR)
│   ├── data/phones/*.json     ← 기종 데이터 (본체 · git 관리)
│   ├── data/phone-images.json ← 이미지 매니페스트 (출처·라이선스)
│   ├── public/phones/*.jpg    ← 기종 실사진 (Wikimedia Commons)
│   ├── lib/                   ← 데이터 로딩(Zod 검증) · 파생 지표 · 인사이트
│   └── scripts/               ← 데이터 파이프라인 (아래)
├── phone-site-design*.md      ← 설계 문서
└── automation-plan.md         ← 데이터 자동수집 조사
```

**데이터 원칙**: 읽기 전용 데이터는 빌드 타임에 정적으로 굽는다. 기종당 JSON 1파일을 Zod로
검증하며, 틀린 데이터는 빌드가 실패한다. 모든 값에 `source`·`asOf`(기준일)를 표기한다.

## 로컬 개발

```bash
cd phone-site
npm install
npm run dev        # http://localhost:3000
npm run build      # 프로덕션 빌드 (전 기종 Zod 검증)
```

## 데이터 파이프라인 (scripts/)

| 스크립트 | 용도 | 소스 |
|---|---|---|
| `add-phones.mjs <input.json>` | 리서치 JSON → 정규화 후 `data/phones/` 저장 | — |
| `update-eol.mjs --write` | 지원종료일 갱신 | endoflife.date API (MIT) |
| `update-resale.mjs --write` | 중고 시세 월 1포인트 수집 | 번개장터 검색 API |
| `fetch-images.mjs` | 기종 실사진 수집 | Wikidata P18 → Wikimedia Commons |
| `validate-data.mjs` | 데이터 무결성 검증 | — |

### 자동 갱신 (GitHub Actions)

`.github/workflows/data-refresh.yml` 이 스케줄로 데이터를 갱신하고 `phondex-bot` 커밋으로
되돌린다. push → Vercel 자동 재배포.

- **지원종료일**: 매주 월요일 06:00 KST
- **중고 시세**: 매월 1일 07:00 KST (월 1포인트 append → 시계열 누적 → TCO·판매타이밍 정밀도↑)
- 수동 실행: Actions 탭 → data-refresh → Run workflow (`resale: true` 로 시세도 강제 수집)

> 참고: 서버리스(Vercel)는 런타임 파일 쓰기가 불가하므로, 데이터 갱신은 Vercel Cron이 아니라
> **GitHub Actions가 git 커밋으로 처리**한다. 데이터가 버전 관리되고 변경 이력이 남는 장점.

## 배포 (Vercel)

이 저장소는 **모노레포**다 (git 루트 = `phone/`, 앱 = `phone/phone-site/`). Vercel 설정 시:

1. Vercel에서 `eun-hak/phone` 저장소 Import
2. **Root Directory → `phone-site`** 로 지정 (필수 — 루트가 아니라 앱 폴더)
3. Framework Preset: Next.js (자동 감지), Region: `icn1`(서울, `vercel.json`에 지정됨)
4. **환경변수 설정**:
   | 변수 | 값 | 용도 |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://<실제도메인>` | canonical URL · sitemap · OG (미설정 시 example.com 폴백) |
5. Deploy. 이후 `main` 브랜치 push마다 자동 재배포.

### 배포 후 체크리스트

- [ ] `NEXT_PUBLIC_SITE_URL` 을 실제 도메인으로 설정 (sitemap·canonical 정상화)
- [ ] Google Search Console 등록 + `/sitemap.xml` 제출
- [ ] 네이버 서치어드바이저 등록
- [ ] GA4 또는 Vercel Analytics 연결
- [ ] 쿠팡 파트너스 실제 태그로 `buyRoutes.coupangUrl` 교체 (현재는 태그 없는 검색 URL)
