import pg from 'pg'
import bcrypt from 'bcrypt'
import { config } from '../dist/config.js'

const { Pool } = pg
const pool = new Pool({ connectionString: config.postgres.connectionString })

try {
  const result = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['admin@yms.local'])
  const hash = result.rows[0]?.password_hash

  if (!hash) {
    console.log('No admin row found')
    process.exit(1)
  }

  const candidates = ['admin123', 'password', '123456', 'admin', 'yms', 'sarobidy']
  for (const candidate of candidates) {
    const ok = await bcrypt.compare(candidate, hash)
    console.log(candidate, ok)
  }
} finally {
  await pool.end()
}
