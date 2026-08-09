import { db } from '../db.js'
import type { ApplicationPayload, ReviewPayload } from '../types.js'

export class ApplicationRepository {
  async findByEmail(email: string) {
    const result = await db.query(
      `SELECT id FROM applications WHERE email = $1 LIMIT 1`,
      [email]
    )
    return result.rows[0] ?? null
  }

  async create(applicationNumber: string, payload: ApplicationPayload) {
    const result = await db.query(
      `INSERT INTO applications (id, application_number, email, full_name, payload, photo_paths, status, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'en_attente', NOW())
       RETURNING *`,
      [
        applicationNumber,
        String(payload.email).trim().toLowerCase(),
        String(payload.full_name).trim(),
        JSON.stringify(payload.data || {}),
        JSON.stringify(payload.photo_paths || []),
      ]
    )

    return result.rows[0]
  }

  async findAll() {
    const result = await db.query(
      `SELECT id, application_number, email, full_name, payload AS data, photo_paths, status, review_note, created_at FROM applications ORDER BY created_at DESC`
    )
    return result.rows.map((row) => ({
      ...row,
      data: row.data || {},
    }))
  }

  async findById(applicationId: string) {
    const result = await db.query(`SELECT * FROM applications WHERE id = $1`, [applicationId])
    if (!result.rowCount) return null
    const row = result.rows[0]
    return {
      ...row,
      data: row.payload ?? {},
    }
  }

  async updateStatus(applicationId: string, status: 'en_attente' | 'approuvee' | 'refusee', note: string) {
    await db.query(
      `UPDATE applications
       SET status = $1, review_note = $2, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [status, note, applicationId]
    )
  }

  async createAccountRequest(applicationId: string, email: string, fullName: string) {
    await db.query(
      `INSERT INTO users_account_request (application_id, email, full_name, status, created_at)
       VALUES ($1, $2, $3, 'created', NOW())`,
      [applicationId, email, fullName]
    )
  }
}
