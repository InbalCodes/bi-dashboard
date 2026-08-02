import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Run with: node --env-file=.env.local -r tsx scripts/init-db.ts");
  }

  const sql = neon(databaseUrl);
  const schemaPath = join(process.cwd(), "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");

  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    console.log(`Running: ${statement.slice(0, 60)}...`);
    await sql.query(statement);
  }

  console.log(`Done. Executed ${statements.length} statements.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
