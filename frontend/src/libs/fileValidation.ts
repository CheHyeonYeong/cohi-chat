/**
 * 파일 업로드 제한 설정
 */
export const FILE_UPLOAD_LIMITS = {
  /** 단일 파일 최대 용량: 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** 예약당 총 파일 용량: 50MB */
  MAX_TOTAL_SIZE_PER_BOOKING: 50 * 1024 * 1024,
  /** 예약당 최대 파일 개수: 5개 */
  MAX_FILES_PER_BOOKING: 5,
  /** 허용 확장자 */
  ALLOWED_EXTENSIONS: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'],
  /** 차단 확장자 */
  BLOCKED_EXTENSIONS: ['exe', 'bat', 'sh', 'js', 'php'],
} as const;

export interface FileValidationError {
  type: 'empty' | 'size' | 'extension' | 'blocked' | 'count' | 'total_size';
  message: string;
  file?: File;
}

export interface FileValidationResult {
  valid: boolean;
  errors: FileValidationError[];
}

/**
 * 파일 확장자 추출
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 단일 파일 검증
 */
export function validateFile(file: File): FileValidationResult {
  const errors: FileValidationError[] = [];

  // 빈 파일 체크
  if (file.size === 0) {
    errors.push({
      type: 'empty',
      message: '빈 파일은 업로드할 수 없습니다.',
      file,
    });
    return { valid: false, errors };
  }

  // 파일 용량 체크
  if (file.size > FILE_UPLOAD_LIMITS.MAX_FILE_SIZE) {
    errors.push({
      type: 'size',
      message: `파일 크기가 ${formatFileSize(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE)}를 초과합니다. (현재: ${formatFileSize(file.size)})`,
      file,
    });
  }

  // 확장자 체크
  const extension = getExtension(file.name);
  const blockedExtensions: readonly string[] = FILE_UPLOAD_LIMITS.BLOCKED_EXTENSIONS;
  const allowedExtensions: readonly string[] = FILE_UPLOAD_LIMITS.ALLOWED_EXTENSIONS;

  if (blockedExtensions.includes(extension)) {
    errors.push({
      type: 'blocked',
      message: `보안상 업로드가 차단된 파일 형식입니다: .${extension}`,
      file,
    });
  } else if (!allowedExtensions.includes(extension)) {
    errors.push({
      type: 'extension',
      message: `허용되지 않은 파일 확장자입니다: .${extension} (허용: ${FILE_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.join(', ')})`,
      file,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 여러 파일 검증 (기존 파일 고려)
 */
export function validateFiles(
  newFiles: FileList | File[],
  existingFilesCount: number,
  existingTotalSize: number
): FileValidationResult {
  const errors: FileValidationError[] = [];
  const files = Array.from(newFiles);

  // 각 파일 개별 검증
  for (const file of files) {
    const result = validateFile(file);
    errors.push(...result.errors);
  }

  // 파일 개수 체크
  const totalCount = existingFilesCount + files.length;
  if (totalCount > FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING) {
    errors.push({
      type: 'count',
      message: `예약당 최대 ${FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING}개의 파일만 첨부할 수 있습니다. (현재: ${existingFilesCount}개, 선택: ${files.length}개)`,
    });
  }

  // 총 용량 체크
  const newTotalSize = files.reduce((sum, file) => sum + file.size, 0);
  const grandTotalSize = existingTotalSize + newTotalSize;
  if (grandTotalSize > FILE_UPLOAD_LIMITS.MAX_TOTAL_SIZE_PER_BOOKING) {
    errors.push({
      type: 'total_size',
      message: `예약당 총 파일 용량 ${formatFileSize(FILE_UPLOAD_LIMITS.MAX_TOTAL_SIZE_PER_BOOKING)}를 초과합니다. (현재: ${formatFileSize(existingTotalSize)}, 선택: ${formatFileSize(newTotalSize)})`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 허용된 파일 형식을 accept 속성 문자열로 반환
 */
export function getAcceptedFileTypes(): string {
  return FILE_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',');
}
