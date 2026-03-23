import { Link } from '@tanstack/react-router';
import { Card } from '~/components/card';
import type { IBookingDetail, BookingRole } from '../../types';
import type { IUserSimple } from '~/types/user';
import { BookingFileSection } from '../BookingFileSection';
import { BookingMetaSection } from '../BookingMetaSection';
import { BookingHeader } from './BookingHeader';

interface BookingDetailPanelProps {
    booking: IBookingDetail | null;
    onUpload: (files: FileList) => void;
    onDownload?: (fileId: number, fileName: string) => void;
    onDelete?: (fileId: number) => void;
    isUploading: boolean;
    isDeleting?: boolean;
    uploadError?: Error | null;
    role?: BookingRole;
    counterpart?: Pick<IUserSimple, 'username' | 'displayName'>;
}

export function BookingDetailPanel({ booking, onUpload, onDownload, onDelete, isUploading, isDeleting, uploadError, role, counterpart }: BookingDetailPanelProps) {
    if (!booking) {
        return (
            <Card size="lg" className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl text-gray-300">📅</span>
                </div>
                <p className="text-gray-500 font-medium">예약을 선택해주세요.</p>
                <p className="text-sm text-gray-400 mt-1">상세 정보를 보려면 목록에서 카드를 클릭하세요.</p>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col gap-6">
            {/* Date and Host info */}
            <BookingHeader
                displayName={counterpart?.displayName ?? booking.host.displayName}
                roleLabel={role === 'host' ? 'Guest' : 'Host'}
                attendanceStatus={booking.attendanceStatus}
                actions={
                    <Link
                        to="/booking/$id"
                        params={{ id: booking.id }}
                        className="text-xs font-medium text-cohi-primary hover:underline"
                    >
                        상세보기
                    </Link>
                }
            />

            <hr className="border-gray-100" />

            <BookingMetaSection booking={booking} />

            <hr className="border-gray-100" />

            <BookingFileSection
                files={booking.files}
                onUpload={onUpload}
                onDownload={onDownload}
                onDelete={onDelete}
                isUploading={isUploading}
                isDeleting={isDeleting}
                uploadError={uploadError}
            />
        </Card>
    );
}
