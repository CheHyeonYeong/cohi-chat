package com.coDevs.cohiChat.booking.entity;

import java.time.Instant;
import java.time.LocalDate;
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

    /**
     * 게스트 예약 취소
     * 당일 취소 시 SAME_DAY_CANCEL, 사전 취소 시 CANCELLED
     */
    public void cancel() {
        cancel(null);
    }

    /**
     * 예약 취소 (사유 포함)
     * 당일 취소 시 SAME_DAY_CANCEL, 사전 취소 시 CANCELLED
     * @param reason 취소 사유 (nullable)
     */
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

    /**
     * 시스템에 의한 예약 강제 취소 (회원 탈퇴 시 사용)
     * 상태에 관계없이 취소 처리
     * @param reason 취소 사유
     */
    public void forceCancel(String reason) {
        this.attendanceStatus = AttendanceStatus.CANCELLED;
        this.cancelledReason = reason;
    }

    /**
     * 호스트가 예약 상태 변경 (출석/노쇼/지각)
     */
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

    public void setGoogleEventId(String googleEventId) {
        this.googleEventId = googleEventId;
    }

    /**
     * 게스트가 호스트 노쇼를 신고
     * 엔티티 레벨에서 상태 전이 가능 여부를 검증
     * @param now 신고 시각 (결정적 테스트를 위해 호출자가 주입)
     */
    public void reportHostNoShow(Instant now) {
        if (!this.attendanceStatus.isGuestReportable()) {
            throw new IllegalStateException("노쇼 신고가 불가능한 예약 상태입니다: " + this.attendanceStatus);
        }
        this.attendanceStatus = AttendanceStatus.HOST_NO_SHOW;
        this.noshowReportedAt = now;
    }
}
