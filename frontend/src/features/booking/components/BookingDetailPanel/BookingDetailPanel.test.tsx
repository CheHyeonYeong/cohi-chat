/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BookingDetailPanel } from './BookingDetailPanel';
import type { IBookingDetail } from '../../types';
import type { IBookingFile } from '../../types';
import React from 'react';

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

// Mock components
vi.mock('~/components', () => ({
    Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('./BookingHeader', () => ({
    BookingHeader: ({ displayName, roleLabel, attendanceStatus, actions }: { displayName: string; roleLabel: string; attendanceStatus: string; actions?: React.ReactNode }) => (
        <div data-testid="booking-header">
            <span>{displayName}</span>
            <span>{roleLabel}</span>
            <span>{attendanceStatus}</span>
            {actions}
        </div>
    ),
}));

vi.mock('../BookingFileSection', () => ({
    BookingFileSection: ({ files }: { files: IBookingFile[] }) => (
        <div data-testid="booking-file-section">
            {files.length === 0
                ? <span>drop-files-here</span>
                : files.map((f) => <span key={f.id}>{f.originalFileName}</span>)
            }
        </div>
    ),
}));

vi.mock('../BookingMetaSection', () => ({
    BookingMetaSection: ({ booking }: { booking: IBookingDetail }) => (
        <div data-testid="booking-meta-section">
            <span>{booking.topic}</span>
            <span>{booking.startedAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>{booking.timeSlot.startedAt} - {booking.timeSlot.endedAt}</span>
            <span>{booking.description || '설명이 없습니다.'}</span>
        </div>
    ),
}));

// Mock @tanstack/react-router to resolve parameters in the Link component
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, params }: { children: React.ReactNode; to: string; params?: Record<string, string | number | undefined> }) => {
        let href = to;
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                href = href.replace('$' + key, String(value));
            });
        }
        return <a href={href}>{children}</a>;
    },
}));

describe('BookingDetailPanel', () => {
    afterEach(() => cleanup());

    it('예약이 없으면 안내 메시지를 표시해야 한다', () => {
        const { getByText } = render(<BookingDetailPanel booking={null} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText(/예약을 선택해주세요/)).toBeInTheDocument();
    });

    it('예약 정보(호스트 이름, 주제, 설명)를 표시해야 한다', () => {
        const { getByText } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText('홍길동')).toBeInTheDocument();
        expect(getByText('커리어 상담')).toBeInTheDocument();
        expect(getByText('포트폴리오 피드백 요청드립니다.')).toBeInTheDocument();
    });

    it('예약 날짜와 시간을 표시해야 한다', () => {
        const { getByText } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText((content) => content.includes('2024년 2월 15일'))).toBeInTheDocument();
        expect(getByText('10:00 - 11:00')).toBeInTheDocument();
    });

    it('상세 페이지로 이동하는 링크가 있어야 한다', () => {
        const { getByRole } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        const link = getByRole('link', { name: /상세보기/ });
        expect(link.getAttribute('href')).toBe('/booking/1');
    });

    it('파일이 없으면 빈 상태를 표시해야 한다', () => {
        const { getByTestId } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        expect(getByTestId('booking-file-section')).toBeInTheDocument();
        expect(getByTestId('booking-file-section')).toHaveTextContent('drop-files-here');
    });

    it('파일이 있으면 파일 목록을 표시해야 한다', () => {
        const bookingWithFiles: IBookingDetail = {
            ...mockBooking,
            files: [
                { id: 1, fileName: 'a.pdf', originalFileName: 'resume.pdf', fileSize: 1024, contentType: 'application/pdf', createdAt: '2024-01-01T00:00:00Z' },
            ],
        };
        const { getByText } = render(<BookingDetailPanel booking={bookingWithFiles} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText('resume.pdf')).toBeInTheDocument();
    });
});
