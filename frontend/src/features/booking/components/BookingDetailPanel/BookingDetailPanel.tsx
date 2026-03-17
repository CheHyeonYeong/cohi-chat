import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '~/components/button';
import { Card } from '~/components/card';
import { formatFileSize } from '~/libs/fileValidation';
import type { IBookingDetail, BookingRole } from '../../types';
import type { IUserSimple } from '~/types/user';
import { FileDropZone } from '../FileDropZone';
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(e.target.files);
            e.target.value = '';
        }
    };

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
                        className="text-xs font-medium text-[var(--cohi-primary)] hover:underline"
                    >
                        상세보기
                    </Link>
                }
            />

            <hr className="border-gray-100" />

            <BookingMetaSection booking={booking} showDayName descriptionFallback="설명이 없습니다." />

            <hr className="border-gray-100" />

            {/* File upload */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">파일 첨부</h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg h-8 text-xs"
                    >
                        {isUploading ? '업로드 중...' : '파일 추가'}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileInputChange}
                        aria-hidden
                    />
                </div>

                {/* Upload error */}
                {uploadError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{uploadError.message}</p>
                    </div>
                )}

                {/* File list */}
                {booking.files.length === 0 ? (
                    <FileDropZone onFilesDropped={onUpload} disabled={isUploading} />
                ) : (
                    <ul className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {booking.files.map((file) => (
                            <li key={file.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs opacity-40">📄</span>
                                    <span className="text-xs text-gray-700 truncate font-medium">{file.originalFileName ?? '이름 없는 파일'}</span>
                                    {file.fileSize > 0 && (
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                                            ({formatFileSize(file.fileSize)})
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                    {onDownload && (
                                        <button
                                            type="button"
                                            onClick={() => onDownload(file.id, file.originalFileName ?? '이름 없는 파일')}
                                            className="text-[10px] font-bold text-[var(--cohi-primary)] uppercase tracking-tighter"
                                        >
                                            Download
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => onDelete(file.id)}
                                            disabled={isDeleting}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-tighter disabled:opacity-50"
                                        >
                                            {isDeleting ? '...' : 'Delete'}
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </Card>
    );
}
