import { httpClient } from '~/libs/httpClient';
import type { AttendanceStatus, IBookingDetail, IBookingFile, INoShowHistoryItem, IPaginatedBookingDetail, IPaginatedBookingWithRole, MeetingType } from '../types';
import { API_URL } from './constants';

interface BookingFlatResponse {
    id: number;
    timeSlotId: number;
    guestId: string;
    hostId: string | null;
    startedAt: string;
    endedAt: string;
    topic: string;
    description: string;
    attendanceStatus: string;
    createdAt: string;
    hostUsername: string | null;
    hostDisplayName: string | null;
    guestUsername: string | null;
    guestDisplayName: string | null;
    meetingType: MeetingType;
    location: string | null;
    meetingLink: string | null;
}

/** ISO 8601 datetime 문자열에서 "HH:mm" 형식의 시간 문자열 추출. */
function extractTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function toBookingDetail(b: BookingFlatResponse, files: IBookingFile[] = []): IBookingDetail {
    return {
        id: b.id,
        startedAt: new Date(b.startedAt),
        endedAt: new Date(b.endedAt),
        topic: b.topic,
        description: b.description,
        timeSlot: {
            id: b.timeSlotId,
            userId: '',
            startedAt: extractTime(b.startedAt),
            endedAt: extractTime(b.endedAt),
            weekdays: [],
            startDate: null,
            endDate: null,
            createdAt: b.createdAt,
            updatedAt: b.createdAt,
        },
        host: { username: b.hostUsername ?? '', displayName: b.hostDisplayName ?? '' },
        guest: { username: b.guestUsername ?? '', displayName: b.guestDisplayName ?? '' },
        files,
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
        attendanceStatus: b.attendanceStatus as AttendanceStatus,
        hostId: b.hostId,
        guestId: b.guestId,
        meetingType: b.meetingType,
        location: b.location,
        meetingLink: b.meetingLink,
    };
}

interface PaginatedBookingResponse {
    bookings: BookingFlatResponse[];
    totalCount: number;
    page: number;
    size: number;
}

interface BookingWithRoleFlatResponse extends BookingFlatResponse {
    role: 'guest' | 'host';
}

interface PaginatedBookingWithRoleResponse {
    bookings: BookingWithRoleFlatResponse[];
    totalCount: number;
    page: number;
    size: number;
}

async function fetchPaginatedBookings(endpoint: string, page: number, pageSize: number): Promise<IPaginatedBookingDetail> {
    const response = await httpClient<PaginatedBookingResponse>(
        `${API_URL}/bookings/${endpoint}?page=${page}&size=${pageSize}`
    );
    return {
        bookings: response.bookings.map(b => toBookingDetail(b)),
        totalCount: response.totalCount,
    };
}

export async function getMyBookings({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingDetail> {
    return fetchPaginatedBookings('guest/me', page, pageSize);
}

export async function getMyHostBookings({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingDetail> {
    return fetchPaginatedBookings('host/me', page, pageSize);
}

export async function getAllMyBookings({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingWithRole> {
    const response = await httpClient<PaginatedBookingWithRoleResponse>(
        `${API_URL}/bookings/me?page=${page}&size=${pageSize}`
    );

    return {
        bookings: response.bookings.map(b => ({
            ...toBookingDetail(b),
            role: b.role,
            counterpart: b.role === 'guest'
                ? { username: b.hostUsername ?? '', displayName: b.hostDisplayName ?? '' }
                : { username: b.guestUsername ?? '', displayName: b.guestDisplayName ?? '' },
        })),
        totalCount: response.totalCount,
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
    return httpClient<IBookingFile>(`${API_URL}/bookings/${id}/files`, {
        method: 'POST',
        body: files,
    });
}

export async function reportHostNoShow(bookingId: number, reason?: string): Promise<IBookingDetail> {
    const body = reason?.trim() ? { reason } : undefined;
    const [b, files] = await Promise.all([
        httpClient<BookingFlatResponse>(`${API_URL}/bookings/${bookingId}/report-noshow`, { method: 'POST', body }),
        httpClient<IBookingFile[]>(`${API_URL}/bookings/${bookingId}/files`)
    ]);
    return toBookingDetail(b, files);
}

export const getNoShowHistory = (hostId: string): Promise<INoShowHistoryItem[]> =>
    httpClient<INoShowHistoryItem[]>(`${API_URL}/bookings/host/${hostId}/noshow-history`);

export const getBookingFiles = (id: number): Promise<IBookingFile[]> =>
    httpClient<IBookingFile[]>(`${API_URL}/bookings/${id}/files`);

export const deleteBookingFile = (bookingId: number, fileId: number): Promise<void> =>
    httpClient<void>(`${API_URL}/bookings/${bookingId}/files/${fileId}`, { method: 'DELETE' });

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

export interface ConfirmUploadRequest {
    objectKey: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
}

/** Pre-signed 업로드 URL 생성 - 클라이언트가 S3에 직접 파일을 업로드할 수 있는 URL 생성 */
export const getPresignedUploadUrl = (bookingId: number, fileName: string, contentType: string): Promise<PresignedUploadUrlResponse> =>
    httpClient<PresignedUploadUrlResponse>(
        `${API_URL}/bookings/${bookingId}/files/presigned-upload-url`,
        { method: 'POST', body: { fileName, contentType } }
    );

export const confirmUpload = (bookingId: number, request: ConfirmUploadRequest): Promise<IBookingFile> =>
    httpClient<IBookingFile>(
        `${API_URL}/bookings/${bookingId}/files/confirm-upload`,
        { method: 'POST', body: request }
    );

/** Pre-signed 다운로드 URL 생성 - 클라이언트가 S3에서 직접 파일을 다운로드할 수 있는 URL 생성 */
export const getPresignedDownloadUrl = (bookingId: number, fileId: number): Promise<PresignedDownloadUrlResponse> =>
    httpClient<PresignedDownloadUrlResponse>(`${API_URL}/bookings/${bookingId}/files/${fileId}/presigned-download-url`);

/** Pre-signed URL을 사용하여 S3에 직접 파일 업로드 */
export async function uploadFileToS3(presignedUrl: string, file: File): Promise<void> {
    const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    if (!response.ok) throw new Error('S3 업로드 실패');
}

/** Pre-signed URL 방식으로 파일 업로드 (전체 플로우) */
export async function uploadBookingFileWithPresignedUrl(bookingId: number, file: File): Promise<IBookingFile> {
    const contentType = file.type || 'application/octet-stream';
    const { url, objectKey } = await getPresignedUploadUrl(bookingId, file.name, contentType);
    await uploadFileToS3(url, file);
    return confirmUpload(bookingId, {
        objectKey,
        originalFileName: file.name,
        contentType,
        fileSize: file.size,
    });
}

/** Pre-signed URL 방식으로 파일 다운로드 */
export async function downloadFileWithPresignedUrl(bookingId: number, fileId: number, fileName: string): Promise<void> {
    const { url } = await getPresignedDownloadUrl(bookingId, fileId);
    const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
    document.body.appendChild(link);
    link.click();
    link.remove();
}
