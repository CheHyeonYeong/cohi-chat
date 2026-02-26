/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import BookingDetailPanel from './BookingDetailPanel';
import type { IBookingDetail } from '../../types';
import React from 'react';

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

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe('BookingDetailPanel', () => {
    afterEach(() => cleanup());

    it('예약이 없으면 안내 메시지를 표시해야 한다', () => {
        const { getByText } = render(<BookingDetailPanel booking={null} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText('예약을 선택해주세요.')).toBeInTheDocument();
    });

    it('예약 정보(호스트 이름, 주제, 설명)를 표시해야 한다', () => {
        const { getByText } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText('홍길동')).toBeInTheDocument();
        expect(getByText('커리어 상담')).toBeInTheDocument();
        expect(getByText('포트폴리오 피드백 요청드립니다.')).toBeInTheDocument();
    });

    it('예약 날짜와 시간을 표시해야 한다', () => {
        const { getByText } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText(/2024년 2월 15일/)).toBeInTheDocument();
        expect(getByText('10:00 - 11:00')).toBeInTheDocument();
    });

    it('상세 페이지로 이동하는 링크가 있어야 한다', () => {
        const { getByRole } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        const link = getByRole('link');
        expect(link.getAttribute('href')).toBe('/booking/1');
    });

    it('파일이 있으면 파일 목록을 표시해야 한다', () => {
        const bookingWithFiles: IBookingDetail = {
            ...mockBooking,
            files: [
                { id: 1, file: 'a.pdf', originalFileName: 'resume.pdf', fileSize: 1024, contentType: 'application/pdf' },
            ],
        };
        const { getByText } = render(<BookingDetailPanel booking={bookingWithFiles} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText('resume.pdf')).toBeInTheDocument();
    });
});
