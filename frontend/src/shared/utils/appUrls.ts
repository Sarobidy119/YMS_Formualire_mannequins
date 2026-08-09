/** URLs publiques des deux applications déployées séparément. */
function readAppUrl(name: 'VITE_ADMIN_APP_URL' | 'VITE_USER_APP_URL') {
  const value = import.meta.env[name]?.trim()
  return value ? value.replace(/\/$/, '') : null
}

export const adminAppUrl = readAppUrl('VITE_ADMIN_APP_URL')
export const userAppUrl = readAppUrl('VITE_USER_APP_URL')

export function leaveForApp(appUrl: string | null, path: string) {
  if (!appUrl) return false
  window.location.replace(`${appUrl}${path}`)
  return true
}
