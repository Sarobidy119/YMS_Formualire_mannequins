import dotenv from 'dotenv'

dotenv.config()

const configuredFrontends = String(
  process.env.FRONTEND_ORIGIN ||
    'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:5178,http://localhost:5179'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendOrigins: configuredFrontends,
  postgres: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:sarobidy@localhost:5432/yms_db',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'local-dev-secret',
  },
  mailer: {
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT || 1025),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'no-reply@yms.local',
  },
}
