# Monitoring and Alerting Setup Guide

This guide covers setting up comprehensive monitoring and alerting for Dashboarduz.

## Overview

The monitoring stack includes:
- **CloudWatch**: AWS-native metrics and logs
- **Prometheus**: Custom metrics and alerting
- **Grafana**: Visualization and dashboards
- **Sentry**: Error tracking and performance monitoring
- **SNS**: Alert notifications

## Components

### 1. CloudWatch

#### Metrics Collected

- **ECS Service Metrics**:
  - CPU utilization
  - Memory utilization
  - Running task count
  - Network I/O

- **RDS Metrics**:
  - CPU utilization
  - Database connections
  - Read/Write IOPS
  - Storage space

- **ElastiCache Metrics**:
  - CPU utilization
  - Memory usage
  - Cache hits/misses
  - Network I/O

- **ALB Metrics**:
  - Request count
  - Response time
  - Error rates
  - Target response time

#### Logs

- **ECS Task Logs**: Application logs from containers
- **VPC Flow Logs**: Network traffic logs
- **CloudTrail**: API call logs

### 2. Prometheus

#### Metrics Exposed

- HTTP request metrics
- Queue job metrics
- Database query metrics
- Custom business metrics

#### Alert Rules

See `monitoring/alerts/alerts.yml` for alert definitions.

### 3. Grafana

#### Dashboards

- **System Health**: Infrastructure metrics
- **Business Metrics**: Application-specific metrics
- **API Performance**: Request/response metrics
- **Database Performance**: Query performance

### 4. Sentry

#### Error Tracking

- JavaScript errors (frontend)
- Node.js errors (backend)
- Performance monitoring
- Release tracking

## Setup Instructions

### CloudWatch Setup

1. **Enable ECS Logging**:
   ```hcl
   # In ECS task definition
   logConfiguration {
     logDriver = "awslogs"
     options = {
       "awslogs-group" = "/ecs/dashboarduz-api"
       "awslogs-region" = "us-east-1"
       "awslogs-stream-prefix" = "ecs"
     }
   }
   ```

2. **Create CloudWatch Dashboard**:
   - Go to CloudWatch Console
   - Create dashboard
   - Add widgets for key metrics

3. **Set Up Alarms**:
   - Use Terraform module (already configured)
   - Or create manually in CloudWatch Console

### Prometheus Setup

1. **Install Prometheus**:
   ```bash
   # Using Helm
   helm install prometheus prometheus-community/kube-prometheus-stack
   ```

2. **Configure Scraping**:
   ```yaml
   # prometheus.yml
   scrape_configs:
     - job_name: 'dashboarduz-api'
       static_configs:
         - targets: ['api:3001']
   ```

3. **Deploy Alertmanager**:
   ```bash
   helm install alertmanager prometheus-community/alertmanager
   ```

### Grafana Setup

1. **Install Grafana**:
   ```bash
   helm install grafana grafana/grafana
   ```

2. **Import Dashboards**:
   - Import `monitoring/dashboards/system-health.json`
   - Import `monitoring/dashboards/business-metrics.json`

3. **Configure Data Sources**:
   - Add Prometheus data source
   - Add CloudWatch data source (if using AWS)

### Sentry Setup

1. **Create Sentry Project**:
   - Go to sentry.io
   - Create new project
   - Get DSN

2. **Configure Environment Variables**:
   ```bash
   SENTRY_DSN=https://xxx@sentry.io/xxx
   SENTRY_ENVIRONMENT=production
   ```

3. **Initialize Sentry**:
   - Backend: Already configured in `apps/api/src/services/observability.ts`
   - Frontend: Add to `apps/web/src/app/layout.tsx`

## Alert Configuration

### Alert Channels

1. **Email**: Configured via SNS
2. **Slack**: Webhook URL in secrets
3. **PagerDuty**: Integration available

### Alert Severity Levels

- **Critical**: Immediate action required
- **Warning**: Attention needed, but not urgent
- **Info**: Informational only

### Key Alerts

1. **Service Down**: API or worker service unavailable
2. **High CPU/Memory**: Resource exhaustion
3. **High Error Rate**: Application errors
4. **Database Issues**: Connection or performance problems
5. **Queue Backlog**: Jobs piling up

## Monitoring Best Practices

### 1. Set Appropriate Thresholds

- Base thresholds on historical data
- Adjust based on traffic patterns
- Use percentiles, not averages

### 2. Avoid Alert Fatigue

- Use alert grouping
- Set appropriate evaluation periods
- Use different channels for different severities

### 3. Monitor Business Metrics

- Track user-facing metrics
- Monitor conversion rates
- Track feature usage

### 4. Regular Reviews

- Review alerts weekly
- Adjust thresholds monthly
- Archive old dashboards

## Troubleshooting

### Missing Metrics

1. **Check metric collection**:
   ```bash
   curl http://api:3001/metrics
   ```

2. **Verify Prometheus scraping**:
   - Check Prometheus targets
   - Review scrape logs

3. **Check CloudWatch permissions**:
   - Verify IAM roles
   - Check CloudWatch agent

### Alert Not Firing

1. **Check alert rule syntax**
2. **Verify metric exists**
3. **Check evaluation period**
4. **Review alertmanager configuration**

### High Alert Volume

1. **Increase thresholds**
2. **Add alert grouping**
3. **Use alert suppression**
4. **Review alert rules**

## Cost Optimization

### CloudWatch Costs

- Use log retention policies
- Aggregate metrics where possible
- Use custom metrics sparingly

### Prometheus Costs

- Set retention periods
- Use downsampling
- Archive old data

## Additional Resources

- [CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
