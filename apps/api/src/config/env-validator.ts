// Environment variable validation on application startup

import { z } from 'zod';

// Environment schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_USERNAME: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  
  // JWT & Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().optional(),
  
  // OTP Provider
  OTP_PROVIDER: z.enum(['firebase', 'twilio']).default('twilio'),
  
  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  
  // Firebase
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  
  // AmoCRM
  AMOCRM_CLIENT_ID: z.string().optional(),
  AMOCRM_CLIENT_SECRET: z.string().optional(),
  AMOCRM_REDIRECT_URI: z.string().url().optional(),
  AMOCRM_BASE_URL: z.string().url().default('https://www.amocrm.ru'),
  
  // UTeL VoIP
  UTEL_API_URL: z.string().url().optional(),
  UTEL_API_TOKEN: z.string().optional(),
  UTEL_WEBHOOK_SECRET: z.string().optional(),
  
  // AWS S3 Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Email Service (SendGrid)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  
  // SMS Service (Twilio - additional for SMS notifications)
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_SMS_FROM_NUMBER: z.string().optional(),
  
  // Firebase (additional)
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  
  // Database Pool Configuration
  DB_POOL_MIN: z.string().optional(),
  DB_POOL_MAX: z.string().optional(),
  DB_SSL: z.string().optional(),
  
  // Redis Configuration
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  LOG_FORMAT: z.enum(['json', 'pretty']).optional(),
  LOGGING_SERVICE_URL: z.string().url().optional(),
  
  // API
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  API_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),
  
  // Frontend
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS_FREE: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS_PRO: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS_ENTERPRISE: z.string().optional(),
  
  // Feature Flags
  FEATURE_WEBHOOKS_ENABLED: z.string().optional(),
  FEATURE_NOTIFICATIONS_ENABLED: z.string().optional(),
  FEATURE_EXPORTS_ENABLED: z.string().optional(),
  FEATURE_SYNC_ENABLED: z.string().optional(),
  FEATURE_ANALYTICS_ENABLED: z.string().optional(),
  
  // Secrets Management
  SECRETS_PROVIDER: z.enum(['aws', 'vault', 'local']).optional(),
  VAULT_ADDR: z.string().url().optional(),
  VAULT_TOKEN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\n` +
        'Please check your environment variables configuration.'
      );
    }
    throw error;
  }
}

// Validate environment on module load
export const env = validateEnv();

// Helper to check if required vars are set for specific features
export function validateFeatureRequirements(feature: string): void {
  const requirements: Record<string, string[]> = {
    otp_twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID'],
    otp_firebase: ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'],
    google_oauth: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
    telegram: ['TELEGRAM_BOT_TOKEN'],
    amocrm: ['AMOCRM_CLIENT_ID', 'AMOCRM_CLIENT_SECRET', 'AMOCRM_REDIRECT_URI'],
    utel: ['UTEL_API_URL', 'UTEL_API_TOKEN'],
    sendgrid: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
    aws_s3: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'],
  };

  const required = requirements[feature];
  if (!required) {
    return;
  }

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(
      `[Env] Feature '${feature}' requires the following environment variables: ${missing.join(', ')}`
    );
  }
}

// Validate all features on startup
export function validateAllFeatures(): void {
  if (env.OTP_PROVIDER === 'twilio') {
    validateFeatureRequirements('otp_twilio');
  } else if (env.OTP_PROVIDER === 'firebase') {
    validateFeatureRequirements('otp_firebase');
  }

  validateFeatureRequirements('google_oauth');
  validateFeatureRequirements('telegram');
  validateFeatureRequirements('amocrm');
  validateFeatureRequirements('utel');
  validateFeatureRequirements('sendgrid');
  validateFeatureRequirements('aws_s3');
}

// Get environment-specific configuration
export function getEnvConfig() {
  return {
    isDevelopment: env.NODE_ENV === 'development',
    isStaging: env.NODE_ENV === 'staging',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    nodeEnv: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    apiUrl: env.API_URL,
    frontendUrl: env.FRONTEND_URL,
    corsOrigin: env.CORS_ORIGIN,
    sentryEnabled: !!env.SENTRY_DSN,
    sentryEnvironment: env.SENTRY_ENVIRONMENT,
    logLevel: env.LOG_LEVEL || 'info',
    logFormat: env.LOG_FORMAT || 'json',
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS ? parseInt(env.RATE_LIMIT_WINDOW_MS, 10) : 60000,
    rateLimitMaxRequestsFree: env.RATE_LIMIT_MAX_REQUESTS_FREE ? parseInt(env.RATE_LIMIT_MAX_REQUESTS_FREE, 10) : 100,
    rateLimitMaxRequestsPro: env.RATE_LIMIT_MAX_REQUESTS_PRO ? parseInt(env.RATE_LIMIT_MAX_REQUESTS_PRO, 10) : 500,
    rateLimitMaxRequestsEnterprise: env.RATE_LIMIT_MAX_REQUESTS_ENTERPRISE ? parseInt(env.RATE_LIMIT_MAX_REQUESTS_ENTERPRISE, 10) : 1000,
    features: {
      webhooks: env.FEATURE_WEBHOOKS_ENABLED !== 'false',
      notifications: env.FEATURE_NOTIFICATIONS_ENABLED !== 'false',
      exports: env.FEATURE_EXPORTS_ENABLED !== 'false',
      sync: env.FEATURE_SYNC_ENABLED !== 'false',
      analytics: env.FEATURE_ANALYTICS_ENABLED !== 'false',
    },
  };
}
