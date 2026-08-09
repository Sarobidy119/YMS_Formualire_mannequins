export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function isMinor(birthDate: string): boolean {
  return calculateAge(birthDate) < 18
}

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    actif: 'Actif',
    disponible: 'Disponible',
    indisponible: 'Indisponible',
    suspendu: 'Suspendu',
  }
  return map[status] ?? status
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    actif: 'bg-green-100 text-green-800',
    disponible: 'bg-blue-100 text-blue-800',
    indisponible: 'bg-yellow-100 text-yellow-800',
    suspendu: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}

export function sanitizeFileName(fileName: string): string {
  const ext = fileName.split('.').pop()
  const uuid = crypto.randomUUID()
  return `${uuid}.${ext}`
}
