import { ImagePlus, X } from 'lucide-react'
import { useRef, useState } from 'react'

const MAX_SIDE = 1000
const MAX_FILE_BYTES = 15 * 1024 * 1024

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не вдалося прочитати файл'))
    }
    img.src = url
  })
}

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
          <img src={value} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-700 p-0.5 text-white hover:bg-red-600"
            aria-label="Прибрати фото"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-dashed border-slate-300 p-2 text-slate-500 hover:border-blue-500 hover:text-blue-600"
          aria-label={label}
          title={label}
        >
          <ImagePlus className="h-5 w-5" />
        </button>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  )
}
