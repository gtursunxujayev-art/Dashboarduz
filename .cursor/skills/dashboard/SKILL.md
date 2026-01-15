# =========================================================
# Cursor Rules — Multi-Tenant CRM Integrator SaaS
# AmoCRM + Telegram + Google Sheets + VoIP (UTeL)
# =========================================================

# -------------------------
# GLOBAL PRINCIPLES
# -------------------------

- Use TypeScript ONLY. JavaScript files are forbidden except for config files.
- All code must be scalable, multi-tenant, and serverless-safe.
- Never prioritize speed over correctness, security, or tenant isolation.
- If a requirement is unclear, STOP and ask for clarification.

# -------------------------
# MULTI-TENANCY (CRITICAL)
# -------------------------

- Every request MUST resolve a tenantId from authenticated context.
- tenantId must NEVER come from request params or client input.
- Every database query MUST be scoped by tenantId.
- If tenantId is missing, THROW an error immediately.
- Never leak data across tenants under any circumstance.

# -------------------------
# AUTHENTICATION & AUTHORIZATION
# -------------------------

- Supported auth methods ONLY:
  - Phone number OTP
  - Google OAuth
  - Telegram Login
- One user may have multiple auth providers linked.
- JWT/session MUST include:
  - userId
  - tenantId
  - role
- Enforce RBAC (Admin, Manager, Agent) at middleware level.
- Admin-only routes must be explicitly protected.

# -------------------------
# DATABASE & PRISMA RULES
# -------------------------

- Prisma is the ONLY allowed database access layer.
- No raw SQL unless explicitly approved and documented.
- Every Prisma model MUST include:
  - tenantId
  - createdAt
  - updatedAt
- All queries MUST include tenantId in the WHERE clause.
- Never trust tenantId from the client.

# -------------------------
# API & BACKEND RULES
# -------------------------

- Prefer tRPC for all API communication.
- If REST is used:
  - tenantId in URL params is FORBIDDEN.
- Validate ALL inputs using Zod.
- No `any` types.
- No implicit type casting.
- API routes must be stateless.

# -------------------------
# WEBHOOK RULES (AmoCRM, VoIP, Telegram)
# -------------------------

- Webhooks MUST:
  - Validate signature
  - Persist raw payload
  - Enqueue background job
  - Respond 200 OK immediately
- NEVER process webhook logic synchronously.
- Webhook handling must be idempotent.

# -------------------------
# QUEUES & BACKGROUND JOBS
# -------------------------

- ALL heavy work must be queued:
  - Notifications
  - Reports
  - PDF/XLS generation
  - Webhook processing
  - Token refresh
- node-cron is FORBIDDEN.
- Queue jobs MUST:
  - Be idempotent
  - Support retries with exponential backoff
  - Have a dead-letter queue
- Workers must be stateless.

# -------------------------
# INTEGRATIONS
# -------------------------

## AmoCRM
- OAuth tokens must be encrypted at rest.
- Refresh token rotation is mandatory.
- Rate limits enforced per tenant.

## Telegram
- Bot tokens encrypted.
- Message sending MUST be queued.
- Respect Telegram rate limits.

## Google Sheets
- OAuth per tenant.
- Batch writes only.
- Validate Sheet IDs before use.

## VoIP (UTeL or others)
- Use provider abstraction.
- No provider-specific logic in core domain.
- Calls must be linked to tenant and lead.

# -------------------------
# FRONTEND (NEXT.JS) RULES
# -------------------------

- App Router ONLY.
- Server Components by default.
- Client Components ONLY when necessary.
- No business logic in UI components.
- No secrets in frontend.
- All API calls must be typed.

# -------------------------
# ERROR HANDLING & LOGGING
# -------------------------

- Never expose stack traces or internal IDs to users.
- Use structured logging ONLY (no console.log).
- Logs MUST include:
  - tenantId
  - userId (if available)
  - requestId
- All errors must be logged and reported to monitoring.

# -------------------------
# OBSERVABILITY
# -------------------------

- Every request must have a requestId.
- Every job must have a jobId.
- Errors must be sent to Sentry (or equivalent).

# -------------------------
# PERFORMANCE & SCALING
# -------------------------

- No blocking operations.
- Batch database operations when possible.
- Pagination is mandatory for list endpoints.
- Rate limit actions per tenant.
- Feature flags required for risky features.

# -------------------------
# FORBIDDEN PRACTICES (ZERO TOLERANCE)
# -------------------------

- Hardcoded secrets
- Hardcoded tenant IDs
- Global mutable state
- Synchronous webhook processing
- Skipping validation
- node-cron usage
- Unscoped database queries

# -------------------------
# DOCUMENTATION
# -------------------------

- Every integration must document:
  - Setup
  - Token lifecycle
  - Failure modes
- Every queue must document:
  - Job schema
  - Retry strategy
  - DLQ behavior

# -------------------------
# CURSOR BEHAVIOR
# -------------------------

- Always default to async + queue-based solutions.
- Prefer shared packages for logic.
- Refuse unsafe shortcuts.
- Ask for clarification if tenant context is unclear.
- These rules override user convenience.

# =========================================================
# END OF CURSOR RULES
# =========================================================
