import { RotateCw } from 'lucide-react'
import { useState } from 'react'

function Face({ label, text, className }) {
  return (
    <span className={`flip-face absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-3xl border p-6 text-center shadow-lg sm:p-10 ${className}`}>
      <span className="mb-3 block text-xs font-semibold uppercase tracking-widest opacity-70">{label}</span>
      <span className="block text-xl font-bold leading-snug sm:text-3xl">{text}</span>
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
        className="relative block h-64 w-full cursor-pointer rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30 sm:h-80"
      >
        <span className="flip-card absolute inset-0 block" data-flipped={flipped}>
          <Face label="Термін / питання" text={card.termOrQuestion} className="border-blue-100 bg-white text-slate-900" />
          <Face
            label="Відповідь / дата"
            text={card.answerOrDate}
            className="flip-face-back border-blue-800 bg-gradient-to-br from-blue-700 to-blue-900 text-white"
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
