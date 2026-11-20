# 설정 가이드 (Firebase · Vercel)

## 1. Firebase 프로젝트
1. https://console.firebase.google.com → 프로젝트 추가.
2. **Authentication → 로그인 방법 → Google** 사용 설정. **설정 → 승인된 도메인**에 `localhost`, Vercel 프로덕션/프리뷰 도메인, 커스텀 도메인 추가.
3. **Firestore Database** 생성(프로덕션 모드, 리전은 `asia-northeast3` 권장).
4. **Storage** 시작 (Blaze 요금제 필요 — 예산 알림 설정 권장).
5. **프로젝트 설정 → 일반 → 내 앱 → 웹 앱** 등록 → 구성 값을 `NEXT_PUBLIC_FIREBASE_*` 에 입력.
6. **프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성** → JSON 의 `project_id`, `client_email`, `private_key` 를 `FIREBASE_ADMIN_*` 에 입력. **JSON 파일은 저장소에 커밋하지 말 것.**

## 2. 로컬 환경변수
```bash
cp .env.example .env.local
```
`ADMIN_EMAIL` 에 관리자 Google 이메일을 입력한다. 첫 로그인 후 `/admin` 대시보드에 표시되는 UID 를 `ADMIN_UID` 에 넣으면 이메일+UID 이중 검증이 된다.

## 3. Rules / 인덱스 배포
```bash
npm i -g firebase-tools
firebase login
firebase use <프로젝트ID>
firebase deploy --only firestore:rules,firestore:indexes,storage
```
(`firebase.json` 이 없다면 `firebase init` 에서 Firestore·Storage 만 선택하고 기존 rules 파일을 유지한다.)

## 4. 관리자 Custom Claim
관리자 로그인 시 서버가 `admin: true` Custom Claim 을 자동 부여한다(`src/lib/auth/session.ts`). Storage 업로드는 이 claim 이 있어야 허용된다. 첫 로그인 직후에는 토큰 갱신이 필요하므로 로그인 화면이 자동으로 `getIdToken(true)` 를 호출한다.

## 5. Vercel
- GitHub 저장소 연결 후 `.env.example` 의 변수를 Vercel 환경변수로 등록 (`FIREBASE_ADMIN_PRIVATE_KEY` 는 `\n` 이스케이프 유지).
- `NEXT_PUBLIC_SITE_URL` 을 실제 도메인으로 설정.
