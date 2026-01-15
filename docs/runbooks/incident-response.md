# Incident Response Runbook

## Overview

This runbook provides procedures for responding to incidents in the Dashboarduz platform.

## Incident Severity Levels

### P0 - Critical
- Complete service outage
- Data loss or corruption
- Security breach
- **Response Time**: Immediate
- **Resolution Target**: 1 hour

### P1 - High
- Major feature unavailable
- Performance degradation (>50%)
- Partial data loss
- **Response Time**: 15 minutes
- **Resolution Target**: 4 hours

### P2 - Medium
- Minor feature unavailable
- Performance issues (<50%)
- Non-critical errors
- **Response Time**: 1 hour
- **Resolution Target**: 24 hours

### P3 - Low
- Cosmetic issues
- Minor bugs
- Enhancement requests
- **Response Time**: 4 hours
- **Resolution Target**: 1 week

## Incident Response Process

### 1. Detection

**Sources:**
- Monitoring alerts (CloudWatch, Sentry)
- User reports
- Automated health checks
- Team notifications

**Initial Assessment:**
- Check alert details
- Verify incident scope
- Determine severity level
- Notify on-call engineer

### 2. Triage

**Gather Information:**
```bash
# Check service health
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/health/queues

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=dashboarduz-api

# Check recent errors
# Review Sentry dashboard
# Check CloudWatch logs
```

**Document:**
- Incident start time
- Affected services
- Error messages
- User impact

### 3. Response

**Immediate Actions:**
1. Acknowledge incident
2. Update status page
3. Notify team via Slack
4. Create incident ticket

**Investigation:**
1. Review logs and metrics
2. Check recent deployments
3. Verify database connectivity
4. Check external service status

**Mitigation:**
1. Apply quick fixes if available
2. Rollback if recent deployment
3. Scale services if needed
4. Enable maintenance mode if necessary

### 4. Resolution

**Verification:**
- Test affected functionality
- Monitor metrics for stability
- Verify no error spikes
- Check user reports

**Communication:**
- Update status page
- Notify team of resolution
- Document resolution steps

### 5. Post-Incident

**Post-Mortem:**
- Schedule within 48 hours
- Document timeline
- Identify root cause
- Create action items
- Update runbooks

## Common Incidents

### Service Down

**Symptoms:**
- Health checks failing
- 5xx errors
- No response from API

**Actions:**
1. Check ECS service status
2. Review task logs
3. Verify container image
4. Check resource limits
5. Restart service if needed

**Commands:**
```bash
# Check ECS service
aws ecs describe-services \
  --cluster dashboarduz-production \
  --services dashboarduz-api

# Check task status
aws ecs list-tasks \
  --cluster dashboarduz-production \
  --service-name dashboarduz-api

# View logs
aws logs tail /ecs/dashboarduz-api --follow
```

### Database Issues

**Symptoms:**
- Connection timeouts
- Slow queries
- High connection count

**Actions:**
1. Check RDS status
2. Review connection pool
3. Check for long-running queries
4. Verify database size
5. Review slow query log

**Commands:**
```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier dashboarduz-production-db

# Connect and check
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"
```

### High Error Rate

**Symptoms:**
- Increased error rate in Sentry
- 4xx/5xx errors
- User complaints

**Actions:**
1. Review Sentry errors
2. Check recent deployments
3. Review application logs
4. Check external API status
5. Verify environment variables

### Queue Backlog

**Symptoms:**
- High number of waiting jobs
- Slow job processing
- Failed jobs accumulating

**Actions:**
1. Check worker service status
2. Review queue metrics
3. Scale workers if needed
4. Check for stuck jobs
5. Review dead letter queue

**Commands:**
```bash
# Check queue status
curl https://api.yourdomain.com/health/queues

# Scale workers
aws ecs update-service \
  --cluster dashboarduz-production \
  --service dashboarduz-worker \
  --desired-count 4
```

### Performance Degradation

**Symptoms:**
- High response times
- Slow page loads
- Timeout errors

**Actions:**
1. Check CPU/memory usage
2. Review database performance
3. Check cache hit rates
4. Review slow queries
5. Scale services if needed

## Escalation

### When to Escalate

- P0 incidents not resolved in 30 minutes
- P1 incidents not resolved in 2 hours
- Need additional expertise
- Security-related incidents
- Data loss incidents

### Escalation Path

1. **On-Call Engineer** (First responder)
2. **Team Lead** (If unresolved in 1 hour)
3. **Engineering Manager** (If unresolved in 2 hours)
4. **CTO** (For P0 incidents)

## Communication Templates

### Initial Alert
```
🚨 INCIDENT: [Severity] [Service] - [Brief Description]

Status: Investigating
Start Time: [Timestamp]
Affected: [Services/Users]
On-Call: [Engineer Name]

Investigating...
```

### Status Update
```
📊 INCIDENT UPDATE: [Incident ID]

Status: [Investigating/Mitigating/Resolved]
Update: [What we know]
Actions: [What we're doing]
ETA: [Estimated resolution time]
```

### Resolution
```
✅ INCIDENT RESOLVED: [Incident ID]

Resolved: [Timestamp]
Duration: [Duration]
Root Cause: [Brief description]
Actions Taken: [What was done]
Post-Mortem: [Scheduled for date]
```

## Tools and Resources

### Monitoring
- CloudWatch Dashboards
- Sentry Error Tracking
- Grafana Metrics
- Status Page

### Communication
- Slack #incidents channel
- Status page updates
- Email notifications
- PagerDuty (for critical)

### Documentation
- Architecture diagrams
- Service dependencies
- Runbooks
- Contact information

## Prevention

### Regular Activities
- Weekly health checks
- Monthly disaster recovery drills
- Quarterly security audits
- Continuous monitoring improvements

### Best Practices
- Proactive monitoring
- Regular backups
- Automated testing
- Gradual deployments
- Feature flags
- Canary releases
