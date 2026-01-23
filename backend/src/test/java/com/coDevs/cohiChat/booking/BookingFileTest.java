package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.BookingFile;

@ExtendWith(MockitoExtension.class)
class BookingFileTest {

    private static final String TEST_FILE_NAME = "test-uuid-file.pdf";
    private static final String TEST_ORIGINAL_FILE_NAME = "resume.pdf";
    private static final String TEST_FILE_PATH = "/uploads/2025/01/test-uuid-file.pdf";
    private static final Long TEST_FILE_SIZE = 1024L;
    private static final String TEST_CONTENT_TYPE = "application/pdf";

    @Mock
    private Booking booking;

    @Test
    @DisplayName("성공: BookingFile 엔티티를 생성할 수 있다")
    void createBookingFileSuccess() {
        // when
        BookingFile bookingFile = BookingFile.create(
            booking,
            TEST_FILE_NAME,
            TEST_ORIGINAL_FILE_NAME,
            TEST_FILE_PATH,
            TEST_FILE_SIZE,
            TEST_CONTENT_TYPE
        );

        // then
        assertThat(bookingFile.getBooking()).isEqualTo(booking);
        assertThat(bookingFile.getFileName()).isEqualTo(TEST_FILE_NAME);
        assertThat(bookingFile.getOriginalFileName()).isEqualTo(TEST_ORIGINAL_FILE_NAME);
        assertThat(bookingFile.getFilePath()).isEqualTo(TEST_FILE_PATH);
        assertThat(bookingFile.getFileSize()).isEqualTo(TEST_FILE_SIZE);
        assertThat(bookingFile.getContentType()).isEqualTo(TEST_CONTENT_TYPE);
    }

    @Test
    @DisplayName("실패: booking이 null이면 예외 발생")
    void createFailsWhenBookingIsNull() {
        assertThatThrownBy(() -> BookingFile.create(
            null,
            TEST_FILE_NAME,
            TEST_ORIGINAL_FILE_NAME,
            TEST_FILE_PATH,
            TEST_FILE_SIZE,
            TEST_CONTENT_TYPE
        ))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("booking");
    }

    @Test
    @DisplayName("실패: fileName이 null이면 예외 발생")
    void createFailsWhenFileNameIsNull() {
        assertThatThrownBy(() -> BookingFile.create(
            booking,
            null,
            TEST_ORIGINAL_FILE_NAME,
            TEST_FILE_PATH,
            TEST_FILE_SIZE,
            TEST_CONTENT_TYPE
        ))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("fileName");
    }

    @Test
    @DisplayName("실패: originalFileName이 null이면 예외 발생")
    void createFailsWhenOriginalFileNameIsNull() {
        assertThatThrownBy(() -> BookingFile.create(
            booking,
            TEST_FILE_NAME,
            null,
            TEST_FILE_PATH,
            TEST_FILE_SIZE,
            TEST_CONTENT_TYPE
        ))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("originalFileName");
    }

    @Test
    @DisplayName("실패: filePath가 null이면 예외 발생")
    void createFailsWhenFilePathIsNull() {
        assertThatThrownBy(() -> BookingFile.create(
            booking,
            TEST_FILE_NAME,
            TEST_ORIGINAL_FILE_NAME,
            null,
            TEST_FILE_SIZE,
            TEST_CONTENT_TYPE
        ))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("filePath");
    }

    @Test
    @DisplayName("실패: fileSize가 null이면 예외 발생")
    void createFailsWhenFileSizeIsNull() {
        assertThatThrownBy(() -> BookingFile.create(
            booking,
            TEST_FILE_NAME,
            TEST_ORIGINAL_FILE_NAME,
            TEST_FILE_PATH,
            null,
            TEST_CONTENT_TYPE
        ))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("fileSize");
    }

    @Test
    @DisplayName("실패: contentType이 null이면 예외 발생")
    void createFailsWhenContentTypeIsNull() {
        assertThatThrownBy(() -> BookingFile.create(
            booking,
            TEST_FILE_NAME,
            TEST_ORIGINAL_FILE_NAME,
            TEST_FILE_PATH,
            TEST_FILE_SIZE,
            null
        ))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("contentType");
    }
}
