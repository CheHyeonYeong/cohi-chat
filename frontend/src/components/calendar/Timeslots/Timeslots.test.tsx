import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Timeslots } from './Timeslots';
import type { IBooking, ITimeSlot } from '../types';

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement('a', { href: to, ...props }, children),
}));

vi.mock('~/features/member', () => ({
    useAuth: () => ({ isAuthenticated: true }),
}));

const timeslots: ITimeSlot[] = [
    {
        id: 1,
        userId: 'host-1',
        startedAt: '10:00',
        endedAt: '11:00',
        weekdays: [1],
        startDate: null,
        endDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 2,
        userId: 'host-1',
        startedAt: '11:00',
        endedAt: '12:00',
        weekdays: [1],
        startDate: null,
        endDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
];

const bookings: IBooking[] = [
    {
        id: 11,
        timeSlotId: 1,
        startedAt: '2025-03-17T10:00:00+09:00',
        endedAt: '2025-03-17T11:00:00+09:00',
    },
];

describe('Timeslots', () => {
    it('예약된 슬롯은 비활성화하고 예약 가능한 슬롯만 선택된다', () => {
        const onSelectTimeslot = vi.fn();

        render(
            <Timeslots
                baseDate={new Date('2025-03-17T00:00:00+09:00')}
                timeslots={timeslots}
                bookings={bookings}
                onSelectTimeslot={onSelectTimeslot}
            />
        );

        const bookedButton = screen.getByRole('button', { name: /10:00 예약 마감/i });
        const availableButton = screen.getByRole('button', { name: /^11:00$/i });

        expect(bookedButton).toBeDisabled();
        expect(availableButton).not.toBeDisabled();

        fireEvent.click(availableButton);

        expect(onSelectTimeslot).toHaveBeenCalledWith(timeslots[1]);
    });
});
