import { Router } from 'express'
import { db } from '../db.js'

export function createModelsRoutes() {
  const router = Router()

  router.get('/', async (req, res, next) => {
    try {
      const { searchText, status, gender, level, city, page = '1', pageSize = '50' } = req.query
      const offset = (Number(page) - 1) * Number(pageSize)
      const conditions: string[] = []
      const values: unknown[] = []

      if (searchText) {
        values.push(`%${String(searchText).trim().toLowerCase()}%`)
        conditions.push(`(LOWER(full_name) LIKE $${values.length} OR LOWER(yms_id) LIKE $${values.length} OR LOWER(email) LIKE $${values.length})`)
      }

      if (status) {
        values.push(String(status).trim())
        conditions.push(`status = $${values.length}`)
      }

      if (gender) {
        values.push(String(gender).trim())
        conditions.push(`gender = $${values.length}`)
      }

      if (level) {
        values.push(String(level).trim())
        conditions.push(`level_yms = $${values.length}`)
      }

      if (city) {
        values.push(String(city).trim().toLowerCase())
        conditions.push(`LOWER(city) = $${values.length}`)
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const query = `SELECT * FROM models ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`
      values.push(Number(pageSize) || 50, offset)

      const [result, countResult] = await Promise.all([
        db.query(query, values),
        db.query(`SELECT COUNT(*) AS count FROM models ${whereClause}`, values.slice(0, values.length - 2)),
      ])

      res.json({ success: true, data: { data: result.rows, count: Number(countResult.rows[0]?.count || 0) } })
    } catch (error) {
      next(error)
    }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      const result = await db.query(`SELECT * FROM models WHERE id = $1`, [req.params.id])
      if (!result.rowCount) {
        return res.status(404).json({ success: false, message: 'Modèle introuvable.' })
      }

      const row = result.rows[0]
      const fullProfile = {
        ...row,
        district: row.district ?? null,
        phone: row.phone ?? '',
        whatsapp: row.whatsapp ?? null,
        gender: row.gender ?? 'femme',
        birth_date: row.birth_date ? row.birth_date.toISOString().slice(0, 10) : '',
        level_yms: row.level_yms ?? null,
        measurements: null,
        availability: null,
        skills: [],
        experiences: [],
        photos: [],
        admin_notes: [],
      }

      return res.json({ success: true, data: fullProfile })
    } catch (error) {
      next(error)
    }
  })

  router.get('/:id/activities', async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT * FROM activities WHERE model_id = $1 ORDER BY created_at DESC`,
        [req.params.id]
      )

      res.json({ success: true, data: result.rows })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/:id', async (req, res, next) => {
    try {
      await db.query(`DELETE FROM models WHERE id = $1`, [req.params.id])
      res.json({ success: true, data: { id: req.params.id } })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/:id/status', async (req, res, next) => {
    try {
      const { status } = req.body || {}
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status requis.' })
      }

      const result = await db.query(
        `UPDATE models SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [String(status).trim(), req.params.id]
      )

      if (!result.rowCount) {
        return res.status(404).json({ success: false, message: 'Modèle introuvable.' })
      }

      res.json({ success: true, data: result.rows[0] })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/:id', async (req, res, next) => {
    try {
      const payload = req.body || {}
      const fields: string[] = []
      const values: unknown[] = []

      if (payload.full_name) {
        values.push(String(payload.full_name))
        fields.push(`full_name = $${values.length}`)
      }
      if (payload.email) {
        values.push(String(payload.email))
        fields.push(`email = $${values.length}`)
      }
      if (payload.status) {
        values.push(String(payload.status))
        fields.push(`status = $${values.length}`)
      }

      if (!fields.length) {
        return res.status(400).json({ success: false, message: 'Aucun champ modifiable fourni.' })
      }

      values.push(req.params.id)
      const result = await db.query(
        `UPDATE models SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
      )

      if (!result.rowCount) {
        return res.status(404).json({ success: false, message: 'Modèle introuvable.' })
      }

      res.json({ success: true, data: result.rows[0] })
    } catch (error) {
      next(error)
    }
  })

  router.post('/', async (req, res, next) => {
    try {
      const payload = req.body || {}
      const result = await db.query(
        `INSERT INTO models (id, full_name, email, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'actif', NOW(), NOW())
         RETURNING *`,
        [payload.full_name || 'Model', payload.email || 'model@example.com']
      )

      res.status(201).json({ success: true, message: 'Modèle créé.', data: result.rows[0] })
    } catch (error) {
      next(error)
    }
  })

  return router
}
