# Governed recycling MRF operations

## Intended use and limits

The governed API normalizes timestamped/unit-bearing telemetry, deduplicates readings, evaluates site constraints, and proposes operator-reviewed actions. It never dispatches equipment or writes to control systems autonomously. Historical validation must cover error, latency, missed events, realized outcomes, sensor quality, and manual fallback.

## Data and integrations

Signed site/tenant claims, asset constraints, calibration/version provenance, independent operator approval, and immutable audit events are required. Telemetry, ERP, WMS, TMS, SCADA, GIS, device, weather, maintenance, and notification adapters are allow-listed and fail closed through an idempotent outbox with leased claims and bounded retries.

## Deploy, rollback, and recovery

Run `./start.sh check`, back up PostgreSQL, then use `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`. No schema runs at normal startup. Reconcile device/job receipts before replay and preserve manual operating procedures. Alert on stale sensors, unit errors, constraint violations, self-approval, expired claims, failed recovery, and dead letters.
