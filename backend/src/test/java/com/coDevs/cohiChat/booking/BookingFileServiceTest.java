package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.Map;
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
import com.coDevs.cohiChat.booking.entity.MeetingType;
import com.coDevs.cohiChat.booking.entity.BookingFile;
import com.coDevs.cohiChat.booking.request.ConfirmUploadRequestDTO;
import com.coDevs.cohiChat.booking.response.BookingFileResponseDTO;
import com.coDevs.cohiChat.booking.response.PresignedDownloadUrlResponseDTO;
import com.coDevs.cohiChat.booking.response.PresignedUploadUrlResponseDTO;
import com.coDevs.cohiChat.global.common.file.CloudFrontUrlService;
import com.coDevs.cohiChat.global.common.file.FileStorageResult;
import com.coDevs.cohiChat.global.common.file.FileStorageService;
import com.coDevs.cohiChat.global.common.file.S3PresignedUrlService;
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

    @Mock
    private FileUploadValidator fileUploadValidator;

    @Mock
    private S3PresignedUrlService s3PresignedUrlService;

    @Mock
    private CloudFrontUrlService cloudFrontUrlService;

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

        booking = Booking.create(timeSlot, GUEST_ID, LocalDate.now().plusDays(1), "Topic", "Description", MeetingType.ONLINE, null, null);
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

            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
            doNothing().when(fileUploadValidator).validate(eq(BOOKING_ID), any(MultipartFile.class));
            given(fileStorageService.store(file)).willReturn(storageResult);
            given(bookingFileRepository.save(any(BookingFile.class))).willReturn(bookingFile);

            // when
            BookingFileResponseDTO response = bookingFileService.uploadFile(BOOKING_ID, GUEST_ID, file);

            // then
            assertThat(response).isNotNull();
            assertThat(response.originalFileName()).isEqualTo("resume.pdf");
            verify(fileUploadValidator).validate(eq(BOOKING_ID), any(MultipartFile.class));
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

            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
            doNothing().when(fileUploadValidator).validate(eq(BOOKING_ID), any(MultipartFile.class));
            given(fileStorageService.store(file)).willReturn(storageResult);
            given(bookingFileRepository.save(any(BookingFile.class))).willReturn(bookingFile);

            // when
            BookingFileResponseDTO response = bookingFileService.uploadFile(BOOKING_ID, HOST_ID, file);

            // then
            assertThat(response).isNotNull();
            verify(fileUploadValidator).validate(eq(BOOKING_ID), any(MultipartFile.class));
        }

        @Test
        @DisplayName("실패: 예약을 찾을 수 없음")
        void uploadFileFailsWhenBookingNotFound() {
            // given
            MultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "content".getBytes()
            );
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.empty());

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
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));

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
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
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
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
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
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));

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
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
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
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
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
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
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
            Booking otherBooking = Booking.create(timeSlot, GUEST_ID, LocalDate.now().plusDays(2), "Other", "Desc", MeetingType.ONLINE, null, null);
            ReflectionTestUtils.setField(otherBooking, "id", 999L);

            BookingFile otherBookingFile = BookingFile.create(
                otherBooking, "other.pdf", "other.pdf", "/path", 100L, "application/pdf"
            );
            ReflectionTestUtils.setField(otherBookingFile, "id", FILE_ID);

            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
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
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
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
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));

            // when & then
            assertThatThrownBy(() -> bookingFileService.downloadFile(BOOKING_ID, FILE_ID, OTHER_USER_ID))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
        }
    }

    @Nested
    @DisplayName("Pre-signed 업로드 URL 생성")
    class GeneratePresignedUploadUrl {

        private static final String FILE_NAME = "document.pdf";
        private static final String CONTENT_TYPE = "application/pdf";
        private static final String PRESIGNED_URL = "https://bucket.s3.amazonaws.com/presigned-url";
        private static final String OBJECT_KEY = "2025/03/uuid-document.pdf";

        @Test
        @DisplayName("성공: 게스트가 업로드 URL을 생성할 수 있다")
        void generateUploadUrlByGuestSuccess() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            doNothing().when(fileUploadValidator).validateFileName(FILE_NAME);
            given(fileUploadValidator.normalizeContentType(CONTENT_TYPE)).willReturn(CONTENT_TYPE);
            given(s3PresignedUrlService.generateUploadUrl(any(), any(), eq(CONTENT_TYPE)))
                .willReturn(PRESIGNED_URL);

            // when
            PresignedUploadUrlResponseDTO response = bookingFileService.generatePresignedUploadUrl(
                BOOKING_ID, GUEST_ID, FILE_NAME, CONTENT_TYPE
            );

            // then
            assertThat(response).isNotNull();
            assertThat(response.url()).isEqualTo(PRESIGNED_URL);
            assertThat(response.objectKey()).isNotNull();
            assertThat(response.expiresIn()).isGreaterThan(0);
            verify(fileUploadValidator).validateFileName(FILE_NAME);
            verify(fileUploadValidator).normalizeContentType(CONTENT_TYPE);
        }

        @Test
        @DisplayName("성공: 호스트가 업로드 URL을 생성할 수 있다")
        void generateUploadUrlByHostSuccess() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            doNothing().when(fileUploadValidator).validateFileName(FILE_NAME);
            given(fileUploadValidator.normalizeContentType(CONTENT_TYPE)).willReturn(CONTENT_TYPE);
            given(s3PresignedUrlService.generateUploadUrl(any(), any(), eq(CONTENT_TYPE)))
                .willReturn(PRESIGNED_URL);

            // when
            PresignedUploadUrlResponseDTO response = bookingFileService.generatePresignedUploadUrl(
                BOOKING_ID, HOST_ID, FILE_NAME, CONTENT_TYPE
            );

            // then
            assertThat(response).isNotNull();
            assertThat(response.url()).isEqualTo(PRESIGNED_URL);
            verify(fileUploadValidator).validateFileName(FILE_NAME);
            verify(fileUploadValidator).normalizeContentType(CONTENT_TYPE);
        }

        @Test
        @DisplayName("실패: 예약을 찾을 수 없음")
        void generateUploadUrlFailsWhenBookingNotFound() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> bookingFileService.generatePresignedUploadUrl(
                BOOKING_ID, GUEST_ID, FILE_NAME, CONTENT_TYPE
            ))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.BOOKING_NOT_FOUND);
        }

        @Test
        @DisplayName("실패: 게스트도 호스트도 아닌 사용자는 URL 생성 불가")
        void generateUploadUrlFailsWhenAccessDenied() {
            // given
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));

            // when & then
            assertThatThrownBy(() -> bookingFileService.generatePresignedUploadUrl(
                BOOKING_ID, OTHER_USER_ID, FILE_NAME, CONTENT_TYPE
            ))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
        }
    }

    @Nested
    @DisplayName("업로드 완료 확인")
    class ConfirmUpload {

        private static final String OBJECT_KEY = "2026/03/uuid-file.pdf";
        private static final String FILE_NAME = "resume.pdf";
        private static final String CONTENT_TYPE = "application/pdf";
        private static final Long FILE_SIZE = 1024L;

        @Test
        @DisplayName("성공: 게스트가 업로드 완료 파일을 등록할 수 있다")
        void confirmUploadByGuestSuccess() {
            // given
            ConfirmUploadRequestDTO request = ConfirmUploadRequestDTO.builder()
                .objectKey(OBJECT_KEY)
                .originalFileName(FILE_NAME)
                .contentType(CONTENT_TYPE)
                .fileSize(FILE_SIZE)
                .build();

            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(fileUploadValidator.normalizeContentType(CONTENT_TYPE)).willReturn(CONTENT_TYPE);
            setPendingUpload(OBJECT_KEY, BOOKING_ID, GUEST_ID, CONTENT_TYPE);
            given(s3PresignedUrlService.getObjectMetadata(OBJECT_KEY))
                .willReturn(Optional.of(new S3PresignedUrlService.S3ObjectMetadata(FILE_SIZE, CONTENT_TYPE)));
            doNothing().when(fileUploadValidator).validateFileName(FILE_NAME);
            doNothing().when(fileUploadValidator).validateFileSize(FILE_SIZE);
            doNothing().when(fileUploadValidator).validateBookingLimits(BOOKING_ID, FILE_SIZE);
            doNothing().when(fileUploadValidator).validateContentType(CONTENT_TYPE);
            given(bookingFileRepository.save(any(BookingFile.class))).willReturn(bookingFile);

            // when
            BookingFileResponseDTO response = bookingFileService.confirmUpload(BOOKING_ID, GUEST_ID, request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.originalFileName()).isEqualTo("resume.pdf");
            verify(fileUploadValidator).validateFileName(FILE_NAME);
            verify(fileUploadValidator).validateFileSize(FILE_SIZE);
            verify(fileUploadValidator).validateBookingLimits(BOOKING_ID, FILE_SIZE);
            verify(fileUploadValidator).validateContentType(CONTENT_TYPE);
            verify(s3PresignedUrlService).getObjectMetadata(OBJECT_KEY);
            verify(bookingFileRepository).save(any(BookingFile.class));
        }

        @Test
        @DisplayName("실패: 예약을 찾을 수 없음")
        void confirmUploadFailsWhenBookingNotFound() {
            // given
            ConfirmUploadRequestDTO request = ConfirmUploadRequestDTO.builder()
                .objectKey(OBJECT_KEY)
                .originalFileName(FILE_NAME)
                .contentType(CONTENT_TYPE)
                .fileSize(FILE_SIZE)
                .build();
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> bookingFileService.confirmUpload(BOOKING_ID, GUEST_ID, request))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.BOOKING_NOT_FOUND);
        }

        @Test
        @DisplayName("실패: 게스트도 호스트도 아닌 사용자는 등록 불가")
        void confirmUploadFailsWhenAccessDenied() {
            // given
            ConfirmUploadRequestDTO request = ConfirmUploadRequestDTO.builder()
                .objectKey(OBJECT_KEY)
                .originalFileName(FILE_NAME)
                .contentType(CONTENT_TYPE)
                .fileSize(FILE_SIZE)
                .build();
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            setPendingUpload(OBJECT_KEY, BOOKING_ID, GUEST_ID, CONTENT_TYPE);

            // when & then
            assertThatThrownBy(() -> bookingFileService.confirmUpload(BOOKING_ID, OTHER_USER_ID, request))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
        }

        @Test
        @DisplayName("실패: 발급된 presigned 업로드 요청이 아니면 등록 불가")
        void confirmUploadFailsWhenRequestNotIssued() {
            // given
            ConfirmUploadRequestDTO request = ConfirmUploadRequestDTO.builder()
                .objectKey(OBJECT_KEY)
                .originalFileName(FILE_NAME)
                .contentType(CONTENT_TYPE)
                .fileSize(FILE_SIZE)
                .build();
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));

            // when & then
            assertThatThrownBy(() -> bookingFileService.confirmUpload(BOOKING_ID, GUEST_ID, request))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_UPLOAD_NOT_CONFIRMED);
        }

        @Test
        @DisplayName("실패: S3 메타데이터가 요청값과 다르면 등록 실패 및 객체 정리")
        void confirmUploadFailsWhenMetadataMismatch() {
            // given
            ConfirmUploadRequestDTO request = ConfirmUploadRequestDTO.builder()
                .objectKey(OBJECT_KEY)
                .originalFileName(FILE_NAME)
                .contentType(CONTENT_TYPE)
                .fileSize(FILE_SIZE)
                .build();
            given(bookingRepository.findById(BOOKING_ID)).willReturn(Optional.of(booking));
            given(fileUploadValidator.normalizeContentType(CONTENT_TYPE)).willReturn(CONTENT_TYPE);
            setPendingUpload(OBJECT_KEY, BOOKING_ID, GUEST_ID, CONTENT_TYPE);
            given(s3PresignedUrlService.getObjectMetadata(OBJECT_KEY))
                .willReturn(Optional.of(new S3PresignedUrlService.S3ObjectMetadata(FILE_SIZE + 1, CONTENT_TYPE)));

            // when & then
            assertThatThrownBy(() -> bookingFileService.confirmUpload(BOOKING_ID, GUEST_ID, request))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_UPLOAD_METADATA_MISMATCH);
            verify(s3PresignedUrlService).deleteObjectQuietly(OBJECT_KEY);
        }
    }

    @Nested
    @DisplayName("Pre-signed 다운로드 URL 생성")
    class GeneratePresignedDownloadUrl {

        private static final String PRESIGNED_URL = "https://bucket.s3.amazonaws.com/presigned-download-url";

        @Test
        @DisplayName("성공: 게스트가 다운로드 URL을 생성할 수 있다")
        void generateDownloadUrlByGuestSuccess() {
            // given
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findById(FILE_ID)).willReturn(Optional.of(bookingFile));
            given(s3PresignedUrlService.generateDownloadUrl(bookingFile.getFilePath()))
                .willReturn(PRESIGNED_URL);
            given(cloudFrontUrlService.toCloudFrontUrl(PRESIGNED_URL)).willReturn(PRESIGNED_URL);

            // when
            PresignedDownloadUrlResponseDTO response = bookingFileService.generatePresignedDownloadUrl(
                BOOKING_ID, FILE_ID, GUEST_ID
            );

            // then
            assertThat(response).isNotNull();
            assertThat(response.url()).isEqualTo(PRESIGNED_URL);
            assertThat(response.expiresIn()).isGreaterThan(0);
        }

        @Test
        @DisplayName("성공: 호스트가 다운로드 URL을 생성할 수 있다")
        void generateDownloadUrlByHostSuccess() {
            // given
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findById(FILE_ID)).willReturn(Optional.of(bookingFile));
            given(s3PresignedUrlService.generateDownloadUrl(bookingFile.getFilePath()))
                .willReturn(PRESIGNED_URL);
            given(cloudFrontUrlService.toCloudFrontUrl(PRESIGNED_URL)).willReturn(PRESIGNED_URL);

            // when
            PresignedDownloadUrlResponseDTO response = bookingFileService.generatePresignedDownloadUrl(
                BOOKING_ID, FILE_ID, HOST_ID
            );

            // then
            assertThat(response).isNotNull();
            assertThat(response.url()).isEqualTo(PRESIGNED_URL);
        }

        @Test
        @DisplayName("실패: 파일을 찾을 수 없음")
        void generateDownloadUrlFailsWhenFileNotFound() {
            // given
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));
            given(bookingFileRepository.findById(FILE_ID)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> bookingFileService.generatePresignedDownloadUrl(
                BOOKING_ID, FILE_ID, GUEST_ID
            ))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.FILE_NOT_FOUND);
        }

        @Test
        @DisplayName("실패: 게스트도 호스트도 아닌 사용자는 URL 생성 불가")
        void generateDownloadUrlFailsWhenAccessDenied() {
            // given
            given(bookingRepository.findByIdWithTimeSlot(BOOKING_ID)).willReturn(Optional.of(booking));

            // when & then
            assertThatThrownBy(() -> bookingFileService.generatePresignedDownloadUrl(
                BOOKING_ID, FILE_ID, OTHER_USER_ID
            ))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
        }
    }

    @SuppressWarnings("unchecked")
    private void setPendingUpload(String objectKey, Long bookingId, UUID requesterId, String contentType) {
        Map<String, Object> pendingUploads =
            (Map<String, Object>) ReflectionTestUtils.getField(bookingFileService, "pendingUploads");
        assertThat(pendingUploads).isNotNull();

        Class<?> pendingClass = null;
        for (Class<?> nestedClass : BookingFileService.class.getDeclaredClasses()) {
            if ("PendingUploadRequest".equals(nestedClass.getSimpleName())) {
                pendingClass = nestedClass;
                break;
            }
        }
        assertThat(pendingClass).isNotNull();
        Object pending = null;
        try {
            var constructor = pendingClass.getDeclaredConstructors()[0];
            constructor.setAccessible(true);
            pending = constructor.newInstance(
                bookingId,
                requesterId,
                contentType,
                Instant.now().plusSeconds(300)
            );
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        pendingUploads.put(objectKey, pending);
    }
}
