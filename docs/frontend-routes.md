# 프론트엔드 페이지 & 라우트

> 라우트 정의: `frontend/src/routes/__root.tsx`

## 공개 페이지

| 경로 | 페이지 | 파일 |
|------|--------|------|
| `/` | 홈 | `pages/Home.tsx` |
| `/login` | 로그인 | `pages/Login.tsx` |
| `/signup` | 회원가입 | `pages/Signup.tsx` |
| `/forgot-password` | 비밀번호 찾기 | `pages/ForgotPassword.tsx` |
| `/reset-password` | 비밀번호 재설정 | `pages/ResetPassword.tsx` |
| `/host/$hostId` | 호스트 프로필 | `pages/host/Profile.tsx` |
| `/terms` | 이용약관 | `pages/Terms.tsx` |
| `/privacy` | 개인정보처리방침 | `pages/Privacy.tsx` |
| `/oauth/callback/$provider` | OAuth 콜백 | `pages/oauth/CallbackPage.tsx` |

## 인증 필요 (AuthGuard)

| 경로 | 페이지 | 파일 |
|------|--------|------|
| `/booking/my-bookings` | 내 예약 목록 | `pages/booking/MyBookings.tsx` |
| `/booking/$id` | 예약 상세/수정 | `pages/booking/Detail.tsx` |
| `/host/register` | 호스트 등록 | `pages/host/Register.tsx` |
| `/member/settings` | 회원정보 변경 | `pages/member/Settings.tsx` |

## 호스트 전용 (HostGuard)

| 경로 | 페이지 | 파일 |
|------|--------|------|
| `/host/timeslots` | 시간대 설정 | `pages/host/TimeSlotSettings.tsx` |
| `/host/settings` | 호스트 설정 | `pages/host/Settings.tsx` |

## 인증 Guard

- **AuthGuard**: 로그인 필요. 미인증 시 `/login`으로 리다이렉트
- **HostGuard**: 로그인 + 호스트 등록 필요. 미인증 시 `/login`, 비호스트 시 `/`로 리다이렉트
