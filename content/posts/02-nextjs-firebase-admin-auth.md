---
title: "Next.js와 Firebase로 1인 관리자 인증 만들기"
slug: nextjs-firebase-admin-auth
category: 개발
tags: [Next.js, Firebase, 인증, 세션쿠키, 보안]
thumbnail: /images/posts/02-nextjs-firebase-admin-auth.webp
excerpt: "Google 로그인, 허용 계정 화이트리스트, HTTP-only 세션 쿠키를 조합해 운영자 1명만 들어갈 수 있는 관리자 영역을 만드는 방법을 설명합니다."
status: published
seo:
  title: "Next.js와 Firebase로 1인 관리자 인증 만들기"
  description: "Firebase Authentication의 Google 로그인과 Admin SDK 세션 쿠키로, 운영자 1인 전용 관리자 페이지를 안전하게 구현하는 방법."
geo:
  tldr: "클라이언트의 로그인 결과를 믿지 말고, ID 토큰을 서버에서 검증해 화이트리스트와 대조한 뒤 HTTP-only 세션 쿠키를 발급한다."
  faq:
    - q: "Firebase 클라이언트 로그인만으로 관리자 페이지를 보호해도 되나요?"
      a: "안 됩니다. 브라우저 코드는 조작될 수 있으므로 서버에서 토큰이나 세션 쿠키를 검증해야 합니다."
    - q: "세션 쿠키의 유효기간은 얼마까지 가능한가요?"
      a: "Firebase 세션 쿠키는 최소 5분에서 최대 2주까지 설정할 수 있습니다."
---

## 목표: 운영자 한 명만 통과

개인 블로그의 관리자는 한 명입니다. 회원가입도, 권한 등급도 필요 없습니다. 대신 **그 한 명이 아니면 절대 통과하지 못해야** 합니다. 이를 위해 세 겹의 방어를 두었습니다.

1. Google 계정으로만 로그인한다.
2. 서버가 이메일(그리고 선택적으로 UID)을 화이트리스트와 대조한다.
3. 통과하면 HTTP-only 세션 쿠키를 발급하고, 이후 모든 요청에서 서버가 다시 검증한다.

## 로그인 흐름

```text
브라우저: Google 팝업 로그인 → Firebase ID 토큰 획득
        → POST /api/admin/session { idToken }
서버:    verifyIdToken → 이메일/UID 화이트리스트 확인
        → 통과: createSessionCookie → Set-Cookie (HttpOnly, SameSite=Lax)
        → 불통과: 403, 클라이언트는 즉시 signOut
```

핵심은 **판단을 서버가 한다**는 점입니다. 클라이언트가 "로그인 성공"이라고 말해도 서버는 ID 토큰의 서명과 만료를 직접 검증합니다.

화이트리스트는 환경변수 `ADMIN_EMAIL`로 두고, 더 엄격하게 하고 싶다면 `ADMIN_UID`를 추가합니다. 이메일은 계정 설정이 바뀔 수 있지만 UID는 바뀌지 않기 때문에, 둘을 함께 쓰면 이중 검증이 됩니다. 이메일 인증 여부(`email_verified`)도 함께 확인합니다.

## 세션 쿠키가 ID 토큰보다 나은 이유

ID 토큰은 수명이 1시간으로 짧습니다. 서버 렌더링 페이지마다 토큰을 새로 받아 오기는 번거롭습니다. Admin SDK의 `createSessionCookie`는 ID 토큰을 더 오래 쓸 수 있는 쿠키로 교환해 줍니다. 유효기간은 최소 5분에서 최대 2주 사이에서 정할 수 있고, 이 프로젝트는 기본 5일로 두었습니다.

쿠키 옵션도 중요합니다.

- `HttpOnly`: 자바스크립트에서 읽을 수 없어 XSS로 탈취하기 어렵습니다.
- `SameSite=Lax`: 다른 사이트에서 오는 대부분의 요청에 쿠키가 실리지 않습니다.
- `Secure`: 운영 환경에서는 HTTPS에서만 전송합니다.

## Next.js에서 두 번 지키기

Next.js 16에서는 `middleware`가 **`proxy`** 라는 이름으로 바뀌었습니다. `src/proxy.ts`에서는 `/admin/**`과 `/api/admin/**`에 쿠키가 없으면 로그인 화면으로 보내거나 401을 돌려줍니다. 하지만 이것은 **1차 관문**일 뿐입니다. 쿠키가 있다는 사실만으로는 유효한 쿠키인지 알 수 없기 때문입니다.

그래서 실제 검증은 서버 쪽에서 다시 합니다. 관리자 레이아웃은 `verifySessionCookie`로 서명과 화이트리스트를 확인하고, 글을 바꾸는 API는 여기에 더해 **폐기 여부(`checkRevoked`)** 까지 확인합니다. 로그아웃하거나 토큰이 폐기된 세션은 즉시 거부됩니다.

## 쓰기 요청의 CSRF 방어

쿠키 기반 인증에서는 다른 사이트가 사용자의 브라우저를 이용해 요청을 보내는 CSRF를 생각해야 합니다. 변경 요청(POST, PATCH, DELETE)은 `Origin` 헤더의 호스트가 현재 서버의 호스트와 같을 때만 허용했습니다. 여기에 `SameSite` 쿠키가 한 겹 더해집니다.

## 로그인 실패는 제한한다

허용되지 않은 계정의 로그인 시도는 403으로 거부하고, 같은 IP에서 10분 안에 5회 실패하면 429를 돌려줍니다. 서버리스 환경에서는 인스턴스마다 메모리가 따로이므로 완벽한 제한은 아니지만, 무차별 시도를 늦추는 데는 충분합니다.

## Custom Claim으로 Storage도 보호

로그인 성공 시 서버가 해당 계정에 `admin: true` Custom Claim을 부여합니다. Firebase Storage 규칙에서 `request.auth.token.admin == true`를 확인하면, 서버 검증을 우회한 클라이언트 업로드도 막을 수 있습니다. 서버 화이트리스트와 Custom Claim이 서로 다른 계층에서 같은 사람을 확인하는 구조입니다.

## 정리

- 클라이언트 로그인은 *신원 확인의 시작*이고, 판단은 서버가 한다.
- 화이트리스트는 이메일과 UID를 함께 쓴다.
- 세션 쿠키는 HttpOnly, SameSite, Secure를 지킨다.
- 프록시는 1차 관문, 서버 검증이 진짜 방어선이다.
- 쓰기 요청은 Origin을 확인한다.
