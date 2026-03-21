package com.coDevs.cohiChat.calendar;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CalendarRepositoryTest {

    @Autowired
    private CalendarRepository calendarRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Member member;
    private Calendar savedCalendar;

    @BeforeEach
    void setUp() {
        member = Member.create(
            "testuser",
            "테스트유저",
            "test@example.com",
            "hashedPassword123",
            Role.HOST
        );
        entityManager.persist(member);
        entityManager.flush();

        Calendar calendar = Calendar.create(
            member,
            List.of("커리어 상담", "이력서 리뷰"),
            "게스트에게 보여줄 설명입니다.",
            "test@group.calendar.google.com"
        );
        savedCalendar = calendarRepository.save(calendar);
    }

    @Test
    @DisplayName("성공: 캘린더 저장 및 ID로 조회")
    void saveAndFindCalendar() {
        // when
        Optional<Calendar> found = calendarRepository.findById(savedCalendar.getId());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getUserId()).isEqualTo(member.getId());
        assertThat(found.get().getTopics()).containsExactly("커리어 상담", "이력서 리뷰");
    }

    @Test
    @DisplayName("성공: memberId로 캘린더 조회")
    void findByMemberId() {
        // when
        Optional<Calendar> found = calendarRepository.findByMemberId(member.getId());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(savedCalendar.getId());
        assertThat(found.get().getMember().getId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("성공: 존재하지 않는 memberId로 조회 시 빈 Optional 반환")
    void findByMemberIdNotFound() {
        // when
        Optional<Calendar> found = calendarRepository.findByMemberId(UUID.randomUUID());

        // then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: memberId로 캘린더 존재 여부 확인 - 존재함")
    void existsByMemberIdTrue() {
        // when
        boolean exists = calendarRepository.existsByMemberId(member.getId());

        // then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("성공: memberId로 캘린더 존재 여부 확인 - 존재하지 않음")
    void existsByMemberIdFalse() {
        // when
        boolean exists = calendarRepository.existsByMemberId(UUID.randomUUID());

        // then
        assertThat(exists).isFalse();
    }
}
