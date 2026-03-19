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
2026-03-12 10:30:45.101 [550e8400-e29b-41d4-a716-446655440000] WARN  com.coDevs.cohiChat.global.observability.SlowQueryLoggingListener - [slowquery] [SLOW] context=request datasource=cohichat-datasource durationMs=214 thresholdMs=100 queryCount=1 statementType=Prepared query="select ..."
2026-03-12 10:30:45.123 [550e8400-e29b-41d4-a716-446655440000] WARN  com.coDevs.cohiChat.global.exception.GlobalExceptionHandler - [context] [FAIL] context=request method=POST path=/api/members/v1/login status=404 code=USER_NOT_FOUND
2026-03-12 10:30:45.124 [550e8400-e29b-41d4-a716-446655440000] WARN  com.coDevs.cohiChat.global.observability.HttpLoggingFilter - [http] [FAIL] context=request method=POST path=/api/members/v1/login status=404 durationMs=231
```

- Prefix every structured observability log message with `[action] [status]`
- Use the same `request-id` across `slowquery`, `context`, and `http` logs for a single request
- Add `context=<request|async|integration|system>` in details for cross-cutting logs
- `request-id` is the only request-scoped MDC field
- `request-id` uses a server-generated UUID; for other log fields prefer safe identifiers such as `bookingId` and avoid email, IP, token, calendar ID

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
- Context: request-boundary failures and internal exception context logs
- HTTP: one access log per request with method, path, status, duration
- Slow query: warn when SQL latency crosses threshold, keeping the same `request-id` when present

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
