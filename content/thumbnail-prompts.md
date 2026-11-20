# 블로그 샘플 데이터 — 주제 및 썸네일 이미지 생성 프롬프트

## 공통 규격

| 항목 | 값 |
|---|---|
| 저장 폴더 | `public/images/posts/` (프로젝트 루트 기준) |
| 파일 형식 | WebP (생성 도구가 PNG/JPG만 지원하면 변환 후 저장) |
| 권장 크기 | 1200 × 630 px (OG 이미지 비율 1.91:1) |
| 용량 | 파일당 300KB 이하 권장 (업로드 한도 10MB) |
| 스타일 가이드 | 미니멀, 밝은 배경, 포인트 컬러 1색(블루 계열), **이미지 안에 글자 넣지 않기** |
| 공통 네거티브 | text, letters, watermark, logo, signature, blurry, low quality, distorted hands |

> 글에 넣을 때: 관리자 에디터의 "대표(썸네일) 이미지" 칸에 URL을 입력하거나, 배포 후 `/images/posts/<파일명>` 경로를 사용합니다.
> Storage 업로드가 꺼져 있는 동안에는 `public/images/posts/` 에 파일을 두고 경로 URL을 직접 입력하세요.

---

## 글 목록

| # | 제목 | 카테고리 | slug | 본문 파일 | 썸네일 파일명 |
|---|---|---|---|---|---|
| 1 | AI와 함께 하루 만에 개인 블로그 만든 과정 | AI | `build-blog-with-claude-code` | `content/posts/01-build-blog-with-claude-code.md` | `01-build-blog-with-claude-code.webp` |
| 2 | Next.js와 Firebase로 1인 관리자 인증 만들기 | 개발 | `nextjs-firebase-admin-auth` | `content/posts/02-nextjs-firebase-admin-auth.md` | `02-nextjs-firebase-admin-auth.webp` |
| 3 | 검색엔진과 AI 검색을 함께 노리는 SEO·GEO 기본기 | 블로그 운영 | `seo-geo-basics` | `content/posts/03-seo-geo-basics.md` | `03-seo-geo-basics.webp` |
| 4 | 개발자 블로그 글쓰기 워크플로우: 마크다운에서 발행까지 | 블로그 운영 | `markdown-writing-workflow` | `content/posts/04-markdown-writing-workflow.md` | `04-markdown-writing-workflow.webp` |
| 5 | Firestore 비용을 아끼는 자체 방문 통계 설계 | 개발 | `firestore-analytics-design` | `content/posts/05-firestore-analytics-design.md` | `05-firestore-analytics-design.webp` |
| 6 | 비회원 댓글 스팸을 막는 5겹 방어 | 개발 | `guest-comment-spam-defense` | `content/posts/06-guest-comment-spam-defense.md` | `06-guest-comment-spam-defense.webp` |

---

## 1. `01-build-blog-with-claude-code.webp`

- **저장 경로:** `public/images/posts/01-build-blog-with-claude-code.webp`
- **콘셉트:** 사람과 AI가 나란히 화면을 보며 함께 설계하는 장면

**프롬프트 (EN)**
```
Minimal flat illustration, a developer and a friendly abstract AI assistant (a glowing blue geometric orb) working side by side at a clean desk, a large monitor showing a blueprint-like wireframe of a blog layout, soft light gradient background in off-white, single accent color electric blue, subtle isometric perspective, calm and optimistic mood, wide 1200x630 composition with empty space on the right, no text
```

**프롬프트 (KR)**
```
미니멀한 플랫 일러스트. 개발자와 친근한 추상적 AI(빛나는 파란 구체)가 나란히 책상에 앉아 블로그 레이아웃 와이어프레임이 뜬 큰 모니터를 보고 있다. 밝은 오프화이트 배경, 포인트 컬러는 일렉트릭 블루 하나, 약한 아이소메트릭 시점, 차분하고 낙관적인 분위기, 오른쪽에 여백이 있는 1200x630 가로 구도, 글자 없음
```

---

## 2. `02-nextjs-firebase-admin-auth.webp`

- **저장 경로:** `public/images/posts/02-nextjs-firebase-admin-auth.webp`
- **콘셉트:** 열쇠 하나로만 열리는 관리자 문, 보안 느낌

**프롬프트 (EN)**
```
Minimal 3D isometric illustration of a single golden key about to unlock a sleek glass door labeled only by a glowing blue shield icon, floating browser window behind it with abstract code lines, clean white background with soft shadows, accent color electric blue, modern tech aesthetic, 1200x630 wide composition, no text
```

**프롬프트 (KR)**
```
미니멀한 3D 아이소메트릭 일러스트. 황금색 열쇠 하나가 파란 방패 아이콘이 빛나는 유리 문을 열려는 장면, 뒤에 추상적인 코드 줄이 보이는 떠 있는 브라우저 창. 깨끗한 흰 배경과 부드러운 그림자, 포인트 컬러 일렉트릭 블루, 현대적인 테크 감성, 1200x630 가로 구도, 글자 없음
```

---

## 3. `03-seo-geo-basics.webp`

- **저장 경로:** `public/images/posts/03-seo-geo-basics.webp`
- **콘셉트:** 검색창과 AI 대화창이 하나의 글을 함께 가리키는 구도

**프롬프트 (EN)**
```
Minimal flat vector illustration, on the left a magnifying glass over a search results page, on the right a chat bubble from an AI assistant, both with beams pointing toward one central glowing document card, soft pastel off-white background, accent color electric blue with a small warm orange highlight, clean geometric shapes, balanced symmetrical composition, 1200x630, no text
```

**프롬프트 (KR)**
```
미니멀한 플랫 벡터 일러스트. 왼쪽에는 검색 결과 페이지 위의 돋보기, 오른쪽에는 AI 어시스턴트의 말풍선이 있고, 둘 다 가운데의 빛나는 문서 카드를 향해 빛줄기를 보낸다. 부드러운 파스텔 오프화이트 배경, 포인트 컬러 일렉트릭 블루와 작은 따뜻한 주황 하이라이트, 깔끔한 기하학적 도형, 좌우 균형 구도, 1200x630, 글자 없음
```

---

## 4. `04-markdown-writing-workflow.webp`

- **저장 경로:** `public/images/posts/04-markdown-writing-workflow.webp`
- **콘셉트:** 마크다운 원고가 발행된 글로 변환되는 흐름

**프롬프트 (EN)**
```
Minimal flat illustration of a split screen: left side a plain markdown document with abstract hash symbols and bullet lines, right side the same content beautifully rendered as a blog post card with a thumbnail, a smooth blue arrow between them, soft off-white background, accent color electric blue, tidy desk elements like a coffee cup in the corner, 1200x630 wide, no readable text
```

**프롬프트 (KR)**
```
미니멀한 플랫 일러스트. 화면이 둘로 나뉘어, 왼쪽은 해시 기호와 글머리 줄이 있는 단순한 마크다운 문서, 오른쪽은 같은 내용이 썸네일 있는 블로그 글 카드로 예쁘게 렌더링된 모습. 둘 사이에 부드러운 파란 화살표. 부드러운 오프화이트 배경, 포인트 컬러 일렉트릭 블루, 구석에 커피잔 같은 정돈된 책상 소품, 1200x630 가로, 읽을 수 있는 글자 없음
```

---

## 5. `05-firestore-analytics-design.webp`

- **저장 경로:** `public/images/posts/05-firestore-analytics-design.webp`
- **콘셉트:** 흩어진 이벤트 점들이 일 단위 집계 막대로 모이는 모습

**프롬프트 (EN)**
```
Minimal flat data visualization illustration, many tiny scattered blue dots flowing through a funnel into a neat row of daily bar charts and a rising line graph, a small flame-shaped database icon in the corner, soft off-white background, accent color electric blue, thin grid lines, elegant and clean, 1200x630 wide, no text, no numbers
```

**프롬프트 (KR)**
```
미니멀한 플랫 데이터 시각화 일러스트. 흩어진 작은 파란 점들이 깔때기를 지나 정돈된 일별 막대그래프와 상승하는 선 그래프로 모인다. 구석에 불꽃 모양의 작은 데이터베이스 아이콘. 부드러운 오프화이트 배경, 포인트 컬러 일렉트릭 블루, 얇은 격자선, 우아하고 깔끔하게, 1200x630 가로, 글자와 숫자 없음
```

---

## 6. `06-guest-comment-spam-defense.webp`

- **저장 경로:** `public/images/posts/06-guest-comment-spam-defense.webp`
- **콘셉트:** 댓글 말풍선들이 여러 겹의 방어막을 통과하며 걸러지는 장면

**프롬프트 (EN)**
```
Minimal flat illustration of friendly speech bubbles passing through five concentric translucent blue shield layers while angry spam bubbles with warning triangles are filtered out and fall away, soft off-white background, accent color electric blue with a small red highlight on the blocked items, clean geometric style, 1200x630 wide, no text
```

**프롬프트 (KR)**
```
미니멀한 플랫 일러스트. 친근한 말풍선들이 다섯 겹의 반투명한 파란 방어막을 통과하고, 경고 삼각형이 붙은 스팸 말풍선들은 걸러져 떨어져 나간다. 부드러운 오프화이트 배경, 포인트 컬러 일렉트릭 블루, 차단된 항목에만 작은 빨강 하이라이트, 깔끔한 기하학적 스타일, 1200x630 가로, 글자 없음
```
