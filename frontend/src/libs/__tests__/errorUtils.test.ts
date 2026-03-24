import { describe, it, expect } from 'vitest';
import { getErrorMessage, isHttpError } from '../errorUtils';

describe('getErrorMessage', () => {
    it('Error 객체에서 메시지를 추출한다', () => {
        const error = new Error('서버에서 보낸 에러 메시지');
        expect(getErrorMessage(error)).toBe('서버에서 보낸 에러 메시지');
    });

    it('문자열에서 메시지를 추출한다', () => {
        expect(getErrorMessage('문자열 에러')).toBe('문자열 에러');
    });

    it('unknown 타입은 fallback을 반환한다', () => {
        expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.');
        expect(getErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다.');
        expect(getErrorMessage(42)).toBe('알 수 없는 오류가 발생했습니다.');
        expect(getErrorMessage({})).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('커스텀 fallback 메시지를 사용한다', () => {
        expect(getErrorMessage(null, '커스텀 폴백')).toBe('커스텀 폴백');
    });

    it('빈 메시지의 Error는 fallback을 반환한다', () => {
        const error = new Error('');
        expect(getErrorMessage(error)).toBe('알 수 없는 오류가 발생했습니다.');
        expect(getErrorMessage(error, '커스텀 폴백')).toBe('커스텀 폴백');
    });

    it('httpClient의 "HTTP error! status: NNN" 패턴이면 상태 코드별 기본 메시지를 반환한다', () => {
        const error = new Error('HTTP error! status: 401', { cause: 401 });
        expect(getErrorMessage(error)).toBe('인증이 만료되었습니다. 다시 로그인해주세요.');
    });

    it('httpClient의 "HTTP error! status: NNN" 패턴이고 매핑 없는 상태 코드면 fallback을 반환한다', () => {
        const error = new Error('HTTP error! status: 418', { cause: 418 });
        expect(getErrorMessage(error)).toBe('알 수 없는 오류가 발생했습니다.');
        expect(getErrorMessage(error, '커스텀 폴백')).toBe('커스텀 폴백');
    });

    it('서버가 보낸 한국어 메시지가 있으면 그대로 반환한다', () => {
        const error = new Error('이미 존재하는 아이디입니다.', { cause: 409 });
        expect(getErrorMessage(error)).toBe('이미 존재하는 아이디입니다.');
    });

    describe('5xx 에러 방어', () => {
        it('500 에러일 때 서버의 raw 메시지를 무시하고 generic 메시지를 반환한다', () => {
            const error = new Error('데이터베이스 오류: ERROR: column m1_0.is_banned does not exist', { cause: 500 });
            expect(getErrorMessage(error)).toBe('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        });

        it('503 에러일 때 서버의 raw 메시지를 무시하고 generic 메시지를 반환한다', () => {
            const error = new Error('Connection pool exhausted', { cause: 503 });
            expect(getErrorMessage(error)).toBe('서버 점검 중입니다. 잠시 후 다시 시도해주세요.');
        });

        it('매핑되지 않은 5xx 상태코드면 fallback을 반환한다', () => {
            const error = new Error('내부 에러 상세 메시지', { cause: 502 });
            expect(getErrorMessage(error)).toBe('알 수 없는 오류가 발생했습니다.');
        });

        it('매핑되지 않은 5xx 상태코드에 커스텀 fallback 사용', () => {
            const error = new Error('내부 에러 상세 메시지', { cause: 502 });
            expect(getErrorMessage(error, '커스텀 폴백')).toBe('커스텀 폴백');
        });

        it('4xx 에러는 서버 메시지를 그대로 반환한다', () => {
            const error = new Error('중복된 계정 ID입니다.', { cause: 409 });
            expect(getErrorMessage(error)).toBe('중복된 계정 ID입니다.');
        });
    });

    describe('네트워크 에러 방어', () => {
        it('Failed to fetch는 사용자 친화적 메시지로 대체한다', () => {
            const error = new Error('Failed to fetch');
            expect(getErrorMessage(error)).toBe('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
        });

        it('NetworkError는 사용자 친화적 메시지로 대체한다', () => {
            const error = new Error('NetworkError when attempting to fetch resource.');
            expect(getErrorMessage(error)).toBe('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
        });

        it('Load failed는 사용자 친화적 메시지로 대체한다', () => {
            const error = new Error('Load failed');
            expect(getErrorMessage(error)).toBe('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
        });
    });

    describe('HTTP 상태별 기본 메시지', () => {
        const cases: [number, string][] = [
            [400, '잘못된 요청입니다.'],
            [401, '인증이 만료되었습니다. 다시 로그인해주세요.'],
            [403, '접근 권한이 없습니다.'],
            [404, '요청한 정보를 찾을 수 없습니다.'],
            [409, '이미 처리된 요청입니다.'],
            [422, '요청 데이터가 올바르지 않습니다.'],
            [429, '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'],
            [500, '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'],
            [503, '서버 점검 중입니다. 잠시 후 다시 시도해주세요.'],
        ];

        it.each(cases)('상태 코드 %d → "%s"', (status, expected) => {
            const error = new Error(`HTTP error! status: ${status}`, { cause: status });
            expect(getErrorMessage(error)).toBe(expected);
        });
    });
});

describe('isHttpError', () => {
    it('Error.cause가 지정한 상태 코드와 일치하면 true', () => {
        const error = new Error('Not Found', { cause: 404 });
        expect(isHttpError(error, 404)).toBe(true);
    });

    it('Error.cause가 다른 상태 코드면 false', () => {
        const error = new Error('Not Found', { cause: 404 });
        expect(isHttpError(error, 500)).toBe(false);
    });

    it('Error가 아닌 값은 false', () => {
        expect(isHttpError('string error', 404)).toBe(false);
        expect(isHttpError(null, 404)).toBe(false);
        expect(isHttpError(undefined, 404)).toBe(false);
    });

    it('cause가 없는 Error는 false', () => {
        const error = new Error('no cause');
        expect(isHttpError(error, 404)).toBe(false);
    });
});
