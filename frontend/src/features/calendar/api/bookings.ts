import { httpClient } from '~/libs/httpClient';
import type { StringTime, ISO8601String } from '~/types/base';
import type { AttendanceStatus, IBooking, IBookingDetail, IBookingFile, INoShowHistoryItem, IPaginatedBookingDetail } from '../types';
import { API_URL } from './constants';

export async function getBookingsByDate(slug: string, date: { year: number; month: number }): Promise<IBooking[]> {
    const url = `${API_URL}/calendar/${slug}/bookings?year=${date.year}&month=${date.month}`;
    const data: IBooking[] = await httpClient<IBooking[]>(url);
    return data;
}

interface BookingFlatResponse {
    id: number;
    timeSlotId: number;
    guestId: string;
    hostId: string | null;
    when: string;
    startTime: StringTime;
    endTime: StringTime;
    topic: string;
    description: string;
    attendanceStatus: string;
    createdAt: ISO8601String;
    hostUsername: string | null;
    hostDisplayName: string | null;
}

/** ?? ?? ???("YYYY-MM-DD")? ?? ???? ??. UTC ?? ???? ?? ?? ?? ??. */
function parseDateLocal(dateStr: string): Date {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toBookingDetail(b: BookingFlatResponse, files: IBookingFile[] = []): IBookingDetail {
    return {
        id: b.id,
        when: parseDateLocal(b.when),
        topic: b.topic,
        description: b.description,
        timeSlot: {
            id: b.timeSlotId,
            userId: '',
            startTime: b.startTime,
            endTime: b.endTime,
            weekdays: [],
            startDate: null,
            endDate: null,
            createdAt: b.createdAt,
            updatedAt: b.createdAt,
        },
        host: {
            username: b.hostUsername ?? '',
            displayName: b.hostDisplayName ?? '',
        },
        files,
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
        attendanceStatus: b.attendanceStatus as AttendanceStatus,
        hostId: b.hostId,
        guestId: b.guestId,
    };
}

export async function getMyBookings({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingDetail> {
    const list = await httpClient<BookingFlatResponse[]>(`${API_URL}/bookings/guest/me`) ?? [];
    const bookings = list.map(b => toBookingDetail(b));

    const start = (page - 1) * pageSize;
    return {
        bookings: bookings.slice(start, start + pageSize),
        totalCount: bookings.length,
    };
}

export async function getBooking(id: number): Promise<IBookingDetail> {
    const [b, files] = await Promise.all([
        httpClient<BookingFlatResponse>(`${API_URL}/bookings/${id}`),
        httpClient<IBookingFile[]>(`${API_URL}/bookings/${id}/files`)
    ]);
    return toBookingDetail(b, files);
}

export async function uploadBookingFile(id: number, files: FormData): Promise<IBookingFile> {
    const url = `${API_URL}/bookings/${id}/files`;
    const data: IBookingFile = await httpClient<IBookingFile>(url, {
        method: 'POST',
        body: files,
    });
    return data;
}

export async function reportHostNoShow(bookingId: number, reason?: string): Promise<IBookingDetail> {
    const [b, files] = await Promise.all([
        httpClient<BookingFlatResponse>(`${API_URL}/bookings/${bookingId}/report-noshow`, {
            method: 'POST',
            body: reason && reason.trim() !== '' ? { reason } : undefined,
        }),
        httpClient<IBookingFile[]>(`${API_URL}/bookings/${bookingId}/files`)
    ]);
    return toBookingDetail(b, files);
}

export async function getNoShowHistory(hostId: string): Promise<INoShowHistoryItem[]> {
    return await httpClient<INoShowHistoryItem[]>(`${API_URL}/bookings/host/${hostId}/noshow-history`);
}

export async function getBookingFiles(id: number): Promise<IBookingFile[]> {
    return await httpClient<IBookingFile[]>(`${API_URL}/bookings/${id}/files`);
}

export async function deleteBookingFile(bookingId: number, fileId: number): Promise<void> {
    await httpClient<void>(`${API_URL}/bookings/${bookingId}/files/${fileId}`, {
        method: 'DELETE',
    });
}

// Pre-signed URL 관련 타입
export interface PresignedUploadUrlResponse {
    url: string;
    objectKey: string;
    expiresIn: number;
}

export interface PresignedDownloadUrlResponse {
    url: string;
    expiresIn: number;
}

/**
 * Pre-signed 업로드 URL 생성
 * 클라이언트가 S3에 직접 파일을 업로드할 수 있는 URL을 생성
 */
export async function getPresignedUploadUrl(
    bookingId: number,
    fileName: string,
    contentType: string
): Promise<PresignedUploadUrlResponse> {
    return await httpClient<PresignedUploadUrlResponse>(
        `${API_URL}/bookings/${bookingId}/files/presigned-upload-url`,
        {
            method: 'POST',
            body: { fileName, contentType },
        }
    );
}

/**
 * Pre-signed 다운로드 URL 생성
 * 클라이언트가 S3에서 직접 파일을 다운로드할 수 있는 URL을 생성
 */
export async function getPresignedDownloadUrl(
    bookingId: number,
    fileId: number
): Promise<PresignedDownloadUrlResponse> {
    return await httpClient<PresignedDownloadUrlResponse>(
        `${API_URL}/bookings/${bookingId}/files/${fileId}/presigned-download-url`
    );
}

/**
 * Pre-signed URL을 사용하여 S3에 직접 파일 업로드
 */
export async function uploadFileToS3(
    presignedUrl: string,
    file: File
): Promise<void> {
    const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type,
        },
    });

    if (!response.ok) {
        throw new Error('S3 업로드 실패');
    }
}

/**
 * Pre-signed URL 방식으로 파일 업로드 (전체 플로우)
 * 1. Pre-signed URL 생성 요청
 * 2. S3에 직접 업로드
 */
export async function uploadBookingFileWithPresignedUrl(
    bookingId: number,
    file: File
): Promise<{ objectKey: string }> {
    // 1. Pre-signed URL 생성
    const { url, objectKey } = await getPresignedUploadUrl(
        bookingId,
        file.name,
        file.type || 'application/octet-stream'
    );

    // 2. S3에 직접 업로드
    await uploadFileToS3(url, file);

    return { objectKey };
}

/**
 * Pre-signed URL 방식으로 파일 다운로드
 */
export async function downloadFileWithPresignedUrl(
    bookingId: number,
    fileId: number,
    fileName: string
): Promise<void> {
    // 1. Pre-signed URL 생성
    const { url } = await getPresignedDownloadUrl(bookingId, fileId);

    // 2. 다운로드 링크 생성 및 클릭
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
