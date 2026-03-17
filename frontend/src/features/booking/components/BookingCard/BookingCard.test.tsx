/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { BookingCard } from './BookingCard';
import type { IBookingDetail } from '../../types';

const mockBooking: IBookingDetail = {
    id: 1,
    startedAt: new Date('2024-02-15T10:00:00+09:00'),
    endedAt: new Date('2024-02-15T11:00:00+09:00'),
    topic: '커리어 상담',
    description: '포트폴리오 피드백 요청드립니다.',
    timeSlot: {
        id: 10,
        userId: 'host-uuid',
        startedAt: '10:00',
        endedAt: '11:00',
        weekdays: [4],
        startDate: null,
        endDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    host: { username: 'hong', displayName: '홍길동' },
    guest: { username: 'guest1', displayName: '게스트1' },
    hostId: 'host-uuid',
    guestId: 'guest-uuid',
    attendanceStatus: 'SCHEDULED',
    files: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    meetingType: 'ONLINE',
    location: null,
    meetingLink: 'https://meet.google.com/test',
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
        expect(getByRole('button').className).toContain('border-[var(--cohi-primary)]');
    });

    it('isSelected가 false이면 기본 스타일을 적용해야 한다', () => {
        const { getByRole } = render(
            <BookingCard booking={mockBooking} onSelect={vi.fn()} isSelected={false} />,
        );
        expect(getByRole('button').className).not.toContain('border-[var(--cohi-primary)]');
    });

    it('role이 guest이면 게스트 태그를 표시해야 한다', () => {
        const { getByTestId } = render(
            <BookingCard booking={mockBooking} role="guest" counterpart={{ username: 'hong', displayName: '홍길동' }} />,
        );
        const tag = getByTestId('booking-role-tag');
        expect(tag.textContent).toContain('게스트');
    });

    it('role이 host이면 호스트 태그를 표시해야 한다', () => {
        const { getByTestId } = render(
            <BookingCard booking={mockBooking} role="host" counterpart={{ username: 'guest1', displayName: '게스트1' }} />,
        );
        const tag = getByTestId('booking-role-tag');
        expect(tag.textContent).toContain('호스트');
    });

    it('counterpart가 주어지면 counterpart 이름을 표시해야 한다', () => {
        const { container } = render(
            <BookingCard booking={mockBooking} role="host" counterpart={{ username: 'guest1', displayName: '게스트1' }} />,
        );
        expect(container.textContent).toContain('게스트1님과의 커피챗');
    });

    it('counterpart가 주어지면 counterpart의 이니셜을 아바타에 표시해야 한다', () => {
        const { getByTestId } = render(
            <BookingCard booking={mockBooking} role="host" counterpart={{ username: 'guest1', displayName: '게스트1' }} />,
        );
        const avatar = getByTestId('booking-avatar-initial');
        expect(avatar.textContent).toBe('게');
    });

    it('role이 없으면 태그를 표시하지 않아야 한다', () => {
        const { queryByTestId } = render(<BookingCard booking={mockBooking} />);
        expect(queryByTestId('booking-role-tag')).toBeNull();
    });

    it('description이 있으면 표시해야 한다', () => {
        const { container } = render(<BookingCard booking={mockBooking} />);
        expect(container.textContent).toContain('포트폴리오 피드백 요청드립니다.');
    });

    it('description이 없으면 표시하지 않아야 한다', () => {
        const bookingWithoutDesc: IBookingDetail = { ...mockBooking, description: '' };
        const { container } = render(<BookingCard booking={bookingWithoutDesc} />);
        expect(container.textContent).not.toContain('포트폴리오 피드백 요청드립니다.');
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
