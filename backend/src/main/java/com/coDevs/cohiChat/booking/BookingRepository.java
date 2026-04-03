package com.coDevs.cohiChat.booking;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.QueryHint;

import static org.hibernate.jpa.HibernateHints.HINT_FETCH_SIZE;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    boolean existsByTimeSlot_Id(Long timeSlotId);

    @QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "100"))
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.timeSlot WHERE b.guestId = :guestId ORDER BY b.bookingDate DESC")
    Stream<Booking> streamByGuestIdOrderByBookingDateDesc(@Param("guestId") UUID guestId);

    @QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "100"))
    @Query("SELECT b FROM Booking b JOIN FETCH b.timeSlot t WHERE t.userId = :hostId ORDER BY b.bookingDate DESC")
    Stream<Booking> streamByHostIdOrderByBookingDateDesc(@Param("hostId") UUID hostId);

    @Query(value = "SELECT b FROM Booking b LEFT JOIN FETCH b.timeSlot WHERE b.guestId = :guestId ORDER BY b.bookingDate DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.guestId = :guestId")
    Page<Booking> findByGuestIdOrderByBookingDateDesc(@Param("guestId") UUID guestId, Pageable pageable);

    @Query(value = "SELECT b FROM Booking b JOIN FETCH b.timeSlot t WHERE t.userId = :hostId ORDER BY b.bookingDate DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b JOIN b.timeSlot t WHERE t.userId = :hostId")
    Page<Booking> findByHostIdOrderByBookingDateDesc(@Param("hostId") UUID hostId, Pageable pageable);

    @Query("""
        SELECT EXISTS (
            SELECT 1 FROM Booking b
            WHERE b.timeSlot.id = :timeSlotId
              AND b.bookingDate = :bookingDate
              AND b.attendanceStatus NOT IN :excludedStatuses
              AND (:excludedId IS NULL OR b.id <> :excludedId)
        )
        """)
    boolean existsDuplicateBooking(
        @Param("timeSlotId") Long timeSlotId,
        @Param("bookingDate") LocalDate bookingDate,
        @Param("excludedStatuses") List<AttendanceStatus> excludedStatuses,
        @Param("excludedId") Long excludedId
    );

    @Query("""
        SELECT EXISTS (
            SELECT 1 FROM Booking b
            JOIN b.timeSlot t
            WHERE t.userId = :hostId
              AND t.deletedAt IS NULL
              AND b.bookingDate = :bookingDate
              AND b.startTime < :endTime
              AND b.endTime > :startTime
              AND b.attendanceStatus NOT IN :excludedStatuses
              AND (:excludedId IS NULL OR b.id <> :excludedId)
        )
        """)
    boolean existsOverlappingBooking(
        @Param("hostId") UUID hostId,
        @Param("bookingDate") LocalDate bookingDate,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("excludedStatuses") List<AttendanceStatus> excludedStatuses,
        @Param("excludedId") Long excludedId
    );

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.timeSlot t
        WHERE t.userId = :hostId
          AND b.bookingDate >= :startDate
          AND b.bookingDate < :endDate
        ORDER BY b.bookingDate
        """)
    List<Booking> findByHostIdAndDateRange(
        @Param("hostId") UUID hostId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.timeSlot t
        WHERE t.userId = :hostId
          AND b.bookingDate >= :today
          AND b.attendanceStatus = :status
        ORDER BY b.bookingDate
        """)
    List<Booking> findFutureBookingsByHostId(
        @Param("hostId") UUID hostId,
        @Param("today") LocalDate today,
        @Param("status") AttendanceStatus status
    );

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.timeSlot t
        WHERE b.guestId = :guestId
          AND b.bookingDate >= :today
          AND b.attendanceStatus = :status
        ORDER BY b.bookingDate
        """)
    List<Booking> findFutureBookingsByGuestId(
        @Param("guestId") UUID guestId,
        @Param("today") LocalDate today,
        @Param("status") AttendanceStatus status
    );

    @Query("""
        SELECT COUNT(b) FROM Booking b
        JOIN b.timeSlot t
        WHERE t.userId = :hostId
          AND b.attendanceStatus = :status
        """)
    long countAttendedByHostId(@Param("hostId") UUID hostId, @Param("status") AttendanceStatus status);

    @Query("""
        SELECT t.userId AS hostId, COUNT(b) AS count
        FROM Booking b JOIN b.timeSlot t
        WHERE t.userId IN :hostIds
          AND b.attendanceStatus = :status
        GROUP BY t.userId
        """)
    List<HostChatCount> countAttendedByHostIds(
        @Param("hostIds") Collection<UUID> hostIds,
        @Param("status") AttendanceStatus status
    );

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.timeSlot
        WHERE b.id = :id
        """)
    Optional<Booking> findByIdWithTimeSlot(@Param("id") Long id);

    @Query("""
        SELECT b FROM Booking b
        JOIN FETCH b.timeSlot t
        WHERE t.id = :timeSlotId
          AND b.bookingDate >= :fromDate
          AND b.attendanceStatus NOT IN :excludedStatuses
        ORDER BY b.bookingDate
        """)
    List<Booking> findActiveBookingsByTimeSlotIdFromDate(
        @Param("timeSlotId") Long timeSlotId,
        @Param("fromDate") LocalDate fromDate,
        @Param("excludedStatuses") List<AttendanceStatus> excludedStatuses
    );
}
