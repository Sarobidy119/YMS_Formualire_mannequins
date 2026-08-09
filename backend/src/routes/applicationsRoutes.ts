import { Router } from 'express'
import { ApplicationController } from '../controllers/applicationController.js'
import { ApplicationService } from '../services/applicationService.js'

export function createApplicationRoutes() {
  const router = Router()
  const controller = new ApplicationController(new ApplicationService())

  router.post('/eligibility', controller.checkEligibility)
  router.post('/', controller.submit)
  router.get('/:id/photos', controller.getPhotos)
  router.get('/', controller.listAll)
  router.post('/review', controller.review)

  return router
}
