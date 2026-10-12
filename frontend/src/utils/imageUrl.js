import { API_URL } from '../services/api.js'

/** Відносні посилання на завантажені зображення (/api/...) перетворює на повні, з урахуванням адреси API. */
export function resolveImageUrl(src) {
  if (!src || !src.startsWith('/api/')) return src
  return API_URL.replace(/\/api\/?$/, '') + src
}

export const isUploadedImage = (src) => Boolean(src) && (src.startsWith('data:image/') || src.startsWith('/api/'))
