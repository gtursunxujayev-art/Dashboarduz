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
    key    = "staging/terraform.tfstate"
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
  
  environment = "staging"
  vpc_cidr    = "10.1.0.0/16"
  
  public_subnets  = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnets = ["10.1.10.0/24", "10.1.20.0/24"]
  
  availability_zones = ["us-east-1a", "us-east-1b"]
  
  tags = {
    Environment = "staging"
    Project     = "dashboarduz"
  }
}

# RDS PostgreSQL Module
module "rds" {
  source = "../../modules/rds"
  
  environment = "staging"
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
  
  db_instance_class    = "db.t3.small"
  db_allocated_storage  = 50
  db_name              = "dashboarduz_staging"
  db_username          = var.db_username
  db_password          = var.db_password
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  multi_az = false  # Single AZ for staging
  
  tags = {
    Environment = "staging"
    Project     = "dashboarduz"
  }
}

# ElastiCache Redis Module
module "redis" {
  source = "../../modules/redis"
  
  environment = "staging"
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
  
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  automatic_failover   = false
  multi_az             = false
  
  tags = {
    Environment = "staging"
    Project     = "dashboarduz"
  }
}

# ECS Cluster Module
module "ecs" {
  source = "../../modules/ecs"
  
  environment = "staging"
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.public_subnet_ids
  
  cluster_name = "dashboarduz-staging"
  
  # API Service
  api_service = {
    name              = "dashboarduz-api-staging"
    desired_count     = 1
    cpu               = 512
    memory            = 1024
    container_image   = var.api_container_image
    container_port    = 3001
  }
  
  # Worker Service
  worker_service = {
    name              = "dashboarduz-worker-staging"
    desired_count     = 1
    cpu               = 256
    memory            = 512
    container_image   = var.worker_container_image
  }
  
  database_url = module.rds.database_url
  redis_url    = module.redis.redis_url
  
  tags = {
    Environment = "staging"
    Project     = "dashboarduz"
  }
}

# Application Load Balancer
module "alb" {
  source = "../../modules/alb"
  
  environment = "staging"
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.public_subnet_ids
  
  name = "dashboarduz-staging-alb"
  
  target_group_arns = [module.ecs.api_target_group_arn]
  
  enable_waf = false  # WAF not needed for staging
  
  tags = {
    Environment = "staging"
    Project     = "dashboarduz"
  }
}

# S3 Bucket for Storage
module "s3" {
  source = "../../modules/s3"
  
  environment = "staging"
  
  bucket_name = "dashboarduz-staging-storage"
  
  versioning_enabled = false  # No versioning for staging
  
  tags = {
    Environment = "staging"
    Project     = "dashboarduz"
  }
}
