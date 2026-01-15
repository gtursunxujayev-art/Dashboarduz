# Environment Variables Documentation

This document describes all environment variables used in the Dashboarduz application.

## Quick Start

1. Copy the appropriate example file:
   - Development: `.env.example`
   - Staging: `config/env.staging.example`
   - Production: `config/env.production.example`

2. Fill in the required values
3. Ensure all required variables are set before starting the application

## Required Variables

### Core Application

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production`, `staging`, `development` | Yes |
| `PORT` | API server port | `3001` | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-secret-key-here` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | Yes |
| `REDIS_URL` | Redis connection string | `redis://host:6379` | Yes |

### Frontend

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Public API URL | `https://api.yourdomain.com` | Yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for frontend | `https://...@sentry.io/...` | No |

## Optional Variables

### Authentication Providers

#### Phone OTP (Twilio)
- `OTP_PROVIDER=twilio`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `TWILIO_PHONE_NUMBER`

#### Phone OTP (Firebase)
- `OTP_PROVIDER=firebase`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

#### Google OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

#### Telegram
- `TELEGRAM_BOT_TOKEN`

### Integrations

#### AmoCRM
- `AMOCRM_CLIENT_ID`
- `AMOCRM_CLIENT_SECRET`
- `AMOCRM_REDIRECT_URI`
- `AMOCRM_BASE_URL` (default: `https://www.amocrm.ru`)
- `AMOCRM_WEBHOOK_SECRET`

#### UTeL VoIP
- `UTEL_API_URL`
- `UTEL_API_TOKEN`
- `UTEL_WEBHOOK_SECRET`

### Security

| Variable | Description | Example |
|----------|-------------|---------|
| `ENCRYPTION_KEY` | 32-byte base64 encoded key | `base64-encoded-key` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX_REQUESTS_FREE` | Free plan limit | `100` |
| `RATE_LIMIT_MAX_REQUESTS_PRO` | Pro plan limit | `500` |
| `RATE_LIMIT_MAX_REQUESTS_ENTERPRISE` | Enterprise limit | `1000` |

### Monitoring

| Variable | Description | Example |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry error tracking DSN | `https://...@sentry.io/...` |
| `SENTRY_ENVIRONMENT` | Sentry environment | `production` |
| `LOG_LEVEL` | Logging level | `info`, `debug`, `warn`, `error` |
| `LOG_FORMAT` | Log format | `json`, `pretty` |
| `LOGGING_SERVICE_URL` | External logging service | `https://logs.datadog.com/...` |

### Storage

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `...` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `dashboarduz-storage` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `FEATURE_WEBHOOKS_ENABLED` | Enable webhook processing | `true` |
| `FEATURE_NOTIFICATIONS_ENABLED` | Enable notifications | `true` |
| `FEATURE_EXPORTS_ENABLED` | Enable exports | `true` |
| `FEATURE_SYNC_ENABLED` | Enable sync jobs | `true` |
| `FEATURE_ANALYTICS_ENABLED` | Enable analytics | `true` |

## Environment-Specific Configuration

### Development
- Use local PostgreSQL and Redis
- Debug logging enabled
- No rate limiting
- Mock external services allowed

### Staging
- Staging database and Redis
- Production-like configuration
- Full monitoring enabled
- Limited rate limiting

### Production
- Production database with RLS
- Production Redis cluster
- Full security enabled
- Comprehensive monitoring
- All secrets from secrets manager

## Secret Management

### AWS Secrets Manager

Store sensitive values in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name dashboarduz/production/database \
  --secret-string '{"username":"user","password":"pass"}'
```

Reference in environment:
```
DATABASE_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@host/db
```

### HashiCorp Vault

```bash
vault kv put secret/dashboarduz/production \
  jwt_secret="your-secret" \
  encryption_key="your-key"
```

## Validation

The application validates all environment variables on startup. Missing required variables will cause the application to fail with a clear error message.

Run validation manually:
```bash
pnpm --filter api validate-env
```

## Security Best Practices

1. **Never commit secrets to version control**
   - Use `.env.example` files with placeholder values
   - Add `.env*` to `.gitignore`

2. **Use secrets management**
   - AWS Secrets Manager
   - HashiCorp Vault
   - GitHub Secrets (for CI/CD)

3. **Rotate secrets regularly**
   - Database passwords: Quarterly
   - JWT secrets: Quarterly
   - OAuth secrets: As needed
   - Encryption keys: Annually

4. **Use different secrets per environment**
   - Never reuse production secrets in staging/dev

5. **Limit secret access**
   - Use IAM roles and policies
   - Principle of least privilege

## Troubleshooting

### "Environment validation failed"
- Check that all required variables are set
- Verify variable names match exactly (case-sensitive)
- Ensure values meet format requirements (URLs, min length, etc.)

### "Feature X requires environment variables"
- This is a warning, not an error
- The feature will be disabled if variables are missing
- Set the required variables to enable the feature

### "JWT_SECRET must be at least 32 characters"
- Generate a secure random secret:
  ```bash
  openssl rand -base64 32
  ```

### "Invalid DATABASE_URL"
- Ensure URL format: `postgresql://user:pass@host:port/db`
- Check for special characters in password (URL encode if needed)
- Verify database is accessible from application network

## Additional Resources

- [Prisma Environment Variables](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [HashiCorp Vault](https://www.vaultproject.io/docs)
