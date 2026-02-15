package com.coDevs.cohiChat.booking;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.coDevs.cohiChat.booking.entity.BookingFile;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

/**
 * 파일 업로드 검증 컴포넌트.
 * 파일 용량, 개수, 확장자 제한을 검증합니다.
 */
@Component
@RequiredArgsConstructor
public class FileUploadValidator {

    /** 단일 파일 최대 용량: 10MB */
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024L;

    /** 예약당 총 파일 용량: 50MB */
    private static final long MAX_TOTAL_SIZE_PER_BOOKING = 50 * 1024 * 1024L;

    /** 예약당 최대 파일 개수: 5개 */
    private static final int MAX_FILES_PER_BOOKING = 5;

    /** 허용 확장자 */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "pdf", "doc", "docx", "txt", "jpg", "jpeg", "png", "gif"
    );

    /** 차단 확장자 */
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
        "exe", "bat", "sh", "js", "php"
    );

    /** 허용 MIME 타입 */
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif"
    );

    private final BookingFileRepository bookingFileRepository;

    /**
     * 파일 업로드 전체 검증을 수행합니다.
     *
     * @param bookingId 예약 ID
     * @param file 업로드할 파일
     */
    public void validate(Long bookingId, MultipartFile file) {
        validateNotEmpty(file);
        validateFileSize(file);
        validateExtension(file);
        validateMimeType(file);

        // DB 조회를 한 번만 수행하여 재사용
        List<BookingFile> existingFiles = bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
        validateFileCount(existingFiles);
        validateTotalSize(existingFiles, file);
    }

    /**
     * 빈 파일인지 검증합니다.
     */
    private void validateNotEmpty(MultipartFile file) {
        if (file.isEmpty()) {
            throw new CustomException(ErrorCode.FILE_EMPTY);
        }
    }

    /**
     * 단일 파일 용량 제한을 검증합니다.
     */
    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new CustomException(ErrorCode.FILE_SIZE_EXCEEDED);
        }
    }

    /**
     * 파일 확장자를 검증합니다.
     */
    private void validateExtension(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new CustomException(ErrorCode.FILE_EXTENSION_NOT_ALLOWED);
        }

        String extension = getExtension(filename).toLowerCase();

        // 차단 확장자 체크
        if (BLOCKED_EXTENSIONS.contains(extension)) {
            throw new CustomException(ErrorCode.FILE_EXTENSION_BLOCKED);
        }

        // 허용 확장자 체크
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new CustomException(ErrorCode.FILE_EXTENSION_NOT_ALLOWED);
        }
    }

    /**
     * MIME 타입을 검증합니다.
     */
    private void validateMimeType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new CustomException(ErrorCode.FILE_MIME_TYPE_NOT_ALLOWED);
        }
    }

    /**
     * 예약당 파일 개수 제한을 검증합니다.
     */
    private void validateFileCount(List<BookingFile> existingFiles) {
        if (existingFiles.size() >= MAX_FILES_PER_BOOKING) {
            throw new CustomException(ErrorCode.FILE_COUNT_EXCEEDED);
        }
    }

    /**
     * 예약당 총 파일 용량 제한을 검증합니다.
     */
    private void validateTotalSize(List<BookingFile> existingFiles, MultipartFile file) {
        long totalSize = existingFiles.stream()
            .mapToLong(BookingFile::getFileSize)
            .sum();

        if (totalSize + file.getSize() > MAX_TOTAL_SIZE_PER_BOOKING) {
            throw new CustomException(ErrorCode.FILE_TOTAL_SIZE_EXCEEDED);
        }
    }

    /**
     * 파일명에서 확장자를 추출합니다.
     */
    private String getExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1 || lastDot == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDot + 1);
    }

    /**
     * 제한 설정값을 반환합니다 (Frontend 연동용).
     */
    public FileUploadLimits getLimits() {
        return new FileUploadLimits(
            MAX_FILE_SIZE,
            MAX_TOTAL_SIZE_PER_BOOKING,
            MAX_FILES_PER_BOOKING,
            ALLOWED_EXTENSIONS,
            BLOCKED_EXTENSIONS
        );
    }

    public record FileUploadLimits(
        long maxFileSize,
        long maxTotalSizePerBooking,
        int maxFilesPerBooking,
        Set<String> allowedExtensions,
        Set<String> blockedExtensions
    ) {}
}
