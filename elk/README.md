# ELK Stack for cohi-chat

Elasticsearch, Logstash, Kibana 스택을 통한 로그 수집 및 분석 환경입니다.

## 버전

- Elasticsearch: 8.17.0
- Logstash: 8.17.0
- Kibana: 8.17.0

## 구성 요소

### Elasticsearch
- 포트: 9200 (HTTP), 9300 (Transport)
- 싱글 노드 모드
- 보안 비활성화 (개발 환경)

### Logstash
- 포트: 5000 (TCP - Spring Boot 로그 수신)
- 포트: 5044 (Beats)
- 포트: 9600 (Monitoring API)

### Kibana
- 포트: 5601

## 실행 방법

### 1. ELK 스택 시작

```bash
docker-compose up -d elasticsearch logstash kibana
```

### 2. ILM 정책 설정 (최초 1회)

Elasticsearch가 시작된 후 실행:

```bash
# Linux/Mac
./elk/elasticsearch/setup-ilm.sh

# Windows (Git Bash)
bash ./elk/elasticsearch/setup-ilm.sh
```

### 3. Kibana 접속

http://localhost:5601

### 4. 인덱스 패턴 생성

1. Kibana 접속
2. Stack Management > Index Patterns
3. Create index pattern: `cohi-chat-logs-*`
4. Time field: `@timestamp`

## Spring Boot 설정

### 환경 변수

```properties
LOGSTASH_HOST=localhost  # Docker 사용 시: logstash
LOGSTASH_PORT=5000
```

### Profile 별 동작

- `default`: 콘솔 + 파일 로깅
- `dev`: 콘솔 + 파일 + Logstash
- `prod`: 콘솔 + Logstash

## 로그 보존 정책 (ILM)

| Phase | 기간 | 액션 |
|-------|------|------|
| Hot | 0-7일 | Rollover (1일, 5GB, 100만 docs) |
| Warm | 7-30일 | Readonly |
| Cold | 30-90일 | - |
| Delete | 90일 이후 | 삭제 |

## 문제 해결

### Elasticsearch 시작 실패

메모리 부족 시:
```bash
# Linux
sudo sysctl -w vm.max_map_count=262144
```

### Logstash 연결 실패

1. Elasticsearch 상태 확인:
```bash
curl http://localhost:9200/_cluster/health
```

2. Logstash 로그 확인:
```bash
docker logs cohi-chat-logstash
```

### Spring Boot 연결 실패

1. Logstash 포트 확인:
```bash
curl http://localhost:9600/_node/stats
```

2. 네트워크 확인 (Docker 환경):
```bash
docker network inspect cohi-chat-network
```
