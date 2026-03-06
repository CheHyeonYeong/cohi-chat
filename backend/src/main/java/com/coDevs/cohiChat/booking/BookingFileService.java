package com.coDevs.cohiChat.booking;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.BookingFile;
import com.coDevs.cohiChat.booking.request.ConfirmUploadRequestDTO;
import com.coDevs.cohiChat.booking.response.BookingFileResponseDTO;
import com.coDevs.cohiChat.booking.response.PresignedDownloadUrlResponseDTO;
import com.coDevs.cohiChat.booking.response.PresignedUploadUrlResponseDTO;
import com.coDevs.cohiChat.global.common.file.FileStorageResult;
import com.coDevs.cohiChat.global.common.file.FileStorageService;
import com.coDevs.cohiChat.global.common.file.S3PresignedUrlService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingFileService {

    private static final Duration PRESIGNED_URL_EXPIRATION = Duration.ofMinutes(15);
    private static final int PRESIGNED_URL_EXPIRATION_SECONDS = (int) PRESIGNED_URL_EXPIRATION.toSeconds();

    private final BookingRepository bookingRepository;
    private final BookingFileRepository bookingFileRepository;
    private final FileStorageService fileStorageService;
    private final FileUploadValidator fileUploadValidator;
    private final S3PresignedUrlService s3PresignedUrlService;

    @Transactional
    public BookingFileResponseDTO uploadFile(Long bookingId, UUID requesterId, MultipartFile file) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateBookingAccess(booking, requesterId);

        // 파일 업로드 제한 검증
        fileUploadValidator.validate(bookingId, file);

        FileStorageResult storageResult = fileStorageService.store(file);

        try {
            BookingFile bookingFile = BookingFile.create(
                booking,
                storageResult.fileName(),
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                storageResult.filePath(),
                storageResult.fileSize(),
                storageResult.contentType()
            );

            BookingFile savedFile = bookingFileRepository.save(bookingFile);
            return BookingFileResponseDTO.from(savedFile);
        } catch (Exception e) {
            fileStorageService.delete(storageResult.filePath());
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<BookingFileResponseDTO> getFiles(Long bookingId, UUID requesterId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateBookingAccess(booking, requesterId);

        List<BookingFile> files = bookingFileRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
        return files.stream()
            .map(BookingFileResponseDTO::from)
            .toList();
    }

    @Transactional
    public void deleteFile(Long bookingId, Long fileId, UUID requesterId) {
        BookingFile bookingFile = getBookingFileWithAccessCheck(bookingId, fileId, requesterId);

        fileStorageService.delete(bookingFile.getFilePath());
        bookingFileRepository.delete(bookingFile);
    }

    @Transactional(readOnly = true)
    public FileDownloadResult downloadFile(Long bookingId, Long fileId, UUID requesterId) {
        BookingFile bookingFile = getBookingFileWithAccessCheck(bookingId, fileId, requesterId);

        byte[] content = fileStorageService.load(bookingFile.getFilePath());
        return new FileDownloadResult(content, bookingFile.getOriginalFileName(), bookingFile.getContentType());
    }

    private BookingFile getBookingFileWithAccessCheck(Long bookingId, Long fileId, UUID requesterId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateBookingAccess(booking, requesterId);

        BookingFile bookingFile = bookingFileRepository.findById(fileId)
            .orElseThrow(() -> new CustomException(ErrorCode.FILE_NOT_FOUND));

        if (!bookingFile.getBooking().getId().equals(bookingId)) {
            throw new CustomException(ErrorCode.FILE_NOT_FOUND);
        }

        return bookingFile;
    }

    private void validateBookingAccess(Booking booking, UUID requesterId) {
        boolean isGuest = booking.getGuestId().equals(requesterId);
        boolean isHost = booking.getTimeSlot().getUserId().equals(requesterId);

        if (!isGuest && !isHost) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    @Transactional(readOnly = true)
    public PresignedUploadUrlResponseDTO generatePresignedUploadUrl(
            Long bookingId, UUID requesterId, String fileName, String contentType) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateBookingAccess(booking, requesterId);
        fileUploadValidator.validateFileName(fileName);
        fileUploadValidator.validateContentType(contentType);

        String objectKey = generateObjectKey(fileName);
        String presignedUrl = s3PresignedUrlService.generateUploadUrl(
            objectKey, PRESIGNED_URL_EXPIRATION, contentType
        );

        return PresignedUploadUrlResponseDTO.of(presignedUrl, objectKey, PRESIGNED_URL_EXPIRATION_SECONDS);
    }

    @Transactional(readOnly = true)
    public PresignedDownloadUrlResponseDTO generatePresignedDownloadUrl(
            Long bookingId, Long fileId, UUID requesterId) {
        BookingFile bookingFile = getBookingFileWithAccessCheck(bookingId, fileId, requesterId);

        String presignedUrl = s3PresignedUrlService.generateDownloadUrl(bookingFile.getFilePath());

        return PresignedDownloadUrlResponseDTO.of(presignedUrl, PRESIGNED_URL_EXPIRATION_SECONDS);
    }

    @Transactional
    public BookingFileResponseDTO confirmUpload(
            Long bookingId, UUID requesterId, ConfirmUploadRequestDTO request) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateBookingAccess(booking, requesterId);

        fileUploadValidator.validateFileName(request.getOriginalFileName());
        fileUploadValidator.validateContentType(request.getContentType());
        fileUploadValidator.validateFileSize(request.getFileSize());
        fileUploadValidator.validateBookingLimits(bookingId, request.getFileSize());

        BookingFile bookingFile = BookingFile.create(
            booking,
            extractFileName(request.getObjectKey()),
            request.getOriginalFileName(),
            request.getObjectKey(),
            request.getFileSize(),
            request.getContentType()
        );

        BookingFile savedFile = bookingFileRepository.save(bookingFile);
        return BookingFileResponseDTO.from(savedFile);
    }

    private String generateObjectKey(String fileName) {
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String extension = getExtension(fileName);
        String storedFileName = UUID.randomUUID().toString() + extension;
        return datePath + "/" + storedFileName;
    }

    private String getExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0 && lastDot < fileName.length() - 1) {
            return "." + fileName.substring(lastDot + 1);
        }
        return "";
    }

    private String extractFileName(String objectKey) {
        int lastSlash = objectKey.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < objectKey.length() - 1) {
            return objectKey.substring(lastSlash + 1);
        }
        return objectKey;
    }
}
