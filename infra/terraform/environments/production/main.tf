terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "dashboarduz-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"
  
  environment = "production"
  vpc_cidr    = "10.0.0.0/16"
  
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.10.0/24", "10.0.20.0/24"]
  
  availability_zones = ["us-east-1a", "us-east-1b"]
  
  tags = {
    Environment = "production"
    Project     = "dashboarduz"
  }
}

# RDS PostgreSQL Module
module "rds" {
  source = "../../modules/rds"
  
  environment = "production"
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
  
  db_instance_class    = "db.t3.medium"
  db_allocated_storage = 100
  db_name              = "dashboarduz_production"
  db_username          = var.db_username
  db_password          = var.db_password
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  multi_az = true
  
  tags = {
    Environment = "production"
    Project     = "dashboarduz"
  }
}

# ElastiCache Redis Module
module "redis" {
  source = "../../modules/redis"
  
  environment = "production"
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
  
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 2
  automatic_failover   = true
  multi_az             = true
  
  tags = {
    Environment = "production"
    Project     = "dashboarduz"
  }
}

# ECS Cluster Module
module "ecs" {
  source = "../../modules/ecs"
  
  environment = "production"
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.public_subnet_ids
  
  cluster_name = "dashboarduz-production"
  
  # API Service
  api_service = {
    name              = "dashboarduz-api"
    desired_count     = 2
    cpu               = 1024
    memory            = 2048
    container_image   = var.api_container_image
    container_port    = 3001
  }
  
  # Worker Service
  worker_service = {
    name              = "dashboarduz-worker"
    desired_count     = 2
    cpu               = 512
    memory            = 1024
    container_image   = var.worker_container_image
  }
  
  database_url = module.rds.database_url
  redis_url    = module.redis.redis_url
  
  tags = {
    Environment = "production"
    Project     = "dashboarduz"
  }
}

# Application Load Balancer
module "alb" {
  source = "../../modules/alb"
  
  environment = "production"
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.public_subnet_ids
  
  name = "dashboarduz-production-alb"
  
  target_group_arns = [module.ecs.api_target_group_arn]
  
  enable_waf = true
  
  tags = {
    Environment = "production"
    Project     = "dashboarduz"
  }
}

# S3 Bucket for Storage
module "s3" {
  source = "../../modules/s3"
  
  environment = "production"
  
  bucket_name = "dashboarduz-production-storage"
  
  versioning_enabled = true
  lifecycle_rules = [
    {
      id      = "delete-old-versions"
      enabled = true
      noncurrent_version_expiration = {
        days = 90
      }
    }
  ]
  
  tags = {
    Environment = "production"
    Project     = "dashboarduz"
  }
}

# CloudWatch Alarms
module "monitoring" {
  source = "../../modules/monitoring"
  
  environment = "production"
  
  api_service_name  = module.ecs.api_service_name
  worker_service_name = module.ecs.worker_service_name
  
  alarm_email = var.alarm_email
  alarm_slack_webhook = var.alarm_slack_webhook
  
  tags = {
    Environment = "production"
    Project     = "dashboarduz"
  }
}
