# SQLite → Supabase PostgreSQL 마이그레이션

## 개요

기존 SQLite 데이터베이스를 Supabase PostgreSQL로 마이그레이션하는 작업입니다.

## 변경 사항

### 1. build.gradle

**삭제:**
```groovy
runtimeOnly 'org.xerial:sqlite-jdbc:3.45.2.0'
implementation 'org.hibernate.orm:hibernate-community-dialects'
```

**추가:**
```groovy
runtimeOnly 'org.postgresql:postgresql'
testRuntimeOnly 'com.h2database:h2'  // 테스트용
```

### 2. application.properties

**기존 (SQLite):**
```properties
spring.datasource.driver-class-name=org.sqlite.JDBC
spring.datasource.url=jdbc:sqlite:${SQLITE_DB_PATH:./cohi-chat.db}
spring.datasource.hikari.maximum-pool-size=1
spring.datasource.hikari.minimum-idle=1
spring.datasource.hikari.connection-init-sql=PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect
```

**변경 (Supabase PostgreSQL):**
```properties
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.url=jdbc:postgresql://${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT:5432}/${SUPABASE_DB_NAME:postgres}?sslmode=require
spring.datasource.username=${SUPABASE_DB_USER:postgres}
spring.datasource.password=${SUPABASE_DB_PASSWORD}
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

### 3. application-test.properties

**변경 (H2 PostgreSQL 호환 모드):**
```properties
spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
```

### 4. 엔티티 columnDefinition 변경

PostgreSQL은 `BINARY(16)` 타입을 지원하지 않으므로 `uuid`로 변경 필요:

| 파일 | 변경 |
|------|------|
| `Member.java` | `BINARY(16)` → `uuid` |
| `Booking.java` | `BINARY(16)` → `uuid` |
| `Calendar.java` | `BINARY(16)` → `uuid` |
| `TimeSlot.java` | `BINARY(16)` → `uuid` |

**예시:**
```java
// 기존
@Column(columnDefinition = "BINARY(16)")
private UUID id;

// 변경
@Column(columnDefinition = "uuid")
private UUID id;
```

## Supabase 연결 정보

### Direct Connection (IPv6 Only)
- Host: `db.{project-ref}.supabase.co`
- Port: `5432`
- User: `postgres`

### Session Pooler (IPv4 지원) - 권장
- Host: `aws-1-ap-northeast-2.pooler.supabase.com`
- Port: `5432`
- User: `postgres.{project-ref}`

> **주의:** IPv4 네트워크에서는 반드시 Session Pooler 사용

## AWS Secrets Manager 설정

다음 키들을 AWS Secrets Manager (`cohi-chat/prod`)에 추가/업데이트:

| Key | 설명 | 예시 값 |
|-----|------|--------|
| `SUPABASE_DB_HOST` | Pooler 호스트 | `aws-1-ap-northeast-2.pooler.supabase.com` |
| `SUPABASE_DB_PORT` | 포트 | `5432` |
| `SUPABASE_DB_NAME` | DB 이름 | `postgres` |
| `SUPABASE_DB_USER` | 사용자 (Pooler용) | `postgres.hdxyahklkeakxbvkdfte` |
| `SUPABASE_DB_PASSWORD` | DB 비밀번호 | (Supabase에서 설정한 값) |

## 로컬 개발 환경

### Redis 실행 (WSL)
```bash
wsl -e bash -c "redis-server --bind 0.0.0.0 --protected-mode no --daemonize yes"
```

### .env 파일 설정
```env
SUPABASE_DB_HOST=aws-1-ap-northeast-2.pooler.supabase.com
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.hdxyahklkeakxbvkdfte
SUPABASE_DB_PASSWORD=your_password
REDIS_HOST=localhost
```

## 테스트

```bash
cd backend
./gradlew build   # 빌드 + 테스트
./gradlew bootRun # 실행
```

## 체크리스트

- [ ] build.gradle 의존성 변경
- [ ] application.properties DB 설정 변경
- [ ] application-test.properties H2로 변경
- [ ] 엔티티 `BINARY(16)` → `uuid` 변경
- [ ] AWS Secrets Manager 업데이트
- [ ] .env.example 업데이트
- [ ] 빌드 테스트
- [ ] 연결 테스트
