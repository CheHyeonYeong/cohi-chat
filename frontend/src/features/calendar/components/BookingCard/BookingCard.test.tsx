/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import BookingCard from './BookingCard';
import type { IBookingDetail } from '../../types';

const mockBooking: IBookingDetail = {
    id: 1,
    when: new Date('2024-02-15'),
    topic: '커리어 상담',
    description: '포트폴리오 피드백 요청드립니다.',
    timeSlot: {
        id: 10,
        userId: 'host-uuid',
        startTime: '10:00',
        endTime: '11:00',
        weekdays: [4],
        startDate: null,
        endDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    host: { username: 'hong', displayName: '홍길동' },
    hostId: 'host-uuid',
    guestId: 'guest-uuid',
    attendanceStatus: 'SCHEDULED',
    files: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
};

describe('BookingCard', () => {
    afterEach(() => cleanup());

    it('host displayName과 topic을 렌더링해야 한다', () => {
        const { container } = render(<BookingCard booking={mockBooking} />);
        expect(container.textContent).toContain('홍길동');
        expect(container.textContent).toContain('커리어 상담');
    });

    it('날짜와 시간을 렌더링해야 한다', () => {
        const { container } = render(<BookingCard booking={mockBooking} />);
        expect(container.textContent).toContain('10:00');
        expect(container.textContent).toContain('11:00');
    });

    it('onSelect가 있으면 클릭 시 booking.id를 인자로 호출해야 한다', () => {
        const onSelect = vi.fn();
        const { getByRole } = render(
            <BookingCard booking={mockBooking} onSelect={onSelect} />,
        );
        fireEvent.click(getByRole('button'));
        expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('isSelected가 true이면 선택 스타일을 적용해야 한다', () => {
        const { getByRole } = render(
            <BookingCard booking={mockBooking} onSelect={vi.fn()} isSelected />,
        );
        expect(getByRole('button').className).toContain('border-[var(--cohe-primary)]');
    });

    it('isSelected가 false이면 기본 스타일을 적용해야 한다', () => {
        const { getByRole } = render(
            <BookingCard booking={mockBooking} onSelect={vi.fn()} isSelected={false} />,
        );
        expect(getByRole('button').className).not.toContain('border-[var(--cohe-primary)]');
    });

    it('파일이 있으면 첨부 개수 배지를 표시해야 한다', () => {
        const bookingWithFiles: IBookingDetail = {
            ...mockBooking,
            files: [
                { id: 1, fileName: 'a.pdf', originalFileName: 'resume.pdf', fileSize: 1024, contentType: 'application/pdf', createdAt: '2024-01-01T00:00:00Z' },
            ],
        };
        const { container } = render(<BookingCard booking={bookingWithFiles} />);
        expect(container.textContent).toContain('1');
        expect(container.textContent).toContain('첨부');
    });
});
