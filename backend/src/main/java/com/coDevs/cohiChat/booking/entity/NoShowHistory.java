package com.coDevs.cohiChat.booking.entity;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

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
@Table(name = "noshow_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NoShowHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "host_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID hostId;

    @Column(name = "reported_by", nullable = false, columnDefinition = "BINARY(16)")
    private UUID reportedBy;

    @Column(name = "reason", length = 255)
    private String reason;

    @CreatedDate
    @Column(name = "reported_at", updatable = false)
    private Instant reportedAt;

    public static NoShowHistory create(
        Booking booking,
        UUID hostId,
        UUID reportedBy,
        String reason
    ) {
        Objects.requireNonNull(booking, "booking must not be null");
        Objects.requireNonNull(hostId, "hostId must not be null");
        Objects.requireNonNull(reportedBy, "reportedBy must not be null");

        NoShowHistory history = new NoShowHistory();
        history.booking = booking;
        history.hostId = hostId;
        history.reportedBy = reportedBy;
        history.reason = reason;
        return history;
    }
}
