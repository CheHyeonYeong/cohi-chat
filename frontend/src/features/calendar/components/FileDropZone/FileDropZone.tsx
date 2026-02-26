import { useState } from 'react';
import { cn } from '~/libs/cn';

interface FileDropZoneProps {
    onFilesDropped: (files: FileList) => void;
    disabled?: boolean;
    className?: string;
}

export default function FileDropZone({ onFilesDropped, disabled = false, className }: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const files = e.dataTransfer.files;
        if (files.length > 0) onFilesDropped(files);
    };

    return (
        <div
            data-testid="file-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                'flex items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors text-sm',
                isDragging
                    ? 'border-[var(--cohe-primary)] bg-[var(--cohe-bg-light)] text-[var(--cohe-primary)]'
                    : 'border-gray-200 text-gray-400',
                disabled && 'opacity-50 cursor-not-allowed',
                className,
            )}
        >
            <span>📎 파일을 드래그하여 업로드</span>
        </div>
    );
}
