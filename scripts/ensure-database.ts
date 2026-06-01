import "dotenv/config";
import pg from "pg";

/**
 * Connects to the default `postgres` database and creates the target DB if missing.
 */
export async function ensureDatabaseExists(connectionUrl?: string): Promise<void> {
  const url = connectionUrl ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const parsed = new URL(url);
  const dbName = parsed.pathname.replace(/^\//, "");
  if (!dbName) {
    throw new Error("DATABASE_URL must include a database name");
  }

  parsed.pathname = "/postgres";
  const adminUrl = parsed.toString();

  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`Created database: ${dbName}`);
    }
  } finally {
    await client.end();
  }
}
