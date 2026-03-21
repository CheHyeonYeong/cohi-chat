import { useRef, useState, useCallback } from 'react';
import { Button } from '~/components/button';
import { useAuth } from '../hooks/useAuth';
import { useUploadProfileImage } from '../hooks/useUploadProfileImage';
import { useDeleteProfileImage } from '../hooks/useDeleteProfileImage';
import { getErrorMessage } from '~/libs/errorUtils';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type AllowedMimeType = typeof ALLOWED_TYPES[number];

function isAllowedType(type: string): type is AllowedMimeType {
    return (ALLOWED_TYPES as readonly string[]).includes(type);
}

function validateFile(file: File): string | null {
    if (!isAllowedType(file.type)) {
        return '허용되지 않은 이미지 형식입니다. (허용: jpg, jpeg, png, gif, webp)';
    }
    if (file.size > MAX_FILE_SIZE) {
        return '프로필 이미지 크기가 5MB를 초과합니다.';
    }
    return null;
}

export function ProfileImageUpload() {
    const { data: user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const uploadMutation = useUploadProfileImage();
    const deleteMutation = useDeleteProfileImage();

    const currentImageUrl = preview || user?.profileImageUrl;
    const isLoading = uploadMutation.isPending || deleteMutation.isPending;

    const clearMessages = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        clearMessages();

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        uploadMutation.mutate(file, {
            onSuccess: () => {
                setSuccessMessage('프로필 이미지가 변경되었습니다.');
                setPreview(null);
            },
            onError: (err) => {
                setError(getErrorMessage(err, '프로필 이미지 업로드에 실패했습니다.'));
                setPreview(null);
            },
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [clearMessages, uploadMutation]);

    const handleDelete = useCallback(() => {
        clearMessages();

        deleteMutation.mutate(undefined, {
            onSuccess: () => {
                setSuccessMessage('프로필 이미지가 삭제되었습니다.');
                setPreview(null);
            },
            onError: (err) => {
                setError(getErrorMessage(err, '프로필 이미지 삭제에 실패했습니다.'));
            },
        });
    }, [clearMessages, deleteMutation]);

    const handleButtonClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className="flex flex-col gap-4" data-testid="profile-image-upload">
            <h3 className="text-lg font-semibold text-[var(--cohi-text-dark)]">
                프로필 이미지
            </h3>

            <div className="flex items-center gap-6">
                <div
                    className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"
                    data-testid="profile-image-preview"
                >
                    {currentImageUrl ? (
                        <img
                            src={currentImageUrl}
                            alt="프로필 이미지"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <svg
                            className="w-12 h-12 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_TYPES.join(',')}
                        onChange={handleFileSelect}
                        className="hidden"
                        data-testid="profile-image-input"
                    />
                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleButtonClick}
                        disabled={isLoading}
                        className="text-sm"
                    >
                        {uploadMutation.isPending ? '업로드 중...' : '이미지 변경'}
                    </Button>
                    {user?.profileImageUrl && (
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="text-sm text-red-600 hover:text-red-700"
                        >
                            {deleteMutation.isPending ? '삭제 중...' : '이미지 삭제'}
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-500">
                JPG, PNG, GIF, WebP 형식, 최대 5MB
            </p>

            {error && (
                <div className="text-red-600 text-sm" data-testid="profile-image-error">
                    {error}
                </div>
            )}

            {successMessage && (
                <div
                    className="text-green-600 text-sm"
                    data-testid="profile-image-success"
                >
                    {successMessage}
                </div>
            )}
        </div>
    );
}
