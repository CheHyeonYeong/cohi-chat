import dayjs from 'dayjs';

/** ISO 8601 문자열 → Date 객체 */
export const parseDateTime = (dateTimeStr: string): Date => dayjs(dateTimeStr).toDate();

/** ISO 8601 문자열 → "H:mm" 시간 문자열 (zero-pad 없음) */
export const extractTime = (dateTimeStr: string): string => dayjs(dateTimeStr).format('H:mm');

/** Date → "YYYY-MM-DD" ISO 날짜 문자열 */
export const formatDateToISO = (date: Date): string => dayjs(date).format('YYYY-MM-DD');

/** Date → "YYYY년 M월 D일" 한국어 날짜 */
export const formatKoreanDate = (date: Date): string => dayjs(date).format('YYYY년 M월 D일');

/** Date → "HH:mm" 한국어 시간 */
export const formatKoreanTime = (date: Date): string => dayjs(date).format('HH:mm');
