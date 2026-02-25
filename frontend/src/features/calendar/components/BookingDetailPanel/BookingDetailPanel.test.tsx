/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import BookingDetailPanel from './BookingDetailPanel';
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
    files: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
};

describe('BookingDetailPanel', () => {
    afterEach(() => cleanup());

    it('topic을 렌더링해야 한다', () => {
        const { container } = render(
            <BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />,
        );
        expect(container.textContent).toContain('커리어 상담');
    });

    it('날짜와 시간을 렌더링해야 한다', () => {
        const { container } = render(
            <BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />,
        );
        expect(container.textContent).toContain('10:00');
        expect(container.textContent).toContain('11:00');
        expect(container.textContent).toContain('2024');
    });

    it('설명을 렌더링해야 한다', () => {
        const { container } = render(
            <BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />,
        );
        expect(container.textContent).toContain('포트폴리오 피드백 요청드립니다.');
    });

    it('파일이 없으면 "첨부 파일이 없습니다"를 표시해야 한다', () => {
        const { container } = render(
            <BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading={false} />,
        );
        expect(container.textContent).toContain('첨부 파일이 없습니다');
    });

    it('파일이 있으면 파일명을 렌더링해야 한다', () => {
        const bookingWithFiles: IBookingDetail = {
            ...mockBooking,
            files: [
                { id: 1, file: 'a.pdf', originalFileName: 'resume.pdf', fileSize: 10240, contentType: 'application/pdf' },
                { id: 2, file: 'b.png', originalFileName: 'portfolio.png', fileSize: 20480, contentType: 'image/png' },
            ],
        };
        const { container } = render(
            <BookingDetailPanel booking={bookingWithFiles} onUpload={vi.fn()} isUploading={false} />,
        );
        expect(container.textContent).toContain('resume.pdf');
        expect(container.textContent).toContain('portfolio.png');
    });

    it('isUploading이 true이면 업로드 버튼이 비활성화돼야 한다', () => {
        const { getByText } = render(
            <BookingDetailPanel booking={mockBooking} onUpload={vi.fn()} isUploading />,
        );
        const btn = getByText(/업로드 중/);
        expect(btn.closest('button')).toBeDisabled();
    });
});
