package com.coDevs.cohiChat.calendar.entity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "calendar")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Calendar {

    @Id
    @Column(name = "user_id", columnDefinition = "BINARY(16)")
    private UUID userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "topics", nullable = false, columnDefinition = "TEXT")
    private List<String> topics;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "google_calendar_id", nullable = false, length = 1024)
    private String googleCalendarId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    public static Calendar create(
        UUID userId,
        List<String> topics,
        String description,
        String googleCalendarId
    ) {
        Calendar calendar = new Calendar();
        calendar.userId = userId;
        calendar.topics = topics;
        calendar.description = description;
        calendar.googleCalendarId = googleCalendarId;

        return calendar;
    }

    public void update(List<String> topics, String description, String googleCalendarId) {
        this.topics = topics;
        this.description = description;
        this.googleCalendarId = googleCalendarId;
        this.updatedAt = Instant.now();
    }

}
