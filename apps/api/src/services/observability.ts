// Observability setup - Sentry, logging, metrics

import * as Sentry from '@sentry/node';

// Initialize Sentry
export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express(),
      ],
      beforeSend(event, hint) {
        // Add custom context before sending to Sentry
        if (hint && hint.originalException) {
          event.extra = {
            ...event.extra,
            originalException: hint.originalException.toString(),
          };
        }
        return event;
      },
    });
  }
}

// Set Sentry user context
export function setSentryUserContext(userId?: string, tenantId?: string, email?: string) {
  if (process.env.SENTRY_DSN && userId) {
    Sentry.setUser({
      id: userId,
      email: email,
      ip_address: '{{auto}}',
      tenant_id: tenantId,
    });
  }
}

// Clear Sentry user context
export function clearSentryUserContext() {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

// Structured logging
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

export function log(level: LogLevel, message: string, context?: LogContext) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'dashboarduz-api',
    ...context,
  };

  // Format log based on environment
  if (process.env.NODE_ENV === 'production') {
    // JSON format for structured logging
    console.log(JSON.stringify(logEntry));
    
    // Send to external logging service if configured
    if (process.env.LOGGING_SERVICE_URL) {
      // In production, you would send to Datadog, CloudWatch, etc.
      // This is a placeholder for actual implementation
      fetch(process.env.LOGGING_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      }).catch(err => {
        console.error('Failed to send log to external service:', err);
      });
    }
  } else {
    // Human-readable format for development
    const color = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    }[level];
    
    const reset = '\x1b[0m';
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`);
    if (context && Object.keys(context).length > 0) {
      console.log(`${color}Context: ${JSON.stringify(context, null, 2)}${reset}`);
    }
  }

  // Send errors to Sentry
  if (level === LogLevel.ERROR && process.env.SENTRY_DSN) {
    const error = new Error(message);
    error.name = 'LoggedError';
    
    Sentry.captureException(error, {
      level: 'error',
      extra: context,
      tags: {
        service: 'dashboarduz-api',
        tenantId: context?.tenantId,
        userId: context?.userId,
      },
    });
  }
}

// Structured logging with automatic context
export function logWithContext(
  level: LogLevel,
  message: string,
  options?: {
    tenantId?: string;
    userId?: string;
    requestId?: string;
    operation?: string;
    duration?: number;
    [key: string]: any;
  }
) {
  const context: LogContext = {
    ...options,
  };

  // Add performance metrics if duration provided
  if (options?.duration !== undefined) {
    context.duration_ms = options.duration;
    Metrics.recordHistogram('operation_duration', options.duration, {
      operation: options.operation || 'unknown',
      tenant_id: options.tenantId || 'unknown',
    });
  }

  // Increment operation counter
  if (options?.operation) {
    Metrics.increment('operation_count', {
      operation: options.operation,
      level: level,
      tenant_id: options.tenantId || 'unknown',
    });
  }

  log(level, message, context);
}

// Metrics (Prometheus-compatible)
export class Metrics {
  private static counters: Map<string, number> = new Map();
  private static gauges: Map<string, number> = new Map();
  private static histograms: Map<string, number[]> = new Map();

  static increment(name: string, labels?: Record<string, string>, value = 1) {
    const key = this.getKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  static setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);
  }

  static recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  private static getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  // Export metrics in Prometheus format
  static export(): string {
    const lines: string[] = [];
    const now = Date.now();

    // Counters
    this.counters.forEach((value, key) => {
      const metricName = key.split('{')[0];
      lines.push(`# TYPE ${metricName} counter`);
      lines.push(`${key} ${value} ${now}`);
    });

    // Gauges
    this.gauges.forEach((value, key) => {
      const metricName = key.split('{')[0];
      lines.push(`# TYPE ${metricName} gauge`);
      lines.push(`${key} ${value} ${now}`);
    });

    // Histograms (Prometheus histogram format)
    this.histograms.forEach((values, key) => {
      const metricName = key.split('{')[0];
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      
      // Calculate buckets (simplified)
      const buckets = [0.1, 0.5, 1, 5, 10, 30, 60, 300]; // seconds
      const bucketCounts = new Map<number, number>();
      
      values.forEach(value => {
        for (const bucket of buckets) {
          if (value <= bucket * 1000) { // Convert seconds to milliseconds
            bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
          }
        }
      });

      lines.push(`# TYPE ${metricName} histogram`);
      lines.push(`${metricName}_sum${key.substring(metricName.length)} ${sum} ${now}`);
      lines.push(`${metricName}_count${key.substring(metricName.length)} ${count} ${now}`);
      
      buckets.forEach(bucket => {
        const count = bucketCounts.get(bucket) || 0;
        lines.push(`${metricName}_bucket${key.substring(metricName.length).replace('}', `,le="${bucket}"}`)} ${count} ${now}`);
      });
      
      // Add +Inf bucket
      lines.push(`${metricName}_bucket${key.substring(metricName.length).replace('}', ',le="+Inf"')} ${count} ${now}`);
    });

    return lines.join('\n');
  }

  // Reset metrics (useful for testing)
  static reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  // Get metrics as JSON (for API endpoints)
  static toJSON(): Record<string, any> {
    const counters: Record<string, number> = {};
    const gauges: Record<string, number> = {};
    const histograms: Record<string, { sum: number; count: number; values: number[] }> = {};

    this.counters.forEach((value, key) => {
      counters[key] = value;
    });

    this.gauges.forEach((value, key) => {
      gauges[key] = value;
    });

    this.histograms.forEach((values, key) => {
      histograms[key] = {
        sum: values.reduce((a, b) => a + b, 0),
        count: values.length,
        values,
      };
    });

    return {
      counters,
      gauges,
      histograms,
      timestamp: new Date().toISOString(),
    };
  }
}
