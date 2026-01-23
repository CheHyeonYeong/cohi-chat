package com.coDevs.cohiChat.booking.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "booking")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_slot_id", nullable = false)
    @OnDelete(action = OnDeleteAction.NO_ACTION)
    private TimeSlot timeSlot;

    @Column(name = "guest_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID guestId;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "topic", nullable = false, length = 255)
    private String topic;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    private AttendanceStatus attendanceStatus;

    @Column(name = "google_event_id", length = 64)
    private String googleEventId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static Booking create(
        TimeSlot timeSlot,
        UUID guestId,
        LocalDate bookingDate,
        String topic,
        String description
    ) {
        Objects.requireNonNull(timeSlot, "timeSlot must not be null");
        Objects.requireNonNull(guestId, "guestId must not be null");
        Objects.requireNonNull(bookingDate, "bookingDate must not be null");
        Objects.requireNonNull(topic, "topic must not be null");
        Objects.requireNonNull(description, "description must not be null");

        Booking booking = new Booking();
        booking.timeSlot = timeSlot;
        booking.guestId = guestId;
        booking.bookingDate = bookingDate;
        booking.topic = topic;
        booking.description = description;
        booking.attendanceStatus = AttendanceStatus.SCHEDULED;
        return booking;
    }

    public void cancel() {
        this.attendanceStatus = AttendanceStatus.CANCELLED;
    }

    public void updateSchedule(TimeSlot newTimeSlot, LocalDate newBookingDate) {
        Objects.requireNonNull(newTimeSlot, "timeSlot must not be null");
        Objects.requireNonNull(newBookingDate, "bookingDate must not be null");
        this.timeSlot = newTimeSlot;
        this.bookingDate = newBookingDate;
    }

    public void update(String topic, String description, TimeSlot timeSlot, LocalDate bookingDate) {
        Objects.requireNonNull(topic, "topic must not be null");
        Objects.requireNonNull(description, "description must not be null");
        Objects.requireNonNull(timeSlot, "timeSlot must not be null");
        Objects.requireNonNull(bookingDate, "bookingDate must not be null");

        this.topic = topic;
        this.description = description;
        this.timeSlot = timeSlot;
        this.bookingDate = bookingDate;
    }
}
