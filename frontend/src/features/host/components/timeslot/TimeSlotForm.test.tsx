/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import TimeSlotForm, { type TimeSlotEntry } from './TimeSlotForm';

describe('TimeSlotForm', () => {
    afterEach(() => {
        cleanup();
    });

    const defaultProps = {
        entries: [{ weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' }] as TimeSlotEntry[],
        onChange: vi.fn(),
        onSave: vi.fn(),
        isPending: false,
        errors: {},
    };

    describe('인라인 시간 검증', () => {
        it('시작 시간이 종료 시간보다 크거나 같으면 인라인 경고를 표시해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '18:00', endTime: '09:00' },
            ];

            const { container } = render(
                <TimeSlotForm {...defaultProps} entries={entries} />
            );

            const warningText = container.textContent;
            expect(warningText).toContain('시작 시간은 종료 시간보다 이전이어야 합니다');
        });

        it('시작 시간과 종료 시간이 같으면 인라인 경고를 표시해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '09:00' },
            ];

            const { container } = render(
                <TimeSlotForm {...defaultProps} entries={entries} />
            );

            const warningText = container.textContent;
            expect(warningText).toContain('시작 시간은 종료 시간보다 이전이어야 합니다');
        });

        it('유효한 시간 범위에서는 인라인 경고를 표시하지 않아야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' },
            ];

            const { container } = render(
                <TimeSlotForm {...defaultProps} entries={entries} />
            );

            const warningText = container.textContent;
            expect(warningText).not.toContain('시작 시간은 종료 시간보다 이전이어야 합니다');
        });

        it('여러 entry 중 일부만 유효하지 않으면 해당 entry에만 경고를 표시해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' },
                { weekdays: [1, 2, 3, 4, 5], startTime: '20:00', endTime: '10:00' },
            ];

            const { container } = render(
                <TimeSlotForm {...defaultProps} entries={entries} />
            );

            // 첫 번째 entry는 유효하므로 에러가 없어야 함
            let warnings = container.querySelectorAll('[data-testid="time-validation-error"]');
            expect(warnings.length).toBe(0);

            // 두 번째 entry를 펼침
            const entryHeaders = container.querySelectorAll('.cursor-pointer');
            fireEvent.click(entryHeaders[1]);

            // 두 번째 entry에 에러가 있어야 함
            warnings = container.querySelectorAll('[data-testid="time-validation-error"]');
            expect(warnings.length).toBe(1);
        });
    });
});
