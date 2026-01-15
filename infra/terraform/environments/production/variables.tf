variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "api_container_image" {
  description = "API container image URI"
  type        = string
  default     = "ghcr.io/your-org/dashboarduz:latest"
}

variable "worker_container_image" {
  description = "Worker container image URI"
  type        = string
  default     = "ghcr.io/your-org/dashboarduz:latest"
}

variable "alarm_email" {
  description = "Email for CloudWatch alarms"
  type        = string
}

variable "alarm_slack_webhook" {
  description = "Slack webhook for alerts"
  type        = string
  sensitive   = true
}
