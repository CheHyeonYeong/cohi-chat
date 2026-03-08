package com.coDevs.cohiChat.dev;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.dev.dto.DummyDataRequest;
import com.coDevs.cohiChat.dev.dto.DummyDataResponse;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import lombok.RequiredArgsConstructor;

@Service
@Profile({"local", "dev"})
@RequiredArgsConstructor
public class DummyDataService {

    private static final String DUMMY_PREFIX = "dummy_";
    private static final String DUMMY_PASSWORD = "dummy1234!";

    private final MemberRepository memberRepository;
    private final CalendarRepository calendarRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public DummyDataResponse generate(DummyDataRequest request) {
        String hashedPassword = passwordEncoder.encode(DUMMY_PASSWORD);
        List<Member> guests = new ArrayList<>();
        List<Member> hosts = new ArrayList<>();
        List<TimeSlot> timeSlots = new ArrayList<>();
        List<Booking> bookings = new ArrayList<>();

        // 1. Guest 생성
        for (int i = 0; i < request.memberCount(); i++) {
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

        // 2. Host 생성 + Calendar 생성
        for (int i = 0; i < request.hostCount(); i++) {
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

            // Calendar 생성
            Calendar calendar = Calendar.create(
                host.getId(),
                List.of("커피챗", "멘토링", "네트워킹"),
                "더미 호스트 " + (i + 1) + "의 캘린더입니다.",
                "dummy-calendar-id-" + host.getId()
            );
            calendarRepository.save(calendar);
        }

        // 3. TimeSlot 생성 (각 호스트에 분배)
        if (!hosts.isEmpty()) {
            int slotsPerHost = Math.max(1, request.timeSlotCount() / hosts.size());
            for (int h = 0; h < hosts.size(); h++) {
                Member host = hosts.get(h);
                for (int i = 0; i < slotsPerHost && timeSlots.size() < request.timeSlotCount(); i++) {
                    int baseHour = 9 + (i % 8); // 9시 ~ 16시
                    TimeSlot timeSlot = TimeSlot.create(
                        host.getId(),
                        LocalTime.of(baseHour, 0),
                        LocalTime.of(baseHour + 1, 0),
                        List.of(1, 2, 3, 4, 5) // 월~금
                    );
                    timeSlots.add(timeSlotRepository.save(timeSlot));
                }
            }
        }

        // 4. Booking 생성 (게스트와 타임슬롯 매칭)
        if (!guests.isEmpty() && !timeSlots.isEmpty()) {
            LocalDate startDate = LocalDate.now().plusDays(1);
            for (int i = 0; i < request.bookingCount() && i < guests.size() && i < timeSlots.size(); i++) {
                Member guest = guests.get(i % guests.size());
                TimeSlot timeSlot = timeSlots.get(i % timeSlots.size());

                // 예약 날짜를 요일에 맞게 조정
                LocalDate bookingDate = findNextValidDate(startDate.plusDays(i), timeSlot.getWeekdays());

                Booking booking = Booking.create(
                    timeSlot,
                    guest.getId(),
                    bookingDate,
                    "더미 예약 토픽 " + (i + 1),
                    "더미 예약 설명입니다. 테스트 목적으로 생성되었습니다."
                );
                bookings.add(bookingRepository.save(booking));
            }
        }

        return DummyDataResponse.of(
            guests.size(),
            hosts.size(),
            timeSlots.size(),
            bookings.size()
        );
    }

    @Transactional
    public void clear() {
        // 더미 데이터 삭제 (prefix로 식별)
        List<Member> dummyMembers = memberRepository.findAll().stream()
            .filter(m -> m.getUsername().startsWith(DUMMY_PREFIX))
            .toList();

        for (Member member : dummyMembers) {
            // 해당 멤버의 Booking 삭제
            bookingRepository.streamByGuestIdOrderByBookingDateDesc(member.getId())
                .forEach(bookingRepository::delete);

            // 해당 멤버의 TimeSlot 삭제 (호스트인 경우)
            timeSlotRepository.findByUserIdOrderByStartTimeAsc(member.getId())
                .forEach(timeSlotRepository::delete);

            // Calendar 삭제
            calendarRepository.findByUserId(member.getId())
                .ifPresent(calendarRepository::delete);

            // Member 삭제
            memberRepository.delete(member);
        }
    }

    private LocalDate findNextValidDate(LocalDate from, List<Integer> weekdays) {
        LocalDate date = from;
        for (int i = 0; i < 7; i++) {
            int dayOfWeek = date.getDayOfWeek().getValue();
            if (weekdays.contains(dayOfWeek)) {
                return date;
            }
            date = date.plusDays(1);
        }
        return from; // 유효한 날짜를 찾지 못하면 시작일 반환
    }
}
