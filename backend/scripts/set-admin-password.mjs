import pg from 'pg'
import bcrypt from 'bcrypt'
import { config } from '../dist/config.js'

const { Pool } = pg
const pool = new Pool({ connectionString: config.postgres.connectionString })

const password = 'admin123'
const hash = await bcrypt.hash(password, 10)

try {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@yms.local'])

  if (existing.rowCount > 0) {
    await pool.query(
      'UPDATE users SET password_hash = $1, role = $2, status = $3, full_name = $4 WHERE email = $5',
      [hash, 'admin', 'active', 'Admin YMS', 'admin@yms.local']
    )
  } else {
    await pool.query(
      'INSERT INTO users (id, email, password_hash, full_name, role, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      ['4b992263-4a1c-4585-9c11-5385594cd65b', 'admin@yms.local', hash, 'Admin YMS', 'admin', 'active']
    )
  }

  console.log('password_hash_updated', password)
} finally {
  await pool.end()
}
