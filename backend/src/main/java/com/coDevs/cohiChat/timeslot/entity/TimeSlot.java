package com.coDevs.cohiChat.timeslot.entity;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
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
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "time_slot")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "calendar_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "weekdays", nullable = false, columnDefinition = "TEXT")
    private List<Integer> weekdays;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static TimeSlot create(
        UUID userId,
        LocalTime startTime,
        LocalTime endTime,
        List<Integer> weekdays
    ) {
        TimeSlot timeSlot = new TimeSlot();
        timeSlot.userId = userId;
        timeSlot.startTime = startTime;
        timeSlot.endTime = endTime;
        timeSlot.weekdays = weekdays;
        return timeSlot;
    }

    public boolean isOverlapping(LocalTime newStartTime, LocalTime newEndTime, List<Integer> newWeekdays) {
        boolean timeOverlaps = this.startTime.isBefore(newEndTime) && this.endTime.isAfter(newStartTime);
        boolean weekdayOverlaps = !Collections.disjoint(this.weekdays, newWeekdays);
        return timeOverlaps && weekdayOverlaps;
    }
}
