import { useRef } from 'react';
import { Button } from '~/components/button';
import { formatFileSize } from '~/libs/fileValidation';
import type { IBookingDetail } from '../../types';

interface BookingDetailPanelProps {
    booking: IBookingDetail;
    onUpload: (files: FileList) => void;
    onDownload?: (fileId: number, fileName: string) => void;
    isUploading: boolean;
}

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

export default function BookingDetailPanel({ booking, onUpload, onDownload, isUploading }: BookingDetailPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const when = new Date(booking.when);
    const dayLabel = DAYS_KO[when.getDay()];

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col gap-6">
            {/* Date header */}
            <div className="flex items-center gap-2 text-[var(--cohe-primary)] font-semibold text-lg">
                <span>📅</span>
                <span>
                    {when.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>

            {/* Meta */}
            <section className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Topic</span>
                    <span className="text-[var(--cohe-text-dark)] font-semibold">{booking.topic}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Date</span>
                    <span>
                        {when.getFullYear()}년 {when.getMonth() + 1}월 {when.getDate()}일({dayLabel})
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Time</span>
                    <span>{booking.timeSlot.startTime} - {booking.timeSlot.endTime}</span>
                </div>
            </section>

            <hr />

            {/* Description */}
            <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">설명</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {booking.description || '설명이 없습니다.'}
                </p>
            </section>

            <hr />

            {/* File upload */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">파일 첨부</h3>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={isUploading}
                        loading={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploading ? '업로드 중...' : '첨부하기'}
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
            </section>

            {/* File list */}
            <section className="flex-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">첨부된 파일</h3>
                {booking.files.length === 0 ? (
                    <p className="text-sm text-gray-400">첨부 파일이 없습니다.</p>
                ) : (
                    <ul className="space-y-2">
                        {booking.files.map((file) => (
                            <li key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs text-gray-400">📄</span>
                                    <span className="text-sm text-gray-700 truncate">{file.originalFileName ?? '알 수 없는 파일'}</span>
                                    {file.fileSize > 0 && (
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                            {formatFileSize(file.fileSize)}
                                        </span>
                                    )}
                                </div>
                                {onDownload && (
                                    <button
                                        type="button"
                                        onClick={() => onDownload(file.id, file.originalFileName ?? '알 수 없는 파일')}
                                        className="text-xs text-[var(--cohe-primary)] hover:underline flex-shrink-0 ml-2"
                                    >
                                        다운로드
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
