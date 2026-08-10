import type { Request, Response, NextFunction } from 'express'
import { ApplicationService } from '../services/applicationService.js'
import { resolvePhotoPublicUrl } from '../utils/photoUrl.js'

export class ApplicationController {
  constructor(private readonly service: ApplicationService) {}

  checkEligibility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.checkEligibility(req.body?.email)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.submit(req.body)
      res.status(201).json({ success: true, message: 'Candidature créée.', data: result })
    } catch (error) {
      next(error)
    }
  }

  listAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listAll()
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  review = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.review(req.body)
      res.json({ success: true, message: 'Candidature traitée.', data: result })
    } catch (error) {
      next(error)
    }
  }

  getPhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const applicationId = req.params.id
      if (!applicationId) return res.status(400).json({ success: false, message: 'Identifiant requis.' })

      const photoPaths = await this.service.getApplicationPhotos(applicationId)
      if (!photoPaths.length) return res.json({ success: true, data: [] })

      const baseUrl = String(req.headers.origin || req.headers.referer || '').replace(/\/$/, '') || process.env.FRONTEND_ORIGIN || ''
      const photos = photoPaths.map((p: string) => ({
        path: p,
        signedUrl: resolvePhotoPublicUrl(p, baseUrl),
      }))

      res.json({ success: true, data: photos })
    } catch (error) {
      next(error)
    }
  }
}
