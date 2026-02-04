package com.coDevs.cohiChat.timeslot.entity;

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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "time_slot_weekday", indexes = {
    @Index(name = "idx_time_slot_weekday", columnList = "time_slot_id, weekday")
})
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
        TimeSlotWeekday entity = new TimeSlotWeekday();
        entity.timeSlot = timeSlot;
        entity.weekday = weekday;
        return entity;
    }
}
