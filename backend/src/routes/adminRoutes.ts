import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'

export function createAdminRoutes() {
  const router = Router()

  router.get('/dashboard', async (_req, res, next) => {
    try {
      const genderColumn = await db.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'models' AND column_name = 'gender' LIMIT 1`
      )
      const hasGender = (genderColumn.rowCount ?? 0) > 0

      const result = await db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status IS NOT NULL) AS total,
           ${hasGender ? "COUNT(*) FILTER (WHERE gender = 'femme') AS femmes," : '0 AS femmes,'}
           ${hasGender ? "COUNT(*) FILTER (WHERE gender = 'homme') AS hommes," : '0 AS hommes,'}
           COUNT(*) FILTER (WHERE status = 'actif') AS actifs,
           COUNT(*) FILTER (WHERE status = 'disponible') AS disponibles,
           COUNT(*) FILTER (WHERE status = 'indisponible') AS indisponibles,
           COUNT(*) FILTER (WHERE status = 'suspendu') AS suspendus
         FROM models`
      )

      const row = result.rows[0] || {}
      const stats = {
        total: Number(row.total || 0),
        femmes: Number(row.femmes || 0),
        hommes: Number(row.hommes || 0),
        actifs: Number(row.actifs || 0),
        disponibles: Number(row.disponibles || 0),
        indisponibles: Number(row.indisponibles || 0),
        suspendus: Number(row.suspendus || 0),
        confirmed: Number(row.actifs || 0) + Number(row.disponibles || 0),
      }

      res.json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  })

  router.get('/castings', async (_req, res, next) => {
    try {
      const result = await db.query(`SELECT * FROM castings ORDER BY created_at DESC`)
      res.json({ success: true, data: result.rows })
    } catch (error) {
      next(error)
    }
  })

  router.post('/castings', async (req, res, next) => {
    try {
      const payload = req.body || {}
      const name = String(payload.name || '').trim()
      const client = payload.client ? String(payload.client).trim() : null
      const eventDate = payload.event_date ? String(payload.event_date).trim() : null
      const type = payload.type ? String(payload.type).trim() : null

      if (!name) {
        return res.status(400).json({ success: false, message: 'Le nom du casting est requis.' })
      }

      if (payload.id) {
        const result = await db.query(
          `UPDATE castings
           SET name = $1, client = $2, event_date = $3, type = $4, updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [name, client, eventDate, type, payload.id]
        )

        return res.json({ success: true, data: result.rows[0] })
      }

      const result = await db.query(
        `INSERT INTO castings (id, name, client, event_date, type, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [randomUUID(), name, client, eventDate, type]
      )

      return res.status(201).json({ success: true, data: result.rows[0] })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/castings/:id', async (req, res, next) => {
    try {
      await db.query(`DELETE FROM castings WHERE id = $1`, [req.params.id])
      res.json({ success: true, data: { id: req.params.id } })
    } catch (error) {
      next(error)
    }
  })

  router.get('/activities', async (_req, res, next) => {
    try {
      const result = await db.query(
        `SELECT a.*, m.full_name, m.email, m.id AS model_id, m.yms_id
         FROM activities a
         LEFT JOIN models m ON m.id = a.model_id
         ORDER BY a.created_at DESC`
      )

      const rows = result.rows.map((row) => {
        const fullName = String(row.full_name || '').trim()
        const parts = fullName.split(/\s+/)

        return {
          ...row,
          models: {
            first_name: parts[0] || '',
            last_name: parts.slice(1).join(' ') || '',
            yms_id: row.yms_id || row.model_id || '',
          },
        }
      })

      res.json({ success: true, data: rows })
    } catch (error) {
      next(error)
    }
  })

  router.post('/activities', async (req, res, next) => {
    try {
      const payload = req.body || {}
      const modelId = String(payload.model_id || '').trim()
      const activityType = String(payload.activity_type || '').trim()
      const description = payload.description ? String(payload.description).trim() : null

      if (!modelId || !activityType) {
        return res.status(400).json({ success: false, message: 'model_id et activity_type requis.' })
      }

      const result = await db.query(
        `INSERT INTO activities (id, model_id, activity_type, description, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [randomUUID(), modelId, activityType, description]
      )

      res.status(201).json({ success: true, data: result.rows[0] })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/activities/:id', async (req, res, next) => {
    try {
      await db.query(`DELETE FROM activities WHERE id = $1`, [req.params.id])
      res.json({ success: true, data: { id: req.params.id } })
    } catch (error) {
      next(error)
    }
  })

  return router
}
