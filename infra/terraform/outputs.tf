# Database outputs
output "database_url" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = false
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
  sensitive   = false
}

# Redis outputs
output "redis_url" {
  description = "Redis connection string"
  value       = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:6379"
  sensitive   = false
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
  sensitive   = false
}

# ECS outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
  sensitive   = false
}

output "ecs_api_service_name" {
  description = "ECS API service name"
  value       = module.ecs.api_service_name
  sensitive   = false
}

output "ecs_worker_service_name" {
  description = "ECS worker service name"
  value       = module.ecs.worker_service_name
  sensitive   = false
}

# ALB outputs
output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
  sensitive   = false
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = module.alb.alb_arn
  sensitive   = false
}

# S3 outputs
output "s3_bucket_name" {
  description = "S3 bucket name for storage"
  value       = module.s3.bucket_name
  sensitive   = false
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.bucket_arn
  sensitive   = false
}

# VPC outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
  sensitive   = false
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr
  sensitive   = false
}

# Monitoring outputs
output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
  sensitive   = false
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = module.monitoring.sns_topic_arn
  sensitive   = false
}
