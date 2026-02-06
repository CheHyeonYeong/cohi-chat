package com.coDevs.cohiChat.google.calendar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.Calendar.Events;
import com.google.api.services.calendar.model.Event;

class GoogleCalendarServiceTest {

    private GoogleCalendarService googleCalendarService;
    private Calendar mockCalendar;
    private Events mockEvents;

    private static final String TEST_CALENDAR_ID = "test-calendar-id";
    private static final String TEST_TIMEZONE = "Asia/Seoul";

    @BeforeEach
    void setUp() {
        mockCalendar = mock(Calendar.class);
        mockEvents = mock(Events.class);
        when(mockCalendar.events()).thenReturn(mockEvents);

        GoogleCalendarProperties properties = new GoogleCalendarProperties();
        properties.setDefaultCalendarId(TEST_CALENDAR_ID);
        properties.setTimezone(TEST_TIMEZONE);

        googleCalendarService = new GoogleCalendarService(mockCalendar, properties);
    }

    @Nested
    @DisplayName("createEvent 메서드")
    class CreateEventTest {

        @Test
        @DisplayName("이벤트 생성 성공 시 이벤트 ID를 반환한다")
        void createEvent_success() throws Exception {
            // given
            Instant startDateTime = toInstant(2025, 1, 20, 10, 0);
            Instant endDateTime = toInstant(2025, 1, 20, 11, 0);
            String summary = "테스트 미팅";
            String description = "테스트 설명";

            Event createdEvent = new Event();
            createdEvent.setId("created-event-id");
            createdEvent.setHtmlLink("https://calendar.google.com/event/123");

            Events.Insert mockInsert = mock(Events.Insert.class);
            when(mockEvents.insert(anyString(), any(Event.class))).thenReturn(mockInsert);
            when(mockInsert.setConferenceDataVersion(1)).thenReturn(mockInsert);
            when(mockInsert.execute()).thenReturn(createdEvent);

            // when
            String eventId = googleCalendarService.createEvent(
                summary,
                description,
                startDateTime,
                endDateTime,
                null
            );

            // then
            assertThat(eventId).isEqualTo("created-event-id");
            verify(mockEvents).insert(anyString(), any(Event.class));
        }

        @Test
        @DisplayName("특정 캘린더 ID로 이벤트를 생성한다")
        void createEvent_withSpecificCalendarId() throws Exception {
            // given
            String specificCalendarId = "specific-calendar-id";
            Instant startDateTime = toInstant(2025, 1, 20, 10, 0);
            Instant endDateTime = toInstant(2025, 1, 20, 11, 0);

            Event createdEvent = new Event();
            createdEvent.setId("event-id");
            createdEvent.setHtmlLink("https://calendar.google.com/event/123");

            Events.Insert mockInsert = mock(Events.Insert.class);
            when(mockEvents.insert(anyString(), any(Event.class))).thenReturn(mockInsert);
            when(mockInsert.setConferenceDataVersion(1)).thenReturn(mockInsert);
            when(mockInsert.execute()).thenReturn(createdEvent);

            // when
            googleCalendarService.createEvent(
                "테스트",
                "설명",
                startDateTime,
                endDateTime,
                specificCalendarId
            );

            // then
            verify(mockEvents).insert(anyString(), any(Event.class));
        }
    }

    @Nested
    @DisplayName("updateEvent 메서드")
    class UpdateEventTest {

        @Test
        @DisplayName("이벤트 수정 성공 시 true를 반환한다")
        void updateEvent_success() throws Exception {
            // given
            String eventId = "event-id";
            Instant startDateTime = toInstant(2025, 1, 21, 14, 0);
            Instant endDateTime = toInstant(2025, 1, 21, 15, 0);

            Event updatedEvent = new Event();
            updatedEvent.setId(eventId);

            Events.Update mockUpdate = mock(Events.Update.class);
            when(mockEvents.update(anyString(), anyString(), any(Event.class))).thenReturn(mockUpdate);
            when(mockUpdate.execute()).thenReturn(updatedEvent);

            // when
            boolean result = googleCalendarService.updateEvent(
                eventId,
                "수정된 미팅",
                "수정된 설명",
                startDateTime,
                endDateTime,
                null
            );

            // then
            assertThat(result).isTrue();
            verify(mockEvents).update(anyString(), anyString(), any(Event.class));
        }
    }

    @Nested
    @DisplayName("deleteEvent 메서드")
    class DeleteEventTest {

        @Test
        @DisplayName("이벤트 삭제 성공 시 true를 반환한다")
        void deleteEvent_success() throws Exception {
            // given
            String eventId = "event-to-delete";

            Events.Delete mockDelete = mock(Events.Delete.class);
            when(mockEvents.delete(anyString(), anyString())).thenReturn(mockDelete);

            // when
            boolean result = googleCalendarService.deleteEvent(eventId, null);

            // then
            assertThat(result).isTrue();
            verify(mockEvents).delete(anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("getEvent 메서드")
    class GetEventTest {

        @Test
        @DisplayName("이벤트 조회 성공 시 Event 객체를 반환한다")
        void getEvent_success() throws Exception {
            // given
            String eventId = "existing-event";
            Event event = new Event();
            event.setId(eventId);
            event.setSummary("기존 미팅");

            Events.Get mockGet = mock(Events.Get.class);
            when(mockEvents.get(anyString(), anyString())).thenReturn(mockGet);
            when(mockGet.execute()).thenReturn(event);

            // when
            Event result = googleCalendarService.getEvent(eventId, null);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(eventId);
            assertThat(result.getSummary()).isEqualTo("기존 미팅");
        }
    }

    @Nested
    @DisplayName("서비스가 비활성화된 경우")
    class DisabledServiceTest {

        @Test
        @DisplayName("Calendar가 null이면 createEvent는 null을 반환한다")
        void createEvent_whenDisabled_returnsNull() {
            // given
            GoogleCalendarProperties properties = new GoogleCalendarProperties();
            GoogleCalendarService disabledService = new GoogleCalendarService(null, properties);

            // when
            String result = disabledService.createEvent(
                "테스트",
                "설명",
                Instant.now(),
                Instant.now().plus(Duration.ofHours(1)),
                null
            );

            // then
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Calendar가 null이면 updateEvent는 false를 반환한다")
        void updateEvent_whenDisabled_returnsFalse() {
            // given
            GoogleCalendarProperties properties = new GoogleCalendarProperties();
            GoogleCalendarService disabledService = new GoogleCalendarService(null, properties);

            // when
            boolean result = disabledService.updateEvent(
                "event-id",
                "테스트",
                "설명",
                Instant.now(),
                Instant.now().plus(Duration.ofHours(1)),
                null
            );

            // then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Calendar가 null이면 deleteEvent는 false를 반환한다")
        void deleteEvent_whenDisabled_returnsFalse() {
            // given
            GoogleCalendarProperties properties = new GoogleCalendarProperties();
            GoogleCalendarService disabledService = new GoogleCalendarService(null, properties);

            // when
            boolean result = disabledService.deleteEvent("event-id", null);

            // then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Calendar가 null이면 getEvent는 null을 반환한다")
        void getEvent_whenDisabled_returnsNull() {
            // given
            GoogleCalendarProperties properties = new GoogleCalendarProperties();
            GoogleCalendarService disabledService = new GoogleCalendarService(null, properties);

            // when
            Event result = disabledService.getEvent("event-id", null);

            // then
            assertThat(result).isNull();
        }
    }

    private static Instant toInstant(int year, int month, int day, int hour, int minute) {
        return LocalDate.of(year, month, day)
            .atTime(LocalTime.of(hour, minute))
            .atZone(ZoneId.of("Asia/Seoul"))
            .toInstant();
    }
}
