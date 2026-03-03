import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "./auth-schema";
import * as appSchema from "./schema";

const schema = { ...authSchema, ...appSchema };

const POSTGRES_URL_REGEX = /^postgres(?:ql)?:\/\/[^\s]+$/i;

function getConnectionString() {
  let url = process.env.DATABASE_URL?.trim();
  if (!url) {
    return "postgresql://localhost:5432/placeholder";
  }
  // Strip psql CLI wrapper: psql 'postgresql://...' or psql "postgresql://..."
  const match = url.match(/postgres(?:ql)?:\/\/[^'"]+/i);
  if (match) {
    url = match[0];
  }
  if (!POSTGRES_URL_REGEX.test(url)) {
    throw new Error(
      `Invalid DATABASE_URL: must be a PostgreSQL URL (e.g. postgresql://user:pass@host:5432/db)`
    );
  }
  return url;
}

const pool = new Pool({
  connectionString: getConnectionString(),
});

export const db = drizzle({ client: pool, schema });
