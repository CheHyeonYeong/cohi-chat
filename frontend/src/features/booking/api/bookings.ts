import { httpClient } from '~/libs/httpClient';
import { parseDateTime, extractTime } from '~/libs/date';
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

const toBookingDetail = (b: BookingFlatResponse, files: IBookingFile[] = []): IBookingDetail => ({
    id: b.id,
    startedAt: parseDateTime(b.startedAt),
    endedAt: parseDateTime(b.endedAt),
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
    host: {
        username: b.hostUsername ?? '',
        displayName: b.hostDisplayName ?? '',
    },
    guest: {
        username: b.guestUsername ?? '',
        displayName: b.guestDisplayName ?? '',
    },
    files,
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
    attendanceStatus: b.attendanceStatus as AttendanceStatus,
    hostId: b.hostId,
    guestId: b.guestId,
    meetingType: b.meetingType,
    location: b.location,
    meetingLink: b.meetingLink,
});

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

export const getMyBookings = async ({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingDetail> => {
    const response = await httpClient<PaginatedBookingResponse>(
        `${API_URL}/bookings/guest/me?page=${page}&size=${pageSize}`
    );
    return {
        bookings: response.bookings.map(b => toBookingDetail(b)),
        totalCount: response.totalCount,
    };
};

export const getMyHostBookings = async ({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingDetail> => {
    const response = await httpClient<PaginatedBookingResponse>(
        `${API_URL}/bookings/host/me?page=${page}&size=${pageSize}`
    );
    return {
        bookings: response.bookings.map(b => toBookingDetail(b)),
        totalCount: response.totalCount,
    };
};

export const getAllMyBookings = async ({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingWithRole> => {
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
};

export const getBooking = async (id: number): Promise<IBookingDetail> => {
    const [b, files] = await Promise.all([
        httpClient<BookingFlatResponse>(`${API_URL}/bookings/${id}`),
        httpClient<IBookingFile[]>(`${API_URL}/bookings/${id}/files`)
    ]);
    return toBookingDetail(b, files);
};

export const uploadBookingFile = async (id: number, files: FormData): Promise<IBookingFile> => {
    const url = `${API_URL}/bookings/${id}/files`;
    const data: IBookingFile = await httpClient<IBookingFile>(url, {
        method: 'POST',
        body: files,
    });
    return data;
};

export const reportHostNoShow = async (bookingId: number, reason?: string): Promise<IBookingDetail> => {
    const body = reason?.trim() ? { reason } : undefined;
    const [b, files] = await Promise.all([
        httpClient<BookingFlatResponse>(`${API_URL}/bookings/${bookingId}/report-noshow`, { method: 'POST', body }),
        httpClient<IBookingFile[]>(`${API_URL}/bookings/${bookingId}/files`)
    ]);
    return toBookingDetail(b, files);
};

export const getNoShowHistory = async (hostId: string): Promise<INoShowHistoryItem[]> =>
    httpClient<INoShowHistoryItem[]>(`${API_URL}/bookings/host/${hostId}/noshow-history`);

export const getBookingFiles = async (id: number): Promise<IBookingFile[]> =>
    httpClient<IBookingFile[]>(`${API_URL}/bookings/${id}/files`);

export const deleteBookingFile = async (bookingId: number, fileId: number): Promise<void> => {
    await httpClient<void>(`${API_URL}/bookings/${bookingId}/files/${fileId}`, {
        method: 'DELETE',
    });
};

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

export const getPresignedUploadUrl = async (bookingId: number, fileName: string, contentType: string): Promise<PresignedUploadUrlResponse> =>
    httpClient<PresignedUploadUrlResponse>(
        `${API_URL}/bookings/${bookingId}/files/presigned-upload-url`,
        { method: 'POST', body: { fileName, contentType } }
    );

export const confirmUpload = async (bookingId: number, request: ConfirmUploadRequest): Promise<IBookingFile> =>
    httpClient<IBookingFile>(
        `${API_URL}/bookings/${bookingId}/files/confirm-upload`,
        { method: 'POST', body: request }
    );

export const getPresignedDownloadUrl = async (bookingId: number, fileId: number): Promise<PresignedDownloadUrlResponse> =>
    httpClient<PresignedDownloadUrlResponse>(`${API_URL}/bookings/${bookingId}/files/${fileId}/presigned-download-url`);

export const uploadFileToS3 = async (presignedUrl: string, file: File): Promise<void> => {
    const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    if (!response.ok) throw new Error('S3 업로드 실패');
};

export const uploadBookingFileWithPresignedUrl = async (bookingId: number, file: File): Promise<IBookingFile> => {
    const contentType = file.type || 'application/octet-stream';
    const { url, objectKey } = await getPresignedUploadUrl(bookingId, file.name, contentType);
    await uploadFileToS3(url, file);
    return confirmUpload(bookingId, {
        objectKey,
        originalFileName: file.name,
        contentType,
        fileSize: file.size,
    });
};

export const downloadFileWithPresignedUrl = async (bookingId: number, fileId: number, fileName: string): Promise<void> => {
    const { url } = await getPresignedDownloadUrl(bookingId, fileId);
    const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
    document.body.appendChild(link);
    link.click();
    link.remove();
};
