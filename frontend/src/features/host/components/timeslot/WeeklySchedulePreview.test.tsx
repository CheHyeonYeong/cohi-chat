/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import WeeklySchedulePreview from './WeeklySchedulePreview';
import type { TimeSlotEntry } from './TimeSlotForm';

describe('WeeklySchedulePreview', () => {
    afterEach(() => {
        cleanup();
    });

    describe('동적 HOURS 범위', () => {
        it('entries가 비어있으면 기본 범위(08:00~22:00)를 표시해야 한다', () => {
            const { container } = render(<WeeklySchedulePreview entries={[]} />);

            const timeLabels = container.querySelectorAll('.text-xs.text-gray-400');
            const times = Array.from(timeLabels).map((el) => el.textContent);

            expect(times).toContain('08:00');
            expect(times).toContain('22:00');
            expect(times).not.toContain('06:00');
            expect(times).not.toContain('23:00');
        });

        it('08:00 이전 시간대를 포함하면 해당 시간대도 표시해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '06:00', endTime: '10:00' },
            ];

            const { container } = render(<WeeklySchedulePreview entries={entries} />);

            const timeLabels = container.querySelectorAll('.text-xs.text-gray-400');
            const times = Array.from(timeLabels).map((el) => el.textContent);

            expect(times).toContain('06:00');
        });

        it('22:00 이후 시간대를 포함하면 해당 시간대도 표시해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '20:00', endTime: '23:30' },
            ];

            const { container } = render(<WeeklySchedulePreview entries={entries} />);

            const timeLabels = container.querySelectorAll('.text-xs.text-gray-400');
            const times = Array.from(timeLabels).map((el) => el.textContent);

            expect(times).toContain('23:00');
        });

        it('여러 entry가 있을 때 전체 범위를 커버해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1], startTime: '05:00', endTime: '08:00' },
                { weekdays: [2], startTime: '20:00', endTime: '23:00' },
            ];

            const { container } = render(<WeeklySchedulePreview entries={entries} />);

            const timeLabels = container.querySelectorAll('.text-xs.text-gray-400');
            const times = Array.from(timeLabels).map((el) => el.textContent);

            expect(times).toContain('05:00');
            expect(times).toContain('23:00');
        });

        it('유효하지 않은 시간 범위(startTime >= endTime)는 미리보기에 반영하지 않아야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '18:00', endTime: '09:00' },
            ];

            const { container } = render(<WeeklySchedulePreview entries={entries} />);

            // 하이라이트가 없어야 함 (유효하지 않은 범위이므로)
            const highlightedCells = container.querySelectorAll('[style*="background-color"]');
            expect(highlightedCells.length).toBe(0);
        });
    });
});
