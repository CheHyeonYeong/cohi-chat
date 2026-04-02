package com.coDevs.cohiChat.member;

import java.util.Locale;
import java.util.Set;

import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

@Component
public class ProfileImageUploadValidator {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "jpg", "jpeg", "png", "gif", "webp"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    );

    public void validate(String fileName, String contentType, long fileSize) {
        validateFileSize(fileSize);
        validateExtension(fileName);
        validateMimeType(contentType);
    }

    public void validateFileSize(long fileSize) {
        if (fileSize > MAX_FILE_SIZE) {
            throw new CustomException(ErrorCode.PROFILE_IMAGE_SIZE_EXCEEDED);
        }
    }

    public void validateExtension(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            throw new CustomException(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }

        var extension = extractExtension(fileName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new CustomException(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }
    }

    public void validateMimeType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            throw new CustomException(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }

        String normalized = normalizeContentType(contentType);
        if (!ALLOWED_MIME_TYPES.contains(normalized)) {
            throw new CustomException(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }
    }

    /**
     * Content-Type을 정규화하여 반환합니다.
     * 예: "image/jpeg; charset=utf-8" → "image/jpeg"
     *
     * <p>Locale.ROOT를 사용하여 로케일에 독립적인 소문자 변환을 보장합니다.
     * 표준 MIME 타입은 ASCII만 사용하므로 국제 문자 처리 이슈가 없습니다.</p>
     *
     * @param contentType 정규화할 Content-Type
     * @return 정규화된 Content-Type (소문자, 파라미터 제거)
     * @throws CustomException contentType이 null, 빈 문자열, 또는 유효하지 않은 형식인 경우
     */
    public String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            throw new CustomException(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }

        try {
            MediaType mediaType = MediaType.parseMediaType(contentType);
            return mediaType.getType().toLowerCase(Locale.ROOT)
                + "/"
                + mediaType.getSubtype().toLowerCase(Locale.ROOT);
        } catch (InvalidMediaTypeException e) {
            throw new CustomException(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }
    }

    private String extractExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        return (lastDotIndex == -1 || lastDotIndex == fileName.length() - 1)
            ? ""
            : fileName.substring(lastDotIndex + 1);
    }

    public long getMaxFileSize() {
        return MAX_FILE_SIZE;
    }

    public Set<String> getAllowedExtensions() {
        return ALLOWED_EXTENSIONS;
    }

    public Set<String> getAllowedMimeTypes() {
        return ALLOWED_MIME_TYPES;
    }
}
