import { Router } from 'express'
import multer from 'multer'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { ApplicationController } from '../controllers/applicationController.js'
import { ApplicationService } from '../services/applicationService.js'

// Do not derive this directory from __dirname: it is src/ in development and
// dist/ after a production build. Both static serving and uploads use the
// backend working directory instead.
const uploadsDirectory = resolve(process.cwd(), 'uploads')

// A fresh deployment may not contain this git-ignored directory yet.
mkdirSync(uploadsDirectory, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename: (_req, file, cb) => {
      const extension = file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0].toLowerCase() || ''
      cb(null, `${randomUUID()}${extension}`)
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image\/jpeg|image\/png|image\/webp)$/i
    cb(null, allowed.test(file.mimetype))
  },
  limits: { files: 6, fileSize: 5 * 1024 * 1024 },
})

export function createApplicationRoutes() {
  const router = Router()
  const controller = new ApplicationController(new ApplicationService())

  router.post('/eligibility', controller.checkEligibility)
  router.post('/', upload.any(), controller.submit)
  router.get('/:id/photos', controller.getPhotos)
  router.get('/', controller.listAll)
  router.post('/review', controller.review)

  return router
}
