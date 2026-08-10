import express from 'express'
import cors from 'cors'
import { resolve } from 'node:path'
import { config } from './config.js'
import { createApplicationRoutes } from './routes/applicationsRoutes.js'
import { createAuthRoutes } from './routes/authRoutes.js'
import { createModelsRoutes } from './routes/modelsRoutes.js'
import { createAdminRoutes } from './routes/adminRoutes.js'

const app = express()

app.use('/uploads', express.static(resolve(__dirname, '../uploads')))

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true)
      return
    }

    const normalizedOrigin = origin.trim()

    if (
      config.frontendOrigins.includes(normalizedOrigin) ||
      /^http:\/\/localhost:(517[3-9]|518\d|519\d)\/?$/i.test(normalizedOrigin) ||
      /^http:\/\/127\.0\.0\.1:(517[3-9]|518\d|519\d)\/?$/i.test(normalizedOrigin)
    ) {
      callback(null, true)
      return
    }

    callback(null, false)
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.use('/api/auth', createAuthRoutes())
app.use('/api/applications', createApplicationRoutes())
app.use('/api/models', createModelsRoutes())
app.use('/api/admin', createAdminRoutes())

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = Number(err.statusCode || err.status || 500)
  const message = err.message || 'Erreur serveur interne'

  res.status(status).json({
    success: false,
    message,
    details: err.details || null,
  })
})

app.listen(config.port, () => {
  console.log(`YMS backend listening on http://localhost:${config.port}`)
})
