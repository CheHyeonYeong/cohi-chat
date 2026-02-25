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
                <TimeSlotForm {...defaultProps} entries={entries} />,
            );

            // 첫 번째 entry는 유효하므로 에러가 없어야 함
            let warnings = container.querySelectorAll('[data-testid="time-validation-error"]');
            expect(warnings.length).toBe(0);

            // 두 번째 entry를 펼침 (data-testid로 정확히 선택)
            const entryHeaders = container.querySelectorAll('[data-testid="entry-header"]');
            fireEvent.click(entryHeaders[1]);

            // 두 번째 entry에 에러가 있어야 함
            warnings = container.querySelectorAll('[data-testid="time-validation-error"]');
            expect(warnings.length).toBe(1);
        });
    });

    describe('시간대 겹침 검증', () => {
        it('요일과 시간대가 겹치는 entry가 있으면 겹침 경고를 표시해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' },
                { weekdays: [1], startTime: '10:00', endTime: '12:00' },
            ];

            const { container } = render(
                <TimeSlotForm {...defaultProps} entries={entries} />,
            );

            // 두 번째 entry를 펼침
            const entryHeaders = container.querySelectorAll('[data-testid="entry-header"]');
            fireEvent.click(entryHeaders[1]);

            const errors = container.querySelectorAll('[data-testid="overlap-error"]');
            expect(errors.length).toBe(1);
        });

        it('요일이 겹치지 않으면 겹침 경고를 표시하지 않아야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3], startTime: '09:00', endTime: '18:00' },
                { weekdays: [4, 5], startTime: '09:00', endTime: '18:00' },
            ];

            const { container } = render(
                <TimeSlotForm {...defaultProps} entries={entries} />,
            );

            const errors = container.querySelectorAll('[data-testid="overlap-error"]');
            expect(errors.length).toBe(0);
        });

        it('시간대가 인접(붙어있음)하면 겹침 경고를 표시하지 않아야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1], startTime: '09:00', endTime: '12:00' },
                { weekdays: [1], startTime: '12:00', endTime: '18:00' },
            ];

            const { container } = render(
                <TimeSlotForm {...defaultProps} entries={entries} />,
            );

            const errors = container.querySelectorAll('[data-testid="overlap-error"]');
            expect(errors.length).toBe(0);
        });

        it('겹치는 entry가 있으면 저장 버튼이 비활성화돼야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1], startTime: '09:00', endTime: '18:00' },
                { weekdays: [1], startTime: '10:00', endTime: '12:00' },
            ];

            const { getByRole } = render(
                <TimeSlotForm {...defaultProps} entries={entries} />,
            );

            const saveButton = getByRole('button', { name: '저장하기' });
            expect(saveButton).toBeDisabled();
        });
    });
});
