# ELK 스택 테스트 가이드

Cohi-Chat 애플리케이션의 ELK(Elasticsearch, Logstash, Kibana) 로그 수집 환경을 테스트하는 가이드입니다.

## 아키텍처

```
┌─────────────┐     TCP:5000    ┌─────────────┐     HTTP:9200   ┌─────────────┐
│   Backend   │ ───────────────▶│  Logstash   │ ───────────────▶│Elasticsearch│
│  (Logback)  │   JSON Logs     │   :5000     │   Index Logs    │   :9200     │
└─────────────┘                 └─────────────┘                 └─────────────┘
                                                                       │
                                                                       │ Query
                                                                       ▼
                                                                ┌─────────────┐
                                                                │   Kibana    │
                                                                │   :5601     │
                                                                └─────────────┘
```

## 1. ELK 스택 실행

### 전체 스택 실행
```bash
docker-compose up -d elasticsearch logstash kibana
```

### 상태 확인
```bash
# 컨테이너 상태
docker-compose ps

# Elasticsearch 클러스터 상태
curl http://localhost:9200/_cluster/health?pretty

# Logstash 상태
curl http://localhost:9600/_node/stats?pretty
```

## 2. ILM 정책 초기화

Elasticsearch에서 Index Lifecycle Management(ILM) 정책을 설정합니다.

```bash
# Windows (Git Bash 또는 WSL)
cd elk/elasticsearch
chmod +x setup-ilm.sh
./setup-ilm.sh

# 또는 직접 curl 실행
curl -X GET "http://localhost:9200/_ilm/policy/cohi-chat-logs-policy?pretty"
```

### ILM 정책 구조
| Phase | 기간 | 동작 |
|-------|------|------|
| Hot | 0-7일 | 쓰기 허용, Rollover (1일/5GB/1M docs) |
| Warm | 7-30일 | 읽기 전용 |
| Cold | 30-90일 | 낮은 우선순위 |
| Delete | 90일 이후 | 인덱스 삭제 |

## 3. Backend 로그 수집 테스트

### Backend 실행 (Docker)
```bash
docker-compose up -d backend
```

### Backend 실행 (로컬)
```bash
cd backend
./gradlew bootRun
```

> **참고**: 로컬 실행 시 `logback-spring.xml`의 Logstash 호스트가 `localhost`인지 확인하세요.

### 로그 생성 테스트
```bash
# 로그인 시도 (로그 생성)
curl -X POST http://localhost:8080/api/members/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'

# 회원가입 시도
curl -X POST http://localhost:8080/api/members/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123", "email": "test@example.com"}'

# 에러 로그 생성 (잘못된 요청)
curl -X GET http://localhost:8080/api/invalid-endpoint
```

## 4. Kibana 설정

### 4.1 Kibana 접속
브라우저에서 http://localhost:5601 접속

### 4.2 Data View (인덱스 패턴) 생성

1. **Stack Management** 메뉴로 이동
   - 좌측 사이드바 하단 → "Stack Management"

2. **Data Views** 클릭
   - Kibana → Data Views

3. **Create data view** 클릭
   - Name: `cohi-chat-logs`
   - Index pattern: `cohi-chat-logs-*`
   - Timestamp field: `@timestamp`
   - Save data view

### 4.3 로그 확인

1. **Discover** 메뉴로 이동
2. Data view에서 `cohi-chat-logs` 선택
3. 시간 범위를 "Last 15 minutes"로 설정

## 5. 로그 검증

### Elasticsearch에서 직접 확인
```bash
# 인덱스 목록
curl http://localhost:9200/_cat/indices?v | grep cohi-chat

# 최근 로그 조회
curl "http://localhost:9200/cohi-chat-logs-*/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 5,
    "sort": [{"@timestamp": "desc"}],
    "query": {"match_all": {}}
  }'

# 에러 로그만 조회
curl "http://localhost:9200/cohi-chat-logs-*/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 10,
    "query": {"match": {"level": "ERROR"}}
  }'
```

### 로그 필드 확인
```bash
curl "http://localhost:9200/cohi-chat-logs-*/_mapping?pretty"
```

## 6. 문제 해결

### 로그가 수집되지 않는 경우

1. **Logstash 연결 확인**
   ```bash
   # Logstash 포트 확인
   docker-compose logs logstash | tail -20

   # TCP 연결 테스트
   nc -zv localhost 5000
   ```

2. **Backend 로그 설정 확인**
   ```bash
   # logback-spring.xml 확인
   cat backend/src/main/resources/logback-spring.xml
   ```

3. **Elasticsearch 상태 확인**
   ```bash
   curl http://localhost:9200/_cluster/health?pretty
   ```

### 인덱스가 생성되지 않는 경우

1. **인덱스 템플릿 확인**
   ```bash
   curl http://localhost:9200/_index_template/cohi-chat-logs-template?pretty
   ```

2. **ILM 정책 재설정**
   ```bash
   ./elk/elasticsearch/setup-ilm.sh
   ```

### Kibana에서 데이터가 보이지 않는 경우

1. 시간 범위를 "Last 7 days"로 확장
2. Data view의 인덱스 패턴이 `cohi-chat-logs-*`인지 확인
3. Refresh 버튼 클릭

### 메모리 부족 오류

```bash
# Elasticsearch 메모리 설정 확인 (docker-compose.yml)
ES_JAVA_OPTS=-Xms512m -Xmx512m

# 호스트 메모리 확인
free -h  # Linux
```

## 7. 유용한 Kibana 쿼리 (KQL)

```
# 특정 로그 레벨
level: "ERROR"

# 특정 로거
logger: "com.coDevs.cohiChat.member.*"

# 메시지 검색
message: *exception*

# 복합 쿼리
level: "ERROR" and logger: *security*

# 시간 범위 + 조건
level: ("ERROR" or "WARN") and NOT message: *health*
```

## 8. 로그 보존 정책

- **Hot phase**: 최근 7일 (읽기/쓰기 가능)
- **Warm phase**: 7-30일 (읽기 전용)
- **Cold phase**: 30-90일 (읽기 전용, 낮은 우선순위)
- **Delete phase**: 90일 이후 자동 삭제

정책 변경이 필요한 경우 `elk/elasticsearch/setup-ilm.sh`를 수정하고 재실행하세요.

## 관련 파일

| 파일 | 설명 |
|------|------|
| `backend/src/main/resources/logback-spring.xml` | Logback 설정 (Logstash Appender) |
| `elk/logstash/pipeline/logstash.conf` | Logstash 파이프라인 설정 |
| `elk/logstash/config/logstash.yml` | Logstash 기본 설정 |
| `elk/elasticsearch/setup-ilm.sh` | ILM 정책 및 인덱스 템플릿 설정 |
| `docker-compose.yml` | ELK 서비스 정의 |
