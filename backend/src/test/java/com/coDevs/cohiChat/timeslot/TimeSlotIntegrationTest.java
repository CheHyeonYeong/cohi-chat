package com.coDevs.cohiChat.timeslot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;
import com.coDevs.cohiChat.timeslot.response.TimeSlotResponseDTO;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TimeSlotIntegrationTest {

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private CalendarRepository calendarRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private TimeSlotService timeSlotService;

    private UUID hostId;

    @BeforeEach
    void setUp() {
        Member host = Member.create(
            "testhost",
            "Test Host",
            "host@test.com",
            "encodedPassword",
            Role.HOST
        );
        Member savedHost = memberRepository.save(host);
        hostId = savedHost.getId();

        Calendar calendar = Calendar.create(
            hostId,
            List.of("커리어 상담"),
            "게스트에게 보여줄 설명입니다.",
            "test@group.calendar.google.com"
        );
        calendarRepository.save(calendar);
    }

    @Test
    @DisplayName("통합 테스트: 타임슬롯 생성 및 조회 전체 흐름")
    void createAndRetrieveTimeSlotFlow() {
        // given - 타임슬롯 생성
        TimeSlot timeSlot = TimeSlot.create(
            hostId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );

        // when - 저장
        TimeSlot savedTimeSlot = timeSlotRepository.save(timeSlot);

        // then - 조회 확인
        assertThat(savedTimeSlot.getId()).isNotNull();
        assertThat(savedTimeSlot.getUserId()).isEqualTo(hostId);
        assertThat(savedTimeSlot.getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(savedTimeSlot.getEndTime()).isEqualTo(LocalTime.of(11, 0));
        assertThat(savedTimeSlot.getWeekdays()).containsExactlyInAnyOrder(0, 1, 2);
        assertThat(savedTimeSlot.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("통합 테스트: 여러 타임슬롯 생성 후 목록 조회 - startTime 오름차순 정렬")
    void createMultipleTimeSlotsAndRetrieve() {
        // given - 순서를 섞어서 저장
        TimeSlot timeSlot16 = TimeSlot.create(
            hostId,
            LocalTime.of(16, 0),
            LocalTime.of(17, 0),
            List.of(2, 3)
        );
        TimeSlot timeSlot10 = TimeSlot.create(
            hostId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0)
        );
        TimeSlot timeSlot14 = TimeSlot.create(
            hostId,
            LocalTime.of(14, 0),
            LocalTime.of(15, 0),
            List.of(1)
        );

        timeSlotRepository.saveAll(List.of(timeSlot16, timeSlot10, timeSlot14));

        // when
        List<TimeSlot> foundTimeSlots = timeSlotRepository.findByUserIdOrderByStartTimeAsc(hostId);

        // then - startTime 오름차순 정렬 확인
        assertThat(foundTimeSlots).hasSize(3);
        assertThat(foundTimeSlots.get(0).getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(foundTimeSlots.get(1).getStartTime()).isEqualTo(LocalTime.of(14, 0));
        assertThat(foundTimeSlots.get(2).getStartTime()).isEqualTo(LocalTime.of(16, 0));
    }

    @Test
    @DisplayName("통합 테스트: 시간과 요일 모두 중복되는 타임슬롯 검증 쿼리")
    void overlappingTimeSlotQuery() {
        // given - 기존 타임슬롯: 10:00-11:00, 월화수(0,1,2)
        TimeSlot existingTimeSlot = TimeSlot.create(
            hostId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );
        timeSlotRepository.save(existingTimeSlot);

        // when - 겹치는 시간대 + 요일 조회 (10:30-11:30, 월요일)
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            hostId,
            LocalTime.of(10, 30),
            LocalTime.of(11, 30),
            List.of(0)
        );

        // then
        assertThat(overlapping).hasSize(1);
        assertThat(overlapping.get(0).getId()).isEqualTo(existingTimeSlot.getId());
    }

    @Test
    @DisplayName("통합 테스트: 시간이 겹쳐도 요일이 다르면 조회되지 않음")
    void noOverlapWhenDifferentWeekdays() {
        // given - 기존 타임슬롯: 10:00-11:00, 월화수(0,1,2)
        TimeSlot existingTimeSlot = TimeSlot.create(
            hostId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );
        timeSlotRepository.save(existingTimeSlot);

        // when - 같은 시간대지만 다른 요일 (목,금)
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            hostId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(3, 4)
        );

        // then
        assertThat(overlapping).isEmpty();
    }

    @Test
    @DisplayName("통합 테스트: 겹치지 않는 시간대는 조회되지 않음")
    void nonOverlappingTimeSlotQuery() {
        // given - 기존 타임슬롯: 10:00-11:00
        TimeSlot existingTimeSlot = TimeSlot.create(
            hostId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );
        timeSlotRepository.save(existingTimeSlot);

        // when - 겹치지 않는 시간대 조회 (11:00-12:00)
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingTimeSlots(
            hostId,
            LocalTime.of(11, 0),
            LocalTime.of(12, 0),
            List.of(0, 1, 2)
        );

        // then
        assertThat(overlapping).isEmpty();
    }

    @Test
    @DisplayName("통합 테스트: 호스트 ID로 타임슬롯 조회 성공")
    void getTimeSlotsByHostIdSuccess() {
        // given
        TimeSlot timeSlot1 = TimeSlot.create(
            hostId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2)
        );
        TimeSlot timeSlot2 = TimeSlot.create(
            hostId,
            LocalTime.of(14, 0),
            LocalTime.of(15, 0),
            List.of(3, 4)
        );
        timeSlotRepository.saveAll(List.of(timeSlot1, timeSlot2));

        // when
        List<TimeSlotResponseDTO> result = timeSlotService.getTimeSlotsByHostId(hostId);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(result.get(1).getStartTime()).isEqualTo(LocalTime.of(14, 0));
    }

    @Test
    @DisplayName("통합 테스트: 호스트 ID로 조회 시 타임슬롯이 없으면 빈 목록 반환")
    void getTimeSlotsByHostIdEmpty() {
        // when
        List<TimeSlotResponseDTO> result = timeSlotService.getTimeSlotsByHostId(hostId);

        // then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("통합 테스트: 존재하지 않는 호스트 ID로 조회 시 HOST_NOT_FOUND 예외")
    void getTimeSlotsByHostIdHostNotFound() {
        // given
        UUID nonExistentHostId = UUID.randomUUID();

        // when & then
        assertThatThrownBy(() -> timeSlotService.getTimeSlotsByHostId(nonExistentHostId))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.HOST_NOT_FOUND);
    }

    @Test
    @DisplayName("통합 테스트: 호스트는 존재하지만 캘린더가 없으면 CALENDAR_NOT_FOUND 예외")
    void getTimeSlotsByHostIdCalendarNotFound() {
        // given
        Member hostWithoutCalendar = Member.create(
            "hostwithoutcalendar",
            "No Calendar Host",
            "nocal@test.com",
            "encodedPassword",
            Role.HOST
        );
        Member savedHost = memberRepository.save(hostWithoutCalendar);

        // when & then
        assertThatThrownBy(() -> timeSlotService.getTimeSlotsByHostId(savedHost.getId()))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CALENDAR_NOT_FOUND);
    }
}
