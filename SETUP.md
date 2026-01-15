# Quick Setup Guide

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- pnpm 8+ (`npm install -g pnpm`)
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database connection (default works with Docker Compose)
- JWT secret (generate a strong random string)
- OTP provider credentials (Firebase or Twilio)
- Integration API keys (AmoCRM, Google, UTeL)

### 3. Start Infrastructure Services

Start PostgreSQL and Redis using Docker Compose:

```bash
pnpm docker:up
# or
docker-compose up -d postgres redis
```

Wait for services to be healthy (check with `docker-compose ps`).

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate
```

### 5. Start Development Servers

**Option A: Run separately (recommended for debugging)**

Terminal 1 - API Server:
```bash
pnpm dev:api
```

Terminal 2 - Frontend:
```bash
pnpm dev
```

**Option B: Run both together**

```bash
pnpm dev:all
```

### 6. Verify Installation

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Health check: http://localhost:3001/health
- Prisma Studio: `pnpm db:studio` (then open http://localhost:5555)

## Next Steps

1. **Set up authentication providers** (see README.md)
2. **Configure integrations** (AmoCRM, Telegram, Google Sheets, UTeL)
3. **Create your first tenant** via registration flow
4. **Connect integrations** in the dashboard

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in `.env`
- Verify database exists: `docker-compose exec postgres psql -U dashboarduz -d dashboarduz`

### Port Already in Use

- Change ports in `.env` or `docker-compose.yml`
- Kill processes using ports 3000, 3001, 5432, 6379

### Prisma Errors

- Regenerate client: `pnpm db:generate`
- Reset database (⚠️ deletes all data): `pnpm --filter db db:push --force-reset`

### TypeScript Errors

- Run type check: `pnpm type-check`
- Ensure all dependencies installed: `pnpm install`

## Development Tips

- Use Prisma Studio to inspect database: `pnpm db:studio`
- Check API logs in terminal running `pnpm dev:api`
- Use browser DevTools Network tab to inspect tRPC calls
- Check Docker logs: `docker-compose logs -f`

## Production Deployment

See README.md for deployment instructions using Docker and Terraform.
