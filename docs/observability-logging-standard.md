# Observability Logging Standard

## Goals

- Trace a single backend request with `request-id`
- Detect external integration failures, especially Google Calendar sync issues
- Keep only high-signal business events in application logs
- Ship backend logs to PostHog through Fluent Bit and Vector

## Non-goals

- No user session tracking in backend logs
- No raw request or response body logging
- No IP address logging at the application layer
- No PII in log fields unless there is a hard operational need

## Log Format

```text
2026-03-12 10:30:45.123 [a1b2c3d4] INFO  com.coDevs.cohiChat.booking.BookingService - [createBooking] [SUCCESS] bookingId=123
2026-03-12 10:30:45.123 [a1b2c3d4] WARN  com.coDevs.cohiChat.google.calendar.GoogleCalendarService - [createEvent] [FAIL] durationMs=2145 cause=SocketTimeoutException
```

- Prefix every business or integration log message with `[action] [status]`
- `request-id` is the only request-scoped MDC field
- Prefer safe identifiers such as `bookingId`; avoid UUID, email, IP, token, calendar ID

## Levels

- `ERROR`: unrecoverable server-side failures
- `WARN`: recoverable failures, abnormal states, slow requests, slow external calls
- `INFO`: business events that matter in operations or analytics
- `DEBUG`: local debugging and skip/no-op states

## Event Scope

- Booking: created, cancelled, host no-show reported
- Member: signup success, login success/failure, withdrawal success
- Calendar: host calendar created, guest-to-host promotion
- Google Calendar: create/update/delete/access validation failures and slow calls
- HTTP: one access log per request with method, path, status, duration

## Pipeline

```text
Spring Boot stdout (text)
-> Fluent Bit
-> Vector
-> PostHog capture API
-> Grafana (PostHog Query API)
```

- PostHog credentials are injected at runtime through environment variables
- Required ingest variable: `POSTHOG_API_KEY`
- Grafana query secret: `POSTHOG_PERSONAL_API_KEY`
