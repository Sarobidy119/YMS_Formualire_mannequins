import { Pool } from 'pg'
import { config } from './config.js'

export const db = new Pool({
  connectionString: config.postgres.connectionString,
})

export async function testDbConnection() {
  const client = await db.connect()
  try {
    const result = await client.query('SELECT NOW() AS now')
    return result.rows[0]
  } finally {
    client.release()
  }
}
