import { z } from "zod";
import { log } from "./lib/logger";

const envSchema = z.object({
  PORT: z.string().optional().default("3000"),
  NODE_ENV: z.string().optional().default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ALLOWED_ORIGINS: z.string().optional(),
});

function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    log.info("env.validated");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error("env.invalid", {
        issues: error.issues.map((err) => `${err.path.join(".")}: ${err.message}`).join("; "),
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      NODE_ENV?: string;
      DATABASE_URL: string;
      ALLOWED_ORIGINS?: string;
    }
  }
}
