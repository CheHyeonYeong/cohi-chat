const HTTP_STATUS_MESSAGES: Record<number, string> = {
    401: '인증이 만료되었습니다. 다시 로그인해주세요.',
    403: '접근 권한이 없습니다.',
    404: '요청한 정보를 찾을 수 없습니다.',
    409: '이미 처리된 요청입니다.',
    500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

/**
 * unknown 타입에서 안전하게 에러 메시지를 추출한다.
 * httpClient가 서버의 error.message를 Error.message로 넣어주므로, 서버 메시지가 우선 사용된다.
 * 서버 메시지가 없으면 HTTP 상태 코드별 기본 메시지, 그것도 없으면 fallback을 반환한다.
 */
export function getErrorMessage(error: unknown, fallback = '알 수 없는 오류가 발생했습니다.'): string {
    if (error instanceof Error) {
        // httpClient가 설정한 메시지가 "HTTP error! status: NNN" 패턴이면 서버 메시지가 없는 것
        const httpFallbackPattern = /^HTTP error! status: \d+$/;
        if (!httpFallbackPattern.test(error.message)) {
            return error.message;
        }
        // 상태 코드별 기본 메시지 시도
        const status = error.cause;
        if (typeof status === 'number' && HTTP_STATUS_MESSAGES[status]) {
            return HTTP_STATUS_MESSAGES[status];
        }
        return fallback;
    }

    if (typeof error === 'string') {
        return error;
    }

    return fallback;
}

/**
 * Error.cause 기반으로 HTTP 상태 코드를 확인한다.
 */
export function isHttpError(error: unknown, status: number): boolean {
    return error instanceof Error && error.cause === status;
}
