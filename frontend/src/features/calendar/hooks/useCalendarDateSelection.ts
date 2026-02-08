import { useCallback } from 'react';

export function useCalendarDateSelection() {
    // Note: timeslots prefetch 제거 - useTimeslots는 hostId 기반으로 조회하므로
    // 날짜 기반 prefetch는 캐시 히트가 발생하지 않음
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleSelectDay = useCallback((slug: string, date: Date) => {
        // 날짜 선택 시 추가 로직이 필요하면 여기에 구현
    }, []);

    return { handleSelectDay };
}
