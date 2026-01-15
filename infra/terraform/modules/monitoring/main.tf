# CloudWatch Monitoring Module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "api_service_name" {
  description = "API service name"
  type        = string
}

variable "worker_service_name" {
  description = "Worker service name"
  type        = string
}

variable "alarm_email" {
  description = "Email for alarms"
  type        = string
}

variable "alarm_slack_webhook" {
  description = "Slack webhook for alarms"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name = "${var.environment}-alarms"

  tags = var.tags
}

# Email Subscription
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarms for API Service
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "${var.api_service_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ServiceName = var.api_service_name
    ClusterName = var.environment
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "api_memory_high" {
  alarm_name          = "${var.api_service_name}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ServiceName = var.api_service_name
    ClusterName = var.environment
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "api_task_count_low" {
  alarm_name          = "${var.api_service_name}-task-count-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RunningTaskCount"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This metric monitors ECS running task count"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ServiceName = var.api_service_name
    ClusterName = var.environment
  }

  tags = var.tags
}

# CloudWatch Alarms for Worker Service
resource "aws_cloudwatch_metric_alarm" "worker_cpu_high" {
  alarm_name          = "${var.worker_service_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ServiceName = var.worker_service_name
    ClusterName = var.environment
  }

  tags = var.tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", label = "API CPU" }],
            ["AWS/ECS", "MemoryUtilization", { stat = "Average", label = "API Memory" }],
            [".", "RunningTaskCount", { stat = "Average", label = "API Tasks" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "API Service Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", label = "Worker CPU" }],
            ["AWS/ECS", "MemoryUtilization", { stat = "Average", label = "Worker Memory" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Worker Service Metrics"
        }
      }
    ]
  })

  tags = var.tags
}

# Outputs
output "alarm_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}
