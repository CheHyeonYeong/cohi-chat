import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '~/components/button';
import { Card } from '~/components/card';
import { formatFileSize } from '~/libs/fileValidation';
import type { IBookingDetail } from '../../types';
import { DAY_NAMES, type Weekday } from '~/libs/constants/days';

interface BookingDetailPanelProps {
    booking: IBookingDetail | null;
    onUpload: (files: FileList) => void;
    onDownload?: (fileId: number, fileName: string) => void;
    isUploading: boolean;
}

export default function BookingDetailPanel({ booking, onUpload, onDownload, isUploading }: BookingDetailPanelProps) {
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

    const when = new Date(booking.when);
    const dayLabel = DAY_NAMES[when.getDay() as Weekday];

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <Card className="h-full flex flex-col gap-6">
            {/* Date and Host info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--cohi-bg-warm)] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[var(--cohi-primary)]">
                            {booking.host.displayName[0] || '?'}
                        </span>
                    </div>
                    <div>
                        <h2 className="font-bold text-[var(--cohi-text-dark)]">{booking.host.displayName}</h2>
                        <p className="text-xs text-gray-500">Host</p>
                    </div>
                </div>
                <Link
                    to="/booking/$id"
                    params={{ id: booking.id }}
                    className="text-xs font-medium text-[var(--cohi-primary)] hover:underline"
                >
                    상세보기 &rarr;
                </Link>
            </div>

            <hr className="border-gray-100" />

            {/* Meta */}
            <section className="space-y-3">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Topic</span>
                    <p className="text-sm font-semibold text-[var(--cohi-text-dark)] mt-0.5">{booking.topic}</p>
                </div>
                <div className="flex gap-6">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {when.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} ({dayLabel})
                        </p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</span>
                        <p className="text-sm text-gray-600 mt-0.5">{booking.timeSlot.startTime} - {booking.timeSlot.endTime}</p>
                    </div>
                </div>
            </section>

            {/* Description */}
            <section>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">설명</span>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                    {booking.description || '설명이 없습니다.'}
                </p>
            </section>

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

                {/* File list */}
                {booking.files.length === 0 ? (
                    <div className="py-8 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-xl mb-1 opacity-20">📎</span>
                        <p className="text-xs text-gray-400">첨부된 파일이 없습니다.</p>
                    </div>
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
                                {onDownload && (
                                    <button
                                        type="button"
                                        onClick={() => onDownload(file.id, file.originalFileName ?? '이름 없는 파일')}
                                        className="text-[10px] font-bold text-[var(--cohi-primary)] opacity-0 group-hover:opacity-100 transition-opacity ml-2 uppercase tracking-tighter"
                                    >
                                        Download
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </Card>
    );
}
