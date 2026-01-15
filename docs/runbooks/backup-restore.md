# Backup and Restore Runbook

## Overview

This runbook describes procedures for backing up and restoring the Dashboarduz database.

## Backup Procedures

### Automated Backups

Backups are automatically created:
- **Production**: Daily at 2 AM UTC
- **Staging**: Daily at 3 AM UTC
- **Retention**: 30 days for production, 7 days for staging

### Manual Backup

```bash
# Create backup locally
pnpm --filter db backup

# Create backup and upload to S3
pnpm --filter db backup --s3
```

### Backup Verification

```bash
# List backups in S3
pnpm --filter db restore:list

# Verify backup file
pg_restore --list backup-file.sql
```

## Restore Procedures

### From Local Backup

```bash
# Restore from local backup file
pnpm --filter db restore <backup-file-path>
```

### From S3 Backup

```bash
# List available backups
pnpm --filter db restore:list

# Restore from S3
pnpm --filter db restore --s3 <s3-key>
```

### Point-in-Time Recovery

For RDS, use AWS Console or CLI:

```bash
# Restore to specific point in time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier dashboarduz-production-db \
  --target-db-instance-identifier dashboarduz-restored-db \
  --restore-time 2024-01-15T10:00:00Z
```

## Disaster Recovery

### Full System Restore

1. **Restore Database**
   ```bash
   pnpm --filter db restore --s3 <latest-backup>
   ```

2. **Restore Application**
   - Deploy previous known-good version
   - Verify environment variables
   - Check service health

3. **Verify Data Integrity**
   - Check tenant data
   - Verify integrations
   - Test critical workflows

### Partial Restore

1. **Identify Affected Data**
   - Review audit logs
   - Check backup timestamps
   - Identify corruption point

2. **Restore Specific Tables**
   ```sql
   -- Restore specific table from backup
   pg_restore -t leads backup-file.sql
   ```

3. **Verify Restore**
   - Check data integrity
   - Test affected features
   - Monitor for issues

## Backup Best Practices

1. **Regular Testing**
   - Test restore procedures monthly
   - Verify backup integrity
   - Document any issues

2. **Multiple Backups**
   - Keep local backups
   - Store in S3
   - Consider cross-region replication

3. **Backup Encryption**
   - All backups encrypted at rest
   - Use S3 server-side encryption
   - Secure backup access

4. **Monitoring**
   - Alert on backup failures
   - Monitor backup sizes
   - Track backup age

## Troubleshooting

### Backup Fails

1. **Check Database Connectivity**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. **Check Disk Space**
   ```bash
   df -h
   ```

3. **Check Permissions**
   - Verify database user permissions
   - Check S3 bucket permissions
   - Review IAM roles

### Restore Fails

1. **Check Backup File**
   ```bash
   file backup-file.sql
   pg_restore --list backup-file.sql
   ```

2. **Check Database State**
   - Verify database is accessible
   - Check for active connections
   - Review database logs

3. **Check Disk Space**
   - Ensure sufficient space for restore
   - Clean up temporary files

## Recovery Time Objectives (RTO)

- **Production**: 1 hour
- **Staging**: 4 hours
- **Development**: 8 hours

## Recovery Point Objectives (RPO)

- **Production**: 1 hour (point-in-time recovery)
- **Staging**: 24 hours
- **Development**: 7 days
