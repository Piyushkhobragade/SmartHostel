import { z } from 'zod';
import dotenv from 'dotenv';

// Ensure dotenv is loaded before parsing
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url("Must be a valid database URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters for security"),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  METRICS_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info')
});

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:', error.flatten().fieldErrors);
    process.exit(1);
  }
  throw error;
}

export { env };
