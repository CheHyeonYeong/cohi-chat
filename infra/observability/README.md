# Observability Stack

This stack receives backend stdout through Docker's fluentd logging driver, ships it to PostHog, and reads it back from Grafana through the PostHog Query API.

## Files

- `fluent-bit.conf`: listens for backend stdout forwarded by Docker's fluentd logging driver
- `vector.toml`: parses backend text logs and emits `backend_log` events to PostHog
- `docker-compose.yml`: local Fluent Bit, Vector, Grafana stack
- `docker-compose.backend-logging.yml`: backend logging override that forwards container stdout to Fluent Bit
- `docker-compose.grafana-only.yml`: EC2-friendly Grafana-only deployment that reads from PostHog
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

For a Grafana-only EC2 deployment, create `infra/observability/.env.grafana` from `.env.grafana.example`.

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

## Grafana-only On EC2

Use this mode when PostHog already stores your backend logs and you only want a low-cost Grafana host on EC2.

1. Launch a small EC2 instance and install Docker with the Compose plugin.
2. Prefer SSM Session Manager access. If you use SSM port forwarding, you do not need to expose Grafana publicly.
3. Create `infra/observability/.env.grafana` from `infra/observability/.env.grafana.example`.
4. Start Grafana only:

```bash
cd ~/cohi-chat
cp infra/observability/.env.grafana.example infra/observability/.env.grafana
docker compose -f infra/observability/docker-compose.grafana-only.yml --env-file infra/observability/.env.grafana up -d
```

The EC2 compose file binds Grafana to `127.0.0.1:3000`, so the instance itself can reach Grafana but the port is not exposed on the public interface by default.

Example SSM port forwarding:

```bash
aws ssm start-session \
  --target i-xxxxxxxxxxxx \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3000"],"localPortNumber":["3000"]}'
```

Then open `http://localhost:3000` on your local machine.
