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
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "guest_noshow_history", indexes = {
    @Index(name = "idx_guest_noshow_history_guest_id", columnList = "guest_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GuestNoShowHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "guest_id", nullable = false, columnDefinition = "uuid")
    private UUID guestId;

    @Column(name = "reported_by", nullable = false, columnDefinition = "uuid")
    private UUID reportedBy;

    @Size(max = 255)
    @Column(name = "reason", length = 255)
    private String reason;

    @CreatedDate
    @Column(name = "reported_at", updatable = false)
    private Instant reportedAt;

    public static GuestNoShowHistory create(
        Booking booking,
        UUID guestId,
        UUID reportedBy,
        String reason
    ) {
        Objects.requireNonNull(booking, "booking must not be null");
        Objects.requireNonNull(guestId, "guestId must not be null");
        Objects.requireNonNull(reportedBy, "reportedBy must not be null");

        GuestNoShowHistory history = new GuestNoShowHistory();
        history.booking = booking;
        history.guestId = guestId;
        history.reportedBy = reportedBy;
        history.reason = reason;
        return history;
    }
}
