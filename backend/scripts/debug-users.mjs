import pkg from 'pg'
const { Pool } = pkg
import { config } from '../dist/config.js'

const pool = new Pool({
  connectionString: config.postgres.connectionString,
})

try {
  const result = await pool.query('SELECT id, email, full_name, role, status, password_hash FROM users WHERE email = $1', ['admin@yms.local'])
  console.log(JSON.stringify(result.rows, null, 2))
} finally {
  await pool.end()
}
