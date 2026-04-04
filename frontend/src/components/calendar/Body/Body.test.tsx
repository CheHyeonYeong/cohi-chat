import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Body } from './Body';
import type { ITimeSlot } from '../types';

describe('Body', () => {
    const createTimeslot = (weekdays: number[]): ITimeSlot => ({
        id: 1,
        userId: 'test-user',
        startedAt: '10:00',
        endedAt: '11:00',
        weekdays,
        startDate: null,
        endDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    });

    const defaultProps = {
        year: 2024,
        month: 6,
        days: [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
        timeslots: [] as ITimeSlot[],
        bookings: [],
        onSelectDay: vi.fn(),
    };

    describe('요일 헤더', () => {
        it('요일 헤더를 표시한다', () => {
            render(<Body {...defaultProps} />);

            expect(screen.getByText('일')).toBeInTheDocument();
            expect(screen.getByText('월')).toBeInTheDocument();
            expect(screen.getByText('화')).toBeInTheDocument();
            expect(screen.getByText('수')).toBeInTheDocument();
            expect(screen.getByText('목')).toBeInTheDocument();
            expect(screen.getByText('금')).toBeInTheDocument();
            expect(screen.getByText('토')).toBeInTheDocument();
        });
    });

    describe('날짜 렌더링', () => {
        it('캘린더 그리드를 렌더링한다', () => {
            render(<Body {...defaultProps} />);

            const grid = screen.getByRole('grid');
            expect(grid).toBeInTheDocument();
        });

        it('날짜들을 표시한다', () => {
            render(<Body {...defaultProps} />);

            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('15')).toBeInTheDocument();
            expect(screen.getByText('30')).toBeInTheDocument();
        });
    });

    describe('날짜 선택', () => {
        it('예약 가능한 날짜를 클릭하면 onSelectDay가 호출된다', async () => {
            const onSelectDay = vi.fn();
            const baseDate = new Date(2024, 5, 1);
            const timeslots = [createTimeslot([0, 1, 2, 3, 4, 5, 6])];

            render(
                <Body
                    {...defaultProps}
                    baseDate={baseDate}
                    timeslots={timeslots}
                    onSelectDay={onSelectDay}
                />,
            );

            const dayCell = screen.getByText('15');
            await userEvent.click(dayCell);

            expect(onSelectDay).toHaveBeenCalledWith(new Date(2024, 5, 15));
        });

        it('타임슬롯이 없는 날짜는 버튼 role이 없다', () => {
            const baseDate = new Date(2024, 5, 1);

            render(<Body {...defaultProps} baseDate={baseDate} timeslots={[]} />);

            const dayButton = screen.queryByRole('button', { name: 'day-15' });
            expect(dayButton).not.toBeInTheDocument();
        });
    });

    describe('선택된 날짜 표시', () => {
        it('선택된 날짜에 스타일이 적용된다', () => {
            const baseDate = new Date(2024, 5, 1);
            const selectedDate = new Date(2024, 5, 15);
            const timeslots = [createTimeslot([0, 1, 2, 3, 4, 5, 6])];

            render(
                <Body
                    {...defaultProps}
                    baseDate={baseDate}
                    selectedDate={selectedDate}
                    timeslots={timeslots}
                />,
            );

            const dayButton = screen.getByRole('button', { name: 'day-15' });
            const span = dayButton.querySelector('span');
            expect(span).toHaveClass('cohi-selectable-active');
        });
    });

    describe('과거 날짜 처리', () => {
        it('과거 날짜는 선택할 수 없다', () => {
            const baseDate = new Date(2024, 5, 15);
            const timeslots = [createTimeslot([0, 1, 2, 3, 4, 5, 6])];

            render(
                <Body
                    {...defaultProps}
                    baseDate={baseDate}
                    timeslots={timeslots}
                />,
            );

            const pastDayButton = screen.queryByRole('button', { name: 'day-10' });
            expect(pastDayButton).not.toBeInTheDocument();
        });
    });
});
