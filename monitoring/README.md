# Cohi-Chat 모니터링 환경

Prometheus와 Grafana를 사용한 애플리케이션 메트릭 모니터링 환경입니다.

## 아키텍처

```
┌─────────────┐     scrape      ┌─────────────┐     query      ┌─────────────┐
│   Backend   │ ───────────────▶│  Prometheus │◀───────────────│   Grafana   │
│  (Actuator) │   /actuator/    │   :9090     │                │   :3001     │
│   :8080     │   prometheus    │             │                │             │
└─────────────┘                 └─────────────┘                └─────────────┘
```

## 실행 방법

### 전체 스택 실행
```bash
docker-compose up -d backend prometheus grafana
```

### 개별 서비스 실행
```bash
# Prometheus만
docker-compose up -d prometheus

# Grafana만 (Prometheus 의존)
docker-compose up -d grafana
```

## 접속 URL

| 서비스 | URL | 인증 정보 |
|--------|-----|-----------|
| Prometheus | http://localhost:9090 | 없음 |
| Grafana | http://localhost:3001 | admin / admin |
| Backend Metrics | http://localhost:8080/api/actuator/prometheus | 없음 |

## 주요 메트릭

### JVM 메트릭
- `jvm_memory_used_bytes` - JVM 메모리 사용량
- `jvm_threads_live_threads` - 활성 스레드 수
- `jvm_gc_pause_seconds` - GC 일시정지 시간

### HTTP 메트릭
- `http_server_requests_seconds_count` - 요청 수
- `http_server_requests_seconds_sum` - 총 응답 시간
- `http_server_requests_seconds_bucket` - 응답 시간 분포 (히스토그램)

### HikariCP 메트릭
- `hikaricp_connections_active` - 활성 DB 연결 수
- `hikaricp_connections_idle` - 유휴 DB 연결 수
- `hikaricp_connections_pending` - 대기 중인 연결 요청 수

## Grafana 대시보드

기본 대시보드가 자동으로 프로비저닝됩니다:
- **Cohi-Chat Application Metrics**: JVM, HTTP, DB 연결 풀 메트릭

### 대시보드 패널
1. **JVM Metrics**
   - Heap Memory Used
   - JVM Threads
   - GC Pause Time

2. **HTTP Metrics**
   - Request Rate (per URI)
   - Response Time Percentiles (p50, p95, p99)
   - Error Rate (4xx, 5xx)

3. **Database Connection Pool**
   - HikariCP Connections (Active, Idle, Pending)
   - Connection Acquire Time

## 로컬 개발 시 메트릭 확인

```bash
# Backend 실행
cd backend && ./gradlew bootRun

# 메트릭 확인
curl http://localhost:8080/api/actuator/prometheus

# 특정 메트릭 검색
curl http://localhost:8080/api/actuator/prometheus | grep jvm_memory
```

## 디렉토리 구조

```
monitoring/
├── prometheus/
│   └── prometheus.yml          # Prometheus 설정
├── grafana/
│   └── provisioning/
│       ├── datasources/
│       │   └── datasource.yml  # Prometheus 데이터소스 설정
│       └── dashboards/
│           ├── dashboard.yml   # 대시보드 프로비저닝 설정
│           └── cohi-chat-dashboard.json  # 기본 대시보드
└── README.md
```

## 설정 커스터마이징

### Prometheus scrape 간격 변경
`monitoring/prometheus/prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'cohi-chat-backend'
    scrape_interval: 10s  # 기본값: 10초
```

### 새 대시보드 추가
`monitoring/grafana/provisioning/dashboards/` 디렉토리에 JSON 파일을 추가하면 자동으로 로드됩니다.

## 참고 문서

- [Spring Boot Actuator 문서](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Micrometer Prometheus 가이드](https://micrometer.io/docs/registry/prometheus)
- [Grafana 프로비저닝 문서](https://grafana.com/docs/grafana/latest/administration/provisioning/)
