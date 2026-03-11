import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();

const MIGRATION_TABLE = "app_migrations";
const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");
const LEGACY_BASELINE_MIGRATIONS = [
  "20251219132722_add_admin_user",
  "20251219150656_add_site_config",
  "20251220022930_add_password_reset_token",
  "20251220123303_add_user_and_page_models",
  "20251220133028_add_user_password_reset_token",
  "20251221000000_add_news_item",
] as const;

type AppliedMigrationRow = {
  name: string;
  checksum: string;
};

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let i = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarQuoteTag: string | null = null;

  while (i < sql.length) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inLineComment) {
      current += char;
      if (char === "\n") {
        inLineComment = false;
      }
      i += 1;
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === "*" && nextChar === "/") {
        current += nextChar;
        inBlockComment = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (dollarQuoteTag) {
      current += char;
      if (sql.startsWith(dollarQuoteTag, i)) {
        current += dollarQuoteTag.slice(1);
        i += dollarQuoteTag.length;
        dollarQuoteTag = null;
        continue;
      }
      i += 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (char === "-" && nextChar === "-") {
        current += char + nextChar;
        inLineComment = true;
        i += 2;
        continue;
      }

      if (char === "/" && nextChar === "*") {
        current += char + nextChar;
        inBlockComment = true;
        i += 2;
        continue;
      }

      if (char === "$") {
        const match = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
        if (match) {
          dollarQuoteTag = match[0];
          current += dollarQuoteTag;
          i += dollarQuoteTag.length;
          continue;
        }
      }
    }

    if (char === "'" && !inDoubleQuote) {
      current += char;
      if (inSingleQuote && nextChar === "'") {
        current += nextChar;
        i += 2;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      i += 1;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      current += char;
      if (inDoubleQuote && nextChar === '"') {
        current += nextChar;
        i += 2;
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      i += 1;
      continue;
    }

    if (char === ";" && !inSingleQuote && !inDoubleQuote) {
      const statement = current.trim();
      if (statement) {
        statements.push(statement);
      }
      current = "";
      i += 1;
      continue;
    }

    current += char;
    i += 1;
  }

  const trailing = current.trim();
  if (trailing) {
    statements.push(trailing);
  }

  return statements;
}

function getMigrationChecksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

function isSkippableMigrationError(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
  const message = error instanceof Error ? error.message : String(error);

  return (
    code === "42P07" ||
    code === "42701" ||
    code === "42710" ||
    /already exists/i.test(message) ||
    /duplicate/i.test(message)
  );
}

async function ensureMigrationTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      name TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<Map<string, string>> {
  const rows = await prisma.$queryRawUnsafe<AppliedMigrationRow[]>(`
    SELECT name, checksum
    FROM ${MIGRATION_TABLE}
    ORDER BY name ASC
  `);

  return new Map(rows.map((row) => [row.name, row.checksum]));
}

async function hasTable(tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS "exists"
    `,
    tableName
  );

  return Boolean(rows[0]?.exists);
}

async function hasColumn(
  tableName: string,
  columnName: string
): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
      ) AS "exists"
    `,
    tableName,
    columnName
  );

  return Boolean(rows[0]?.exists);
}

async function shouldBootstrapLegacyBaseline(
  appliedMigrations: Map<string, string>
): Promise<boolean> {
  for (const appliedMigrationName of appliedMigrations.keys()) {
    if (!LEGACY_BASELINE_MIGRATIONS.includes(appliedMigrationName as (typeof LEGACY_BASELINE_MIGRATIONS)[number])) {
      return false;
    }
  }

  const [hasUserTable, hasPageTable, hasSiteConfigTable, hasNewsArticleTable] =
    await Promise.all([
      hasTable("User"),
      hasTable("Page"),
      hasTable("SiteConfig"),
      hasTable("NewsArticle"),
    ]);

  if (!hasUserTable || !hasPageTable || !hasSiteConfigTable || !hasNewsArticleTable) {
    return false;
  }

  return hasColumn("MediaAsset", "userId");
}

async function getMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    directories.map(async (directory) => {
      const filePath = path.join(MIGRATIONS_DIR, directory, "migration.sql");
      const sql = await fs.readFile(filePath, "utf8");

      return {
        name: directory,
        filePath,
        sql,
        checksum: getMigrationChecksum(sql),
      };
    })
  );
}

async function recordMigration(name: string, checksum: string) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${MIGRATION_TABLE} (name, checksum) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
    name,
    checksum
  );
}

async function applyMigration(name: string, sql: string) {
  const statements = splitSqlStatements(sql);

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (error) {
      if (isSkippableMigrationError(error)) {
        console.log(`  ~ skipped existing object for statement in ${name}`);
        continue;
      }
      throw error;
    }
  }
}

async function main() {
  const statusOnly = process.argv.includes("--status");

  await ensureMigrationTable();
  const migrationFiles = await getMigrationFiles();
  let appliedMigrations = await getAppliedMigrations();

  if (await shouldBootstrapLegacyBaseline(appliedMigrations)) {
    if (statusOnly) {
      console.log(
        "~ legacy database detected, historical migrations will be baselined on next db:migrate"
      );

      const virtualAppliedMigrations = new Map(appliedMigrations);
      for (const migration of migrationFiles) {
        if (
          LEGACY_BASELINE_MIGRATIONS.includes(
            migration.name as (typeof LEGACY_BASELINE_MIGRATIONS)[number]
          )
        ) {
          virtualAppliedMigrations.set(migration.name, migration.checksum);
        }
      }
      appliedMigrations = virtualAppliedMigrations;
    } else {
      console.log("~ legacy database detected, baselining historical migrations");

      for (const migration of migrationFiles) {
        if (
          LEGACY_BASELINE_MIGRATIONS.includes(
            migration.name as (typeof LEGACY_BASELINE_MIGRATIONS)[number]
          ) &&
          !appliedMigrations.has(migration.name)
        ) {
          await recordMigration(migration.name, migration.checksum);
          console.log(`~ baselined ${migration.name}`);
        }
      }

      appliedMigrations = await getAppliedMigrations();
    }
  }

  let appliedCount = 0;
  let pendingCount = 0;

  for (const migration of migrationFiles) {
    const appliedChecksum = appliedMigrations.get(migration.name);

    if (appliedChecksum) {
      if (appliedChecksum !== migration.checksum) {
        throw new Error(
          `Migration checksum mismatch for ${migration.name}. ` +
            `Expected ${appliedChecksum}, got ${migration.checksum}.`
        );
      }

      console.log(`= ${migration.name} already recorded`);
      continue;
    }

    pendingCount += 1;

    if (statusOnly) {
      console.log(`- ${migration.name} pending`);
      continue;
    }

    console.log(`> applying ${migration.name}`);
    await applyMigration(migration.name, migration.sql);
    await recordMigration(migration.name, migration.checksum);
    appliedCount += 1;
    console.log(`+ recorded ${migration.name}`);
  }

  if (statusOnly) {
    console.log(
      `Status complete: ${migrationFiles.length - pendingCount} recorded, ${pendingCount} pending.`
    );
    return;
  }

  console.log(
    `Migration complete: ${appliedCount} applied, ${migrationFiles.length - appliedCount} already recorded.`
  );
}

main()
  .catch((error) => {
    console.error("Migration runner failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
