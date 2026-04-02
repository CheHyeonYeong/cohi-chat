package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatNoException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

class ProfileImageUploadValidatorTest {

    private ProfileImageUploadValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ProfileImageUploadValidator();
    }

    @Nested
    class ValidateFileSize {
        @Test
        @DisplayName("허용 범위 내 파일은 통과한다")
        void fileSizeWithinLimit() {
            assertThatNoException().isThrownBy(() ->
                    validator.validateFileSize(1024 * 1024)); // 1MB
        }

        @Test
        @DisplayName("정확히 5MB는 통과한다")
        void exactlyMaxSize() {
            assertThatNoException().isThrownBy(() ->
                    validator.validateFileSize(5 * 1024 * 1024));
        }

        @Test
        @DisplayName("5MB 초과시 예외를 던진다")
        void exceedsMaxSize() {
            assertThatThrownBy(() ->
                    validator.validateFileSize(5 * 1024 * 1024 + 1))
                    .isInstanceOf(CustomException.class)
                    .extracting(e -> ((CustomException) e).getErrorCode())
                    .isEqualTo(ErrorCode.PROFILE_IMAGE_SIZE_EXCEEDED);
        }
    }

    @Nested
    class ValidateExtension {
        @ParameterizedTest
        @ValueSource(strings = {"photo.jpg", "photo.jpeg", "photo.png", "photo.gif", "photo.webp"})
        @DisplayName("허용된 확장자는 통과한다")
        void allowedExtensions(String fileName) {
            assertThatNoException().isThrownBy(() ->
                    validator.validateExtension(fileName));
        }

        @ParameterizedTest
        @ValueSource(strings = {"photo.JPG", "photo.JPEG", "photo.PNG"})
        @DisplayName("대문자 확장자도 통과한다")
        void upperCaseExtensions(String fileName) {
            assertThatNoException().isThrownBy(() ->
                    validator.validateExtension(fileName));
        }

        @ParameterizedTest
        @ValueSource(strings = {"photo.bmp", "photo.tiff", "photo.svg", "photo.pdf"})
        @DisplayName("허용되지 않은 확장자는 예외를 던진다")
        void disallowedExtensions(String fileName) {
            assertThatThrownBy(() ->
                    validator.validateExtension(fileName))
                    .isInstanceOf(CustomException.class)
                    .extracting(e -> ((CustomException) e).getErrorCode())
                    .isEqualTo(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }

        @Test
        @DisplayName("파일명이 null이면 예외를 던진다")
        void nullFileName() {
            assertThatThrownBy(() ->
                    validator.validateExtension(null))
                    .isInstanceOf(CustomException.class);
        }

        @Test
        @DisplayName("파일명이 빈 문자열이면 예외를 던진다")
        void emptyFileName() {
            assertThatThrownBy(() ->
                    validator.validateExtension(""))
                    .isInstanceOf(CustomException.class);
        }

        @Test
        @DisplayName("확장자가 없는 파일명은 예외를 던진다")
        void noExtension() {
            assertThatThrownBy(() ->
                    validator.validateExtension("photo"))
                    .isInstanceOf(CustomException.class);
        }
    }

    @Nested
    class ValidateMimeType {
        @ParameterizedTest
        @ValueSource(strings = {"image/jpeg", "image/png", "image/gif", "image/webp"})
        @DisplayName("허용된 MIME 타입은 통과한다")
        void allowedMimeTypes(String contentType) {
            assertThatNoException().isThrownBy(() ->
                    validator.validateMimeType(contentType));
        }

        @ParameterizedTest
        @ValueSource(strings = {"image/bmp", "image/tiff", "image/svg+xml", "application/pdf", "text/plain"})
        @DisplayName("허용되지 않은 MIME 타입은 예외를 던진다")
        void disallowedMimeTypes(String contentType) {
            assertThatThrownBy(() ->
                    validator.validateMimeType(contentType))
                    .isInstanceOf(CustomException.class)
                    .extracting(e -> ((CustomException) e).getErrorCode())
                    .isEqualTo(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }

        @Test
        @DisplayName("MIME 타입이 null이면 예외를 던진다")
        void nullMimeType() {
            assertThatThrownBy(() ->
                    validator.validateMimeType(null))
                    .isInstanceOf(CustomException.class);
        }

        @Test
        @DisplayName("MIME 타입이 빈 문자열이면 예외를 던진다")
        void emptyMimeType() {
            assertThatThrownBy(() ->
                    validator.validateMimeType(""))
                    .isInstanceOf(CustomException.class);
        }
    }

    @Nested
    class NormalizeContentType {
        @Test
        @DisplayName("charset이 포함된 MIME 타입을 정규화한다")
        void normalizesWithCharset() {
            String result = validator.normalizeContentType("image/jpeg; charset=utf-8");
            assertThat(result).isEqualTo("image/jpeg");
        }

        @Test
        @DisplayName("대문자 MIME 타입을 소문자로 정규화한다")
        void normalizesUpperCase() {
            String result = validator.normalizeContentType("IMAGE/JPEG");
            assertThat(result).isEqualTo("image/jpeg");
        }

        @Test
        @DisplayName("이미 정규화된 MIME 타입은 그대로 반환한다")
        void alreadyNormalized() {
            String result = validator.normalizeContentType("image/png");
            assertThat(result).isEqualTo("image/png");
        }

        @Test
        @DisplayName("null MIME 타입은 예외를 던진다")
        void nullContentType() {
            assertThatThrownBy(() -> validator.normalizeContentType(null))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }

        @Test
        @DisplayName("빈 MIME 타입은 예외를 던진다")
        void emptyContentType() {
            assertThatThrownBy(() -> validator.normalizeContentType(""))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }

        @Test
        @DisplayName("유효하지 않은 MIME 타입은 예외를 던진다")
        void invalidContentType() {
            assertThatThrownBy(() -> validator.normalizeContentType("invalid-mime-type"))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.PROFILE_IMAGE_TYPE_NOT_ALLOWED);
        }
    }

    @Nested
    class ValidateAll {
        @Test
        @DisplayName("유효한 파일은 모든 검증을 통과한다")
        void validFile() {
            assertThatNoException().isThrownBy(() ->
                    validator.validate("photo.jpg", "image/jpeg", 1024 * 1024));
        }

        @Test
        @DisplayName("파일 크기가 초과되면 예외를 던진다")
        void oversizedFile() {
            assertThatThrownBy(() ->
                    validator.validate("photo.jpg", "image/jpeg", 6 * 1024 * 1024))
                    .isInstanceOf(CustomException.class)
                    .extracting(e -> ((CustomException) e).getErrorCode())
                    .isEqualTo(ErrorCode.PROFILE_IMAGE_SIZE_EXCEEDED);
        }
    }
}
