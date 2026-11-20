# 개인 홍보용 블로그 PRD (Product Requirements Document)

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.0 (초안) |
| 작성일 | 2026-11-20 |
| 저장소 | https://github.com/yalaoh-sys/blog.git |
| 배포 | Vercel |
| DB / 인증 | Firebase (Firestore, Authentication - Google 로그인, Storage) |
| 상태 | 초안 – 열린 질문(§15) 확정 후 개발 착수 |

---

## 1. 개요

### 1.1 배경·목적
개인의 전문성·작업물·소식을 알리는 **개인 홍보용 블로그**를 구축한다. 검색엔진(SEO)과 생성형 AI 검색(GEO)에 잘 노출되고, 운영자 1인이 쉽게 글을 쓰고 방문 흐름을 분석할 수 있어야 한다.

### 1.2 목표 (Goals)
1. 일반적인 블로그 구조(목록·상세·카테고리·검색·댓글)를 갖춘 공개 사이트 제공
2. 마크다운 기반 편집기로 이미지 포함 글을 빠르게 작성·발행
3. 운영자 1인 전용 관리자 모드(글, 카테고리, 메인 콘텐츠, SEO/GEO, 댓글, 휴지통, 통계)
4. 검색·AI 인용에 유리한 구조화 데이터와 메타 관리
5. 외부 분석 도구 없이 조회수·유입경로·사이트 내 이동경로 자체 수집·시각화

### 1.3 비목표 (Non-Goals, v1)
- 다중 작성자/회원가입/구독자 로그인
- 유료 콘텐츠, 결제, 뉴스레터 발송
- 소셜 로그인 댓글, 대댓글 알림 메일
- 다국어(i18n) – v1은 한국어 단일 (구조는 확장 가능하게)
- 실시간 협업 편집

### 1.4 성공 지표 (KPI)
| 지표 | 목표(출시 3개월) |
|---|---|
| Lighthouse (모바일) 성능/SEO/접근성/권장사항 | 각 90+ |
| LCP | < 2.5s (p75) |
| 검색엔진 색인 페이지 비율 | 공개 글의 95% 이상 |
| 월간 방문(UV) | 운영자가 설정(예: 1,000) |
| 스팸 댓글 노출 | 0건 (승인/필터 통과분만) |

---

## 2. 사용자 및 역할

| 역할 | 설명 | 권한 |
|---|---|---|
| 방문자(비회원) | 누구나 | 글 열람, 검색, 댓글 작성(캡차), 본인 댓글 수정/삭제(비밀번호) |
| 관리자(운영자 1인) | Google 로그인 + 허용 계정 일치 | 모든 관리 기능 |
| 크롤러/봇 | 검색·AI 크롤러 | 공개 페이지 열람 (sitemap/robots/llms.txt) |

### 사용자 시나리오 (요약)
- **방문자**: 검색/SNS로 글 도착 → 읽기 → 관련 글·카테고리 이동 → 댓글 남김 → 소개(About)·연락처 확인
- **운영자**: 로그인 → 새 글 작성(마크다운+이미지) → 카테고리·SEO 설정 → 발행/예약 → 통계로 유입·인기 글 확인 → 부적절 댓글 삭제 → 휴지통 정리

---

## 3. 기술 스택 및 아키텍처

### 3.1 권장 스택
| 영역 | 선택 | 사유 |
|---|---|---|
| 프레임워크 | **Next.js (App Router, TypeScript)** | SSR/ISR로 SEO 최적, Vercel 최적화 |
| 스타일 | Tailwind CSS | 빠른 반응형 구현 |
| 인증 | Firebase Authentication (Google) | 요구사항 |
| DB | Cloud Firestore | 요구사항(Firebase) |
| 이미지 저장 | Firebase Storage | Firebase 일원화 (※ Blaze 요금제 필요 — §15 참고) |
| 서버 로직 | Next.js Route Handler / Server Actions + **Firebase Admin SDK** | 관리자 권한 검증·통계 집계·캡차 검증을 서버에서 수행 |
| 마크다운 편집기 | `@uiw/react-md-editor` 또는 Toast UI Editor (분할 미리보기, 툴바, 이미지 붙여넣기/드래그 확장) | 라이선스·번들 크기 검토 후 확정 |
| 마크다운 렌더링 | `react-markdown` + `remark-gfm` + `rehype-sanitize` + 코드 하이라이트(shiki) | XSS 방지, 코드블록 |
| 캡차 | **Cloudflare Turnstile** (대안: reCAPTCHA v3, hCaptcha) | 무료·UX 양호·서버 검증 |
| 차트 | Recharts 등 | 통계 대시보드 |
| 배포 | Vercel (GitHub 연동 자동 배포, Preview/Production) | 요구사항 |

### 3.2 아키텍처 개요
```
[Browser] ── SSR/ISR ──> [Vercel (Next.js)] ──Admin SDK──> [Firestore / Storage]
   │                          │
   │ Google Login (Firebase)  ├─ /api/comments  (Turnstile 검증, 스팸필터, 레이트리밋)
   │  → ID Token → 세션쿠키   ├─ /api/track     (통계 수집)
   │                          └─ /api/admin/*   (세션쿠키 + 관리자 UID 검증)
```
- 공개 페이지: ISR(`revalidate` + 발행/수정 시 on-demand revalidate)
- 관리자 페이지: `/admin/**` CSR + 서버 세션 검증, `noindex`
- 클라이언트의 Firestore 직접 쓰기는 **금지**(Security Rules로 차단), 모든 쓰기는 서버(Admin SDK) 경유. 공개 읽기는 `published` 글만 허용하거나 서버 렌더링으로만 접근.

### 3.3 환경 구성
- 환경 변수(Vercel): `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_ADMIN_*`(서비스 계정), `ADMIN_EMAIL`/`ADMIN_UID`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_SITE_URL`, `IP_HASH_SALT`
- Firebase Auth 승인 도메인에 Vercel 프로덕션/프리뷰 도메인 및 커스텀 도메인 등록
- 브랜치 전략: `main`(Production), `feature/*`(Preview)

---

## 4. 정보 구조 (IA) 및 라우팅

### 4.1 공개 사이트
| 경로 | 화면 |
|---|---|
| `/` | 메인(관리자가 구성: 히어로, 소개, 추천 글, 최신 글, 카테고리, 링크) |
| `/posts` | 전체 글 목록 (페이지네이션 또는 무한 스크롤) |
| `/posts/[slug]` | 글 상세 (목차, 본문, 이전/다음 글, 관련 글, 댓글) |
| `/category/[slug]` | 카테고리별 목록 |
| `/tags/[tag]` | 태그별 목록 (v1 포함 권장) |
| `/search?q=` | 검색 결과 |
| `/about` | 소개/프로필/연락처 (홍보 핵심 페이지) |
| `/rss.xml` | RSS 피드 |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | SEO/GEO 자동 생성 |
| `/404` | 사용자 정의 오류 페이지 |

### 4.2 관리자
| 경로 | 화면 |
|---|---|
| `/admin/login` | Google 로그인 |
| `/admin` | 대시보드(요약 통계, 최근 댓글, 임시저장 글) |
| `/admin/posts` | 글 목록(상태 필터: 발행/임시저장/예약/휴지통) |
| `/admin/posts/new`, `/admin/posts/[id]` | 마크다운 에디터 |
| `/admin/categories` | 카테고리 관리 |
| `/admin/home` | 메인 콘텐츠 관리 |
| `/admin/seo` | SEO/GEO 관리 |
| `/admin/comments` | 댓글 관리 |
| `/admin/media` | 업로드 이미지 관리 |
| `/admin/trash` | 휴지통 |
| `/admin/analytics` | 통계 |
| `/admin/settings` | 사이트 기본 설정 |

---

## 5. 기능 요구사항

> 우선순위: **P0**(필수, MVP) / **P1**(중요, v1 포함 권장) / **P2**(후순위)

### 5.1 공개 블로그 (일반적인 블로그 형식)

| ID | 요구사항 | 우선순위 |
|---|---|---|
| PUB-01 | 글 목록: 썸네일, 제목, 요약, 카테고리, 작성일, 조회수 표시. 페이지당 10개 | P0 |
| PUB-02 | 글 상세: 마크다운 렌더링(GFM 표·체크리스트·코드블록·이미지·인용), 제목 계층 자동 목차(TOC), 읽는 시간 | P0 |
| PUB-03 | 카테고리 탐색(1단계 + 선택적 2단계), 카테고리별 글 수 표시 | P0 |
| PUB-04 | 이전/다음 글, 같은 카테고리·태그 기반 관련 글 | P1 |
| PUB-05 | 검색(제목·본문·태그). v1은 Firestore 한계상 제목/태그/요약 기반 + 클라이언트/서버 필터, 필요 시 Algolia 등 확장 | P1 |
| PUB-06 | 태그 페이지, 인기 글(조회수 기준) 위젯 | P1 |
| PUB-07 | 반응형 디자인(모바일 우선), 다크모드 지원 | P0 / P1 |
| PUB-08 | About 페이지: 프로필, 경력/포트폴리오 링크, 연락처, SNS 링크 | P0 |
| PUB-09 | 공유 버튼(링크 복사, 주요 SNS), OG 이미지 미리보기 | P1 |
| PUB-10 | RSS 피드 | P1 |
| PUB-11 | 접근성(WCAG 2.1 AA 지향): 키보드 탐색, alt 텍스트, 명도 대비 | P1 |
| PUB-12 | 사용자 정의 404/오류 페이지 | P0 |
| PUB-13 | 쿠키/개인정보 안내 배너(통계 수집 고지), 개인정보처리방침 페이지 | P1 |

### 5.2 글쓰기 (마크다운 편집기)

| ID | 요구사항 | 우선순위 |
|---|---|---|
| WRT-01 | 마크다운 에디터: 툴바(제목, 굵게, 기울임, 링크, 목록, 인용, 코드, 표), 실시간 분할 미리보기, 단축키 | P0 |
| WRT-02 | **이미지 업로드**: 파일 선택 / 드래그&드롭 / 클립보드 붙여넣기 → Firebase Storage 업로드 → 마크다운 `![alt](url)` 자동 삽입 | P0 |
| WRT-03 | 업로드 제약: jpg/png/webp/gif, 파일당 최대 10MB, 업로드 시 클라이언트 리사이즈(긴 변 2000px)·WebP 변환 옵션, 진행률 표시, 실패 재시도 | P0 |
| WRT-04 | 글 메타: 제목, slug(자동 생성·수정 가능, 중복 검사), 요약(excerpt), 대표(썸네일) 이미지, 카테고리, 태그, 발행 상태 | P0 |
| WRT-05 | 상태: **임시저장 / 발행 / 예약발행 / 비공개(링크 접근 불가)** | P0 / 예약 P1 |
| WRT-06 | 자동 저장(30초 주기·변경 감지, 로컬 백업 병행), 이탈 시 경고 | P1 |
| WRT-07 | 글별 SEO/GEO 필드(→ §5.5) 입력 패널 | P0 |
| WRT-08 | 미리보기: 실제 공개 페이지와 동일 렌더링의 새 탭 미리보기 | P1 |
| WRT-09 | 발행일·수정일 관리, 수정 시 `updatedAt` 갱신 | P0 |
| WRT-10 | 글 복제, 고정 글(공지/Pinned) 설정 | P2 |
| WRT-11 | 마크다운 안전성: 저장은 원문, 렌더링 시 sanitize(스크립트/iframe 차단, 허용 목록 기반 embed 예: YouTube) | P0 |

### 5.3 관리자 모드 (운영자 1인 전용)

#### 5.3.1 인증·접근 제어
| ID | 요구사항 | 우선순위 |
|---|---|---|
| ADM-01 | Firebase Auth **Google 로그인**만 허용 | P0 |
| ADM-02 | **허용 계정(이메일 + UID) 화이트리스트**와 일치하는 1인만 관리자. 불일치 계정은 로그인 직후 즉시 로그아웃 + 안내 | P0 |
| ADM-03 | ID Token을 서버에서 검증 후 **HTTP-only 세션 쿠키** 발급(최대 5일~2주, 설정 가능). 모든 `/api/admin/*`·`/admin/**`는 서버에서 세션·UID 재검증 | P0 |
| ADM-04 | Firestore/Storage Security Rules로 관리자 외 쓰기 차단(이중 방어). Custom Claim `admin: true` 부여 | P0 |
| ADM-05 | `/admin/**` `noindex, nofollow`, robots 차단, 로그인 시도 실패 레이트리밋 | P0 |
| ADM-06 | 로그아웃, 세션 만료 시 재로그인 유도 | P0 |

#### 5.3.2 글 관리
- 목록: 검색, 상태/카테고리 필터, 정렬(최신/조회수), 일괄 선택(일괄 휴지통 이동·카테고리 변경·상태 변경) — P0(기본), 일괄 P1
- 글 삭제 = **휴지통 이동**(§5.6)

#### 5.3.3 카테고리 관리 (P0)
- 생성/수정/삭제, 이름·slug·설명·정렬 순서(드래그 정렬)·노출 여부
- 최대 2단계(대분류/중분류) 계층
- 카테고리별 SEO 제목/설명
- 삭제 규칙: 글이 있는 카테고리 삭제 시 글을 "미분류" 또는 다른 카테고리로 이동 선택 후 삭제. "미분류"는 기본 카테고리로 삭제 불가
- slug 변경 시 301 리다이렉트 매핑 보관

#### 5.3.4 메인 콘텐츠 관리 (P0)
메인 페이지를 **섹션(블록) 단위**로 구성·순서 변경·노출 토글:
| 섹션 | 편집 항목 |
|---|---|
| 히어로 | 헤드라인, 서브카피, 프로필/배경 이미지, CTA 버튼(문구·링크) |
| 소개 | 짧은 소개 마크다운 |
| 추천 글(Featured) | 글 직접 선택(최대 N개), 순서 지정 |
| 최신 글 | 노출 개수 |
| 카테고리 바로가기 | 노출할 카테고리 선택 |
| 링크/SNS/연락처 | 아이콘 + URL 목록 |
| 공지 배너 | 문구·기간·링크 |
- 미리보기 후 저장·즉시 반영(on-demand revalidate)
- 사이트 공통: 사이트명, 로고, 파비콘, 푸터 문구, 헤더 메뉴 구성

#### 5.3.5 댓글 관리 (P0)
- 전체 댓글 목록(글별 필터), 상태: 승인/대기/스팸/삭제
- 댓글 삭제 → 휴지통(복원 가능), 관리자 답글 작성(관리자 표시 배지)
- 금칙어 목록 관리, 자동 승인 모드 vs 사전 승인 모드 설정 (§5.4)

#### 5.3.6 미디어 관리 (P1)
- 업로드 이미지 목록(썸네일, 사용 중인 글 표시), 사용되지 않는 이미지 정리

### 5.4 비회원 댓글 (캡차)

| ID | 요구사항 | 우선순위 |
|---|---|---|
| CMT-01 | 글 상세 하단 댓글 목록(오래된 순/최신 순 토글), 댓글 수 표시 | P0 |
| CMT-02 | 작성 입력: 닉네임(2~20자), 비밀번호(4자 이상), 내용(1~1,000자, 순수 텍스트·줄바꿈만 허용, HTML/마크다운 렌더링 금지), 이메일(선택, 비공개, 알림용 아님·미수집도 가능) | P0 |
| CMT-03 | **캡차 필수**(Cloudflare Turnstile): 클라이언트 토큰 → 서버에서 검증 후에만 저장 | P0 |
| CMT-04 | 비밀번호는 **bcrypt/argon2 해시**로 저장(평문 금지). 본인 수정/삭제 시 비밀번호 확인 | P0 |
| CMT-05 | 1단계 대댓글(답글) 지원 | P1 |
| CMT-06 | 스팸 방어: IP 해시 기준 레이트리밋(예: 분당 3회·일 30회), 허니팟 필드, 링크 개수 제한(3개 초과 시 대기), 금칙어 필터, 중복 내용 차단 | P0 |
| CMT-07 | 운영 모드 설정: **자동 승인**(기본) / **사전 승인**. 의심 댓글은 자동으로 "대기" | P1 |
| CMT-08 | 비회원 삭제 = 즉시 숨김 처리(내용은 "작성자가 삭제한 댓글입니다"), 관리자는 휴지통에서 확인 가능 | P0 |
| CMT-09 | 관리자 새 댓글 알림(대시보드 배지, v2: 이메일/푸시) | P1 |
| CMT-10 | 개인정보: IP 원문 저장 금지(솔트 해시만), 이메일 수집 시 동의 문구 표시 | P0 |

### 5.5 SEO / GEO 관리

**SEO (검색엔진 최적화)**
| ID | 요구사항 | 우선순위 |
|---|---|---|
| SEO-01 | 사이트 전역 기본값: 사이트 제목 템플릿(`%s | 사이트명`), 기본 설명, 기본 OG 이미지, 대표 도메인(canonical) | P0 |
| SEO-02 | 글/카테고리/페이지별 메타 오버라이드: title(≤60자), description(≤155자), canonical, OG/Twitter 카드, `noindex` 토글 + 글자 수 카운터·검색결과 미리보기 | P0 |
| SEO-03 | 자동 생성: `sitemap.xml`(발행 글·카테고리·태그, `lastmod`), `robots.txt`(관리자 경로 차단·sitemap 명시), RSS | P0 |
| SEO-04 | 구조화 데이터(JSON-LD): `WebSite`, `Person`(운영자), `BlogPosting`/`Article`, `BreadcrumbList`, `FAQPage`(해당 글), `ProfilePage`(About) | P0 |
| SEO-05 | 검색엔진 소유 확인 메타(Google Search Console, Naver 서치어드바이저, Bing) 입력 필드 | P0 |
| SEO-06 | 301 리다이렉트 관리(slug 변경 시 자동 기록 + 수동 추가) | P1 |
| SEO-07 | 발행 전 SEO 체크리스트(제목/설명 길이, 대표 이미지, alt 누락, H1 중복, 내부 링크) 점수 표시 | P2 |
| SEO-08 | 성능: 이미지 `next/image` 최적화, lazy load, 폰트 최적화, Core Web Vitals 준수 | P0 |

**GEO (생성형 엔진 최적화 – AI 검색 인용 유도)**
| ID | 요구사항 | 우선순위 |
|---|---|---|
| GEO-01 | `/llms.txt`(사이트 요약 + 핵심 글 링크 목록) 및 `/llms-full.txt`(선택) 자동 생성, 관리자에서 소개문 편집 | P1 |
| GEO-02 | `robots.txt`에서 AI 크롤러(GPTBot, ClaudeBot, PerplexityBot, Google-Extended 등) **허용/차단 토글** 제공 (기본 허용: 홍보 목적) | P1 |
| GEO-03 | 글별 **"핵심 요약(TL;DR)"** 및 **FAQ(질문-답변 쌍)** 입력 필드 → 본문 상단 요약 블록 + `FAQPage` JSON-LD 자동 출력 | P1 |
| GEO-04 | 저자 엔티티 강화: 운영자 프로필(이름, 직함, 소속, 전문분야, `sameAs` SNS/포트폴리오 링크)을 `Person` 스키마로 일관 출력 | P0 |
| GEO-05 | 본문 구조 가이드: 질문형 H2/H3, 짧은 단락, 표/목록 권장 안내(에디터 도움말), 게시일·수정일 명시 | P2 |
| GEO-06 | 시맨틱 HTML(`article`, `time`, `address` 등), JS 없이도 본문 읽히는 SSR 보장 | P0 |

### 5.6 삭제 정책: 휴지통 · 완전 삭제

| ID | 요구사항 | 우선순위 |
|---|---|---|
| TRS-01 | 글/댓글/카테고리(선택)/미디어의 "삭제"는 **소프트 삭제**: `deletedAt`, `deletedBy`, `status: trashed` 기록. 공개 사이트·sitemap·검색·통계 집계 목록에서 즉시 제외 | P0 |
| TRS-02 | 휴지통 화면: 유형별 탭(글/댓글/미디어), 삭제일, 원래 위치(카테고리) 표시 | P0 |
| TRS-03 | **복원**: 원래 상태(임시저장/발행 등)로 복구. 카테고리가 사라졌다면 "미분류"로 복구 | P0 |
| TRS-04 | **휴지통에서의 삭제 = 완전 삭제**(DB 문서 영구 삭제). 확인 모달(되돌릴 수 없음 문구) 필수. 글 완전 삭제 시 해당 글의 댓글·통계 원시 이벤트·전용 업로드 이미지 연쇄 삭제(공용 이미지는 참조 확인) | P0 |
| TRS-05 | "휴지통 비우기" 일괄 완전 삭제(2단계 확인) | P0 |
| TRS-06 | 자동 영구 삭제 보관 기간(예: 30일) 옵션 – 기본값 "자동 삭제 안 함", 설정에서 변경 | P2 |
| TRS-07 | 휴지통 글의 slug는 예약 유지(복원 충돌 방지) | P1 |

### 5.7 통계 (조회수 · 진입경로 · 사이트 내 이동경로)

#### 5.7.1 수집 원칙
- **자체 수집**: 클라이언트 경량 트래커 → `/api/track` → Firestore 저장(서버에서 봇·관리자 제외 필터)
- 개인정보 최소화: IP 원문 미저장(일별 솔트 해시), 쿠키 대신 `sessionStorage`의 익명 세션 ID 사용(30분 비활동 시 세션 종료), 고지 문구 노출
- 제외 대상: 관리자 로그인 상태, 봇/크롤러 User-Agent, 프리뷰 도메인, 새로고침 중복(같은 세션 같은 글 30분 내 1회만 조회수 카운트)

#### 5.7.2 수집 이벤트 (pageview)
| 필드 | 설명 |
|---|---|
| sessionId | 익명 세션 ID |
| path / postId | 현재 페이지 / 글 ID |
| referrer | 직전 도메인 및 전체 URL (사이트 내부 이동이면 내부 경로) |
| utm_source/medium/campaign | 쿼리 파라미터 |
| channel | 분류 결과: Direct / Search(Google·Naver·Daum·Bing…) / Social(Instagram·X·Facebook·LinkedIn…) / Referral / Internal / AI(ChatGPT·Perplexity 등) |
| device / browser / os / country | UA 파싱, 국가(Vercel geo 헤더) |
| prevPath, seq | 세션 내 이전 경로·순번(이동경로 분석) |
| ts | 서버 타임스탬프 |

#### 5.7.3 통계 요구사항
| ID | 요구사항 | 우선순위 |
|---|---|---|
| STA-01 | **조회수**: 글별 누적 조회수(공개 화면 표시), 일/주/월별 PV·UV 추이 차트 | P0 |
| STA-02 | 인기 글 TOP N(기간 필터: 오늘/7일/30일/전체) | P0 |
| STA-03 | **진입경로(유입) 통계**: 채널별 비율, 상위 referrer 도메인, 검색엔진별 비율, UTM 캠페인별, AI 유입 별도 집계, 글별 유입 상세 | P0 |
| STA-04 | **사이트 내 이동경로 통계**: 랜딩 페이지(첫 페이지) TOP, 이탈 페이지 TOP, 페이지 A → B 이동 흐름 표(Top transitions), 세션 평균 페이지 수/체류, 시각화(Sankey 또는 이동 매트릭스 표) | P1 |
| STA-05 | 기기·브라우저·국가 분포 | P1 |
| STA-06 | 기간 선택(오늘/7일/30일/사용자 지정), CSV 내보내기 | P1 |
| STA-07 | 실시간(최근 30분) 방문자/페이지 | P2 |
| STA-08 | 댓글 수 대비 조회수 등 글별 성과 표 | P2 |

#### 5.7.4 집계 전략 (Firestore 비용 최적화)
- 원시 이벤트는 `events` 컬렉션에 저장, **일 단위 집계 문서**(`stats_daily/{yyyy-mm-dd}`: PV, UV, 글별/채널별/경로별 카운터, transition 카운터)를 `FieldValue.increment`로 동시 갱신
- 대시보드는 집계 문서만 조회(읽기 수 최소화). 원시 이벤트는 90일 TTL 정책(Firestore TTL)로 자동 삭제
- UV는 일 단위 세션 ID 집합 근사(HyperLogLog 대신 `sessions_daily` 문서 존재 여부로 계산)
- 조회수 중복 방지는 서버 측(sessionId+postId 키) 검증

---

## 6. 데이터 모델 (Firestore)

```
posts/{postId}
  title, slug, excerpt, content(markdown), thumbnailUrl,
  categoryId, tags[], status: draft|published|scheduled|private|trashed,
  publishedAt, scheduledAt, createdAt, updatedAt, deletedAt, prevStatus,
  viewCount, commentCount, readingMinutes,
  seo{ title, description, canonical, ogImage, noindex },
  geo{ tldr, faq[{q,a}] }

categories/{categoryId}
  name, slug, description, parentId, order, visible, postCount,
  seo{ title, description }

comments/{commentId}
  postId, parentId, nickname, passwordHash, content,
  status: approved|pending|spam|deleted_by_author|trashed,
  isAdmin, ipHash, userAgentHash, createdAt, deletedAt

media/{mediaId}
  url, storagePath, width, height, size, usedInPosts[], createdAt, deletedAt

siteSettings/main            // 사이트명, 로고, 메뉴, 푸터, 댓글모드, 금칙어, AI봇 허용 등
homeLayout/main              // sections[{type, order, visible, data}]
profile/main                 // 이름, 직함, 소개, sameAs[], 연락처
redirects/{id}               // from, to, createdAt
events/{eventId}             // pageview 원시 이벤트 (TTL 90일)
stats_daily/{yyyy-mm-dd}     // 집계 카운터 (+ 하위 컬렉션 posts, channels, paths, transitions)
```
- 복합 인덱스: `posts(status, publishedAt desc)`, `posts(categoryId, status, publishedAt desc)`, `comments(postId, status, createdAt)`
- 휴지통은 별도 컬렉션이 아닌 `status: trashed` + `deletedAt` 필드로 관리 (복원 용이)

---

## 7. Security Rules 원칙
- `posts`, `categories`, `siteSettings` 등: 클라이언트 읽기는 필요한 공개 문서만, **쓰기는 전부 차단**(Admin SDK 전용)
- `comments`: 클라이언트 직접 읽기/쓰기 금지(서버 API 경유 — passwordHash·ipHash 노출 방지)
- `events`, `stats_*`: 클라이언트 접근 전면 차단
- Storage: 읽기 공개(이미지), 쓰기는 `request.auth.token.admin == true` 및 파일 타입/크기 제한
- 관리자 판정: Custom Claim + 서버 UID 화이트리스트 이중 검증

---

## 8. 비기능 요구사항

| 구분 | 요구사항 |
|---|---|
| 성능 | LCP < 2.5s, CLS < 0.1, INP < 200ms. ISR/캐시, 이미지 최적화, 불필요한 클라이언트 JS 최소화 |
| 보안 | HTTPS 강제, CSP·보안 헤더, XSS(sanitize)·CSRF(SameSite 쿠키 + Origin 검사)·NoSQL 인젝션 방어, 서비스 계정 키 비공개(Vercel 환경변수), 의존성 취약점 점검(Dependabot) |
| 개인정보 | IP 원문·평문 비밀번호 저장 금지, 통계 수집 고지, 개인정보처리방침 |
| 가용성 | Vercel/Firebase SLA 의존, 오류 모니터링(Vercel 로그, 선택 Sentry) |
| 호환성 | 최신 Chrome/Edge/Safari/Firefox, iOS Safari, Android Chrome |
| 비용 | Firebase 무료(Spark)~Blaze 저사용 구간 내 운영 목표. Firestore 읽기 최소화(집계·캐시), 예산 알림 설정 |
| 백업 | Firestore 정기 Export(수동/스케줄) + 마크다운 일괄 내보내기(관리자 기능, P2) |
| 유지보수 | TypeScript strict, ESLint/Prettier, 환경별 설정 분리 |

---

## 9. UX / 화면 가이드

- **디자인 톤**: 개인 브랜딩 중심의 깔끔한 미니멀 스타일, 가독성 높은 본문(폭 680~720px, 줄간 1.7), 포인트 컬러 1색
- **공개 레이아웃**: 상단 헤더(로고·메뉴·검색·다크모드) / 본문 / 푸터(SNS·저작권). 글 상세는 우측(데스크톱) 또는 상단(모바일) TOC
- **관리자 레이아웃**: 좌측 사이드 내비 + 상단 바(사이트 보기·로그아웃), 에디터는 전체 폭 분할 뷰
- **빈 상태/오류/로딩** 상태 정의(스켈레톤, 토스트 알림, 확인 모달)
- 위험 동작(삭제·완전 삭제·휴지통 비우기)은 색상·문구로 구분하고 확인 필수

---

## 10. 주요 플로우

**관리자 로그인**: `/admin/login` → Google 팝업 → ID Token → 서버 검증(허용 UID?) → 예: 통과 시 세션 쿠키 → `/admin`, 불일치 시 로그아웃·"권한 없음"

**글 발행**: 새 글 → 작성(이미지 붙여넣기 업로드) → 카테고리/태그/SEO/GEO 입력 → 발행 → 서버 저장 + 해당 경로·메인·카테고리·sitemap revalidate

**댓글 작성**: 입력 → Turnstile 통과 → 서버(토큰 검증, 레이트리밋, 필터) → 저장(승인/대기) → 목록 반영

**삭제**: 글 삭제 → 휴지통 이동(공개 제외) → (복원 or 휴지통에서 삭제 → 확인 → 영구 삭제 + 연쇄 정리)

**통계 수집**: 페이지 로드 → 트래커가 `/api/track` 호출(경로·referrer·prevPath) → 서버 필터·분류 → 이벤트 + 일 집계 증가

---

## 11. 개발 단계 (마일스톤)

| 단계 | 범위 | 산출물 |
|---|---|---|
| M0. 기반 | 저장소/Next.js 세팅, Firebase 프로젝트·Auth·Rules, Vercel 연동, 환경변수, 디자인 토큰 | 빈 사이트 배포(Preview/Prod) |
| M1. 관리자·글 | 관리자 로그인/세션/권한, 글 CRUD, 마크다운 에디터, 이미지 업로드, 카테고리 관리 | 글 작성·발행 가능 |
| M2. 공개 블로그 | 메인(관리자 설정 연동), 목록/상세/카테고리/About/검색, 반응형, 404 | 방문자 열람 가능 |
| M3. 댓글·휴지통 | 비회원 댓글+캡차+스팸방어, 댓글 관리, 휴지통(복원/완전 삭제) | 상호작용·삭제 정책 완료 |
| M4. SEO/GEO | 메타/OG, sitemap/robots/RSS/llms.txt, JSON-LD, SEO 관리 화면, 리다이렉트 | 검색·AI 최적화 |
| M5. 통계 | 트래커, 집계, 대시보드(조회수·유입·이동경로), CSV | 분석 대시보드 |
| M6. 품질·출시 | 성능/접근성/보안 점검, QA, 도메인 연결, Search Console·네이버 등록, 백업 설정 | **v1.0 정식 오픈** |

---

## 12. 수용 기준 (Acceptance Criteria, 핵심)

1. 허용되지 않은 Google 계정으로 로그인하면 `/admin` 접근과 모든 관리 API 호출이 거부된다(서버·Rules 양쪽에서 검증).
2. 에디터에서 이미지를 붙여넣으면 업로드되어 마크다운 링크가 자동 삽입되고, 발행 글에서 최적화되어 표시된다.
3. 글을 삭제하면 공개 페이지·sitemap·검색에서 사라지고 휴지통에 나타나며, 복원하면 원래 상태로 돌아온다.
4. 휴지통에서 삭제하면 DB에서 영구 삭제되고 복원할 수 없다(확인 모달 필수).
5. 캡차 미통과·토큰 위조 요청으로는 댓글이 저장되지 않으며, 비회원 댓글은 설정한 비밀번호로만 수정/삭제된다.
6. 글 발행 후 sitemap에 반영되고, 상세 페이지에 `BlogPosting` JSON-LD와 OG 메타가 출력된다. 글별 FAQ 입력 시 `FAQPage` JSON-LD가 출력된다.
7. 방문 시 조회수가 1회만 증가하고(같은 세션 중복 제외), 관리자·봇 방문은 집계되지 않는다.
8. 대시보드에서 기간별 조회수, 채널별 진입경로, 랜딩/이탈 페이지, 페이지 간 이동 상위 목록을 확인할 수 있다.
9. 메인 콘텐츠 관리에서 섹션 순서·노출·내용을 변경하면 공개 메인에 즉시 반영된다.
10. 모바일(375px)과 데스크톱에서 레이아웃이 깨지지 않고 Lighthouse 목표 점수를 충족한다.

---

## 13. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| Firebase Storage 사용에 Blaze(종량제) 요금제 필요 | 비용 발생/카드 등록 | 예산 알림, 이미지 리사이즈로 용량 절감, 대안(Vercel Blob/Cloudinary) 검토 |
| Firestore 전문 검색 한계 | 검색 품질 | v1은 제목·태그 중심, 필요 시 Algolia/Typesense 연동 |
| 통계 쓰기 비용 증가 | 트래픽 급증 시 비용 | 일 집계 + 샘플링 옵션, 이벤트 TTL 90일, 봇 선차단 |
| 스팸 댓글 | 신뢰도 하락 | 캡차+레이트리밋+필터+사전승인 모드 |
| 관리자 계정 탈취 | 콘텐츠 변조 | Google 2단계 인증 권장, 세션 단축, 서비스 계정 키 관리 |
| 클라이언트 트래커 광고차단 | 통계 과소 집계 | 동일 도메인 `/api/track` 사용(차단 확률↓), 한계 문서화 |
| AI 크롤러 정책 변화 | GEO 효과 변동 | robots/llms.txt를 설정화하여 신속 조정 |

---

## 14. 향후 확장 (v2 후보)
- 댓글 알림 이메일, 뉴스레터 구독
- 시리즈(연재) 기능, 글 버전 이력
- 외부 검색(Algolia), 이미지 CDN(Cloudinary)
- 다국어(ko/en), 포트폴리오/프로젝트 전용 컬렉션
- 통계 고도화(코호트, 스크롤 깊이, 전환 이벤트 — 연락처 클릭 등)
- 마크다운 일괄 가져오기/내보내기(Notion, Velog 이전)

---

## 15. 열린 질문 (확정 필요)

| # | 질문 | 권장안 |
|---|---|---|
| 1 | 관리자 허용 Google 계정(이메일)은? | 단일 계정, 환경변수 + Custom Claim |
| 2 | 도메인은 Vercel 기본(`*.vercel.app`) vs 커스텀 도메인? | 커스텀 도메인(SEO·브랜딩) |
| 3 | 이미지 저장소: Firebase Storage(Blaze 필요) 유지 여부? | Blaze + 예산 알림, 부담 시 Vercel Blob |
| 4 | 캡차 종류: Turnstile / reCAPTCHA / hCaptcha? | Cloudflare Turnstile |
| 5 | 댓글 기본 모드: 자동 승인 vs 사전 승인? | 자동 승인 + 의심 건 대기 |
| 6 | 휴지통 자동 영구 삭제 기간? | 자동 삭제 없음(수동), 옵션 제공 |
| 7 | 마크다운 에디터 후보 확정(uiw vs Toast UI)? | 프로토타입 후 확정 |
| 8 | 통계 수집 고지 방식(배너 vs 푸터 문구)? | 푸터 + 개인정보처리방침 (쿠키 미사용) |
| 9 | AI 크롤러 허용 여부? | 홍보 목적상 허용 |
| 10 | 카테고리 계층 깊이? | 2단계 |
| 11 | 사이트명·톤앤매너·참고 사이트·로고/컬러는? | 별도 제공 필요 |
| 12 | 예약발행 구현 방식(Vercel Cron)? | P1에서 Vercel Cron 사용 |
