export type ApplicationStatus = 'en_attente' | 'approuvee' | 'refusee'

export interface ApplicationPayload {
  email: string
  full_name: string
  data?: Record<string, unknown>
  photo_paths?: string[]
}

export interface ReviewPayload {
  applicationId: string
  decision: 'approve' | 'reject'
  note?: string
}

export interface EligibilityPayload {
  email: string
}
