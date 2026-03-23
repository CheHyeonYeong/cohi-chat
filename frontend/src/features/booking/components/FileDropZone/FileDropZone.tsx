import type { ChangeEvent, DragEvent } from 'react';
import { useRef, useState } from 'react';
import { cn } from '~/libs/cn';

interface FileDropZoneProps {
    onFilesDropped: (files: FileList) => void;
    disabled?: boolean;
    accept?: string;
    className?: string;
}

export function FileDropZone({ onFilesDropped, disabled = false, accept, className }: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const files = e.dataTransfer.files;
        if (files.length > 0) onFilesDropped(files);
    };

    const handleClick = () => {
        if (!disabled) fileInputRef.current?.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesDropped(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div
            data-testid="file-drop-zone"
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={handleClick}
            onKeyDown={(e) => { if (!disabled && e.key === 'Enter') handleClick(); }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                'flex items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors text-sm',
                isDragging
                    ? 'border-cohi-primary bg-cohi-bg-light text-cohi-primary'
                    : 'border-gray-200 text-gray-400',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                className,
            )}
        >
            <span>📎 파일을 드래그하거나 클릭하여 업로드</span>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
                aria-hidden
            />
        </div>
    );
}
