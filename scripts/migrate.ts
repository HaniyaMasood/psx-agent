import "dotenv/config";
import knex from "knex";
import config from "../knexfile";
import { ensureDatabaseExists } from "./ensure-database";

async function main() {
  await ensureDatabaseExists();
  const db = knex(config);
  try {
    const [batch, log] = await db.migrate.latest();
    console.log("Migrations applied:", batch, log);
  } finally {
    await db.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
