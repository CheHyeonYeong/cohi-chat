import { describe, expect, it } from 'vitest';
import { canUploadMoreFiles } from './bookingUploadUtils';
import { FILE_UPLOAD_LIMITS } from '~/libs/fileValidation';

describe('canUploadMoreFiles', () => {
    it('allows upload when current files are one below the max', () => {
        expect(canUploadMoreFiles(FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING - 1)).toBe(true);
    });

    it('blocks upload when current files reached the max', () => {
        expect(canUploadMoreFiles(FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING)).toBe(false);
    });
});
