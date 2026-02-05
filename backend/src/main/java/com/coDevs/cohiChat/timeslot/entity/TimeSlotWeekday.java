package com.coDevs.cohiChat.timeslot.entity;

import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "time_slot_weekday",
    indexes = {
        @Index(name = "idx_time_slot_weekday", columnList = "time_slot_id, weekday")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_time_slot_weekday", columnNames = {"time_slot_id", "weekday"})
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TimeSlotWeekday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_slot_id", nullable = false)
    private TimeSlot timeSlot;

    @Column(name = "weekday", nullable = false)
    private Integer weekday;

    public static TimeSlotWeekday create(TimeSlot timeSlot, Integer weekday) {
        if (weekday == null || weekday < 0 || weekday > 6) {
            throw new IllegalArgumentException("weekday must be between 0 and 6");
        }
        TimeSlotWeekday entity = new TimeSlotWeekday();
        entity.timeSlot = timeSlot;
        entity.weekday = weekday;
        return entity;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TimeSlotWeekday that)) return false;
        return Objects.equals(timeSlot, that.timeSlot) && Objects.equals(weekday, that.weekday);
    }

    @Override
    public int hashCode() {
        return Objects.hash(timeSlot, weekday);
    }
}
