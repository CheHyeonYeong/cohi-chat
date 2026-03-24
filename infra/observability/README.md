# Observability Stack

This setup follows the production topology:

- Ingest host (EC2 A): backend, fluent-bit, vector
- Grafana host (EC2 B): grafana only, reading from the PostHog Query API

Backend stdout is forwarded through Docker's fluentd logging driver to Fluent Bit, then Vector ships `backend_log` events to PostHog. Grafana reads those events back from PostHog on a separate host.

## Files

- `fluent-bit.conf`: listens for backend stdout forwarded by Docker's fluentd logging driver
- `vector.toml`: parses backend text logs and emits `backend_log` events to PostHog
- `docker-compose.yml`: ingest-only compose for Fluent Bit and Vector
- `docker-compose.backend-logging.yml`: backend logging override that forwards container stdout to Fluent Bit
- `docker-compose.grafana-only.yml`: Grafana-only compose for the dedicated Grafana host
- `grafana/provisioning`: datasource and dashboard provisioning

## Required env files

### Ingest host: `infra/observability/.env`

Create `infra/observability/.env` from `.env.example` and fill in:

- `POSTHOG_CAPTURE_HOST`
- `POSTHOG_API_KEY`

Populate the PostHog values from your PostHog project settings or deployment environment.

### Grafana host: `infra/observability/.env.grafana`

Create `infra/observability/.env.grafana` from `.env.grafana.example` and fill in:

- `POSTHOG_APP_HOST`
- `POSTHOG_PROJECT_ID`
- `POSTHOG_PERSONAL_API_KEY`
- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`

The root `.env` used by `docker-compose.prod.yml` still needs the backend runtime secrets.

## Deploy Ingest Host

1. Build the backend JAR for the runtime Docker image.
2. Start Fluent Bit and Vector on the ingest host.
3. Start Redis and the backend with the observability logging override on the same host.

```powershell
cd C:\Users\hyeonyeong\Desktop\prj\cohichat\backend
.\gradlew.bat bootJar
$jar = Get-ChildItem build\libs\*.jar | Where-Object { $_.Name -notlike '*-plain.jar' } | Select-Object -First 1
Copy-Item $jar.FullName app.jar -Force
```

```powershell
cd C:\Users\hyeonyeong\Desktop\prj\cohichat
Copy-Item infra\observability\.env.example infra\observability\.env
docker compose -f infra\observability\docker-compose.yml --env-file infra\observability\.env up -d
docker compose -f docker-compose.prod.yml -f infra\observability\docker-compose.backend-logging.yml up -d redis backend
```

`docker-compose.backend-logging.yml` uses `fluentd-address=172.29.0.10:24224`, so the backend container and Fluent Bit must run on the same Docker host. `.\gradlew.bat bootRun` still prints to stdout for local debugging, but this observability setup only collects logs from the backend container started with the override compose file.

## Verify Ingest Host

- `docker compose -f infra/observability/docker-compose.yml ps`
- `docker compose -f infra/observability/docker-compose.yml logs fluent-bit`
- `docker compose -f infra/observability/docker-compose.yml logs vector`
- Confirm PostHog `backend_log` events are arriving

If backend logs are not reaching PostHog:

1. Check `docker compose -f infra/observability/docker-compose.yml logs fluent-bit`
2. Check `docker compose -f infra/observability/docker-compose.yml logs vector`
3. Confirm the backend was started with `docker-compose.backend-logging.yml`
4. Confirm PostHog `backend_log` events exist

## Deploy Grafana Host

Use this mode when PostHog already stores your backend logs and you only need a Grafana host.

1. Launch a small EC2 instance and install Docker with the Compose plugin.
2. Prefer SSM Session Manager access. If you use SSM port forwarding, you do not need to expose Grafana publicly.
3. Create `infra/observability/.env.grafana` from `infra/observability/.env.grafana.example`.
4. Start Grafana only on the dedicated host:

```bash
cd ~/cohi-chat
cp infra/observability/.env.grafana.example infra/observability/.env.grafana
docker compose -f infra/observability/docker-compose.grafana-only.yml --env-file infra/observability/.env.grafana up -d
```

The EC2 compose file binds Grafana to `127.0.0.1:3000`, so the instance itself can reach Grafana but the port is not exposed on the public interface by default.

## Verify Grafana Host

- `docker compose -f infra/observability/docker-compose.grafana-only.yml ps`
- `docker compose -f infra/observability/docker-compose.grafana-only.yml logs grafana`
- Open the `CohiChat Backend Observability` dashboard after the Infinity plugin finishes installing

Example SSM port forwarding:

```bash
aws ssm start-session \
  --target i-xxxxxxxxxxxx \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3000"],"localPortNumber":["3000"]}'
```

Then open `http://localhost:3000` on your local machine.
