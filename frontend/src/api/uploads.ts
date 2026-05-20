import { getToken } from './client'

export async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
  const form = new FormData()
  form.append('file', file)
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch('/api/uploads', { method: 'POST', body: form, headers })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body?.detail ?? detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json()
}
