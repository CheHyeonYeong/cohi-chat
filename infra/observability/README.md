# Observability Stack

This stack tails backend text logs, ships them to PostHog, and reads them back from Grafana through the PostHog Query API.

## Files

- `fluent-bit.conf`: tails `backend/logs/backend.log`
- `vector.toml`: parses backend text logs and emits `backend_log` events to PostHog
- `docker-compose.yml`: local Fluent Bit, Vector, Grafana stack
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

## Run

1. Start the backend with Java 21.
2. Confirm `backend/logs/backend.log` is being written.
3. Start the observability stack.

```powershell
$env:JAVA_HOME='C:\Users\hyeonyeong\.jdks\openjdk-21.0.2'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
cd C:\Users\hyeonyeong\Desktop\prj\cohichat\backend
.\gradlew.bat bootRun
```

```powershell
cd C:\Users\hyeonyeong\Desktop\prj\cohichat
Copy-Item infra\observability\.env.example infra\observability\.env
docker compose -f infra\observability\docker-compose.yml --env-file infra\observability\.env up -d
```

## Verify

- Backend log file: `backend/logs/backend.log`
- Vector API: `http://localhost:8687/health`
- Grafana: `http://localhost:3001`
- Dashboard: `CohiChat Backend Observability`

If logs are not visible in Grafana:

1. Check `docker compose -f infra/observability/docker-compose.yml logs vector`
2. Confirm PostHog `backend_log` events exist
3. Re-open Grafana after the Infinity plugin finishes installing
