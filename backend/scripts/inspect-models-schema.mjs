import pg from 'pg'
import { config } from '../dist/config.js'

const { Pool } = pg
const pool = new Pool({ connectionString: config.postgres.connectionString })

try {
  const result = await pool.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    ['public', 'models']
  )
  console.log(JSON.stringify(result.rows, null, 2))
} finally {
  await pool.end()
}
