# Procurement automation runbook

The acceptance journey is tenant owner registration in a development environment, tenant user provisioning, persistent vendor creation, optional product creation, bid submission for an active tenant vendor, and audited `SUBMITTED → UNDER_EVALUATION → EVALUATED → AWARDED` decisions. The browser vendors/bids pages use this PostgreSQL API. Production accepts only provisioned, verified OIDC identities; role and tenant authority always come from the database.

Run `./start.sh check` for builds and unit tests. CI creates PostgreSQL, replays Prisma migrations twice, and runs the HTTP/database test with `RUN_DB_TESTS=true`. Before deployment, run `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate` as a one-shot job, then `./start.sh start`. Generated AI/gap/custom-view routes are unavailable by default and cannot be enabled in production.

Use `compose.yaml` as the reference topology. `/api/health` is liveness, `/api/ready` verifies PostgreSQL, `/api/metrics` exposes request counters, and application logs are structured JSON with request IDs. Alert on readiness failures, 5xx/error ratio, authentication failures, invalid lifecycle attempts, audit-write failures, database saturation, and backup age.

Create a restricted verified backup with `DATABASE_URL=... BACKUP_FILE=/approved/path/procurement.dump ./scripts/backup.sh`. Restore only to the exact approved target during a maintenance window with `ALLOW_DATABASE_RESTORE=1`; rehearse this quarterly and reconcile tenant, bid, and audit counts after restore. Startup never installs, seeds, migrates, deletes data, or kills unrelated processes.
