import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { Button } from '~/components/button';
import {
    validateFiles,
    getAcceptedFileTypes,
    formatFileSize,
    canUploadMoreFiles,
    FILE_UPLOAD_LIMITS,
    type FileValidationError,
} from '~/libs/fileValidation';
import type { IBookingFile } from '../../types';
import { FileDropZone } from '../FileDropZone';

interface BookingFileSectionProps {
    files: IBookingFile[];
    onUpload: (files: FileList) => void;
    onDownload?: (fileId: number, fileName: string) => void;
    onDelete?: (fileId: number) => void;
    isUploading: boolean;
    isDeleting?: boolean;
    uploadError?: Error | null;
}

export const BookingFileSection = ({
    files,
    onUpload,
    onDownload,
    onDelete,
    isUploading,
    isDeleting,
    uploadError,
}: BookingFileSectionProps) => {
    const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canUploadMore = canUploadMoreFiles(files.length);

    const handleFilesSelected = (selectedFiles: FileList) => {
        const existingSize = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
        const result = validateFiles(selectedFiles, files.length, existingSize);

        if (result.errors.length > 0) {
            setValidationErrors(result.errors);
        } else {
            setValidationErrors([]);
            onUpload(selectedFiles);
        }
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        handleFilesSelected(e.target.files);
        e.target.value = '';
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-700">파일 첨부</h3>
                    <p className="text-xs text-gray-400">
                        허용 형식: {FILE_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.join(', ')} · 최대 크기: {formatFileSize(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE)} · 첨부 {files.length}/{FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING}개
                    </p>
                </div>
                {canUploadMore && (
                    <>
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
                            accept={getAcceptedFileTypes()}
                            className="hidden"
                            onChange={handleFileInputChange}
                            aria-hidden
                        />
                    </>
                )}
            </div>

            {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-red-700 font-medium text-sm mb-1">파일 업로드 오류</p>
                    <ul className="list-disc pl-4 text-red-600 text-sm space-y-0.5">
                        {validationErrors.map((err, i) => (
                            <li key={i}>{err.message}</li>
                        ))}
                    </ul>
                </div>
            )}

            {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-red-600 text-sm">{uploadError.message}</p>
                </div>
            )}

            {!canUploadMore && (
                <p className="text-sm text-red-500 mb-3">
                    최대 파일 개수에 도달했습니다. 더 파일을 첨부하려면 기존 파일을 삭제해주세요.
                </p>
            )}

            {files.length === 0 ? (
                canUploadMore && <FileDropZone onFilesDropped={handleFilesSelected} disabled={isUploading} accept={getAcceptedFileTypes()} />
            ) : (
                <ul className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {files.map((file) => (
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
                                        className="text-[10px] font-bold text-cohi-primary uppercase tracking-tighter"
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
    );
};
