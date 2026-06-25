import nextEnv from "@next/env";
import postgres from "postgres";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 1,
});

try {
  await sql`
    alter table public."Submissions"
    add column if not exists track_path text
  `;
  console.log('Added public."Submissions".track_path (or it already existed).');
} finally {
  await sql.end();
}
