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

import com.coDevs.cohiChat.calendar.entity.Calendar;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CalendarRepositoryTest {

    @Autowired
    private CalendarRepository calendarRepository;

    private UUID userId;
    private Calendar savedCalendar;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        Calendar calendar = Calendar.create(
            userId,
            List.of("커리어 상담", "이력서 리뷰"),
            "게스트에게 보여줄 설명입니다.",
            "test@group.calendar.google.com"
        );
        savedCalendar = calendarRepository.save(calendar);
    }

    @Test
    @DisplayName("성공: 캘린더 저장 및 조회")
    void saveAndFindCalendar() {
        // when
        Optional<Calendar> found = calendarRepository.findById(savedCalendar.getUserId());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getUserId()).isEqualTo(userId);
        assertThat(found.get().getTopics()).containsExactly("커리어 상담", "이력서 리뷰");
    }

    @Test
    @DisplayName("성공: userId로 캘린더 조회")
    void findByUserId() {
        // when
        Optional<Calendar> found = calendarRepository.findByUserId(userId);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getUserId()).isEqualTo(savedCalendar.getUserId());
    }

    @Test
    @DisplayName("성공: 존재하지 않는 userId로 조회 시 빈 Optional 반환")
    void findByUserIdNotFound() {
        // when
        Optional<Calendar> found = calendarRepository.findByUserId(UUID.randomUUID());

        // then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: userId로 캘린더 존재 여부 확인 - 존재함")
    void existsByUserIdTrue() {
        // when
        boolean exists = calendarRepository.existsByUserId(userId);

        // then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("성공: userId로 캘린더 존재 여부 확인 - 존재하지 않음")
    void existsByUserIdFalse() {
        // when
        boolean exists = calendarRepository.existsByUserId(UUID.randomUUID());

        // then
        assertThat(exists).isFalse();
    }
}
