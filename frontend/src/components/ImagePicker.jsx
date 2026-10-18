import { ImagePlus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { resolveImageUrl } from '../utils/imageUrl.js'
import { fileToDataUrl } from '../utils/imageFile.js'

const MAX_FILE_BYTES = 15 * 1024 * 1024

export default function ImagePicker({ value, onChange, label = 'Фото' }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Оберіть файл-зображення.')
    if (file.size > MAX_FILE_BYTES) return setError('Файл завеликий (максимум 15 МБ).')
    setError('')
    try {
      onChange(await fileToDataUrl(file))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" aria-label={label} />
      {value ? (
        <span className="relative">
          <img src={resolveImageUrl(value)} alt="" className="h-10 w-10 rounded-lg border border-[var(--color-line)] object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-1.5 -top-1.5 rounded-xl bg-[var(--color-inverse)] p-0.5 text-[var(--color-on-inverse)] hover:bg-red-600"
            aria-label="Прибрати фото"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-dashed border-[var(--color-line-strong)] p-2 text-[var(--color-mute)] hover:border-blue-500 hover:text-blue-600"
          aria-label={label}
          title={label}
        >
          <ImagePlus className="h-5 w-5" />
        </button>
      )}
      {error && <span className="text-xs text-[var(--color-danger-fg)]">{error}</span>}
    </div>
  )
}
