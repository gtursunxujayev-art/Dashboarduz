# Database Deployment Guide

This guide covers database migration, backup, and restore procedures for Dashboarduz.

## Overview

The database deployment strategy includes:
- **Migrations**: Automated schema changes using Prisma
- **Backups**: Automated daily backups with S3 storage
- **Restores**: Point-in-time recovery capabilities
- **Monitoring**: Migration status and health checks

## Prerequisites

1. **PostgreSQL** >= 14.0
2. **Prisma CLI** installed
3. **AWS CLI** configured (for S3 backups)
4. **pg_dump** and **pg_restore** utilities

## Migration Strategy

### Development Migrations

```bash
# Create a new migration
cd packages/db
pnpm migrate

# Apply migrations
pnpm migrate:deploy

# Check migration status
pnpm migrate:status
```

### Production Migrations

Migrations are automatically applied via GitHub Actions on deployment. Manual migration:

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:pass@host:5432/db"

# Run migrations
pnpm migrate:deploy
```

### Migration Best Practices

1. **Always test migrations locally first**
2. **Create backups before migrations**
3. **Review migration SQL before applying**
4. **Use transactions for reversible changes**
5. **Test rollback procedures**

## Backup Strategy

### Automated Backups

Backups are scheduled daily at 2 AM UTC:

```bash
# Create a backup
pnpm backup

# Create and upload to S3
pnpm backup:s3
```

### Manual Backups

```bash
# Local backup
tsx scripts/backup.ts create

# S3 backup
tsx scripts/backup.ts create --s3
```

### Backup Retention

- **Daily backups**: Kept for 7 days
- **Weekly backups**: Kept for 4 weeks
- **Monthly backups**: Kept for 12 months

### Backup Locations

- **Local**: `./backups/` directory
- **S3**: `s3://dashboarduz-backups/backups/`

## Restore Procedures

### From Local Backup

```bash
# Restore from local file
tsx scripts/restore.ts restore ./backups/backup-file.sql.gz
```

### From S3 Backup

```bash
# List available backups
pnpm restore:list

# Restore from S3
tsx scripts/restore.ts restore --s3 backups/backup-file.sql.gz
```

### Restore to Different Database

```bash
# Restore to staging database
DATABASE_URL="postgresql://user:pass@host:5432/staging_db" \
tsx scripts/restore.ts restore --s3 backups/backup-file.sql.gz
```

## Disaster Recovery

### Full Database Restore

1. **Stop application services**
2. **Create current backup** (if possible)
3. **Restore from backup**
4. **Verify data integrity**
5. **Restart services**

### Point-in-Time Recovery

For RDS instances, use AWS RDS point-in-time recovery:

```bash
# Restore to specific timestamp
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier dashboarduz-prod \
  --target-db-instance-identifier dashboarduz-restore \
  --restore-time 2024-01-15T10:00:00Z
```

## Migration Rollback

### Automatic Rollback

Prisma doesn't support automatic rollbacks. Use manual procedures:

1. **Create backup before migration**
2. **Apply migration**
3. **If issues occur, restore from backup**

### Manual Rollback

```bash
# Restore from pre-migration backup
tsx scripts/restore.ts restore --s3 backups/pre-migration-backup.sql.gz
```

## Monitoring

### Migration Status

```bash
# Check applied migrations
pnpm migrate:status
```

### Database Health

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

### Backup Verification

```bash
# List backups
pnpm restore:list

# Verify backup integrity
pg_restore --list backup-file.sql
```

## CI/CD Integration

### GitHub Actions

Migrations run automatically on deployment:

```yaml
- name: Run database migrations
  run: pnpm db:migrate:deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_PRODUCTION }}
```

### Pre-Deployment Checks

1. **Migration status check**
2. **Backup creation**
3. **Schema validation**

## Security

### Database Credentials

- Store credentials in AWS Secrets Manager
- Use IAM database authentication where possible
- Rotate credentials regularly

### Backup Encryption

- All backups encrypted at rest (S3)
- Use SSL/TLS for database connections
- Encrypt backup files before upload

## Troubleshooting

### Migration Failures

1. **Check database connection**
2. **Verify migration SQL syntax**
3. **Check for conflicting migrations**
4. **Review Prisma migration logs**

### Backup Failures

1. **Verify database connectivity**
2. **Check disk space**
3. **Verify AWS credentials (for S3)**
4. **Check S3 bucket permissions**

### Restore Failures

1. **Verify backup file integrity**
2. **Check database permissions**
3. **Ensure sufficient disk space**
4. **Verify target database exists**

## Best Practices

1. **Always backup before migrations**
2. **Test migrations in staging first**
3. **Monitor migration execution time**
4. **Keep migration files small and focused**
5. **Document breaking changes**
6. **Use feature flags for risky migrations**
7. **Schedule migrations during low-traffic periods**

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- [AWS RDS Backup and Restore](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html)
