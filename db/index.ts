import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import * as authSchema from "./auth-schema";
import * as appSchema from "./schema";

const schema = { ...authSchema, ...appSchema };

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return "postgresql://localhost:5432/placeholder";
  }
  const parsed = envSchema.safeParse({ DATABASE_URL: url });
  if (!parsed.success) {
    throw new Error(
      `Invalid DATABASE_URL: must be a valid PostgreSQL URL (e.g. postgresql://user:pass@host:5432/db)`
    );
  }
  return parsed.data.DATABASE_URL;
}

const pool = new Pool({
  connectionString: getConnectionString(),
});

export const db = drizzle({ client: pool, schema });
