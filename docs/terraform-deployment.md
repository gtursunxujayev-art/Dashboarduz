# Terraform Infrastructure Deployment Guide

This guide explains how to deploy the Dashboarduz infrastructure using Terraform.

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.5.0 installed
3. **AWS Account** with necessary permissions
4. **Domain name** configured (for SSL certificates)

## AWS Permissions Required

The AWS user/role needs the following permissions:
- EC2 (VPC, Security Groups, Load Balancers)
- ECS (Clusters, Services, Task Definitions)
- RDS (Database instances)
- ElastiCache (Redis clusters)
- S3 (Storage buckets)
- IAM (Roles and policies)
- CloudWatch (Logs, Metrics, Alarms)
- ACM (SSL certificates)
- WAF (Web Application Firewall)

## Configuration

### 1. Set Environment Variables

```bash
export AWS_REGION=us-east-1
export AWS_PROFILE=your-profile
export TF_VAR_environment=production
export TF_VAR_db_password=$(openssl rand -base64 32)
export TF_VAR_jwt_secret=$(openssl rand -base64 32)
```

### 2. Configure Terraform Variables

Edit `infra/terraform/environments/production/variables.tf`:

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "yourdomain.com"
}
```

### 3. Initialize Terraform

```bash
cd infra/terraform/environments/production
terraform init
```

### 4. Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan carefully to ensure all resources are correct.

### 5. Apply Configuration

```bash
terraform apply tfplan
```

## Infrastructure Components

### VPC Module
- Creates VPC with public and private subnets
- Configures NAT Gateway for private subnet internet access
- Sets up route tables and internet gateway

### RDS Module
- PostgreSQL database instance
- Multi-AZ deployment for high availability
- Automated backups enabled
- Encryption at rest

### ElastiCache Module
- Redis cluster for caching and queues
- Multi-AZ deployment
- Automatic failover

### ECS Module
- ECS cluster with Fargate launch type
- API service with auto-scaling
- Worker service for background jobs
- Task definitions with proper resource limits

### ALB Module
- Application Load Balancer
- HTTPS listener with SSL certificate
- WAF integration for security
- Health checks configured

### S3 Module
- Storage bucket for file uploads
- Versioning enabled
- Lifecycle policies
- Encryption at rest

### Monitoring Module
- CloudWatch dashboards
- SNS topics for alerts
- Metric alarms for CPU, memory, and task count

## Environment-Specific Deployments

### Production

```bash
cd infra/terraform/environments/production
terraform workspace select production
terraform apply
```

### Staging

```bash
cd infra/terraform/environments/staging
terraform workspace select staging
terraform apply
```

## Outputs

After deployment, Terraform outputs important values:

```bash
terraform output
```

Key outputs:
- `database_url`: PostgreSQL connection string
- `redis_url`: Redis connection string
- `alb_dns_name`: Load balancer DNS name
- `ecs_cluster_name`: ECS cluster name
- `s3_bucket_name`: S3 bucket name

## Updating Infrastructure

### Update Configuration

1. Modify Terraform files
2. Run `terraform plan` to preview changes
3. Review changes carefully
4. Apply with `terraform apply`

### Update ECS Services

ECS services can be updated via:
- GitHub Actions (automated)
- AWS Console (manual)
- Terraform (infrastructure changes)

## Destroying Infrastructure

⚠️ **Warning**: This will delete all resources!

```bash
terraform destroy
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check AWS credentials
   - Verify IAM permissions

2. **Resource Already Exists**
   - Check for existing resources
   - Use `terraform import` if needed

3. **SSL Certificate Issues**
   - Ensure domain is verified in Route 53
   - Wait for certificate validation

4. **Database Connection Issues**
   - Check security group rules
   - Verify database endpoint

## Security Best Practices

1. **Secrets Management**
   - Use AWS Secrets Manager for sensitive values
   - Never commit secrets to version control

2. **Network Security**
   - Use private subnets for databases
   - Restrict security group rules
   - Enable VPC Flow Logs

3. **Encryption**
   - Enable encryption at rest for RDS and S3
   - Use TLS for all connections
   - Rotate encryption keys regularly

4. **Access Control**
   - Use IAM roles for ECS tasks
   - Implement least privilege principle
   - Enable MFA for AWS console access

## Cost Optimization

1. **Right-Sizing**
   - Monitor resource usage
   - Adjust instance sizes based on metrics

2. **Reserved Instances**
   - Use RDS Reserved Instances for production
   - Consider Savings Plans for ECS

3. **Lifecycle Policies**
   - Configure S3 lifecycle policies
   - Archive old logs and backups

## Monitoring

- CloudWatch Dashboards: View system metrics
- CloudWatch Alarms: Get notified of issues
- CloudWatch Logs: Centralized logging

## Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
