# Blue-Green Deployment Guide

## Target Topology

```text
Client
  -> EC2 :80
  -> Nginx
  -> backend-blue:8080 or backend-green:8080
  -> Redis / Supabase PostgreSQL
```

- External traffic enters through `nginx` only.
- `backend-blue` and `backend-green` run on the internal Docker network only.
- During normal operation only one backend receives traffic.
- During deployment the inactive backend is started temporarily, validated, and then promoted.

## One-Time Initial Cutover

The current production server exposes Spring Boot directly on `:8080`.
The first cutover is a topology change, not a fully zero-downtime deployment.

1. Allow inbound `80` on the EC2 security group.
2. Keep `8080` open until `nginx` traffic is verified.
3. Deploy this branch so that `redis`, `nginx`, `backend-blue`, and `backend-green` are available.
4. Verify `http://<ec2-or-domain>/actuator/health` through `nginx`.
5. Move user traffic to `:80`.
6. After verification, remove external access to `:8080`.

## Ongoing Deploy Flow

`server-deploy-prod.yml` performs the following sequence:

1. Build the backend JAR in GitHub Actions.
2. Upload the JAR to S3.
3. SSH into EC2 and sync the repository.
4. Start `redis` only.
5. Run `scripts/blue-green-deploy.sh`.

`blue-green-deploy.sh` does this:

1. Detect the active color.
2. Build and start the inactive backend.
3. Wait for the inactive backend health check to become `healthy`.
4. Start `nginx` if it is not already running.
5. Rewrite `nginx/upstream.conf` to point to the inactive backend.
6. Run `nginx -t` and `nginx -s reload`.
7. Stop the old backend.

## Rollback Flow

Use this on the EC2 host:

```bash
bash scripts/rollback.sh
```

`rollback.sh` does this:

1. Detect the current active color.
2. Start the previous backend if it is stopped.
3. Wait for the previous backend health check.
4. Switch `nginx/upstream.conf` back to the previous backend.
5. Reload `nginx`.
6. Stop the problematic backend.

## Operational Notes

- `docker-compose.prod.yml` exposes only `80:80` on `nginx`.
- `backend-blue` and `backend-green` do not expose host ports.
- `redis` remains internal-only.
- `nginx/chat-upstream.conf` ships with `127.0.0.1:3001` as a safe placeholder.
  Replace it with the real chat server address before routing `/chat/` traffic.
- Database changes must remain backward compatible while both app versions may exist during deployment.

## Verification Commands

```bash
docker-compose -f docker-compose.prod.yml ps
docker inspect --format='{{.State.Health.Status}}' cohi-chat-backend-blue
docker inspect --format='{{.State.Health.Status}}' cohi-chat-backend-green
docker exec cohi-chat-nginx nginx -t
cat nginx/upstream.conf
curl -I http://127.0.0.1/actuator/health
```

## Related Files

- `docker-compose.prod.yml`
- `nginx/nginx.prod.conf`
- `nginx/upstream.conf`
- `nginx/chat-upstream.conf`
- `scripts/blue-green-deploy.sh`
- `scripts/rollback.sh`
- `.github/workflows/server-deploy-prod.yml`
