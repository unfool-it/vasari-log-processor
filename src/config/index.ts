import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * STRICT PARAMETER CONFIGURATION
 * Validates environment properties to capture and isolate failures
 * before they touch business domains.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().default(8080),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SECURE_BYPASS_KEY: z.string().min(32),
  ANONYMIZATION_SALT: z.string().min(16),
  // Added trimming to handle potential whitespace in environment strings
  ALLOWED_ORIGINS: z.string().transform((str) => str.split(',').map(s => s.trim())),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment configuration:', JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

// Export the inferred type for use in other modules
export type Config = z.infer<typeof envSchema>;
export const config = _env.data;
