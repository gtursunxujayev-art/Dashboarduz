# ElastiCache Redis Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for Redis"
  type        = list(string)
}

variable "node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "automatic_failover" {
  description = "Enable automatic failover"
  type        = bool
  default     = false
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-redis-subnet-group"
    }
  )
}

# Security Group for Redis
resource "aws_security_group" "redis" {
  name        = "${var.environment}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_id != "" ? data.aws_vpc.main[0].cidr_block : "10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-redis-sg"
    }
  )
}

data "aws_vpc" "main" {
  count = var.vpc_id != "" ? 1 : 0
  id    = var.vpc_id
}

# ElastiCache Cluster
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${var.environment}-redis"
  engine               = "redis"
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = "default.redis7"
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  port                 = 6379
  
  snapshot_retention_limit = var.environment == "production" ? 5 : 1
  snapshot_window         = "03:00-05:00"
  
  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-redis"
    }
  )
}

# Replication Group (for Multi-AZ)
resource "aws_elasticache_replication_group" "main" {
  count = var.multi_az ? 1 : 0
  
  replication_group_id       = "${var.environment}-redis-replication"
  description                = "Redis replication group for ${var.environment}"
  
  node_type                  = var.node_type
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = var.num_cache_nodes
  automatic_failover_enabled = var.automatic_failover
  multi_az_enabled           = var.multi_az
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  snapshot_retention_limit = var.environment == "production" ? 5 : 1
  snapshot_window         = "03:00-05:00"
  
  tags = merge(
    var.tags,
    {
      Name = "${var.environment}-redis-replication"
    }
  )
}

# Outputs
output "redis_url" {
  description = "Redis connection URL"
  value       = var.multi_az ? aws_elasticache_replication_group.main[0].configuration_endpoint_address : aws_elasticache_cluster.main.cache_nodes[0].address
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = var.multi_az ? aws_elasticache_replication_group.main[0].configuration_endpoint_address : aws_elasticache_cluster.main.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}
