package com.coDevs.cohiChat.global.analytics;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.posthog.java.PostHog;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    @Nullable
    private final PostHog postHog;

    public void capture(String distinctId, String event, Map<String, Object> properties) {
        if (postHog == null) {
            return;
        }
        try {
            postHog.capture(distinctId, event, properties);
        } catch (Exception e) {
            log.warn("[analytics] [FAIL] event={} error={}", event, e.getMessage());
        }
    }

    public void trackSignup(UUID memberId, String provider, String role) {
        Map<String, Object> properties = new HashMap<>();
        properties.put("provider", provider);
        properties.put("role", role);
        capture(memberId.toString(), "member signed up", properties);
    }

    public void trackLogin(UUID memberId, String provider) {
        Map<String, Object> properties = new HashMap<>();
        properties.put("provider", provider);
        capture(memberId.toString(), "member logged in", properties);
    }

    public void trackBookingCreated(UUID guestId, UUID hostId, LocalDate bookingDate, String topic) {
        Map<String, Object> properties = new HashMap<>();
        properties.put("hostId", hostId.toString());
        properties.put("bookingDate", bookingDate.toString());
        properties.put("topic", topic);
        capture(guestId.toString(), "booking created", properties);
    }

    public void trackBookingCancelled(UUID guestId, Long bookingId) {
        Map<String, Object> properties = new HashMap<>();
        properties.put("bookingId", bookingId);
        capture(guestId.toString(), "booking cancelled", properties);
    }

    public void trackBookingStatusChanged(UUID hostId, Long bookingId, AttendanceStatus status) {
        Map<String, Object> properties = new HashMap<>();
        properties.put("bookingId", bookingId);
        properties.put("status", status.name());
        capture(hostId.toString(), "booking status changed", properties);
    }

    public void trackHostNoShowReported(UUID guestId, UUID hostId, Long bookingId) {
        Map<String, Object> properties = new HashMap<>();
        properties.put("hostId", hostId.toString());
        properties.put("bookingId", bookingId);
        capture(guestId.toString(), "host no show reported", properties);
    }
}
