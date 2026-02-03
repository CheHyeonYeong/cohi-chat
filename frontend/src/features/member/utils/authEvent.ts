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
 *
 * 메모리 누수 방지:
 * - 이 이벤트를 구독하는 컴포넌트는 반드시 cleanup 시 이벤트 리스너를 제거해야 합니다.
 * - useAuth 훅에서는 useSyncExternalStore의 subscribe 함수가 cleanup 함수를 반환하여
 *   컴포넌트 언마운트 시 자동으로 이벤트 리스너가 정리됩니다.
 */
export function dispatchAuthChange(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
    }
}
