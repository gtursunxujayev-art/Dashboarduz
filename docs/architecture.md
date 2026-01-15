# Dashboarduz Architecture Documentation

## System Overview

Dashboarduz is a multi-tenant SaaS platform that integrates AmoCRM, Telegram, Google Sheets, and VoIP (UTeL) services into a unified dashboard.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js App (Vercel)                                 │  │
│  │  - React 19                                           │  │
│  │  - tRPC Client                                        │  │
│  │  - Tailwind CSS                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Application Load Balancer (AWS)                     │  │
│  │  - SSL Termination                                   │  │
│  │  - WAF Rules                                          │  │
│  │  - Rate Limiting                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                        │
│  ┌──────────────────────┐  ┌────────────────────────────┐  │
│  │  API Service (ECS)    │  │  Worker Service (ECS)      │  │
│  │  - Express + tRPC     │  │  - BullMQ Workers          │  │
│  │  - Authentication     │  │  - Webhook Processing      │  │
│  │  - Integration APIs   │  │  - Notifications          │  │
│  │  - Health Checks      │  │  - Exports                │  │
│  └──────────────────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  PostgreSQL     │  │  Redis         │  │  S3 Storage     │
│  (RDS)          │  │  (ElastiCache)  │  │  (File Storage) │
│  - Multi-AZ     │  │  - Multi-AZ     │  │  - Versioning   │
│  - RLS Enabled  │  │  - Persistence  │  │  - Encryption   │
│  - Backups      │  │  - Queues       │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Component Details

### Frontend (Next.js)

**Technology Stack:**
- Next.js 14 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- tRPC Client
- React Query

**Deployment:**
- Vercel (primary)
- Alternative: Docker on ECS

**Features:**
- Server-side rendering
- Static asset optimization
- Edge network distribution
- Automatic SSL

### API Service

**Technology Stack:**
- Node.js 20
- Express.js
- tRPC
- TypeScript
- Prisma ORM

**Deployment:**
- ECS Fargate
- Auto-scaling (2-10 instances)
- Load balanced via ALB

**Endpoints:**
- `/api/trpc` - tRPC API
- `/health` - Health check
- `/health/queues` - Queue metrics
- `/metrics` - Prometheus metrics
- `/webhooks/*` - Webhook receivers

### Worker Service

**Technology Stack:**
- Node.js 20
- BullMQ
- Redis
- TypeScript

**Deployment:**
- ECS Fargate
- Separate from API service
- Auto-scaling based on queue depth

**Workers:**
- Webhook processing
- Notification delivery
- Export generation
- Sync jobs

### Database (PostgreSQL)

**Configuration:**
- RDS PostgreSQL 16
- Multi-AZ for production
- Automated backups (30 days retention)
- Point-in-time recovery
- Row Level Security (RLS) enabled

**Connection Pooling:**
- PgBouncer (recommended)
- Prisma connection pool
- Max 20 connections per instance

### Cache & Queue (Redis)

**Configuration:**
- ElastiCache Redis 7
- Multi-AZ for production
- Automatic failover
- Persistence enabled
- Backup retention: 5 days

**Usage:**
- BullMQ job queues
- Session storage
- Rate limiting
- Real-time pub/sub

### Storage (S3)

**Configuration:**
- S3 buckets per environment
- Versioning enabled (production)
- Server-side encryption
- Lifecycle policies
- Cross-region replication (production)

**Usage:**
- File uploads
- Exports (PDF, Excel)
- Backups
- Static assets

## Data Flow

### Authentication Flow

```
User → Frontend → API → Auth Service → Database
                ↓
            JWT Token
                ↓
            Frontend (stored)
```

### Integration Flow

```
External Service → Webhook → API → Queue → Worker → Database
                                      ↓
                                  Notification
```

### Lead Sync Flow

```
AmoCRM → Webhook → API → Queue → Worker → Database → Frontend
```

## Security Architecture

### Network Security

- VPC with public/private subnets
- Security groups for access control
- WAF rules on ALB
- DDoS protection
- VPN for admin access

### Data Security

- Encryption at rest (RDS, S3, ElastiCache)
- Encryption in transit (TLS 1.3)
- Row Level Security (RLS) in PostgreSQL
- Encrypted integration tokens
- Secrets in AWS Secrets Manager

### Authentication & Authorization

- JWT tokens for API access
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- OAuth2 for integrations
- Webhook signature verification

## Scalability

### Horizontal Scaling

- API service: 2-10 instances
- Worker service: 2-5 instances
- Auto-scaling based on CPU/memory
- Queue-based worker scaling

### Vertical Scaling

- Database: Upgrade instance class
- Redis: Upgrade node type
- ECS: Increase CPU/memory

### Performance Optimization

- Database indexing
- Query optimization
- Connection pooling
- Caching strategies
- CDN for static assets

## Monitoring & Observability

### Metrics

- CloudWatch metrics
- Prometheus metrics
- Custom business metrics
- Grafana dashboards

### Logging

- CloudWatch Logs
- Structured JSON logging
- Log aggregation
- Log retention: 30 days

### Alerting

- CloudWatch alarms
- SNS notifications
- Slack integration
- PagerDuty for critical

### Tracing

- Sentry error tracking
- Distributed tracing
- Performance monitoring
- User session replay

## Disaster Recovery

### Backup Strategy

- Database: Daily automated backups
- S3: Versioning and replication
- Redis: Daily snapshots
- Point-in-time recovery: 7 days

### Recovery Procedures

- RTO: 1 hour (production)
- RPO: 1 hour (production)
- Multi-region setup (future)
- Automated failover (future)

## Deployment Architecture

### CI/CD Pipeline

```
GitHub → Build → Test → Security Scan → 
  Docker Build → Registry → 
    Staging Deploy → Tests → 
      Production Deploy → Smoke Tests
```

### Environments

- **Development**: Local Docker Compose
- **Staging**: AWS ECS (single region)
- **Production**: AWS ECS (multi-AZ)

### Deployment Strategy

- Blue-green deployments
- Canary releases (future)
- Feature flags
- Automated rollback

## Integration Architecture

### AmoCRM

- OAuth2 authentication
- Webhook receiver
- Polling fallback
- Token refresh
- Signature verification

### Telegram

- Bot API integration
- Webhook receiver
- Message sending
- User authentication

### Google Sheets

- OAuth2 authentication
- Sheets API
- Drive API
- Quota management

### UTeL VoIP

- REST API client
- Webhook receiver
- Call event processing
- Recording management

## Cost Optimization

### Resource Sizing

- Right-size instances
- Reserved instances for production
- Spot instances for workers (future)

### Optimization Strategies

- Auto-scaling
- Scheduled scaling
- Cost monitoring
- Resource tagging

## Future Enhancements

- Multi-region deployment
- Global Accelerator
- Read replicas for analytics
- Event-driven architecture
- Serverless functions
- GraphQL API
- Real-time WebSocket updates
