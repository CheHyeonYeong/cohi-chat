import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProfileImagePresignedUrlApi,
    confirmProfileImageUploadApi,
} from '../api';

interface UploadProfileImageParams {
    file: File;
}

export function useUploadProfileImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ file }: UploadProfileImageParams) => {
            // 1. Presigned URL 요청
            const presignedResponse = await getProfileImagePresignedUrlApi({
                fileName: file.name,
                contentType: file.type,
                fileSize: file.size,
            });

            // 2. S3에 직접 업로드
            const uploadResponse = await fetch(presignedResponse.uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                },
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error('S3 업로드에 실패했습니다.');
            }

            // 3. 업로드 확인 및 프로필 적용
            const profileImageUrl = await confirmProfileImageUploadApi({
                objectKey: presignedResponse.objectKey,
            });

            return profileImageUrl;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth'] });
        },
    });
}
