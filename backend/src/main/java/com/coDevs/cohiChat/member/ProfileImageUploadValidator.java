package com.coDevs.cohiChat.member;

import java.util.Set;

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

        if (!ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
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
