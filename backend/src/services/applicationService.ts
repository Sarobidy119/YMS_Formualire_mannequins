import { randomUUID } from 'crypto'
import nodemailer from 'nodemailer'
import { config } from '../config.js'
import { db } from '../db.js'
import { HttpError } from '../httpError.js'
import { ApplicationRepository } from '../repositories/ApplicationRepository.js'
import type { ApplicationPayload, ReviewPayload, ApplicationStatus } from '../types.js'

export class ApplicationService {
  constructor(private readonly repository = new ApplicationRepository()) {}

  async checkEligibility(email: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) {
      throw new Error('Email requis pour vérifier l’éligibilité.')
    }

    // Determine eligibility: allow registration only when the application
    // has been approved or when an account request has already been created
    // by the admin. This mirrors the admin workflow (approve -> createAccountRequest).
    const result = await db.query(
      `SELECT a.status AS application_status, u.id IS NOT NULL AS has_account_request
       FROM applications a
       LEFT JOIN users_account_request u ON u.application_id = a.id
       WHERE a.email = $1
       ORDER BY a.created_at DESC
       LIMIT 1`,
      [normalizedEmail]
    )

    if (!result.rowCount) {
      return { eligible: false, reason: 'no_application' }
    }

    const row = result.rows[0]
    const isApproved = String(row.application_status) === 'approuvee'
    const hasAccountRequest = Boolean(row.has_account_request)

    return {
      eligible: isApproved || hasAccountRequest,
      reason: isApproved ? 'application_approved' : hasAccountRequest ? 'account_request_created' : 'not_approved',
    }
  }

  async submit(payload: ApplicationPayload & Record<string, unknown>) {
    const rawPayload = payload || {}
    const email = String(rawPayload.email || '').trim().toLowerCase()

    const rawFullName = String(rawPayload.full_name || rawPayload.fullName || '').trim()
    const firstName = String(rawPayload.first_name || '').trim()
    const lastName = String(rawPayload.last_name || '').trim()
    const derivedFullName = rawFullName || `${firstName} ${lastName}`.trim()

    if (!email || !derivedFullName) {
      throw new HttpError(400, 'Une adresse email et un nom complet sont requis.')
    }

    const existing = await this.repository.findByEmail(email)

    if (existing) {
      throw new HttpError(409, 'Cette candidature existe déjà pour cet email.')
    }

    const dataObject = rawPayload.data && typeof rawPayload.data === 'object' && !Array.isArray(rawPayload.data)
      ? { ...rawPayload.data as Record<string, unknown> }
      : { ...rawPayload }

    delete (dataObject as Record<string, unknown>).email
    delete (dataObject as Record<string, unknown>).full_name
    delete (dataObject as Record<string, unknown>).fullName
    delete (dataObject as Record<string, unknown>).first_name
    delete (dataObject as Record<string, unknown>).last_name
    delete (dataObject as Record<string, unknown>).photos
    delete (dataObject as Record<string, unknown>).photo_paths

    const photoPaths = Array.isArray(rawPayload.photo_paths)
      ? rawPayload.photo_paths
      : Array.isArray((rawPayload.photos as unknown[]))
        ? (rawPayload.photos as unknown[]).map((item) => String(item))
        : Object.values(rawPayload.photos as Record<string, unknown> || {}).map((item) => String(item))

    const normalizedPayload: ApplicationPayload = {
      email,
      full_name: derivedFullName,
      data: dataObject,
      photo_paths: photoPaths,
    }

    const applicationNumber = `YMS-${Date.now().toString().slice(-6)}`
    const application = await this.repository.create(applicationNumber, normalizedPayload)

    return {
      applicationNumber,
      application,
    }
  }

  async listAll() {
    return await this.repository.findAll()
  }

  async getApplicationPhotos(applicationId: string) {
    const application = await this.repository.findById(applicationId)
    if (!application) return []
    const photoPaths: string[] = Array.isArray(application.photo_paths) ? application.photo_paths : []
    return photoPaths
  }

  async review(payload: ReviewPayload) {
    const { applicationId, decision, note = '' } = payload

    if (!applicationId) {
      throw new HttpError(400, 'Identifiant de candidature requis.')
    }

    const current = await this.repository.findById(applicationId)

    if (!current) {
      throw new HttpError(404, 'Candidature introuvable.')
    }

    const newStatus: ApplicationStatus = decision === 'approve' ? 'approuvee' : 'refusee'

    await this.repository.updateStatus(applicationId, newStatus, note)

    if (decision === 'approve') {
      await this.sendWelcomeEmail(current.email, current.full_name)
      await this.repository.createAccountRequest(applicationId, current.email, current.full_name)
      await this.createModelFromApplication(current)
    }

    return {
      ok: true,
      decision: newStatus,
      applicationId,
    }
  }

  private async createModelFromApplication(application: { email: string; full_name: string; data?: unknown }) {
    const existing = await db.query(`SELECT id FROM models WHERE email = $1 LIMIT 1`, [application.email])
    if (existing.rowCount) return

    const data = typeof application.data === 'string'
      ? JSON.parse(application.data as string)
      : (application.data as Record<string, unknown>) || {}

    const firstName = String(data.first_name || '').trim() || application.full_name.split(/\s+/)[0] || ''
    const lastName = String(data.last_name || '').trim() || application.full_name.split(/\s+/).slice(1).join(' ') || ''
    const birthDate = data.birth_date ? String(data.birth_date).trim() : null
    const gender = data.gender ? String(data.gender).trim() : null
    const city = data.city ? String(data.city).trim() : null
    const district = data.district ? String(data.district).trim() : null
    const phone = data.phone ? String(data.phone).trim() : null
    const whatsapp = data.whatsapp ? String(data.whatsapp).trim() : null
    const levelYms = data.level_yms ? String(data.level_yms).trim() : null

    await db.query(
      `INSERT INTO models (
         id, yms_id, first_name, last_name, full_name, birth_date, gender, city,
         district, phone, whatsapp, email, level_yms, status, created_at, updated_at
       ) VALUES (
         gen_random_uuid(), NULL, $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, 'disponible', NOW(), NOW()
       )`,
      [firstName, lastName, application.full_name, birthDate, gender, city, district, phone, whatsapp, application.email, levelYms]
    )
  }

  private async sendWelcomeEmail(email: string, fullName: string) {
    // Email is best-effort: an SMTP failure must never block application
    // approval. Log a warning and continue so the account request is created.
    try {
      const transporter = nodemailer.createTransport({
        host: config.mailer.host,
        port: config.mailer.port,
        secure: config.mailer.port === 465,
        auth: config.mailer.user && config.mailer.password
          ? { user: config.mailer.user, pass: config.mailer.password }
          : undefined,
      })

      const signupUrl = (Array.isArray(config.frontendOrigins) && config.frontendOrigins[0])
        ? `${config.frontendOrigins[0]}/register`
        : 'http://localhost:5173/register'

      const subject = 'YMS — Votre candidature a été validée'
      const text = `Bonjour ${fullName},\n\nFélicitations — votre candidature a été validée par l'équipe YMS. Vous pouvez désormais créer votre compte en suivant ce lien : ${signupUrl}\n\nSi vous rencontrez des problèmes, répondez à cet email.`
      const html = `
        <p>Bonjour ${fullName},</p>
        <p><strong>Félicitations</strong> — votre candidature a été validée par l'équipe YMS.</p>
        <p>Pour créer votre compte et accéder à votre espace, cliquez sur le bouton ci-dessous :</p>
        <p><a href="${signupUrl}" style="background:#1f2937;color:#fff;padding:10px 14px;text-decoration:none;border-radius:6px;">Créer mon compte</a></p>
        <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur : <br><a href="${signupUrl}">${signupUrl}</a></p>
        <p>Si vous avez besoin d'aide, répondez simplement à cet email.</p>
        <p>— L'équipe YMS</p>
      `

      await transporter.sendMail({
        from: config.mailer.from,
        to: email,
        subject,
        text,
        html,
      })
    } catch (error) {
      console.warn('[mailer] Échec de l’envoi de l’email de bienvenue (non bloquant):', error)
    }
  }
}
