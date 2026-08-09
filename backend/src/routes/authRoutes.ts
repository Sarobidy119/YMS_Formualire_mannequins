import { Router } from 'express'
import { randomUUID } from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { db } from '../db.js'
import { ApplicationService } from '../services/applicationService.js'

export function createAuthRoutes() {
  const router = Router()
  const applicationService = new ApplicationService()

  router.post('/signup', async (req, res, next) => {
    try {
      const { email, password, fullName } = req.body || {}
      if (!email || !password || !fullName) {
        return res.status(400).json({ success: false, message: 'Email, mot de passe et nom complet requis.' })
      }

      const normalizedEmail = String(email).trim().toLowerCase()
      const eligibility = await applicationService.checkEligibility(normalizedEmail)
      if (!eligibility.eligible) {
        return res.status(403).json({ success: false, message: 'Adresse email non validée par l\'administrateur. Vous ne pouvez pas créer de compte pour le moment.' })
      }
      const passwordHash = await bcrypt.hash(password, 10)

      const existing = await db.query(`SELECT id FROM users WHERE email = $1`, [normalizedEmail])
      if (existing.rowCount) {
        return res.status(409).json({ success: false, message: 'Ce compte existe déjà.' })
      }

      const created = await db.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, status, created_at)
         VALUES ($1, $2, $3, $4, 'model', 'active', NOW())
         RETURNING id, email, full_name, role`,
        [randomUUID(), normalizedEmail, passwordHash, fullName]
      )

      // If a model/profile exists for this email (created from an approved application),
      // link it to the newly created user so the user sees their prefilled profile.
      try {
        await db.query(`UPDATE models SET user_id = $1 WHERE LOWER(email) = LOWER($2) AND user_id IS NULL`, [created.rows[0].id, normalizedEmail])
      } catch (err) {
        // non-blocking: log and continue
        console.warn('Failed to link model to user after signup:', err)
      }

      const modelResult = await db.query(`SELECT * FROM models WHERE LOWER(email) = LOWER($1) LIMIT 1`, [normalizedEmail])

      const token = jwt.sign({ sub: created.rows[0].id, email: normalizedEmail }, config.auth.jwtSecret, { expiresIn: '12h' })

      return res.status(201).json({ success: true, message: 'Compte créé.', data: { token, user: created.rows[0], profile: modelResult.rowCount ? modelResult.rows[0] : null } })
    } catch (error) {
      next(error)
    }
  })

  router.post('/signin', async (req, res, next) => {
    try {
      const { email, password } = req.body || {}
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' })
      }

      const result = await db.query(`SELECT * FROM users WHERE email = $1`, [String(email).trim().toLowerCase()])
      if (!result.rowCount) {
        return res.status(401).json({ success: false, message: 'Identifiants invalides.' })
      }

      const user = result.rows[0]
      const isValid = await bcrypt.compare(password, user.password_hash)
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Identifiants invalides.' })
      }

      const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.auth.jwtSecret, { expiresIn: '12h' })

      // Attempt to load linked model/profile so frontend can skip onboarding when present
      let profile = null
      try {
        const modelRes = await db.query(`SELECT * FROM models WHERE user_id = $1 OR LOWER(email) = LOWER($2) LIMIT 1`, [user.id, user.email])
        if (modelRes.rowCount) profile = modelRes.rows[0]
      } catch (err) {
        console.warn('Failed to fetch profile on signin:', err)
      }

      return res.json({ success: true, data: { token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, profile } })
    } catch (error) {
      next(error)
    }
  })

  router.get('/me', async (req, res) => {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token manquant.' })
    }

    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as { sub: string; email: string; role?: string }
      const result = await db.query(`SELECT * FROM users WHERE id = $1`, [decoded.sub])
      if (!result.rowCount) {
        return res.status(401).json({ success: false, message: 'Utiliateur introuvable.' })
      }

      // Attempt to load linked model/profile so frontend can use the model id
      let profile = null
      try {
        const modelRes = await db.query(`SELECT * FROM models WHERE user_id = $1 OR LOWER(email) = LOWER($2) LIMIT 1`, [decoded.sub, decoded.email])
        if (modelRes.rowCount) profile = modelRes.rows[0]
      } catch (err) {
        console.warn('Failed to fetch profile on /me:', err)
      }

      return res.json({ success: true, data: { user: result.rows[0], profile } })
    } catch (_error) {
      return res.status(401).json({ success: false, message: 'Token invalide.' })
    }
  })

  return router
}
