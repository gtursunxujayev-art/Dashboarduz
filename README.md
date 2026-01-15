# Dashboarduz - Multi-Tenant CRM Integrator

A secure, scalable multi-tenant SaaS platform that integrates AmoCRM, Telegram, Google Sheets, and VoIP (UTeL) into a unified dashboard. Built with TypeScript, Next.js, Node.js, and PostgreSQL.

## 🎯 Features

- **Multi-Tenant Architecture**: Secure tenant isolation with PostgreSQL Row Level Security (RLS)
- **Multiple Authentication Methods**: Phone OTP, Google OAuth, Telegram Login
- **CRM Integration**: AmoCRM OAuth2, webhooks, and polling fallback
- **Telegram Bot**: Send notifications and manage bot connections
- **Google Sheets**: OAuth2 integration for reading/writing spreadsheets
- **VoIP Integration**: UTeL API integration for call tracking and recording
- **Real-time Dashboard**: Live updates via WebSockets
- **Queue System**: Background job processing with Redis + BullMQ
- **Exports**: Generate PDF and Excel reports
- **Observability**: Sentry error tracking, structured logging, Prometheus metrics
- **CI/CD**: GitHub Actions workflows for automated deployment
- **Infrastructure as Code**: Terraform configurations for AWS

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│  API Server │────▶│  PostgreSQL │
│   Frontend  │     │   (tRPC)    │     │   (RLS)     │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ├────▶ Redis (Queue)
                            │
                            ├────▶ Webhooks
                            │
                            └────▶ External APIs
                                   (AmoCRM, Telegram, Google, UTeL)
```

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, tRPC, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis + BullMQ
- **Auth**: JWT, Firebase Auth / Twilio Verify, Google OAuth, Telegram Login Widget
- **Infrastructure**: Docker, Terraform, AWS (RDS, ElastiCache, S3)
- **Monitoring**: Sentry, Prometheus, structured logging

## 📦 Project Structure

```
dashboarduz/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Express API server with tRPC
├── packages/
│   ├── db/               # Prisma schema and client
│   └── shared/           # Shared types and Zod schemas
├── infra/
│   └── terraform/        # Infrastructure as Code
├── .github/
│   └── workflows/        # CI/CD pipelines
└── docker-compose.yml    # Local development setup
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm 8+
- Docker and Docker Compose (for local development)
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Dashboarduz
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start local services (PostgreSQL, Redis)**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Set up the database**
   ```bash
   # Generate Prisma client
   pnpm db:generate

   # Run migrations
   pnpm db:migrate
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: API server
   pnpm --filter api dev

   # Terminal 2: Next.js frontend
   pnpm --filter web dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - tRPC endpoint: http://localhost:3001/api/trpc
   - Prisma Studio: `pnpm db:studio`

## 🔐 Authentication Setup

### Phone OTP (Firebase or Twilio)

1. **Firebase Auth**:
   - Create a Firebase project
   - Enable Phone Authentication
   - Set `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` in `.env`
   - Set `OTP_PROVIDER=firebase`

2. **Twilio Verify**:
   - Create a Twilio account
   - Create a Verify Service
   - Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` in `.env`
   - Set `OTP_PROVIDER=twilio`

### Google OAuth

1. Create a Google Cloud project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
5. Add redirect URI: `http://localhost:3001/api/auth/google/callback`

### Telegram Login

1. Create a Telegram bot via [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Use Telegram Login Widget on frontend (see [Telegram docs](https://core.telegram.org/widgets/login))

## 🔌 Integration Setup

### AmoCRM

1. Register your application in AmoCRM
2. Get `AMOCRM_CLIENT_ID` and `AMOCRM_CLIENT_SECRET`
3. Set redirect URI in AmoCRM: `http://localhost:3001/api/integrations/amocrm/callback`
4. Configure webhook URL in AmoCRM dashboard

### Telegram Bot

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get bot token
3. Connect bot in the dashboard (Settings → Integrations → Telegram)
4. Optionally set webhook URL for receiving messages

### Google Sheets

1. Enable Google Sheets API in Google Cloud Console
2. OAuth2 flow will be handled automatically when connecting in dashboard

### UTeL VoIP

1. Get API token from UTeL
2. Set `UTEL_API_URL` and `UTEL_API_TOKEN` in `.env`
3. Configure webhook URL in UTeL dashboard for call events

## 🗄️ Database Schema

Key models:
- **Tenant**: Multi-tenant isolation
- **User**: Users with roles (Admin, Manager, Agent)
- **Integration**: Connected services (AmoCRM, Telegram, etc.)
- **Lead**: CRM leads from AmoCRM
- **Contact**: Contact information
- **Call**: VoIP call records
- **Notification**: Queued notifications
- **WebhookEvent**: Incoming webhook events
- **AuditLog**: Security audit trail

See `packages/db/prisma/schema.prisma` for full schema.

## 🔒 Security

- **Row Level Security (RLS)**: PostgreSQL RLS enforces tenant isolation
- **JWT Authentication**: Secure API access
- **Encrypted Tokens**: Integration tokens encrypted at rest (KMS)
- **Webhook Signature Verification**: Validates incoming webhooks
- **Rate Limiting**: Per-tenant rate limits
- **RBAC**: Role-based access control (Admin, Manager, Agent)

## 📊 Monitoring & Observability

- **Sentry**: Error tracking and performance monitoring
- **Structured Logging**: JSON logs with context
- **Prometheus Metrics**: Custom metrics for monitoring
- **Health Checks**: `/health` endpoint

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t dashboarduz/api .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  dashboarduz/api
```

### Terraform (AWS)

```bash
cd infra/terraform

# Initialize
terraform init

# Plan
terraform plan -var="db_password=your-secure-password"

# Apply
terraform apply
```

### CI/CD

GitHub Actions workflow automatically:
- Lints and type-checks code
- Builds Docker images
- Pushes to container registry
- (Configure deployment steps as needed)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

## 📝 Development

### Adding a new integration

1. Add integration type to `packages/shared/src/types/index.ts`
2. Create service in `apps/api/src/services/integrations/`
3. Add tRPC router in `apps/api/src/trpc/routers/integrations.ts`
4. Update Prisma schema if needed
5. Add webhook handler in `apps/api/src/webhooks/`

### Adding a new tRPC procedure

1. Add to appropriate router in `apps/api/src/trpc/routers/`
2. Use `protectedProcedure` for authenticated endpoints
3. Use `adminProcedure` for admin-only endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

[Add your license here]

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Contact support

## 🗺️ Roadmap

- [ ] Complete OAuth2 flows for all integrations
- [ ] Implement BullMQ queue workers
- [ ] Add WebSocket support for real-time updates
- [ ] PDF/Excel export functionality
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Multi-region deployment

---

Built with ❤️ using TypeScript, Next.js, and modern cloud-native technologies.
