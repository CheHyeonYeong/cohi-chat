import dayjs from 'dayjs';

/** ISO 8601 문자열 → Date 객체 */
export function parseDateTime(dateTimeStr: string): Date {
    return dayjs(dateTimeStr).toDate();
}

/** ISO 8601 문자열 → "H:mm" 시간 문자열 (zero-pad 없음) */
export function extractTime(dateTimeStr: string): string {
    return dayjs(dateTimeStr).format('H:mm');
}

/** Date → "YYYY-MM-DD" ISO 날짜 문자열 */
export function formatDateToISO(date: Date): string {
    return dayjs(date).format('YYYY-MM-DD');
}

/** Date → "YYYY년 M월 D일" 한국어 날짜 */
export function formatKoreanDate(date: Date): string {
    return dayjs(date).format('YYYY년 M월 D일');
}

/** Date → "HH:mm" 한국어 시간 */
export function formatKoreanTime(date: Date): string {
    return dayjs(date).format('HH:mm');
}
