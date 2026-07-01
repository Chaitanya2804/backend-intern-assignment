# Scalability Notes

This assignment is intentionally scoped small, but here's how it would evolve to handle real
production load.

## Database
- **Read replicas**: point `GET` requests at read replicas and writes at the primary once read
  traffic grows past what a single Postgres instance handles comfortably.
- **Indexing**: add indexes on `Tasks.userId` and `Tasks.status` (already the most common query
  filters) — trivial now, essential once the table has millions of rows.
- **Migrations over sync()**: replace `sequelize.sync()` with versioned `sequelize-cli` migrations
  so schema changes are reviewable and reversible in production.
- **Connection pooling**: already configured via Sequelize's `pool` options; in a multi-instance
  deployment, pair this with something like PgBouncer to avoid exhausting Postgres connections.

## Caching
- **Redis** in front of read-heavy, rarely-changing endpoints (e.g. a public task-status summary)
  to cut database load, with cache invalidation on writes.
- **Rate-limit store**: move `express-rate-limit`'s in-memory store to a Redis-backed store so
  limits are enforced consistently across multiple server instances rather than per-process.

## Horizontal scaling
- The API is already stateless (JWT-based auth, no server-side sessions), so it can run as
  multiple identical instances behind a load balancer with no sticky-session requirement.
- Containerize with **Docker** and orchestrate with Kubernetes or a managed container service,
  scaling instance count based on CPU/request-latency metrics.

## Microservices (if it grew far beyond this scope)
- Auth/User management and Task management could split into separate services once they have
  independent scaling needs or release cadences, communicating over REST/gRPC or an event bus
  (e.g. Kafka/RabbitMQ) for things like "user deleted → cascade task cleanup."
- An API gateway would then handle routing, auth token verification, and rate limiting centrally
  instead of each service reimplementing it.

## Observability
- Structured logging (e.g. `pino`/`winston`) shipped to a log aggregator, plus request tracing
  (OpenTelemetry) once there are enough moving parts that a single `morgan` log line isn't enough
  to debug production issues.
- Health check endpoint (`/health`, already present) wired into the load balancer and
  uptime monitoring.

## Security at scale
- Move from long-lived refresh tokens in `localStorage` (fine for this demo) to httpOnly, secure
  cookies for refresh tokens in a production frontend, to reduce XSS exposure.
- Add automated dependency scanning (`npm audit` / Dependabot) and a WAF in front of the API.
