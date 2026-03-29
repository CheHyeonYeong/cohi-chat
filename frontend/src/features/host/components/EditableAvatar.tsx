import { useRef, useState, useCallback } from 'react';
import { Avatar } from '~/components/Avatar';
import { useUploadProfileImage } from '~/features/member/hooks/useUploadProfileImage';
import { useDeleteProfileImage } from '~/features/member/hooks/useDeleteProfileImage';
import { getErrorMessage } from '~/libs/errorUtils';
import { cn } from '~/libs/cn';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type AllowedMimeType = (typeof ALLOWED_TYPES)[number];

const isAllowedType = (type: string): type is AllowedMimeType =>
    (ALLOWED_TYPES as readonly string[]).includes(type);

const validateFile = (file: File): string | null => {
    if (!isAllowedType(file.type)) {
        return '허용되지 않은 이미지 형식입니다. (허용: jpg, jpeg, png, gif, webp)';
    }
    if (file.size > MAX_FILE_SIZE) {
        return '프로필 이미지 크기가 5MB를 초과합니다.';
    }
    return null;
};

interface EditableAvatarProps {
    displayName: string;
    profileImageUrl?: string;
    isEditing: boolean;
}

export const EditableAvatar = ({ displayName, profileImageUrl, isEditing }: EditableAvatarProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    const uploadMutation = useUploadProfileImage();
    const deleteMutation = useDeleteProfileImage();

    const isLoading = uploadMutation.isPending || deleteMutation.isPending;

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setError(null);

            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }

            uploadMutation.mutate(file, {
                onError: (err) => {
                    setError(getErrorMessage(err, '프로필 이미지 업로드에 실패했습니다.'));
                },
            });

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [uploadMutation],
    );

    const handleChangeClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleDeleteClick = useCallback(() => {
        setError(null);
        deleteMutation.mutate(undefined, {
            onError: (err) => {
                setError(getErrorMessage(err, '프로필 이미지 삭제에 실패했습니다.'));
            },
        });
    }, [deleteMutation]);

    return (
        <div className="flex flex-col items-center">
            <div className="relative" data-testid="editable-avatar">
                <Avatar displayName={displayName} profileImageUrl={profileImageUrl} size="xl" />

                {isEditing && (
                    <div
                        className={cn(
                            'absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center',
                            'cursor-pointer transition-opacity',
                            isLoading && 'pointer-events-none opacity-70',
                        )}
                        data-testid="avatar-overlay"
                    >
                        <button
                            type="button"
                            onClick={handleChangeClick}
                            disabled={isLoading}
                            className="text-white text-xs font-medium hover:underline"
                            data-testid="avatar-change-button"
                        >
                            {uploadMutation.isPending ? '업로드 중...' : '변경'}
                        </button>
                        {profileImageUrl && (
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                disabled={isLoading}
                                className="text-red-300 text-xs font-medium hover:underline mt-1"
                                data-testid="avatar-delete-button"
                            >
                                {deleteMutation.isPending ? '삭제 중...' : '삭제'}
                            </button>
                        )}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="avatar-file-input"
                />
            </div>

            {error && (
                <p className="mt-2 text-red-600 text-xs text-center" data-testid="avatar-error">
                    {error}
                </p>
            )}
        </div>
    );
};
