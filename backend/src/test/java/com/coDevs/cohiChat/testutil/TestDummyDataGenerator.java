package com.coDevs.cohiChat.testutil;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import lombok.RequiredArgsConstructor;

/**
 * 테스트용 더미 데이터 생성기
 * src/test에 위치하여 프로덕션 빌드에 포함되지 않음
 */
@Component
@RequiredArgsConstructor
public class TestDummyDataGenerator {

    private static final String DUMMY_PREFIX = "dummy_";
    private static final String DUMMY_PASSWORD = "dummy1234!";

    private final MemberRepository memberRepository;
    private final CalendarRepository calendarRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 더미 데이터 생성
     * @param guestCount 생성할 게스트 수
     * @param hostCount 생성할 호스트 수
     * @param timeSlotsPerHost 호스트당 타임슬롯 수
     * @return 생성된 데이터 요약
     */
    @Transactional
    public GeneratedData generate(int guestCount, int hostCount, int timeSlotsPerHost) {
        String hashedPassword = passwordEncoder.encode(DUMMY_PASSWORD);
        List<Member> guests = new ArrayList<>();
        List<Member> hosts = new ArrayList<>();
        List<TimeSlot> timeSlots = new ArrayList<>();

        // 게스트 생성
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

        // 호스트 생성 + Calendar + TimeSlot
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

            // Calendar 생성
            Calendar calendar = Calendar.create(
                host.getId(),
                List.of("커피챗", "멘토링", "네트워킹"),
                "더미 호스트 " + (i + 1) + "의 캘린더입니다.",
                "dummy-calendar-id-" + host.getId()
            );
            calendarRepository.save(calendar);

            // TimeSlot 생성
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

        return new GeneratedData(guests.size(), hosts.size(), timeSlots.size());
    }

    /**
     * 더미 데이터 삭제 (DUMMY_PREFIX로 시작하는 데이터)
     */
    @Transactional
    public void clear() {
        List<Member> dummyMembers = memberRepository.findAll().stream()
            .filter(m -> m.getUsername().startsWith(DUMMY_PREFIX))
            .toList();

        for (Member member : dummyMembers) {
            timeSlotRepository.findByUserIdOrderByStartTimeAsc(member.getId())
                .forEach(timeSlotRepository::delete);

            calendarRepository.findByUserId(member.getId())
                .ifPresent(calendarRepository::delete);

            memberRepository.delete(member);
        }
    }

    public record GeneratedData(int guestCount, int hostCount, int timeSlotCount) {}
}
