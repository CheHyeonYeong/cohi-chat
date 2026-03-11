/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import WeeklySchedulePreview from './WeeklySchedulePreview';
import { commitDraggedEntry } from './dragUtils';
import type { TimeSlotEntry } from './TimeSlotForm';

describe('WeeklySchedulePreview', () => {
    afterEach(() => {
        cleanup();
    });

    describe('동적 HOURS 범위', () => {
        it('entries가 비어있으면 기본 범위(08:00~22:00)를 표시해야 한다', () => {
            const { container } = render(<WeeklySchedulePreview entries={[]} />);

            const timeLabels = container.querySelectorAll('[data-testid="time-label"]');
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

            const timeLabels = container.querySelectorAll('[data-testid="time-label"]');
            const times = Array.from(timeLabels).map((el) => el.textContent);

            expect(times).toContain('06:00');
        });

        it('22:00 이후 시간대를 포함하면 해당 시간대도 표시해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '20:00', endTime: '23:30' },
            ];

            const { container } = render(<WeeklySchedulePreview entries={entries} />);

            const timeLabels = container.querySelectorAll('[data-testid="time-label"]');
            const times = Array.from(timeLabels).map((el) => el.textContent);

            expect(times).toContain('23:00');
        });

        it('여러 entry가 있을 때 전체 범위를 커버해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1], startTime: '05:00', endTime: '08:00' },
                { weekdays: [2], startTime: '20:00', endTime: '23:00' },
            ];

            const { container } = render(<WeeklySchedulePreview entries={entries} />);

            const timeLabels = container.querySelectorAll('[data-testid="time-label"]');
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
            const highlightedCells = container.querySelectorAll('[data-highlighted]');
            expect(highlightedCells.length).toBe(0);
        });
    });

    describe('드래그 선택 기능', () => {
        it('onChange가 없으면 grid-cell data-testid가 없어야 한다 (read-only 모드)', () => {
            const { container } = render(<WeeklySchedulePreview entries={[]} />);
            // onChange 미전달 시 DndContext를 사용하지 않음
            const cells = container.querySelectorAll('[data-testid^="grid-cell-"]');
            expect(cells.length).toBe(0);
        });

        it('onChange가 있으면 그리드 셀이 렌더링돼야 한다 (interactive 모드)', () => {
            const onChange = vi.fn();
            const { container } = render(
                <WeeklySchedulePreview entries={[]} onChange={onChange} />,
            );
            const cells = container.querySelectorAll('[data-testid^="grid-cell-"]');
            // 기본 범위(08~22) = 15시간 × 2 half-rows × 7일 = 210 셀
            expect(cells.length).toBe(210);
        });

        it('드래그 안내 문구가 onChange 유무에 따라 다르게 표시돼야 한다', () => {
            const { container: readOnly } = render(<WeeklySchedulePreview entries={[]} />);
            expect(readOnly.textContent).toContain('왼쪽 폼에서 시간대를 설정하면');

            cleanup();

            const { container: interactive } = render(
                <WeeklySchedulePreview entries={[]} onChange={vi.fn()} />,
            );
            expect(interactive.textContent).toContain('그리드를 드래그해');
        });

        it('interactive 모드에서 셀은 touch-action:none 스타일을 가져야 한다 (dnd-kit 설정 확인)', () => {
            const onChange = vi.fn();
            const { getByTestId } = render(
                <WeeklySchedulePreview entries={[]} onChange={onChange} />,
            );

            const cell = getByTestId('grid-cell-0-0');
            // dnd-kit PointerSensor/TouchSensor가 활성화됐을 때 필수 스타일
            expect(cell.style.touchAction).toBe('none');
        });

        it('기존 entries가 있어도 interactive 모드가 정상 렌더링돼야 한다', () => {
            const onChange = vi.fn();
            const entries: TimeSlotEntry[] = [
                { weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' },
            ];
            const { container } = render(
                <WeeklySchedulePreview entries={entries} onChange={onChange} />,
            );

            // 하이라이트된 셀과 DraggableCell이 공존해야 함
            const cells = container.querySelectorAll('[data-testid^="grid-cell-"]');
            expect(cells.length).toBeGreaterThan(0);

            // 09:00~18:00 범위의 셀이 하이라이트돼야 함
            const highlightedCells = container.querySelectorAll('[data-highlighted]');
            expect(highlightedCells.length).toBeGreaterThan(0);
        });

        it('하이라이트된 셀 우클릭 후 확인하면 해당 시간대를 삭제해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1], startTime: '09:00', endTime: '10:00' },
            ];
            const onChange = vi.fn();
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

            const { getByTestId } = render(
                <WeeklySchedulePreview entries={entries} onChange={onChange} />,
            );

            fireEvent.contextMenu(getByTestId('grid-cell-0-2'));

            expect(confirmSpy).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith([]);
            confirmSpy.mockRestore();
        });

        it('기존 시간대 우클릭 삭제는 onDeleteEntry로 위임해야 한다', () => {
            const entries: TimeSlotEntry[] = [
                { weekdays: [1], startTime: '09:00', endTime: '10:00', existingId: 101 },
            ];
            const onChange = vi.fn();
            const onDeleteEntry = vi.fn();
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

            const { getByTestId } = render(
                <WeeklySchedulePreview
                    entries={entries}
                    onChange={onChange}
                    onDeleteEntry={onDeleteEntry}
                />,
            );

            fireEvent.contextMenu(getByTestId('grid-cell-0-2'));

            expect(confirmSpy).toHaveBeenCalledTimes(1);
            expect(onDeleteEntry).toHaveBeenCalledWith(entries[0], 0);
            expect(onChange).not.toHaveBeenCalled();
            confirmSpy.mockRestore();
        });
    });
});

describe('commitDraggedEntry', () => {
    it('기존 시간대와 겹치면 onDuplicateBlocked를 호출하고 onChange는 호출하지 않아야 한다', () => {
        const entries: TimeSlotEntry[] = [{ weekdays: [1], startTime: '09:00', endTime: '10:00' }];
        const onChange = vi.fn();
        const onDuplicateBlocked = vi.fn();

        commitDraggedEntry({
            entries,
            onChange,
            onDuplicateBlocked,
            dragStartId: 'cell-0-2',
            endId: 'cell-0-3',
            startHour: 8,
        });

        expect(onChange).not.toHaveBeenCalled();
        expect(onDuplicateBlocked).toHaveBeenCalledTimes(1);
        expect(onDuplicateBlocked).toHaveBeenCalledWith({
            weekdays: [1],
            startTime: '09:00',
            endTime: '10:00',
        });
    });

    it('겹치지 않으면 onChange로 새 시간대를 추가해야 한다', () => {
        const entries: TimeSlotEntry[] = [{ weekdays: [1], startTime: '09:00', endTime: '10:00' }];
        const onChange = vi.fn();
        const onDuplicateBlocked = vi.fn();

        commitDraggedEntry({
            entries,
            onChange,
            onDuplicateBlocked,
            dragStartId: 'cell-0-4',
            endId: 'cell-0-5',
            startHour: 8,
        });

        expect(onDuplicateBlocked).not.toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([
            ...entries,
            { weekdays: [1], startTime: '10:00', endTime: '11:00' },
        ]);
    });
});
