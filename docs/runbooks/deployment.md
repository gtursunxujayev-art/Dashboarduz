# Deployment Runbook

## Overview

This runbook describes the procedures for deploying Dashboarduz to different environments (staging, production).

## Prerequisites

- Access to AWS account with appropriate permissions
- Access to GitHub repository
- Terraform installed and configured
- AWS CLI configured with credentials
- Docker installed (for local testing)

## Pre-Deployment Checklist

- [ ] All tests passing in CI/CD pipeline
- [ ] Security scans completed successfully
- [ ] Database migrations tested in staging
- [ ] Environment variables updated in secrets manager
- [ ] Backup of current production database (if production)
- [ ] Team notified of deployment window
- [ ] Rollback plan prepared

## Deployment Procedures

### Staging Deployment

1. **Trigger Deployment**
   ```bash
   # Push to staging branch or use GitHub Actions UI
   git push origin staging
   ```

2. **Monitor Deployment**
   - Watch GitHub Actions workflow: `.github/workflows/deploy-staging.yml`
   - Check CloudWatch logs for errors
   - Verify health endpoint: `https://api-staging.yourdomain.com/health`

3. **Post-Deployment Verification**
   ```bash
   # Run smoke tests
   curl https://api-staging.yourdomain.com/health
   curl https://api-staging.yourdomain.com/api/trpc
   
   # Check database migrations
   pnpm --filter db migrate:status
   ```

4. **Integration Testing**
   - Test authentication flows
   - Test integration connections
   - Verify webhook endpoints
   - Check queue processing

### Production Deployment

1. **Pre-Deployment**
   ```bash
   # Create database backup
   pnpm --filter db backup --s3
   
   # Verify current production state
   curl https://api.yourdomain.com/health
   ```

2. **Trigger Deployment**
   ```bash
   # Merge to main branch or use GitHub Actions UI
   git push origin main
   ```

3. **Monitor Deployment**
   - Watch GitHub Actions workflow: `.github/workflows/deploy-production.yml`
   - Monitor CloudWatch dashboards
   - Check Sentry for errors
   - Verify metrics in Grafana

4. **Post-Deployment Verification**
   ```bash
   # Health checks
   curl https://api.yourdomain.com/health
   curl https://api.yourdomain.com/health/queues
   
   # Smoke tests
   curl https://api.yourdomain.com/api/trpc
   
   # Check service status
   aws ecs describe-services --cluster dashboarduz-production --services dashboarduz-api
   ```

5. **Gradual Rollout** (if using canary)
   - Monitor canary metrics for 15 minutes
   - Check error rates and performance
   - Gradually increase traffic to new version
   - Full rollout after 30 minutes of stability

## Database Migrations

### Running Migrations

```bash
# Check migration status
pnpm --filter db migrate:status

# Run migrations
pnpm --filter db migrate:deploy

# Verify migrations
pnpm --filter db migrate:status
```

### Zero-Downtime Migrations

1. **Additive Changes Only**
   - New columns with defaults
   - New tables
   - New indexes (created concurrently)

2. **Multi-Step Process**
   ```sql
   -- Step 1: Add column with default (no downtime)
   ALTER TABLE leads ADD COLUMN new_field VARCHAR(255) DEFAULT '';
   
   -- Step 2: Backfill data (background job)
   UPDATE leads SET new_field = 'value' WHERE new_field = '';
   
   -- Step 3: Make column NOT NULL (after backfill)
   ALTER TABLE leads ALTER COLUMN new_field SET NOT NULL;
   ```

3. **Breaking Changes**
   - Requires maintenance window
   - Coordinate with team
   - Plan rollback procedure

## Rollback Procedures

### Application Rollback

1. **ECS Service Rollback**
   ```bash
   # Rollback to previous task definition
   aws ecs update-service \
     --cluster dashboarduz-production \
     --service dashboarduz-api \
     --task-definition dashboarduz-api:previous \
     --force-new-deployment
   ```

2. **GitHub Actions Rollback**
   - Use workflow_dispatch with previous commit SHA
   - Or manually trigger rollback job

3. **Database Rollback**
   ```bash
   # Restore from backup
   pnpm --filter db restore --s3 <backup-key>
   ```

### Emergency Rollback

If production is down:

1. **Immediate Actions**
   - Rollback ECS service to previous version
   - Check CloudWatch logs for errors
   - Verify database connectivity

2. **Investigation**
   - Review deployment logs
   - Check Sentry for errors
   - Review recent code changes

3. **Communication**
   - Notify team via Slack
   - Update status page
   - Document incident

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions Logs**
   - Identify failing step
   - Review error messages
   - Check environment variables

2. **Check ECS Service**
   ```bash
   aws ecs describe-services \
     --cluster dashboarduz-production \
     --services dashboarduz-api
   ```

3. **Check CloudWatch Logs**
   ```bash
   aws logs tail /ecs/dashboarduz-api --follow
   ```

### Service Not Starting

1. **Check Task Definition**
   - Verify container image exists
   - Check environment variables
   - Verify secrets in Secrets Manager

2. **Check Health Checks**
   - Verify health endpoint responds
   - Check health check configuration
   - Review startup logs

### Database Migration Fails

1. **Check Migration Status**
   ```bash
   pnpm --filter db migrate:status
   ```

2. **Review Migration Files**
   - Check for syntax errors
   - Verify SQL compatibility
   - Test in staging first

3. **Manual Intervention**
   - Connect to database
   - Review migration logs
   - Fix issues manually if needed

## Post-Deployment

### Verification Checklist

- [ ] Health endpoints responding
- [ ] API endpoints functional
- [ ] Database migrations applied
- [ ] Queue workers processing jobs
- [ ] Integrations connected
- [ ] Monitoring dashboards updated
- [ ] No error spikes in Sentry
- [ ] Performance metrics normal

### Monitoring

- Monitor CloudWatch dashboards for 1 hour
- Check Sentry for new errors
- Review Grafana dashboards
- Verify queue processing
- Check integration sync status

### Communication

- Update team on deployment status
- Document any issues encountered
- Update deployment log
- Schedule post-mortem if issues occurred

## Maintenance Windows

### Scheduled Maintenance

1. **Announcement**
   - Notify users 48 hours in advance
   - Update status page
   - Set maintenance mode flag

2. **During Maintenance**
   - Enable maintenance mode
   - Perform updates
   - Run database migrations
   - Verify functionality

3. **After Maintenance**
   - Disable maintenance mode
   - Verify all services
   - Monitor for issues
   - Update status page

## Best Practices

1. **Always test in staging first**
2. **Create backups before production deployments**
3. **Use feature flags for gradual rollouts**
4. **Monitor metrics during and after deployment**
5. **Have rollback plan ready**
6. **Document all deployments**
7. **Schedule deployments during low-traffic periods**
8. **Keep deployment windows short**

## Emergency Contacts

- **On-Call Engineer**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **Database Admin**: [Contact Info]
- **AWS Support**: [Support Plan Info]

## Related Documentation

- [Database Backup and Restore](./backup-restore.md)
- [Monitoring and Alerting](./monitoring.md)
- [Incident Response](./incident-response.md)
