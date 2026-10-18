import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { resolveImageUrl } from '../utils/imageUrl.js'

export default function QuestionImage({ src, alt = 'Ілюстрація до питання' }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (!src) return null
  const resolved = resolveImageUrl(src)

  if (failedSrc === src) {
    return (
      <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface-muted)] px-4 py-6 text-sm text-[var(--color-mute)]">
        <ImageOff className="h-4 w-4" aria-hidden="true" />
        Не вдалося завантажити зображення
      </div>
    )
  }

  return (
    <figure className="mb-5 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)]">
      <img
        src={resolved}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className="mx-auto max-h-64 w-full object-contain sm:max-h-80 lg:max-h-96"
      />
    </figure>
  )
}
