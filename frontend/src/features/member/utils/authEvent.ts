/**
 * 인증 상태 변경을 알리는 커스텀 이벤트를 발생시킵니다.
 * useAuth 훅에서 이 이벤트를 구독하여 상태를 갱신합니다.
 *
 * 사용처:
 * - useLogin: 로그인 성공 후 호출
 * - useLogout: 로그아웃 후 호출
 *
 * 구독처:
 * - useAuth: useSyncExternalStore로 'auth-change' 이벤트 구독
 */
export function dispatchAuthChange(): void {
    window.dispatchEvent(new Event('auth-change'));
}
