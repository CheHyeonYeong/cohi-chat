package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.BookingFile;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FileUploadValidatorTest {

    @InjectMocks
    private FileUploadValidator fileUploadValidator;

    @Mock
    private BookingFileRepository bookingFileRepository;

    @Mock
    private Booking mockBooking;

    private static final Long BOOKING_ID = 1L;

    @Nested
    @DisplayName("빈 파일 검증")
    class EmptyFileValidation {

        @Test
        @DisplayName("성공: 내용이 있는 파일은 통과")
        void validateNotEmptySuccess() {
            given(bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID))
                .willReturn(new ArrayList<>());

            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "content".getBytes()
            );

            assertThatCode(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("실패: 빈 파일")
        void validateNotEmptyFails() {
            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", new byte[0]
            );

            assertThatThrownBy(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_EMPTY);
        }
    }

    @Nested
    @DisplayName("파일 용량 검증")
    class FileSizeValidation {

        @Test
        @DisplayName("성공: 10MB 이하 파일")
        void validateFileSizeSuccess() {
            given(bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID))
                .willReturn(new ArrayList<>());

            byte[] content = new byte[1024 * 1024]; // 1MB
            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", content
            );

            assertThatCode(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("실패: 10MB 초과 파일")
        void validateFileSizeFails() {
            byte[] content = new byte[11 * 1024 * 1024]; // 11MB
            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", content
            );

            assertThatThrownBy(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_SIZE_EXCEEDED);
        }
    }

    @Nested
    @DisplayName("파일 확장자 검증")
    class ExtensionValidation {

        @ParameterizedTest
        @ValueSource(strings = {"pdf", "doc", "docx", "txt", "jpg", "jpeg", "png", "gif"})
        @DisplayName("성공: 허용된 확장자")
        void validateAllowedExtensionSuccess(String extension) {
            given(bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID))
                .willReturn(new ArrayList<>());

            String mimeType = getMimeTypeForExtension(extension);
            MockMultipartFile file = new MockMultipartFile(
                "file", "test." + extension, mimeType, "content".getBytes()
            );

            assertThatCode(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .doesNotThrowAnyException();
        }

        @ParameterizedTest
        @ValueSource(strings = {"exe", "bat", "sh", "js", "php"})
        @DisplayName("실패: 차단된 확장자")
        void validateBlockedExtensionFails(String extension) {
            MockMultipartFile file = new MockMultipartFile(
                "file", "test." + extension, "application/octet-stream", "content".getBytes()
            );

            assertThatThrownBy(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_EXTENSION_BLOCKED);
        }

        @ParameterizedTest
        @ValueSource(strings = {"zip", "rar", "html", "css", "py"})
        @DisplayName("실패: 허용되지 않은 확장자")
        void validateNotAllowedExtensionFails(String extension) {
            MockMultipartFile file = new MockMultipartFile(
                "file", "test." + extension, "application/octet-stream", "content".getBytes()
            );

            assertThatThrownBy(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_EXTENSION_NOT_ALLOWED);
        }

        private String getMimeTypeForExtension(String extension) {
            return switch (extension) {
                case "pdf" -> "application/pdf";
                case "doc" -> "application/msword";
                case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                case "txt" -> "text/plain";
                case "jpg", "jpeg" -> "image/jpeg";
                case "png" -> "image/png";
                case "gif" -> "image/gif";
                default -> "application/octet-stream";
            };
        }
    }

    @Nested
    @DisplayName("MIME 타입 검증")
    class MimeTypeValidation {

        @Test
        @DisplayName("실패: 잘못된 MIME 타입")
        void validateMimeTypeFails() {
            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/x-malware", "content".getBytes()
            );

            assertThatThrownBy(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_MIME_TYPE_NOT_ALLOWED);
        }
    }

    @Nested
    @DisplayName("파일 개수 제한 검증")
    class FileCountValidation {

        @Test
        @DisplayName("성공: 5개 미만일 때 업로드 가능")
        void validateFileCountSuccess() {
            List<BookingFile> existingFiles = createMockFiles(4);
            given(bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID))
                .willReturn(existingFiles);

            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "content".getBytes()
            );

            assertThatCode(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("실패: 이미 5개 파일이 있을 때")
        void validateFileCountFails() {
            List<BookingFile> existingFiles = createMockFiles(5);
            given(bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID))
                .willReturn(existingFiles);

            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "content".getBytes()
            );

            assertThatThrownBy(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_COUNT_EXCEEDED);
        }
    }

    @Nested
    @DisplayName("총 용량 제한 검증")
    class TotalSizeValidation {

        @Test
        @DisplayName("성공: 총 용량 50MB 미만일 때")
        void validateTotalSizeSuccess() {
            List<BookingFile> existingFiles = createMockFilesWithSize(40 * 1024 * 1024L);
            given(bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID))
                .willReturn(existingFiles);

            byte[] content = new byte[5 * 1024 * 1024]; // 5MB
            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", content
            );

            assertThatCode(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("실패: 총 용량 50MB 초과")
        void validateTotalSizeFails() {
            List<BookingFile> existingFiles = createMockFilesWithSize(45 * 1024 * 1024L);
            given(bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID))
                .willReturn(existingFiles);

            byte[] content = new byte[6 * 1024 * 1024]; // 6MB
            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", content
            );

            assertThatThrownBy(() -> fileUploadValidator.validate(BOOKING_ID, file))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_TOTAL_SIZE_EXCEEDED);
        }
    }

    @Nested
    @DisplayName("제한 설정값 조회")
    class GetLimits {

        @Test
        @DisplayName("제한 설정값을 올바르게 반환한다")
        void getLimitsReturnsCorrectValues() {
            var limits = fileUploadValidator.getLimits();

            assertThat(limits.maxFileSize()).isEqualTo(10 * 1024 * 1024L);
            assertThat(limits.maxTotalSizePerBooking()).isEqualTo(50 * 1024 * 1024L);
            assertThat(limits.maxFilesPerBooking()).isEqualTo(5);
            assertThat(limits.allowedExtensions()).contains("pdf", "doc", "docx", "txt", "jpg", "png", "gif");
            assertThat(limits.blockedExtensions()).contains("exe", "bat", "sh", "js", "php");
        }
    }

    private List<BookingFile> createMockFiles(int count) {
        List<BookingFile> files = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            BookingFile file = BookingFile.create(
                mockBooking,
                "file" + i + ".pdf",
                "file" + i + ".pdf",
                "/path/file" + i + ".pdf",
                1024L,
                "application/pdf"
            );
            ReflectionTestUtils.setField(file, "id", (long) i);
            files.add(file);
        }
        return files;
    }

    private List<BookingFile> createMockFilesWithSize(long totalSize) {
        List<BookingFile> files = new ArrayList<>();
        BookingFile file = BookingFile.create(
            mockBooking,
            "large-file.pdf",
            "large-file.pdf",
            "/path/large-file.pdf",
            totalSize,
            "application/pdf"
        );
        ReflectionTestUtils.setField(file, "id", 1L);
        files.add(file);
        return files;
    }
}
