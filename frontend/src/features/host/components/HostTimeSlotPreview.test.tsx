import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HostTimeSlotPreview } from './HostTimeSlotPreview';
import type { ITimeSlot } from '~/components/calendar';

const mockTimeslots: ITimeSlot[] = [
    {
        id: 1,
        userId: 'user1',
        startedAt: '10:00',
        endedAt: '11:00',
        weekdays: [1, 3, 5],
        startDate: null,
        endDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 2,
        userId: 'user1',
        startedAt: '14:00',
        endedAt: '15:30',
        weekdays: [2, 4],
        startDate: null,
        endDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
];

describe('HostTimeSlotPreview', () => {
    it('요일별 시간대를 렌더링한다', () => {
        render(<HostTimeSlotPreview timeslots={mockTimeslots} />);

        expect(screen.getByText('월, 수, 금')).toBeInTheDocument();
        expect(screen.getByText('10:00 - 11:00')).toBeInTheDocument();
        expect(screen.getByText('화, 목')).toBeInTheDocument();
        expect(screen.getByText('14:00 - 15:30')).toBeInTheDocument();
    });

    it('로딩 중이면 로딩 메시지를 표시한다', () => {
        render(<HostTimeSlotPreview timeslots={[]} isLoading />);

        expect(screen.getByTestId('host-timeslot-preview-loading')).toHaveTextContent(
            '시간대를 불러오는 중...',
        );
    });

    it('시간대가 없으면 빈 상태 메시지를 표시한다', () => {
        render(<HostTimeSlotPreview timeslots={[]} />);

        expect(screen.getByTestId('host-timeslot-preview-empty')).toHaveTextContent(
            '등록된 예약 가능 시간이 없습니다.',
        );
    });
});
