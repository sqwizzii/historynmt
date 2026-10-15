import { RotateCw } from 'lucide-react'
import { useState } from 'react'

function Face({ label, text, image, className }) {
  return (
    <span className={`flip-face absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-xl border p-6 text-center sm:p-10 ${className}`}>
      <span className="mb-3 block text-xs font-semiboldst opacity-70">{label}</span>
      {image && <img src={image} alt="" className="mb-3 max-h-36 w-auto max-w-full object-contain sm:max-h-52" />}
      <span className={`block font-semibold font-semibold leading-tight ${image ? 'text-lg sm:text-2xl' : 'text-xl sm:text-3xl'}`}>{text}</span>
    </span>
  )
}

export default function FlipCard({ card }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="flip-scene">
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        aria-pressed={flipped}
        aria-label={flipped ? 'Показати термін' : 'Показати відповідь'}
        className="relative block h-64 w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:h-80"
      >
        <span className="flip-card absolute inset-0 block" data-flipped={flipped}>
          <Face label="Термін / питання" text={card.termOrQuestion} image={card.imageUrl} className="border-slate-200 bg-white text-slate-900" />
          <Face
            label="Відповідь / дата"
            text={card.answerOrDate}
            className="flip-face-back bg-hero ornament border-slate-200 text-white"
          />
        </span>
        <span className="pointer-events-none absolute bottom-3 right-4 z-10 flex items-center gap-1 text-xs text-slate-400">
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          {flipped ? 'Натисніть, щоб повернути' : 'Натисніть, щоб перевернути'}
        </span>
      </button>
    </div>
  )
}
