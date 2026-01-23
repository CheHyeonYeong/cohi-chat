package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.BookingFile;
import com.coDevs.cohiChat.booking.response.BookingFileResponseDTO;
import com.coDevs.cohiChat.file.FileStorageResult;
import com.coDevs.cohiChat.file.FileStorageService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@ExtendWith(MockitoExtension.class)
class BookingFileServiceTest {

    @InjectMocks
    private BookingFileService bookingFileService;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingFileRepository bookingFileRepository;

    @Mock
    private FileStorageService fileStorageService;

    private static final Long BOOKING_ID = 1L;
    private static final Long FILE_ID = 1L;
    private static final UUID GUEST_ID = UUID.randomUUID();
    private static final UUID HOST_ID = UUID.randomUUID();
    private static final UUID OTHER_USER_ID = UUID.randomUUID();

    private Booking booking;
    private TimeSlot timeSlot;
    private BookingFile bookingFile;

    @BeforeEach
    void setUp() {
        timeSlot = TimeSlot.create(HOST_ID, java.time.LocalTime.of(9, 0), java.time.LocalTime.of(10, 0), List.of(1, 2, 3));
        ReflectionTestUtils.setField(timeSlot, "id", 1L);

        booking = Booking.create(timeSlot, GUEST_ID, LocalDate.now().plusDays(1), "Topic", "Description");
        ReflectionTestUtils.setField(booking, "id", BOOKING_ID);

        bookingFile = BookingFile.create(
            booking,
            "uuid-file.pdf",
            "resume.pdf",
            "/uploads/2025/01/uuid-file.pdf",
            1024L,
            "application/pdf"
        );
        ReflectionTestUtils.setField(bookingFile, "id", FILE_ID);
    }

    @Nested
    @DisplayName("파일 업로드")
    class UploadFile {

        @Test
        @DisplayName("성공: 게스트가 파일을 업로드할 수 있다")
        void uploadFileByGuestSuccess() {
            // given
            MultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "content".getBytes()
            );
            FileStorageResult storageResult = new FileStorageResult(
                "uuid-file.pdf", "/uploads/2025/01/uuid-file.pdf", 7L, "application/pdf"
            );

            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(fileStorageService.store(file)).willReturn(storageResult);
            given(bookingFileRepository.save(any(BookingFile.class))).willReturn(bookingFile);

            // when
            BookingFileResponseDTO response = bookingFileService.uploadFile(BOOKING_ID, GUEST_ID, file);

            // then
            assertThat(response).isNotNull();
            assertThat(response.originalFileName()).isEqualTo("resume.pdf");
            verify(fileStorageService).store(file);
            verify(bookingFileRepository).save(any(BookingFile.class));
        }

        @Test
        @DisplayName("성공: 호스트가 파일을 업로드할 수 있다")
        void uploadFileByHostSuccess() {
            // given
            MultipartFile file = new MockMultipartFile(
                "file", "notes.pdf", "application/pdf", "content".getBytes()
            );
            FileStorageResult storageResult = new FileStorageResult(
                "uuid-file.pdf", "/uploads/2025/01/uuid-file.pdf", 7L, "application/pdf"
            );

            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(fileStorageService.store(file)).willReturn(storageResult);
            given(bookingFileRepository.save(any(BookingFile.class))).willReturn(bookingFile);

            // when
            BookingFileResponseDTO response = bookingFileService.uploadFile(BOOKING_ID, HOST_ID, file);

            // then
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("실패: 예약을 찾을 수 없음")
        void uploadFileFailsWhenBookingNotFound() {
            // given
            MultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "content".getBytes()
            );
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> bookingFileService.uploadFile(BOOKING_ID, GUEST_ID, file))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.BOOKING_NOT_FOUND);
        }

        @Test
        @DisplayName("실패: 게스트도 호스트도 아닌 사용자는 업로드 불가")
        void uploadFileFailsWhenAccessDenied() {
            // given
            MultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "content".getBytes()
            );
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));

            // when & then
            assertThatThrownBy(() -> bookingFileService.uploadFile(BOOKING_ID, OTHER_USER_ID, file))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
        }
    }

    @Nested
    @DisplayName("파일 목록 조회")
    class GetFiles {

        @Test
        @DisplayName("성공: 게스트가 파일 목록을 조회할 수 있다")
        void getFilesByGuestSuccess() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID))
                .willReturn(List.of(bookingFile));

            // when
            List<BookingFileResponseDTO> responses = bookingFileService.getFiles(BOOKING_ID, GUEST_ID);

            // then
            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).originalFileName()).isEqualTo("resume.pdf");
        }

        @Test
        @DisplayName("성공: 호스트가 파일 목록을 조회할 수 있다")
        void getFilesByHostSuccess() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(BOOKING_ID))
                .willReturn(List.of(bookingFile));

            // when
            List<BookingFileResponseDTO> responses = bookingFileService.getFiles(BOOKING_ID, HOST_ID);

            // then
            assertThat(responses).hasSize(1);
        }

        @Test
        @DisplayName("실패: 게스트도 호스트도 아닌 사용자는 조회 불가")
        void getFilesFailsWhenAccessDenied() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));

            // when & then
            assertThatThrownBy(() -> bookingFileService.getFiles(BOOKING_ID, OTHER_USER_ID))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
        }
    }

    @Nested
    @DisplayName("파일 삭제")
    class DeleteFile {

        @Test
        @DisplayName("성공: 게스트가 파일을 삭제할 수 있다")
        void deleteFileByGuestSuccess() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findById(FILE_ID)).willReturn(Optional.of(bookingFile));

            // when
            bookingFileService.deleteFile(BOOKING_ID, FILE_ID, GUEST_ID);

            // then
            verify(fileStorageService).delete(bookingFile.getFilePath());
            verify(bookingFileRepository).delete(bookingFile);
        }

        @Test
        @DisplayName("성공: 호스트가 파일을 삭제할 수 있다")
        void deleteFileByHostSuccess() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findById(FILE_ID)).willReturn(Optional.of(bookingFile));

            // when
            bookingFileService.deleteFile(BOOKING_ID, FILE_ID, HOST_ID);

            // then
            verify(fileStorageService).delete(bookingFile.getFilePath());
            verify(bookingFileRepository).delete(bookingFile);
        }

        @Test
        @DisplayName("실패: 파일을 찾을 수 없음")
        void deleteFileFailsWhenFileNotFound() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findById(FILE_ID)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> bookingFileService.deleteFile(BOOKING_ID, FILE_ID, GUEST_ID))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_NOT_FOUND);
        }

        @Test
        @DisplayName("실패: 파일이 해당 예약에 속하지 않음")
        void deleteFileFailsWhenFileBelongsToDifferentBooking() {
            // given
            Booking otherBooking = Booking.create(timeSlot, GUEST_ID, LocalDate.now().plusDays(2), "Other", "Desc");
            ReflectionTestUtils.setField(otherBooking, "id", 999L);

            BookingFile otherBookingFile = BookingFile.create(
                otherBooking, "other.pdf", "other.pdf", "/path", 100L, "application/pdf"
            );
            ReflectionTestUtils.setField(otherBookingFile, "id", FILE_ID);

            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findById(FILE_ID)).willReturn(Optional.of(otherBookingFile));

            // when & then
            assertThatThrownBy(() -> bookingFileService.deleteFile(BOOKING_ID, FILE_ID, GUEST_ID))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("파일 다운로드")
    class DownloadFile {

        @Test
        @DisplayName("성공: 게스트가 파일을 다운로드할 수 있다")
        void downloadFileByGuestSuccess() {
            // given
            byte[] content = "file content".getBytes();
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findById(FILE_ID)).willReturn(Optional.of(bookingFile));
            given(fileStorageService.load(bookingFile.getFilePath())).willReturn(content);

            // when
            var result = bookingFileService.downloadFile(BOOKING_ID, FILE_ID, GUEST_ID);

            // then
            assertThat(result.content()).isEqualTo(content);
            assertThat(result.originalFileName()).isEqualTo("resume.pdf");
            assertThat(result.contentType()).isEqualTo("application/pdf");
        }

        @Test
        @DisplayName("실패: 게스트도 호스트도 아닌 사용자는 다운로드 불가")
        void downloadFileFailsWhenAccessDenied() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));

            // when & then
            assertThatThrownBy(() -> bookingFileService.downloadFile(BOOKING_ID, FILE_ID, OTHER_USER_ID))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
        }
    }
}
