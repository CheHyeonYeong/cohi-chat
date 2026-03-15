package com.coDevs.cohiChat.testutil;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
    public GeneratedData generate(int guestCount, int hostCount, int timeSlotsPerHost, int bookedBookingsPerHost) {
        String hashedPassword = passwordEncoder.encode(DUMMY_PASSWORD);
        List<Member> guests = new ArrayList<>();
        List<Member> hosts = new ArrayList<>();
        List<TimeSlot> timeSlots = new ArrayList<>();
        List<Booking> bookings = new ArrayList<>();

        for (int i = 0; i < guestCount; i++) {
            String username = DUMMY_PREFIX + "guest_" + UUID.randomUUID().toString().substring(0, 8);
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
            String username = DUMMY_PREFIX + "host_" + UUID.randomUUID().toString().substring(0, 8);
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
                List.of("커피챗", "멘토링", "포트폴리오 리뷰"),
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

        if (!guests.isEmpty() && bookedBookingsPerHost > 0) {
            int guestCursor = 0;
            for (int hostIndex = 0; hostIndex < hosts.size(); hostIndex++) {
                Member host = hosts.get(hostIndex);
                List<TimeSlot> hostTimeSlots = timeSlots.stream()
                    .filter(slot -> slot.getUserId().equals(host.getId()))
                    .toList();

                int bookingLimit = Math.min(bookedBookingsPerHost, hostTimeSlots.size());
                for (int bookingIndex = 0; bookingIndex < bookingLimit; bookingIndex++) {
                    Member guest = guests.get(guestCursor % guests.size());
                    TimeSlot timeSlot = hostTimeSlots.get(bookingIndex);
                    LocalDate bookingDate = findNextBookingDate(
                        LocalDate.now().plusDays(bookingIndex + 1L + (hostIndex * 7L)),
                        timeSlot
                    );

                    Booking booking = Booking.create(
                        timeSlot,
                        guest.getId(),
                        bookingDate,
                        "더미 예약 " + (bookingIndex + 1),
                        "이미 예약된 상태를 테스트하기 위한 더미 예약입니다."
                    );
                    bookings.add(bookingRepository.save(booking));
                    guestCursor++;
                }
            }
        }

        return new GeneratedData(guests.size(), hosts.size(), timeSlots.size(), bookings.size());
    }

    @Transactional
    public void clear() {
        List<Member> dummyMembers = memberRepository.findAll().stream()
            .filter(member -> member.getUsername().startsWith(DUMMY_PREFIX))
            .toList();
        List<UUID> dummyMemberIds = dummyMembers.stream()
            .map(Member::getId)
            .toList();

        bookingRepository.findAll().stream()
            .filter(booking ->
                dummyMemberIds.contains(booking.getGuestId())
                    || (booking.getTimeSlot() != null && dummyMemberIds.contains(booking.getTimeSlot().getUserId()))
            )
            .forEach(bookingRepository::delete);

        for (Member member : dummyMembers) {
            timeSlotRepository.findByUserIdOrderByStartTimeAsc(member.getId())
                .forEach(timeSlotRepository::delete);

            calendarRepository.findByUserId(member.getId())
                .ifPresent(calendarRepository::delete);

            memberRepository.delete(member);
        }
    }

    private LocalDate findNextBookingDate(LocalDate startDate, TimeSlot timeSlot) {
        LocalDate bookingDate = startDate;
        while (!timeSlot.getWeekdays().contains(toWeekdayValue(bookingDate))) {
            bookingDate = bookingDate.plusDays(1);
        }
        return bookingDate;
    }

    private int toWeekdayValue(LocalDate date) {
        return date.getDayOfWeek().getValue() % 7;
    }

    public record GeneratedData(
        int guestCount,
        int hostCount,
        int timeSlotCount,
        int bookedBookingCount
    ) {}
}
