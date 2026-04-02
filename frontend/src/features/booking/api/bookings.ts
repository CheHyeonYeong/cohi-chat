import { httpClient } from '~/libs/httpClient';
import { parseDateTime, extractTime } from '~/libs/date';
import type { AttendanceStatus, IBookingDetail, IBookingFile, IBookingWithRole, INoShowHistoryItem, IPaginatedBookingDetail, IPaginatedBookingWithRole, MeetingType } from '../types';
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
    const fetchSize = page * pageSize;
    const [guestResult, hostResult] = await Promise.all([
        getMyBookings({ page: 1, pageSize: fetchSize }),
        getMyHostBookings({ page: 1, pageSize: fetchSize }),
    ]);

    const guestBookings: IBookingWithRole[] = guestResult.bookings.map(b => ({
        ...b,
        role: 'guest' as const,
        counterpart: b.host,
    }));

    const hostBookings: IBookingWithRole[] = hostResult.bookings.map(b => ({
        ...b,
        role: 'host' as const,
        counterpart: b.guest,
    }));

    // Deduplicate by bookingId — prefer guest role if same booking appears in both
    const seen = new Set<number>();
    const merged: IBookingWithRole[] = [];

    for (const b of guestBookings) {
        seen.add(b.id);
        merged.push(b);
    }
    for (const b of hostBookings) {
        if (!seen.has(b.id)) {
            merged.push(b);
        }
    }

    // Sort by startedAt descending
    merged.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    // Client-side pagination
    const start = (page - 1) * pageSize;
    return {
        bookings: merged.slice(start, start + pageSize),
        totalCount: merged.length,
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
    const [b, files] = await Promise.all([
        httpClient<BookingFlatResponse>(`${API_URL}/bookings/${bookingId}/report-noshow`, {
            method: 'POST',
            body: reason && reason.trim() !== '' ? { reason } : undefined,
        }),
        httpClient<IBookingFile[]>(`${API_URL}/bookings/${bookingId}/files`)
    ]);
    return toBookingDetail(b, files);
};

export const getNoShowHistory = async (hostId: string): Promise<INoShowHistoryItem[]> => await httpClient<INoShowHistoryItem[]>(`${API_URL}/bookings/host/${hostId}/noshow-history`);

export const getBookingFiles = async (id: number): Promise<IBookingFile[]> => await httpClient<IBookingFile[]>(`${API_URL}/bookings/${id}/files`);

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
    contentType: string;
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

/**
 * Pre-signed 업로드 URL 생성
 * 클라이언트가 S3에 직접 파일을 업로드할 수 있는 URL을 생성
 */
export const getPresignedUploadUrl = async (bookingId: number, fileName: string, contentType: string): Promise<PresignedUploadUrlResponse> => await httpClient<PresignedUploadUrlResponse>(
    `${API_URL}/bookings/${bookingId}/files/presigned-upload-url`,
    {
        method: 'POST',
        body: { fileName, contentType },
    }
);

export const confirmUpload = async (bookingId: number, request: ConfirmUploadRequest): Promise<IBookingFile> => await httpClient<IBookingFile>(
    `${API_URL}/bookings/${bookingId}/files/confirm-upload`,
    {
        method: 'POST',
        body: request,
    }
);

/**
 * Pre-signed 다운로드 URL 생성
 * 클라이언트가 S3에서 직접 파일을 다운로드할 수 있는 URL을 생성
 */
export const getPresignedDownloadUrl = async (bookingId: number, fileId: number): Promise<PresignedDownloadUrlResponse> => await httpClient<PresignedDownloadUrlResponse>(
    `${API_URL}/bookings/${bookingId}/files/${fileId}/presigned-download-url`
);

/**
 * Pre-signed URL을 사용하여 S3에 직접 파일 업로드
 */
export const uploadFileToS3 = async (presignedUrl: string, file: File, contentType: string): Promise<void> => {
    const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': contentType,
        },
    });

    if (!response.ok) {
        throw new Error('S3 업로드 실패');
    }
};

/**
 * Pre-signed URL 방식으로 파일 업로드 (전체 플로우)
 * 1. Pre-signed URL 생성 요청
 * 2. S3에 직접 업로드
 */
export const uploadBookingFileWithPresignedUrl = async (bookingId: number, file: File): Promise<IBookingFile> => {
    // 1. Pre-signed URL 생성
    const { url, objectKey, contentType } = await getPresignedUploadUrl(
        bookingId,
        file.name,
        file.type || 'application/octet-stream'
    );

    // 2. S3에 직접 업로드 (서버에서 정규화된 contentType 사용)
    await uploadFileToS3(url, file, contentType);

    // 3. 업로드 완료 DB 등록
    return await confirmUpload(bookingId, {
        objectKey,
        originalFileName: file.name,
        contentType,
        fileSize: file.size,
    });
};

/**
 * Pre-signed URL 방식으로 파일 다운로드
 */
export const downloadFileWithPresignedUrl = async (bookingId: number, fileId: number, fileName: string): Promise<void> => {
    // 1. Pre-signed URL 생성
    const { url } = await getPresignedDownloadUrl(bookingId, fileId);

    // 2. 다운로드 링크 생성 및 클릭
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
