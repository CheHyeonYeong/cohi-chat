# 관측 스택

이 구성은 현재 운영 토폴로지를 기준으로 작성되어 있습니다.

- Ingest 호스트(EC2 A): `backend`, `fluent-bit`, `vector`
- Grafana 호스트(EC2 B): `grafana`만 실행, PostHog Query API로 로그 조회

백엔드 `stdout`은 Docker `fluentd` logging driver를 통해 Fluent Bit으로 전달되고, Vector가 이를 `backend_log` 이벤트로 가공해 PostHog로 보냅니다. Grafana는 별도 호스트에서 PostHog에 저장된 데이터를 조회합니다.

## 파일 구성

- `fluent-bit.conf`: Docker `fluentd` logging driver로 전달된 백엔드 로그를 수신합니다.
- `vector.toml`: 백엔드 텍스트 로그를 파싱해 PostHog `backend_log` 이벤트로 전송합니다.
- `docker-compose.ingest.yml`: Ingest 전용 compose입니다. Fluent Bit과 Vector만 실행합니다.
- `docker-compose.backend-observability.yml`: 백엔드 컨테이너 `stdout`을 Fluent Bit으로 전달하는 logging override compose입니다.
- `docker-compose.grafana.yml`: Grafana 전용 호스트에서 사용하는 compose입니다.
- `grafana/provisioning`: Grafana datasource 및 dashboard provisioning 설정입니다.

## 필요한 env 파일

### Ingest 호스트: `infra/observability/.env`

`infra/observability/.env.ingest.example`을 복사해 `infra/observability/.env`를 만들고 아래 값을 채웁니다.

- `POSTHOG_CAPTURE_HOST`
- `POSTHOG_API_KEY`

PostHog 값은 실제 운영 환경이나 PostHog 프로젝트 설정값을 사용하면 됩니다.

### Grafana 호스트: `infra/observability/.env.grafana`

`infra/observability/.env.grafana.example`을 복사해 `infra/observability/.env.grafana`를 만들고 아래 값을 채웁니다.

- `POSTHOG_APP_HOST`
- `POSTHOG_PROJECT_ID`
- `POSTHOG_PERSONAL_API_KEY`
- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`

별도로 루트 `.env`에는 서버 호스트에서 사용하는 백엔드 런타임 시크릿이 필요합니다.
서버 호스트 compose는 `infra/app/docker-compose.server.yml`에 있습니다.

## Ingest 호스트 배포

1. 런타임 Docker 이미지에서 사용할 백엔드 JAR을 빌드합니다.
2. Ingest 호스트에서 Fluent Bit과 Vector를 실행합니다.
3. 같은 호스트에서 observability logging override를 포함해 Redis와 backend를 실행합니다.

```powershell
cd C:\Users\hyeonyeong\Desktop\prj\cohichat\backend
.\gradlew.bat bootJar
$jar = Get-ChildItem build\libs\*.jar | Where-Object { $_.Name -notlike '*-plain.jar' } | Select-Object -First 1
Copy-Item $jar.FullName app.jar -Force
```

```powershell
cd C:\Users\hyeonyeong\Desktop\prj\cohichat
Copy-Item infra\observability\.env.ingest.example infra\observability\.env
docker compose -f infra\observability\docker-compose.ingest.yml --env-file infra\observability\.env up -d
docker compose --env-file .env -f infra\app\docker-compose.server.yml -f infra\observability\docker-compose.backend-observability.yml up -d redis backend
```

`docker-compose.backend-observability.yml`은 `fluentd-address=172.29.0.10:24224`를 사용하므로, backend 컨테이너와 Fluent Bit은 반드시 같은 Docker 호스트에서 실행되어야 합니다. `.\gradlew.bat bootRun`으로도 로컬 로그 확인은 가능하지만, 이 관측 구성은 override compose로 띄운 backend 컨테이너 로그만 수집합니다.

## Ingest 호스트 점검

- `docker compose -f infra/observability/docker-compose.ingest.yml ps`
- `docker compose -f infra/observability/docker-compose.ingest.yml logs fluent-bit`
- `docker compose -f infra/observability/docker-compose.ingest.yml logs vector`
- PostHog에 `backend_log` 이벤트가 실제로 적재되는지 확인합니다.

백엔드 로그가 PostHog까지 도달하지 않는다면 아래를 순서대로 확인합니다.

1. `docker compose -f infra/observability/docker-compose.ingest.yml logs fluent-bit`
2. `docker compose -f infra/observability/docker-compose.ingest.yml logs vector`
3. backend가 `docker-compose.backend-observability.yml`을 포함해 실행되었는지 확인합니다.
4. PostHog에 `backend_log` 이벤트가 실제로 존재하는지 확인합니다.

## Grafana 호스트 배포

이 모드는 백엔드 로그가 이미 PostHog에 적재되고 있고, 별도의 Grafana 조회용 호스트만 필요할 때 사용합니다.

1. 작은 EC2 인스턴스를 하나 띄우고 Docker 및 Compose plugin을 설치합니다.
2. Grafana를 공인 IP에서 직접 접속하려면 보안그룹에서 TCP `3000` 인바운드를 허용합니다. 가능하면 허용 대역을 팀의 고정 IP로 제한합니다.
3. `infra/observability/.env.grafana.example`을 복사해 `infra/observability/.env.grafana`를 만듭니다.
4. 전용 호스트에서 Grafana만 실행합니다.

```bash
cd ~/cohi-chat
cp infra/observability/.env.grafana.example infra/observability/.env.grafana
docker compose -f infra/observability/docker-compose.grafana.yml --env-file infra/observability/.env.grafana up -d
```

이 compose는 Grafana를 `0.0.0.0:3000`으로 노출하므로, 보안그룹이 허용되어 있으면 `http://<grafana-ec2-public-ip>:3000`으로 접근할 수 있습니다.

## Grafana 호스트 점검

- `docker compose -f infra/observability/docker-compose.grafana.yml ps`
- `docker compose -f infra/observability/docker-compose.grafana.yml logs grafana`
- Infinity plugin 설치가 끝난 뒤 `CohiChat Backend Observability` 대시보드가 정상 표시되는지 확인합니다.

공인 포트를 열고 싶지 않다면 SSM 포트 포워딩으로도 접근할 수 있습니다.

예시 SSM 포트 포워딩:

```bash
aws ssm start-session \
  --target i-xxxxxxxxxxxx \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3000"],"localPortNumber":["3000"]}'
```

이후 로컬 브라우저에서 `http://localhost:3000`을 열면 됩니다.
