package com.coDevs.cohiChat.calendar;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.coDevs.cohiChat.calendar.entity.Calendar;

@Repository
public interface CalendarRepository extends JpaRepository<Calendar, UUID> {

    Optional<Calendar> findByHostIdAndIsDeletedFalse(UUID hostId);

    boolean existsByHostIdAndIsDeletedFalse(UUID hostId);
}
