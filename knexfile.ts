import type { Knex } from "knex";

const config: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/psx_agent",
  migrations: {
    directory: "./lib/db/migrations",
    extension: "ts",
  },
  pool: { min: 0, max: 10 },
};

export default config;
