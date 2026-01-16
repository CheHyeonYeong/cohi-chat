package com.coDevs.cohiChat.calendar.entity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "calendar", indexes = {
    @Index(name = "idx_calendar_host_id", columnList = "host_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Calendar {

    private static final int MIN_DESCRIPTION_LENGTH = 10;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "host_id", nullable = false, unique = true, columnDefinition = "BINARY(16)")
    private UUID hostId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "topics", nullable = false, columnDefinition = "TEXT")
    private List<String> topics;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "google_calendar_id", nullable = false, length = 1024)
    private String googleCalendarId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static Calendar create(
        UUID hostId,
        List<String> topics,
        String description,
        String googleCalendarId
    ) {
        validateRequired(hostId, topics, description, googleCalendarId);

        Calendar calendar = new Calendar();
        calendar.hostId = hostId;
        calendar.topics = topics;
        calendar.description = description;
        calendar.googleCalendarId = googleCalendarId;
        calendar.isDeleted = false;

        return calendar;
    }

    private static void validateRequired(
        UUID hostId,
        List<String> topics,
        String description,
        String googleCalendarId
    ) {
        if (hostId == null) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        if (topics == null || topics.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        if (description == null || description.length() < MIN_DESCRIPTION_LENGTH) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        if (googleCalendarId == null || googleCalendarId.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
    }

    public void softDelete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return !isDeleted;
    }
}
