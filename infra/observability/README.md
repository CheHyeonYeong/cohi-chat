# Observability Stack

This stack receives backend stdout through Docker's fluentd logging driver, ships it to PostHog, and reads it back from Grafana through the PostHog Query API.

## Files

- `fluent-bit.conf`: listens for backend stdout forwarded by Docker's fluentd logging driver
- `vector.toml`: parses backend text logs and emits `backend_log` events to PostHog
- `docker-compose.yml`: local Fluent Bit, Vector, Grafana stack
- `docker-compose.backend-logging.yml`: backend logging override that forwards container stdout to Fluent Bit
- `grafana/provisioning`: datasource and dashboard provisioning

## Required secrets

Create `infra/observability/.env` from `.env.example` and fill in:

- `POSTHOG_CAPTURE_HOST`
- `POSTHOG_APP_HOST`
- `POSTHOG_PROJECT_ID`
- `POSTHOG_API_KEY`
- `POSTHOG_PERSONAL_API_KEY`
- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`

Populate the PostHog values directly from your PostHog project settings or deployment environment.
The root `.env` used by `docker-compose.prod.yml` still needs to contain the backend runtime secrets.

## Run

1. Build the backend JAR for the runtime Docker image.
2. Start the observability stack.
3. Start Redis and the backend with the observability logging override.

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

`.\gradlew.bat bootRun` still prints to stdout for local debugging, but the local observability stack only collects logs from the backend container started with the override compose file.
The Docker logging driver targets the Fluent Bit container's fixed bridge IP (`172.29.0.10:24224`), not `127.0.0.1`.

## Verify

- Fluent Bit forward input: `localhost:24224`
- Vector API: `http://localhost:8687/health`
- Grafana: `http://localhost:3001`
- Dashboard: `CohiChat Backend Observability`

If logs are not visible in Grafana:

1. Check `docker compose -f infra/observability/docker-compose.yml logs fluent-bit`
2. Check `docker compose -f infra/observability/docker-compose.yml logs vector`
3. Confirm the backend was started with `docker-compose.backend-logging.yml`
4. Confirm PostHog `backend_log` events exist
5. Re-open Grafana after the Infinity plugin finishes installing
