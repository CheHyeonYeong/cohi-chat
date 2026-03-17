# 운영 관측성 안내사항

이 문서는 운영 관측성 구성의 목적, 현재 구현 상태, 검증 결과를 정리한 문서다.
로그 포맷 규칙 자체는 [observability-logging-standard.md](./observability-logging-standard.md)를 따른다.

## 1. 왜 하는가

- 요청 하나를 `request-id`로 끝까지 추적할 수 있어야 한다.
- Google Calendar 같은 외부 연동 실패를 운영 로그에서 빠르게 찾을 수 있어야 한다.
- 단순 서버 로그 적재가 아니라, 실제 운영에 필요한 이벤트만 남겨야 한다.
- 이후 대시보드와 운영 분석까지 연결할 수 있는 수집 경로를 미리 고정하려는 목적이 있다.

## 2. 현재 파이프라인

현재 로컬 기준 수집 경로는 아래와 같다.

```text
backend stdout
-> Docker fluentd log driver
-> Fluent Bit
-> Vector
-> PostHog
-> Grafana
```

조금 더 풀어서 쓰면 다음과 같다.

```text
Spring Boot stdout
-> Docker fluentd log driver
-> Fluent Bit 수집
-> Vector 가공/전달
-> PostHog 적재
-> Grafana 조회
```

현재 구현은 애플리케이션 log file을 만들지 않고 `stdout` 단일 경로를 기준으로 한다.

## 3. 각 구성요소 역할

### Spring Boot

- 애플리케이션 로그의 원천이다.
- `RequestIdFilter`가 `request-id`를 MDC에 넣고 `X-Request-ID` 응답 헤더에 함께 내려준다.
- `HttpLoggingFilter`가 요청 단위 `http` 로그를 남긴다.
- `GlobalExceptionHandler`가 요청 처리 실패를 `context` 로그로 남긴다.
- `SlowQueryLoggingListener`가 느린 SQL을 `slowquery` 로그로 남긴다.

### MDC란 무엇인가

- `MDC`는 `Mapped Diagnostic Context`의 약자다.
- 요청 단위 공통 값을 저장해 두었다가 같은 요청에서 발생한 로그에 자동으로 붙이기 위한 컨텍스트다.
- 여기서는 `request-id`를 MDC에 넣어 같은 요청의 `context`, `http`, `slowquery` 로그를 묶는 용도로 사용한다.

### Fluent Bit

- Docker fluentd logging driver가 전달한 backend container stdout을 수집한다.
- 애플리케이션이 직접 분석 서비스에 붙지 않도록 수집 계층 역할을 맡는다.
- 현재는 가볍게 stdout 로그를 받아 Vector로 전달하는 역할에 집중한다.

### Vector

- Fluent Bit가 보낸 텍스트 로그를 파싱한다.
- `action`, `status`, `context`, `request_id`, `details` 같은 필드를 추출해 PostHog 이벤트로 변환한다.
- 이후 목적지가 늘어나면 중간 가공/분기 계층으로 확장할 수 있다.

### PostHog

- `backend_log` 이벤트를 저장하고 조회하는 저장소 역할을 맡는다.
- 운영 로그를 이벤트 형태로 적재해 필터링과 질의를 가능하게 한다.

### Grafana

- PostHog Query API를 통해 적재된 이벤트를 대시보드로 조회한다.
- 현재는 `Total Logs`, `Context Distribution`, `Level Distribution`, `Top Event / Status`, `Latest Request / Fail / Slow Logs` 패널이 구성돼 있다.
- 현재 스택에는 Loki가 없으므로 Grafana `Drilldown > Logs`는 사용하지 않는다.

## 4. 현재 로그 기준

### 목표

- 하나의 백엔드 요청을 `request-id`로 추적
- Google Calendar 같은 외부 연동 실패를 빠르게 탐지
- 운영적으로 의미 있는 이벤트만 기록
- 백엔드 로그를 후속 분석 도구로 전달

### 비목표

- 백엔드에서 사용자 세션 추적까지 하지는 않음
- raw request/response body는 남기지 않음
- 애플리케이션 레벨에서 IP를 직접 남기지 않음
- 운영상 꼭 필요하지 않으면 PII를 로그 필드에 넣지 않음

### 로그 포맷 원칙

- 구조화된 관측성 로그는 `[action] [status]` 접두어를 사용한다.
- 요청 범위 식별자는 `request-id` 하나만 사용한다.
- `request-id`는 MDC를 통해 같은 요청의 로그에 일관되게 붙는다.
- 공통 관측성 로그는 `context=<request|async|integration|system>` 필드를 붙여 문맥을 구분한다.
- 안전한 식별자만 남기고 이메일, 토큰, IP, 캘린더 ID 같은 값은 직접 남기지 않는다.

### 현재 사용 중인 공통 로그 유형

- `http`: 요청 단위 access log
- `context`: 요청 처리 실패나 경계 이벤트
- `slowquery`: 임계값을 넘긴 SQL

예시는 다음과 같다.

```text
2026-03-15 01:18:31.106 [550e8400-e29b-41d4-a716-446655440000] WARN  com.coDevs.cohiChat.global.exception.GlobalExceptionHandler - [context] [FAIL] context=request method=POST path=/api/members/v1/login status=404 code=USER_NOT_FOUND
2026-03-15 01:18:31.137 [550e8400-e29b-41d4-a716-446655440000] WARN  com.coDevs.cohiChat.global.observability.HttpLoggingFilter - [http] [FAIL] context=request method=POST path=/api/members/v1/login status=404 durationMs=287
```

### 권장 레벨

- `ERROR`: 서버가 복구하지 못하는 실패
- `WARN`: 복구 가능 실패, 느린 요청, 느린 SQL, 느린 외부 호출
- `INFO`: 운영상 의미 있는 비즈니스 이벤트
- `DEBUG`: 로컬 디버깅용 로그

## 5. 현재 반영된 작업

- `Request ID`를 생성해 응답 헤더와 로그에 함께 남기는 구조
- `logback` 패턴에 `request-id` 출력 반영
- `logback`을 file appender 없이 stdout 단일 경로로 정리
- `GlobalExceptionHandler`를 `[context] [FAIL]` 형식으로 정리
- `HttpLoggingFilter`를 `[http] [SUCCESS|FAIL|SLOW]` 형식으로 정리
- 느린 SQL을 `[slowquery] [SLOW]` 형식으로 남기는 리스너 추가
- `Docker fluentd log driver -> Fluent Bit -> Vector -> PostHog -> Grafana` 수집 경로 구성
- Vector에서 `action`, `status`, `context`, `request_id`, `details` 추출
- Grafana에서 request 중심 패널 구성

## 6. 현재 기준 확인된 내용

- 애플리케이션 로그 출력은 file appender 없이 stdout 단일 경로로 정리했다.
- Fluent Bit는 file tail 대신 Docker fluentd logging driver에서 전달한 stdout을 수집하도록 변경했다.
- Vector 파싱 규칙은 기존 로그 포맷을 그대로 유지하고, Docker 로그의 trailing newline 정리만 추가했다.
- stdout 기반 전환 뒤 PostHog/Grafana end-to-end 재검증은 별도로 필요하다.

예시:

- `request_id=550e8400-e29b-41d4-a716-446655440000`
- `action=context`, `status=FAIL`
- `action=http`, `status=FAIL`

## 7. 아직 남은 검증 포인트

- stdout 기반 수집 경로가 실제 컨테이너 환경에서도 안정적으로 유지되는지 end-to-end 검증 필요
- `async`, `integration`, `system` 컨텍스트 로그를 더 넓게 적용할지 결정 필요
- 느린 SQL이 실제 트래픽에서 어떻게 보이는지 샘플 검증 필요
- Grafana 첫 화면에서 어떤 패널을 우선 지표로 둘지 정리 필요
- Google Calendar 실패, 예약/회원 이벤트, 느린 요청 중 무엇을 1차 모니터링 대상으로 둘지 기준 확정 필요

## 8. 정리

- 지금 단계의 핵심은 "로그를 많이 남기는 것"이 아니라 "운영에 필요한 이벤트를 일관된 기준으로 남기고 흘려보내는 것"이다.
- 현재 기준 역할 분리는 `Fluent Bit = 수집`, `Vector = 가공/전달`, `PostHog = 저장`, `Grafana = 조회`로 이해하면 된다.
- 현재 기준 수집 시작점은 backend log file이 아니라 backend stdout이다.
- 다음 단계는 로그 범위를 넓히는 것보다, 어떤 이벤트를 운영자가 먼저 봐야 하는지 우선순위를 더 명확히 하는 것이다.
