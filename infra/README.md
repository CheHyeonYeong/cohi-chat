# 인프라 가이드

## 운영 토폴로지

- Frontend: S3 + CloudFront
- App 호스트(EC2 A): `backend`, `redis`, `fluent-bit`, `vector`
- Grafana 호스트(EC2 B): `grafana`
- 시크릿 저장소: AWS Secrets Manager `cohi-chat/prod`

## 디렉터리 구조

```text
infra/
├── README.md
├── app/
│   └── docker-compose.server.yml
└── observability/
    ├── docker-compose.ingest.yml
    ├── docker-compose.backend-observability.yml
    ├── docker-compose.grafana.yml
    ├── .env.ingest.example
    ├── .env.grafana.example
    ├── README.md
    ├── fluent-bit.conf
    ├── vector.toml
    └── grafana/
```

## 파일 역할

- `infra/app/docker-compose.server.yml`: App 호스트의 `backend + redis` 실행 정의
- `infra/observability/docker-compose.ingest.yml`: App 호스트의 `fluent-bit + vector` 실행 정의
- `infra/observability/docker-compose.backend-observability.yml`: backend 컨테이너 logging driver override
- `infra/observability/docker-compose.grafana.yml`: Grafana 호스트 전용 compose
- `infra/observability/README.md`: observability 상세 운영 절차

## 배포 엔트리

- `.github/workflows/server-deploy-prod.yml`: App 호스트의 backend, redis, ingest observability 배포
- `.github/workflows/grafana-deploy-prod.yml`: Grafana 호스트 배포
- `.github/workflows/client-deploy-prod.yml`: 프론트엔드 S3/CloudFront 배포
