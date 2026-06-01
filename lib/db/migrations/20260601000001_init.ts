import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable("user_profiles", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.jsonb("profile").notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("companies", (t) => {
    t.string("symbol", 32).primary();
    t.string("name").nullable();
    t.string("sector").nullable();
    t.jsonb("metadata").nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("fundamentals_cache", (t) => {
    t.string("symbol", 32).primary();
    t.jsonb("payload").notNullable();
    t.timestamp("fetched_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("dividends_cache", (t) => {
    t.string("symbol", 32).primary();
    t.jsonb("payload").notNullable();
    t.timestamp("fetched_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("price_cache", (t) => {
    t.string("symbol", 32).primary();
    t.jsonb("payload").notNullable();
    t.timestamp("fetched_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("announcements_cache", (t) => {
    t.string("symbol", 32).primary();
    t.jsonb("payload").notNullable();
    t.timestamp("fetched_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("research_runs", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.jsonb("input_profile").notNullable();
    t.string("status", 32).notNullable().defaultTo("pending");
    t.jsonb("state_snapshot").nullable();
    t.jsonb("report").nullable();
    t.string("thread_id").nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("run_reviews", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("run_id").notNullable().references("id").inTable("research_runs").onDelete("CASCADE");
    t.boolean("acknowledged").notNullable().defaultTo(false);
    t.text("reviewer_note").nullable();
    t.timestamp("reviewed_at").nullable();
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("run_reviews");
  await knex.schema.dropTableIfExists("research_runs");
  await knex.schema.dropTableIfExists("announcements_cache");
  await knex.schema.dropTableIfExists("price_cache");
  await knex.schema.dropTableIfExists("dividends_cache");
  await knex.schema.dropTableIfExists("fundamentals_cache");
  await knex.schema.dropTableIfExists("companies");
  await knex.schema.dropTableIfExists("user_profiles");
}
