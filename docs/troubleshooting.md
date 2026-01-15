# Troubleshooting Guide

## Common Issues and Solutions

### API Service Issues

#### Service Not Responding

**Symptoms:**
- Health checks failing
- 502/503 errors
- Timeout errors

**Diagnosis:**
```bash
# Check ECS service status
aws ecs describe-services \
  --cluster dashboarduz-production \
  --services dashboarduz-api

# Check task logs
aws logs tail /ecs/dashboarduz-api --follow

# Check health endpoint
curl -v https://api.yourdomain.com/health
```

**Solutions:**
1. Check container logs for errors
2. Verify environment variables
3. Check database connectivity
4. Verify Redis connectivity
5. Restart service if needed

#### High Memory Usage

**Symptoms:**
- Memory alerts
- OOM kills
- Slow performance

**Solutions:**
1. Increase memory allocation
2. Check for memory leaks
3. Review heap dumps
4. Optimize code
5. Scale horizontally

#### High CPU Usage

**Symptoms:**
- CPU alerts
- Slow response times
- Request queuing

**Solutions:**
1. Check for CPU-intensive operations
2. Optimize database queries
3. Add caching
4. Scale horizontally
5. Review code for inefficiencies

### Database Issues

#### Connection Pool Exhausted

**Symptoms:**
- "Too many connections" errors
- Slow queries
- Timeout errors

**Diagnosis:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection by database
SELECT datname, count(*) 
FROM pg_stat_activity 
GROUP BY datname;

-- Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' 
  AND now() - pg_stat_activity.query_start > interval '5 minutes';
```

**Solutions:**
1. Increase connection pool size
2. Reduce connection timeout
3. Kill idle connections
4. Optimize queries
5. Use read replicas

#### Slow Queries

**Symptoms:**
- High query latency
- Timeout errors
- User complaints

**Diagnosis:**
```sql
-- Enable slow query log
SET log_min_duration_statement = 1000; -- Log queries > 1 second

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- Analyze query plans
EXPLAIN ANALYZE SELECT ...;
```

**Solutions:**
1. Add missing indexes
2. Optimize query structure
3. Update table statistics
4. Consider partitioning
5. Use read replicas for analytics

#### Database Lock Issues

**Symptoms:**
- Queries hanging
- Deadlock errors
- Transaction timeouts

**Diagnosis:**
```sql
-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Check blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_query,
       blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Solutions:**
1. Kill blocking queries
2. Reduce transaction time
3. Use appropriate isolation levels
4. Optimize locking strategy
5. Review application code

### Redis Issues

#### Memory Issues

**Symptoms:**
- Memory alerts
- Eviction warnings
- Performance degradation

**Diagnosis:**
```bash
# Check Redis memory
redis-cli INFO memory

# Check key count
redis-cli DBSIZE

# Check large keys
redis-cli --bigkeys
```

**Solutions:**
1. Increase Redis memory
2. Set appropriate TTLs
3. Remove unused keys
4. Optimize data structures
5. Use Redis eviction policies

#### Connection Issues

**Symptoms:**
- Connection errors
- Timeout errors
- Queue processing stops

**Diagnosis:**
```bash
# Check Redis connectivity
redis-cli -h <host> -p 6379 PING

# Check connection count
redis-cli INFO clients
```

**Solutions:**
1. Check security groups
2. Verify network connectivity
3. Check Redis service status
4. Review connection pool settings
5. Restart Redis if needed

### Queue Issues

#### Queue Backlog

**Symptoms:**
- High number of waiting jobs
- Slow processing
- User complaints

**Diagnosis:**
```bash
# Check queue metrics
curl https://api.yourdomain.com/health/queues

# Check BullMQ dashboard
# Or use Redis CLI
redis-cli LLEN bull:webhook-processing:waiting
```

**Solutions:**
1. Scale worker instances
2. Check for stuck jobs
3. Review job processing time
4. Optimize job logic
5. Increase worker concurrency

#### Failed Jobs

**Symptoms:**
- High failure rate
- Dead letter queue growing
- Error alerts

**Diagnosis:**
```bash
# Check failed jobs
redis-cli LLEN bull:webhook-processing:failed

# Review job errors in logs
aws logs tail /ecs/dashboarduz-worker --follow
```

**Solutions:**
1. Review error logs
2. Fix underlying issues
3. Retry failed jobs
4. Update job retry logic
5. Monitor for patterns

### Integration Issues

#### AmoCRM Sync Fails

**Symptoms:**
- Leads not syncing
- Integration errors
- Webhook failures

**Diagnosis:**
```bash
# Check integration status
curl https://api.yourdomain.com/api/trpc/integrations.list

# Check webhook events
# Review database for webhook_events table
```

**Solutions:**
1. Verify OAuth tokens
2. Check token expiration
3. Review webhook configuration
4. Check AmoCRM API status
5. Review error logs

#### Telegram Bot Not Responding

**Symptoms:**
- Messages not sent
- Bot errors
- Webhook failures

**Diagnosis:**
```bash
# Test bot token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

**Solutions:**
1. Verify bot token
2. Check webhook URL
3. Review bot permissions
4. Check rate limits
5. Review error logs

### Authentication Issues

#### JWT Token Invalid

**Symptoms:**
- 401 errors
- Users logged out
- Token expiration errors

**Diagnosis:**
```bash
# Check JWT secret
# Verify token expiration
# Review authentication logs
```

**Solutions:**
1. Verify JWT_SECRET matches
2. Check token expiration settings
3. Review token generation
4. Check clock synchronization
5. Clear and regenerate tokens

#### OTP Not Sending

**Symptoms:**
- OTP requests fail
- Users can't verify
- Provider errors

**Diagnosis:**
```bash
# Check OTP provider status
# Review provider logs
# Check API credentials
```

**Solutions:**
1. Verify provider credentials
2. Check provider service status
3. Review rate limits
4. Check phone number format
5. Review error logs

## Diagnostic Commands

### System Health Check

```bash
# Full health check
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/health/queues
curl https://api.yourdomain.com/health/detailed

# Check metrics
curl https://api.yourdomain.com/metrics
```

### Database Diagnostics

```bash
# Connection test
psql $DATABASE_URL -c "SELECT version();"

# Check RLS
psql $DATABASE_URL -c "SHOW row_security;"

# Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### Redis Diagnostics

```bash
# Connection test
redis-cli -h <host> PING

# Memory info
redis-cli INFO memory

# Queue status
redis-cli LLEN bull:webhook-processing:waiting
```

### ECS Diagnostics

```bash
# Service status
aws ecs describe-services \
  --cluster dashboarduz-production \
  --services dashboarduz-api

# Task status
aws ecs list-tasks \
  --cluster dashboarduz-production \
  --service-name dashboarduz-api

# Logs
aws logs tail /ecs/dashboarduz-api --follow
```

## Getting Help

### Internal Resources

1. **Documentation**
   - Architecture docs
   - API documentation
   - Runbooks

2. **Monitoring**
   - CloudWatch dashboards
   - Sentry errors
   - Grafana metrics

3. **Team**
   - Slack #engineering channel
   - On-call engineer
   - Team lead

### External Resources

- AWS Support (if on support plan)
- Service provider documentation
- Community forums
- Stack Overflow

## Prevention

### Best Practices

1. **Monitoring**
   - Set up comprehensive alerts
   - Regular health checks
   - Proactive monitoring

2. **Testing**
   - Regular load testing
   - Chaos engineering
   - Disaster recovery drills

3. **Documentation**
   - Keep runbooks updated
   - Document known issues
   - Share learnings

4. **Code Quality**
   - Code reviews
   - Automated testing
   - Error handling
   - Logging
