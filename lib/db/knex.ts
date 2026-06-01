import type { Knex } from "knex";

let instance: Knex | null = null;

export async function getDb(): Promise<Knex> {
  if (!instance) {
    const knexFactory = (await import("knex")).default;
    const config = (await import("@/knexfile")).default;
    instance = knexFactory(config);
  }
  return instance;
}

export async function isDbAvailable(): Promise<boolean> {
  try {
    const db = await getDb();
    await db.raw("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
