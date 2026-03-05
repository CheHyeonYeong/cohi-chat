import { FILE_UPLOAD_LIMITS } from '~/libs/fileValidation';

export function canUploadMoreFiles(currentFileCount: number): boolean {
    return currentFileCount < FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING;
}
