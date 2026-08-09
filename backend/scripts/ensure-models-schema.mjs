import fs from 'fs/promises'
import path from 'path'
import pg from 'pg'
import { config } from '../dist/config.js'

const pool = new pg.Pool({ connectionString: config.postgres.connectionString })

function buildAlterStatements(existingColumns) {
  const statements = []
  const has = (column) => existingColumns.includes(column)

  if (!has('yms_id')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS yms_id TEXT UNIQUE')
  }
  if (!has('first_name')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS first_name TEXT')
  }
  if (!has('last_name')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS last_name TEXT')
  }
  if (!has('birth_date')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS birth_date DATE')
  }
  if (!has('gender')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS gender TEXT')
  }
  if (!has('city')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS city TEXT')
  }
  if (!has('district')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS district TEXT')
  }
  if (!has('phone')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS phone TEXT')
  }
  if (!has('whatsapp')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS whatsapp TEXT')
  }
  if (!has('level_yms')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS level_yms TEXT')
  }

  if (!has('created_at')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()')
  }
  if (!has('updated_at')) {
    statements.push('ALTER TABLE models ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()')
  }

  statements.push(
    `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'models_gender_check'
        ) THEN
          ALTER TABLE models ADD CONSTRAINT models_gender_check CHECK (gender IN ('femme','homme'));
        END IF;
      END
    $$;`,
    `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'models_level_yms_check'
        ) THEN
          ALTER TABLE models ADD CONSTRAINT models_level_yms_check CHECK (level_yms IN ('debutant','intermediaire','experimente'));
        END IF;
      END
    $$;`
  )

  return statements
}

async function run() {
  const client = await pool.connect()
  try {
    const tableResult = await client.query(`SELECT to_regclass('public.models') AS exists`)
    const modelsExists = Boolean(tableResult.rows[0]?.exists)

    if (!modelsExists) {
      const schemaPath = path.resolve(new URL(import.meta.url).pathname, '../sql/schema.sql')
      const schemaSql = await fs.readFile(schemaPath, 'utf-8')
      await client.query(schemaSql)
      console.log('Created database schema from sql/schema.sql')
      return
    }

    const columnsResult = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'models' ORDER BY ordinal_position`
    )
    const existingColumns = columnsResult.rows.map((row) => row.column_name)

    const statements = buildAlterStatements(existingColumns)

    if (!statements.length) {
      console.log('No schema changes required for models table.')
      return
    }

    for (const statement of statements) {
      await client.query(statement)
    }

    if (!existingColumns.includes('first_name') || !existingColumns.includes('last_name')) {
      await client.query(
        `UPDATE models
         SET first_name = split_part(full_name, ' ', 1),
             last_name = regexp_replace(full_name, '^[^ ]+\\s*', '')
         WHERE first_name IS NULL OR last_name IS NULL`
      )
    }

    console.log('Applied missing columns and constraints to models table.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((error) => {
  console.error('Failed to ensure models schema:', error)
  process.exit(1)
})
