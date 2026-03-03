# Database Setup

Auth (sign up/sign in) requires the database tables to exist. Run:

```bash
npm run db:push
```

This creates the `user`, `session`, `account`, `verification` tables (plus `profiles`, `macro_targets`, `foods`, `weight_logs`).

**Ensure your `.env` has a valid `DATABASE_URL`:**

```
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

For Neon, use the connection string from the dashboard (not the `psql` CLI format).
