# 데이터 자동 수집 가능성 — 조사 결과 및 아키텍처

> 조사일 2026-07-03. 엔드포인트는 실제 호출로 확인한 것만 "확인됨" 표기.
> 결론: **지원종료일·중고시세는 완전 자동화 가능**, 스펙·수리비는 반자동, **이슈는 수동(해자)**.

## 필드별 자동화 가능성 요약

| 필드 | 자동화 | 최적 소스 | 난이도 | 법적 리스크 |
|---|---|---|---|---|
| 스펙/출시일/출시가 | 부분 | Wikidata(CC0) + 수동 보정 | 중 | GSMArena 크롤링 **금지** |
| SW 지원 종료일 | **완전** | endoflife.date API | 하 | 낮음 (MIT) |
| 공식 수리비 | 반자동 | Apple/삼성 지원 페이지 | 상 | 중 (공개 API 없음) |
| 중고 시세 | **완전** | 번개장터 내부 API | 하 | 중 (비공식 API) |
| 알려진 이슈 | **수동** | 뉴스+커뮤니티 (편집 판단) | 상 | — (해자) |

## 확인된 엔드포인트

### 지원종료일 — 완전 자동화 (1순위)
- `https://endoflife.date/api/samsung-mobile.json` — **900+ 기기**, 각 레코드에 `releaseDate`, `support`(보안 종료일), `eol`(지원 종료일). 우리 스키마에 필요한 값 그대로. MIT·무인증. [확인됨]
- `https://endoflife.date/api/iphone.json` — 출시일·`supportedIosVersions`·단종일. [확인됨]
- `https://security.samsungmobile.com/workScope.smsb` — **정적 HTML**, 월간/분기/반기 티어별 기기 목록 내장. 교차검증용. [확인됨]
- → 주 1회 Cron이면 충분. 거의 무인 운영.

### 중고 시세 — 완전 자동화 (2순위)
- `https://api.bunjang.co.kr/api/1/find_v2.json?q={검색어}&order=score&n=20` — **실제 호출 성공, 무인증.** `name, price, proshop(전문판매자), used(상태), update_time`. `proshop=false`로 개인거래, `used` 코드로 A급 근사, 중앙값/IQR로 시세 산출. [확인됨]
  - 리스크: 비공식 내부 API → 딜레이·캐싱·일 1회 필수, 엔드포인트 변경 감지 필요.
- `https://m.smartchoice.or.kr/smc/mobile/phoneUsedSalePrice.do` — KTOA(준공식), **업체 판매가** 월 2회. 개인거래 아님 → 참조값으로 병기. [확인됨]

### 스펙 — 반자동
- Wikidata SPARQL `https://query.wikidata.org/sparql` (CC0, 재배포 자유). 칩셋/RAM/배터리 골격. 한국 출고가는 거의 없음 → 수동. [확인됨/부분]
- GSMArena: robots.txt가 **ClaudeBot·CCBot 등 차단**. 상시 크롤링 **채택 금지**. [확인됨]

### 수리비 — 반자동/수동
- Apple 공개 가격 API: **존재 확인 실패**(404). 지원 페이지는 JS 렌더링이라 파싱 난이도 상. [확인됨: 부정]
- 화면·배터리·후면 3항목 × 인기 모델로 범위가 좁아 **분기 1회 수동 갱신**이 ROI 우위.

### 이슈 — 수동 (해자)
- 뉴스·커뮤니티 자동 수집은 가능하나 "실제 결함 vs 루머" 판별에 편집 판단 필수. 오탐은 신뢰·법적 리스크 직결.
- 자동화는 "키워드 모니터링 → 후보 큐 적재"까지만. **게시는 사람이.**

## 권장 아키텍처 (Vercel Cron)

```
[주1회] endoflife.date /api/{iphone,samsung-mobile}.json → 지원종료일·출시일 (완전 자동)
[월1회] security.samsungmobile.com/workScope.smsb 정적 파싱 → 삼성 보안 티어 보강
[주1회] Wikidata SPARQL (CC0) → 스펙 골격, 결측은 수동 보정 큐
[일1회] api.bunjang.co.kr find_v2 (딜레이+캐싱+이상치 제거) → A급 시세 중앙값
         + smartchoice 월2회 준공식 참조값 병기
[분기]  Apple/삼성 지원 페이지 → 수리비 스냅샷 → 편집자 확인 후 반영
[상시]  {모델명}+결함/발열/그린라인 키워드 모니터링 → 이슈 후보 큐 → 사람이 게시
```

## 구현 원칙
- 모든 데이터에 `source` · `fetchedAt` · `confidence`(공식/준공식/개인거래추정) 메타 표기 — **신뢰도 투명화가 곧 제품 차별점**.
- 저장: Turso/Postgres + KV 캐시. 현재 JSON 구조를 그대로 DB로 승격 가능.
- 단계적 도입: ①지원종료일 자동화(가장 쉬움·효과 큼) → ②시세 자동화 → ③스펙 보정 → 수리비·이슈는 수동 유지.

## 현재 사이트와의 접점
- 지금은 기종당 JSON 1파일. 위 Cron이 이 JSON(또는 승격된 DB row)의 `eol`·`resale` 필드를 갱신하면, 페이지는 그대로 재생성됨(ISR).
- 즉 **자동화는 데이터 레이어만 교체**하고 프레젠테이션은 손대지 않아도 됨 — 현재 구조가 자동화 친화적.
