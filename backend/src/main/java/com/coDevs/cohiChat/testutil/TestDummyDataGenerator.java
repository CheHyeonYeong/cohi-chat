package com.coDevs.cohiChat.testutil;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import lombok.RequiredArgsConstructor;

/**
 * Local profile-only dummy data generator for manual QA.
 * It seeds deterministic guest/host accounts, time slots, and optional past bookings.
 */
@Profile("local")
@Component
@RequiredArgsConstructor
public class TestDummyDataGenerator {

    public static final String DUMMY_PREFIX = "dummy_";
    public static final String DUMMY_PASSWORD = "dummy1234!";

    private final MemberRepository memberRepository;
    private final CalendarRepository calendarRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public GeneratedData generate(int guestCount, int hostCount, int timeSlotsPerHost) {
        return generate(guestCount, hostCount, timeSlotsPerHost, 0);
    }

    @Transactional
    public GeneratedData generate(int guestCount, int hostCount, int timeSlotsPerHost, int pastBookingsPerHost) {
        clear();

        String hashedPassword = passwordEncoder.encode(DUMMY_PASSWORD);
        List<Member> guests = new ArrayList<>();
        List<Member> hosts = new ArrayList<>();
        List<TimeSlot> timeSlots = new ArrayList<>();
        List<Booking> bookings = new ArrayList<>();

        for (int i = 0; i < guestCount; i++) {
            String username = DUMMY_PREFIX + "guest_" + (i + 1);
            Member guest = Member.create(
                username,
                "더미 게스트 " + (i + 1),
                username + "@dummy.test",
                hashedPassword,
                Role.GUEST
            );
            guests.add(memberRepository.save(guest));
        }

        for (int i = 0; i < hostCount; i++) {
            String username = DUMMY_PREFIX + "host_" + (i + 1);
            Member host = Member.create(
                username,
                "더미 호스트 " + (i + 1),
                username + "@dummy.test",
                hashedPassword,
                Role.GUEST
            );
            host.promoteToHost();
            host.updateProfile("더미 직업 " + (i + 1), null);
            hosts.add(memberRepository.save(host));

            Calendar calendar = Calendar.create(
                host.getId(),
                List.of("커피챗", "멘토링", "노쇼 테스트"),
                "더미 호스트 " + (i + 1) + "의 캘린더입니다.",
                "dummy-calendar-id-" + host.getId()
            );
            calendarRepository.save(calendar);

            for (int j = 0; j < timeSlotsPerHost; j++) {
                int baseHour = 9 + (j % 8);
                TimeSlot timeSlot = TimeSlot.create(
                    host.getId(),
                    LocalTime.of(baseHour, 0),
                    LocalTime.of(baseHour + 1, 0),
                    List.of(1, 2, 3, 4, 5)
                );
                timeSlots.add(timeSlotRepository.save(timeSlot));
            }
        }

        if (!guests.isEmpty() && pastBookingsPerHost > 0) {
            int guestCursor = 0;
            for (Member host : hosts) {
                List<TimeSlot> hostTimeSlots = timeSlots.stream()
                    .filter(slot -> slot.getUserId().equals(host.getId()))
                    .toList();

                int bookingLimit = Math.min(pastBookingsPerHost, hostTimeSlots.size());
                for (int bookingIndex = 0; bookingIndex < bookingLimit; bookingIndex++) {
                    Member guest = guests.get(guestCursor % guests.size());
                    TimeSlot timeSlot = hostTimeSlots.get(bookingIndex);
                    LocalDate bookingDate = LocalDate.now().minusDays(bookingIndex + 1L);

                    Booking booking = Booking.create(
                        timeSlot,
                        guest.getId(),
                        bookingDate,
                        "노쇼 테스트",
                        "더미 데이터 생성기로 만든 과거 예약입니다.",
                        null,
                        null,
                        null
                    );
                    bookings.add(bookingRepository.save(booking));
                    guestCursor++;
                }
            }
        }

        return new GeneratedData(
            guests.size(),
            hosts.size(),
            timeSlots.size(),
            bookings.size(),
            DUMMY_PASSWORD
        );
    }

    @Transactional
    public void clear() {
        List<Member> dummyMembers = memberRepository.findAll().stream()
            .filter(member -> member.getUsername().startsWith(DUMMY_PREFIX))
            .toList();
        List<java.util.UUID> dummyGuestIds = dummyMembers.stream()
            .filter(member -> member.getRole() == Role.GUEST)
            .map(Member::getId)
            .toList();

        bookingRepository.findAll().stream()
            .filter(booking -> dummyGuestIds.contains(booking.getGuestId()))
            .forEach(bookingRepository::delete);

        for (Member member : dummyMembers) {
            timeSlotRepository.findByUserIdOrderByStartTimeAsc(member.getId())
                .forEach(timeSlotRepository::delete);

            calendarRepository.findByUserId(member.getId())
                .ifPresent(calendarRepository::delete);

            memberRepository.delete(member);
        }
    }

    public record GeneratedData(
        int guestCount,
        int hostCount,
        int timeSlotCount,
        int pastBookingCount,
        String defaultPassword
    ) {}
}