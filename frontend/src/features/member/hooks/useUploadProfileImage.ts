import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProfileImagePresignedUrlApi,
    confirmProfileImageUploadApi,
} from '../api';

const uploadToS3 = async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });

    if (!response.ok) {
        throw new Error('S3 업로드에 실패했습니다.');
    }
};

export const useUploadProfileImage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const { uploadUrl, objectKey } = await getProfileImagePresignedUrlApi({
                fileName: file.name,
                contentType: file.type,
                fileSize: file.size,
            });

            await uploadToS3(uploadUrl, file);

            return confirmProfileImageUploadApi({ objectKey });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth'] });
            queryClient.invalidateQueries({ queryKey: ['hosts'] });
        },
    });
};
