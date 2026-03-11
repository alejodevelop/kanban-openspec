import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { schema } from "./index";

const migrationDir = join(process.cwd(), "drizzle");
const migrationFile = readdirSync(migrationDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort()[0];
if (!migrationFile) {
  throw new Error("No SQL migration found under ./drizzle");
}
const migrationSql = readFileSync(join(migrationDir, migrationFile), "utf8");

describe("schema verification", () => {
  it("loads shared schema entrypoint", () => {
    expect(Object.keys(schema).sort()).toEqual(["boards", "cards", "columns"]);
  });

  it("creates expected kanban tables", () => {
    expect(migrationSql).toMatch(/CREATE TABLE "boards"/i);
    expect(migrationSql).toMatch(/CREATE TABLE "columns"/i);
    expect(migrationSql).toMatch(/CREATE TABLE "cards"/i);
  });

  it("enforces key foreign keys with cascade deletes", () => {
    expect(migrationSql).toMatch(
      /FOREIGN KEY \("board_id"\) REFERENCES "public"\."boards"\("id"\) ON DELETE cascade/i,
    );
    expect(migrationSql).toMatch(
      /FOREIGN KEY \("column_id"\) REFERENCES "public"\."columns"\("id"\) ON DELETE cascade/i,
    );
  });

  it("supports board derivation and optional card description", () => {
    const cardsSection = migrationSql.match(/CREATE TABLE "cards"[\s\S]*?\);/i)?.[0] ?? "";
    expect(cardsSection).toContain('"description" text');
    expect(cardsSection).not.toMatch(/"description" text NOT NULL/i);
    expect(cardsSection).not.toContain('"board_id"');
    expect(migrationSql).toContain('"column_id" uuid NOT NULL');
    expect(migrationSql).toContain('"board_id" uuid NOT NULL');
  });

  it("keeps technical naming in english", () => {
    expect(migrationSql).toMatch(/"created_at" timestamp/i);
    expect(migrationSql).toMatch(/"updated_at" timestamp/i);
    expect(migrationSql).toMatch(/"position" integer NOT NULL/i);
    expect(migrationSql).not.toMatch(/tableros|columnas|tarjetas|titulo|descripcion/i);
  });
});
