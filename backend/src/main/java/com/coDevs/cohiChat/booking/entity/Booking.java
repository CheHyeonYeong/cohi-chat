package com.coDevs.cohiChat.booking.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
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

    @Column(name = "guest_id", nullable = false, columnDefinition = "uuid")
    private UUID guestId;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "topic", nullable = false, length = 255)
    private String topic;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 30)
    private AttendanceStatus attendanceStatus;

    @Column(name = "google_event_id", length = 64)
    private String googleEventId;

    @Column(name = "noshow_reported_at")
    private Instant noshowReportedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "cancelled_reason", length = 100)
    private String cancelledReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "meeting_type", nullable = false, length = 20, columnDefinition = "varchar(20) default 'ONLINE'")
    private MeetingType meetingType = MeetingType.ONLINE;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "meeting_link", length = 2000, columnDefinition = "varchar(2000) default 'https://www.cohi-chat.com'")
    private String meetingLink = "https://www.cohi-chat.com";

    public static Booking create(
        TimeSlot timeSlot,
        UUID guestId,
        LocalDate bookingDate,
        String topic,
        String description
    ) {
        return create(timeSlot, guestId, bookingDate, topic, description, MeetingType.ONLINE, null, null);
    }

    public static Booking create(
        TimeSlot timeSlot,
        UUID guestId,
        LocalDate bookingDate,
        String topic,
        String description,
        MeetingType meetingType,
        String location,
        String meetingLink
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
        booking.startTime = timeSlot.getStartTime();
        booking.endTime = timeSlot.getEndTime();
        booking.topic = topic;
        booking.description = description;
        booking.attendanceStatus = AttendanceStatus.SCHEDULED;
        booking.meetingType = meetingType != null ? meetingType : MeetingType.ONLINE;
        booking.location = location;
        booking.meetingLink = meetingLink != null ? meetingLink : "https://www.cohi-chat.com";
        return booking;
    }

    public void cancel() {
        cancel(null);
    }

    public void cancel(String reason) {
        if (!this.attendanceStatus.isCancellable()) {
            throw new IllegalStateException("취소할 수 없는 예약 상태입니다: " + this.attendanceStatus);
        }
        if (this.bookingDate.equals(LocalDate.now())) {
            this.attendanceStatus = AttendanceStatus.SAME_DAY_CANCEL;
        } else {
            this.attendanceStatus = AttendanceStatus.CANCELLED;
        }
        this.cancelledReason = reason;
    }

    public void forceCancel(String reason) {
        this.attendanceStatus = AttendanceStatus.CANCELLED;
        this.cancelledReason = reason;
    }

    public void updateStatus(AttendanceStatus newStatus) {
        Objects.requireNonNull(newStatus, "status must not be null");
        if (!this.attendanceStatus.isModifiable()) {
            throw new IllegalStateException("상태를 변경할 수 없는 예약입니다: " + this.attendanceStatus);
        }
        if (!newStatus.isHostSettable()) {
            throw new IllegalArgumentException("호스트가 설정할 수 없는 상태입니다: " + newStatus);
        }
        this.attendanceStatus = newStatus;
    }

    public void updateSchedule(TimeSlot newTimeSlot, LocalDate newBookingDate) {
        Objects.requireNonNull(newTimeSlot, "timeSlot must not be null");
        Objects.requireNonNull(newBookingDate, "bookingDate must not be null");
        this.timeSlot = newTimeSlot;
        this.bookingDate = newBookingDate;
        this.startTime = newTimeSlot.getStartTime();
        this.endTime = newTimeSlot.getEndTime();
    }

    public void update(String topic, String description, TimeSlot timeSlot, LocalDate bookingDate) {
        update(topic, description, timeSlot, bookingDate, this.meetingType, this.location, this.meetingLink);
    }

    public void update(
        String topic,
        String description,
        TimeSlot timeSlot,
        LocalDate bookingDate,
        MeetingType meetingType,
        String location,
        String meetingLink
    ) {
        Objects.requireNonNull(topic, "topic must not be null");
        Objects.requireNonNull(description, "description must not be null");
        Objects.requireNonNull(timeSlot, "timeSlot must not be null");
        Objects.requireNonNull(bookingDate, "bookingDate must not be null");

        this.topic = topic;
        this.description = description;
        this.timeSlot = timeSlot;
        this.bookingDate = bookingDate;
        this.startTime = timeSlot.getStartTime();
        this.endTime = timeSlot.getEndTime();
        this.meetingType = meetingType != null ? meetingType : MeetingType.ONLINE;
        this.location = location;
        this.meetingLink = meetingLink != null ? meetingLink : "https://www.cohi-chat.com";
    }

    public void setGoogleEventId(String googleEventId) {
        this.googleEventId = googleEventId;
    }

    public void reportHostNoShow(Instant now) {
        this.attendanceStatus = AttendanceStatus.HOST_NO_SHOW;
        this.noshowReportedAt = now;
    }
}
