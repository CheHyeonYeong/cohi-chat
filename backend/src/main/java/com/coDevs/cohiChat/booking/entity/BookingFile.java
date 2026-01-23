package com.coDevs.cohiChat.booking.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "booking_file")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BookingFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "original_file_name", nullable = false, length = 255)
    private String originalFileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public static BookingFile create(
        Booking booking,
        String fileName,
        String originalFileName,
        String filePath,
        Long fileSize,
        String contentType
    ) {
        Objects.requireNonNull(booking, "booking must not be null");
        Objects.requireNonNull(fileName, "fileName must not be null");
        Objects.requireNonNull(originalFileName, "originalFileName must not be null");
        Objects.requireNonNull(filePath, "filePath must not be null");
        Objects.requireNonNull(fileSize, "fileSize must not be null");
        Objects.requireNonNull(contentType, "contentType must not be null");

        BookingFile bookingFile = new BookingFile();
        bookingFile.booking = booking;
        bookingFile.fileName = fileName;
        bookingFile.originalFileName = originalFileName;
        bookingFile.filePath = filePath;
        bookingFile.fileSize = fileSize;
        bookingFile.contentType = contentType;
        return bookingFile;
    }
}
