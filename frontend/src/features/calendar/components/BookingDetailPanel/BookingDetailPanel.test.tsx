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
    topic: '??? ??',
    description: '????? ??? ??????.',
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
    host: { username: 'hong', displayName: '???' },
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

    it('??? ??? ?? ???? ???? ??', () => {
        const { getByText } = render(<BookingDetailPanel booking={null} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText(/??? ??????/i)).toBeInTheDocument();
    });

    it('?? ??(??? ??, ??, ??)? ???? ??', () => {
        const { getByText } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText('???')).toBeInTheDocument();
        expect(getByText('??? ??')).toBeInTheDocument();
        expect(getByText('????? ??? ??????.')).toBeInTheDocument();
    });

    it('?? ??? ??? ???? ??', () => {
        const { getByText } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        expect(getByText(/2024? 2? 15?/)).toBeInTheDocument();
        expect(getByText('10:00 - 11:00')).toBeInTheDocument();
    });

    it('?? ???? ???? ??? ??? ??', () => {
        const { getByRole } = render(<BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />);
        const link = getByRole('link');
        expect(link.getAttribute('href')).toBe('/booking/1');
    });

    it('??? ??? ?? ??? ???? ??', () => {
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
