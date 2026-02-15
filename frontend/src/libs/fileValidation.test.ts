import { describe, it, expect } from 'vitest';
import {
    validateFile,
    validateFiles,
    formatFileSize,
    getAcceptedFileTypes,
    FILE_UPLOAD_LIMITS,
} from './fileValidation';

describe('fileValidation', () => {
    describe('formatFileSize', () => {
        it('0 바이트를 올바르게 포맷팅한다', () => {
            expect(formatFileSize(0)).toBe('0 Bytes');
        });

        it('바이트 단위를 올바르게 포맷팅한다', () => {
            expect(formatFileSize(512)).toBe('512 Bytes');
        });

        it('KB 단위를 올바르게 포맷팅한다', () => {
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(2048)).toBe('2 KB');
        });

        it('MB 단위를 올바르게 포맷팅한다', () => {
            expect(formatFileSize(1024 * 1024)).toBe('1 MB');
            expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
        });
    });

    describe('getAcceptedFileTypes', () => {
        it('허용된 확장자를 accept 형식으로 반환한다', () => {
            const acceptTypes = getAcceptedFileTypes();
            expect(acceptTypes).toContain('.pdf');
            expect(acceptTypes).toContain('.doc');
            expect(acceptTypes).toContain('.docx');
            expect(acceptTypes).toContain('.txt');
            expect(acceptTypes).toContain('.jpg');
            expect(acceptTypes).toContain('.png');
            expect(acceptTypes).toContain('.gif');
        });
    });

    describe('validateFile', () => {
        const createMockFile = (name: string, size: number, type: string = 'application/pdf'): File => {
            const content = new Array(size).fill('a').join('');
            return new File([content], name, { type });
        };

        it('유효한 파일은 통과한다', () => {
            const file = createMockFile('test.pdf', 1024);
            const result = validateFile(file);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('빈 파일은 실패한다', () => {
            const file = createMockFile('test.pdf', 0);
            const result = validateFile(file);
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].type).toBe('empty');
        });

        it('10MB 초과 파일은 실패한다', () => {
            const file = createMockFile('test.pdf', FILE_UPLOAD_LIMITS.MAX_FILE_SIZE + 1);
            const result = validateFile(file);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.type === 'size')).toBe(true);
        });

        it('허용된 확장자 파일은 통과한다', () => {
            const extensions = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
            for (const ext of extensions) {
                const file = createMockFile(`test.${ext}`, 1024);
                const result = validateFile(file);
                expect(result.errors.filter(e => e.type === 'extension' || e.type === 'blocked')).toHaveLength(0);
            }
        });

        it('차단된 확장자 파일은 실패한다', () => {
            const blockedExtensions = ['exe', 'bat', 'sh', 'js', 'php'];
            for (const ext of blockedExtensions) {
                const file = createMockFile(`test.${ext}`, 1024);
                const result = validateFile(file);
                expect(result.valid).toBe(false);
                expect(result.errors.some(e => e.type === 'blocked')).toBe(true);
            }
        });

        it('허용되지 않은 확장자 파일은 실패한다', () => {
            const file = createMockFile('test.zip', 1024);
            const result = validateFile(file);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.type === 'extension')).toBe(true);
        });
    });

    describe('validateFiles', () => {
        const createMockFile = (name: string, size: number): File => {
            const content = new Array(size).fill('a').join('');
            return new File([content], name, { type: 'application/pdf' });
        };

        it('파일 개수 제한을 검증한다', () => {
            const files = [createMockFile('test1.pdf', 1024)];
            const result = validateFiles(files, 5, 0); // 이미 5개 있음
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.type === 'count')).toBe(true);
        });

        it('총 용량 제한을 검증한다', () => {
            const files = [createMockFile('test.pdf', 10 * 1024 * 1024)]; // 10MB
            const existingSize = 45 * 1024 * 1024; // 45MB
            const result = validateFiles(files, 0, existingSize);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.type === 'total_size')).toBe(true);
        });

        it('제한 내 파일은 통과한다', () => {
            const files = [
                createMockFile('test1.pdf', 1024),
                createMockFile('test2.pdf', 1024),
            ];
            const result = validateFiles(files, 2, 1024 * 1024); // 2개 있고 1MB 사용 중
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('FILE_UPLOAD_LIMITS', () => {
        it('올바른 제한값을 가진다', () => {
            expect(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
            expect(FILE_UPLOAD_LIMITS.MAX_TOTAL_SIZE_PER_BOOKING).toBe(50 * 1024 * 1024);
            expect(FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING).toBe(5);
            expect(FILE_UPLOAD_LIMITS.ALLOWED_EXTENSIONS).toContain('pdf');
            expect(FILE_UPLOAD_LIMITS.BLOCKED_EXTENSIONS).toContain('exe');
        });
    });
});
