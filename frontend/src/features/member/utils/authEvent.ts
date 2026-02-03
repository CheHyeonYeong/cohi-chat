const AUTH_CHANGE_EVENT = 'auth-change';

/**
 * 인증 상태 변경을 알리는 커스텀 이벤트를 발생시킵니다.
 * useAuth 훅에서 이 이벤트를 구독하여 상태를 갱신합니다.
 */
export function dispatchAuthChange(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
}

/**
 * 인증 상태 변경 이벤트를 구독합니다.
 * localStorage 변경과 auth-change 커스텀 이벤트를 모두 구독합니다.
 *
 * @param callback - 상태 변경 시 호출될 콜백 함수
 * @returns cleanup 함수 (이벤트 리스너 제거)
 */
export function subscribeAuthChange(callback: () => void): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }
    window.addEventListener('storage', callback);
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    };
}
