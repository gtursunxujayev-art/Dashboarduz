# Deployment Runbook

This runbook provides step-by-step procedures for deploying Dashboarduz to production.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Backup created (for production)
- [ ] Monitoring dashboards ready
- [ ] Rollback plan prepared

## Deployment Procedure

### 1. Pre-Deployment

```bash
# 1. Verify current production state
kubectl get pods -n production
# or
aws ecs describe-services --cluster dashboarduz-production --services dashboarduz-api

# 2. Create database backup
cd packages/db
pnpm backup:s3

# 3. Check migration status
pnpm migrate:status

# 4. Verify environment variables
# Check all required variables are set in deployment platform
```

### 2. Database Migration

```bash
# Run migrations via GitHub Actions
# Or manually:
cd packages/db
export DATABASE_URL=$DATABASE_URL_PRODUCTION
pnpm migrate:deploy
```

### 3. Deploy Backend

#### Via GitHub Actions (Recommended)

1. Push to `main` branch
2. Monitor GitHub Actions workflow
3. Verify deployment success

#### Manual Deployment

```bash
# Build and push Docker image
docker build -f Dockerfile.production -t dashboarduz-api:latest .
docker tag dashboarduz-api:latest your-registry/dashboarduz-api:latest
docker push your-registry/dashboarduz-api:latest

# Update ECS service
aws ecs update-service \
  --cluster dashboarduz-production \
  --service dashboarduz-api \
  --force-new-deployment
```

### 4. Deploy Frontend

#### Via Vercel (Recommended)

- Automatic on push to `main`
- Or manually: `vercel --prod`

#### Manual Deployment

```bash
cd apps/web
docker build -f Dockerfile -t dashboarduz-web:latest .
# Deploy to your platform
```

### 5. Post-Deployment Verification

```bash
# 1. Health check
curl https://api.yourdomain.com/health

# 2. Smoke tests
curl https://api.yourdomain.com/api/trpc

# 3. Check logs
aws logs tail /ecs/dashboarduz-api --follow

# 4. Monitor metrics
# Check CloudWatch/Grafana dashboards

# 5. Verify services
# Check all services are running and healthy
```

## Rollback Procedure

### Quick Rollback

```bash
# 1. Identify previous deployment
aws ecs describe-services \
  --cluster dashboarduz-production \
  --services dashboarduz-api \
  --query 'services[0].deployments'

# 2. Rollback to previous task definition
aws ecs update-service \
  --cluster dashboarduz-production \
  --service dashboarduz-api \
  --task-definition dashboarduz-api:previous \
  --force-new-deployment

# 3. Verify rollback
curl https://api.yourdomain.com/health
```

### Database Rollback

```bash
# 1. Stop application services
# 2. Restore from backup
cd packages/db
tsx scripts/restore.ts restore --s3 backups/backup-file.sql.gz

# 3. Verify database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tenants;"

# 4. Restart services
```

## Emergency Procedures

### Service Down

1. **Check service status**:
   ```bash
   aws ecs describe-services --cluster dashboarduz-production
   ```

2. **Check logs**:
   ```bash
   aws logs tail /ecs/dashboarduz-api --follow
   ```

3. **Restart service**:
   ```bash
   aws ecs update-service \
     --cluster dashboarduz-production \
     --service dashboarduz-api \
     --force-new-deployment
   ```

### Database Issues

1. **Check database status**:
   ```bash
   aws rds describe-db-instances --db-instance-identifier dashboarduz-prod
   ```

2. **Check connections**:
   ```bash
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

3. **Restore from backup if needed**

### High Error Rate

1. **Check error logs**:
   ```bash
   aws logs filter-log-events \
     --log-group-name /ecs/dashboarduz-api \
     --filter-pattern "ERROR"
   ```

2. **Check Sentry** for error details
3. **Scale up services** if needed:
   ```bash
   aws ecs update-service \
     --cluster dashboarduz-production \
     --service dashboarduz-api \
     --desired-count 4
   ```

## Post-Deployment Tasks

- [ ] Verify all services healthy
- [ ] Check error rates
- [ ] Monitor performance metrics
- [ ] Update deployment documentation
- [ ] Notify team of deployment
- [ ] Schedule post-deployment review

## Communication

### Deployment Notifications

- **Slack**: #deployments channel
- **Email**: ops@yourdomain.com
- **PagerDuty**: For critical deployments

### Status Updates

- Pre-deployment: "Starting deployment..."
- In progress: "Deployment in progress..."
- Success: "Deployment successful ✅"
- Failure: "Deployment failed ❌ - Rolling back..."

## Troubleshooting

### Common Issues

1. **Deployment timeout**:
   - Check service health
   - Verify resource limits
   - Check network connectivity

2. **Health check failures**:
   - Verify health endpoint
   - Check application logs
   - Verify environment variables

3. **Database connection errors**:
   - Verify database is accessible
   - Check security group rules
   - Verify credentials

## Additional Resources

- [Deployment Documentation](./deployment.md)
- [Database Deployment Guide](./database-deployment.md)
- [Frontend Deployment Guide](./frontend-deployment.md)
- [Monitoring Setup](./monitoring-setup.md)
