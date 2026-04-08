package com.coDevs.cohiChat.booking;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.coDevs.cohiChat.booking.entity.Booking;
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
    private final CloudFrontUrlService cloudFrontUrlService;
    private final Map<String, PendingUploadRequest> pendingUploads = new ConcurrentHashMap<>();

    @Transactional
    public BookingFileResponseDTO uploadFile(Long bookingId, UUID requesterId, MultipartFile file) {
        Booking booking = bookingRepository.findByIdWithTimeSlot(bookingId)
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
        Booking booking = bookingRepository.findByIdWithTimeSlot(bookingId)
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
        Booking booking = bookingRepository.findByIdWithTimeSlot(bookingId)
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
        String normalizedContentType = fileUploadValidator.normalizeContentType(contentType);
        cleanupExpiredPendingUploads();

        String objectKey = generateObjectKey(fileName);
        String presignedUrl = s3PresignedUrlService.generateUploadUrl(
            objectKey, PRESIGNED_URL_EXPIRATION, normalizedContentType
        );
        pendingUploads.put(
            objectKey,
            new PendingUploadRequest(
                bookingId,
                requesterId,
                normalizedContentType,
                Instant.now().plus(PRESIGNED_URL_EXPIRATION)
            )
        );

        return PresignedUploadUrlResponseDTO.of(presignedUrl, objectKey, PRESIGNED_URL_EXPIRATION_SECONDS);
    }

    @Transactional(readOnly = true)
    public PresignedDownloadUrlResponseDTO generatePresignedDownloadUrl(
            Long bookingId, Long fileId, UUID requesterId) {
        BookingFile bookingFile = getBookingFileWithAccessCheck(bookingId, fileId, requesterId);

        String presignedUrl = s3PresignedUrlService.generateDownloadUrl(bookingFile.getFilePath());
        String downloadUrl = cloudFrontUrlService.toCloudFrontUrl(presignedUrl);

        return PresignedDownloadUrlResponseDTO.of(downloadUrl, PRESIGNED_URL_EXPIRATION_SECONDS);
    }

    @Transactional
    public BookingFileResponseDTO confirmUpload(
            Long bookingId, UUID requesterId, ConfirmUploadRequestDTO request) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        validateBookingAccess(booking, requesterId);
        cleanupExpiredPendingUploads();

        PendingUploadRequest pendingUploadRequest = pendingUploads.get(request.getObjectKey());
        if (pendingUploadRequest == null
            || !pendingUploadRequest.bookingId().equals(bookingId)
            || !pendingUploadRequest.requesterId().equals(requesterId)
            || pendingUploadRequest.expiresAt().isBefore(Instant.now())) {
            throw new CustomException(ErrorCode.FILE_UPLOAD_NOT_CONFIRMED);
        }

        fileUploadValidator.validateFileName(request.getOriginalFileName());
        String normalizedRequestedContentType = fileUploadValidator.normalizeContentType(request.getContentType());

        S3PresignedUrlService.S3ObjectMetadata objectMetadata = s3PresignedUrlService
            .getObjectMetadata(request.getObjectKey())
            .orElseThrow(() -> new CustomException(ErrorCode.FILE_NOT_FOUND));

        String normalizedS3ContentType;
        try {
            normalizedS3ContentType = fileUploadValidator.normalizeContentType(objectMetadata.contentType());
        } catch (CustomException e) {
            cleanupOrphanObject(request.getObjectKey());
            pendingUploads.remove(request.getObjectKey());
            throw e;
        }
        if (!pendingUploadRequest.contentType().equals(normalizedRequestedContentType)
            || !pendingUploadRequest.contentType().equals(normalizedS3ContentType)
            || request.getFileSize() != objectMetadata.contentLength()) {
            cleanupOrphanObject(request.getObjectKey());
            pendingUploads.remove(request.getObjectKey());
            throw new CustomException(ErrorCode.FILE_UPLOAD_METADATA_MISMATCH);
        }

        try {
            fileUploadValidator.validateContentType(normalizedS3ContentType);
            fileUploadValidator.validateFileSize(objectMetadata.contentLength());
            fileUploadValidator.validateBookingLimits(bookingId, objectMetadata.contentLength());

            BookingFile bookingFile = BookingFile.create(
                booking,
                extractFileName(request.getObjectKey()),
                request.getOriginalFileName(),
                request.getObjectKey(),
                objectMetadata.contentLength(),
                normalizedS3ContentType
            );

            BookingFile savedFile = bookingFileRepository.save(bookingFile);
            pendingUploads.remove(request.getObjectKey());
            return BookingFileResponseDTO.from(savedFile);
        } catch (CustomException e) {
            cleanupOrphanObject(request.getObjectKey());
            pendingUploads.remove(request.getObjectKey());
            throw e;
        }
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

    private void cleanupExpiredPendingUploads() {
        Instant now = Instant.now();
        pendingUploads.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private void cleanupOrphanObject(String objectKey) {
        s3PresignedUrlService.deleteObjectQuietly(objectKey);
    }

    private record PendingUploadRequest(
        Long bookingId,
        UUID requesterId,
        String contentType,
        Instant expiresAt
    ) {}
}
