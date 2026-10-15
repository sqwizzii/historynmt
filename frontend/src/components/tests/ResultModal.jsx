import { Award } from 'lucide-react'
import { primaryButtonClass, secondaryButtonClass } from '../styles.js'
import Modal from '../Modal.jsx'

const NMT_MIN = 100
const NMT_MAX = 200

export default function ResultModal({ result, autoReason = null, onReview, onRetry, onClose }) {
  const percent = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0
  const nmtPosition = ((result.nmtScore - NMT_MIN) / (NMT_MAX - NMT_MIN)) * 100

  return (
    <Modal title="Тест завершено" onClose={onClose}>
      <p className="mt-1 text-sm text-slate-600">{result.testTitle}</p>
      {autoReason === 'TIMEOUT' && <p className="mt-1 text-sm font-medium text-slate-900">Час вичерпано: відповіді надіслано автоматично.</p>}
      {autoReason === 'LEFT_PAGE' && <p className="mt-1 text-sm font-medium text-slate-900">Ви залишили сторінку: тест завершено автоматично.</p>}

      <div className="mt-6 flex flex-col items-center rounded-xl bg-indigo-600 px-4 py-6 text-white">
        <Award className="mb-2 h-7 w-7 text-white" aria-hidden="true" />
        <span className="text-xs font-semibold text-blue-100">Орієнтовний бал НМТ (лінійна шкала)</span>
        <span className="mt-1 text-5xl font-extrabold tabular-nums">{result.nmtScore}</span>
        <div className="mt-4 w-full">
          <div className="h-2 overflow-hidden rounded-xl bg-white/20">
            <div className="h-full rounded-xl bg-white transition-all" style={{ width: `${nmtPosition}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs text-blue-100">
            <span>{NMT_MIN}</span>
            <span>{NMT_MAX}</span>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Первинний бал</dt>
          <dd className="mt-1 text-lg font-bold text-slate-900">
            {result.score} <span className="text-sm font-medium text-slate-500">з {result.maxScore}</span>
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Правильність</dt>
          <dd className="mt-1 text-lg font-bold text-slate-900">{percent}%</dd>
        </div>
      </dl>

      <div className="mt-6 space-y-2">
        <button type="button" onClick={onReview} className={`${primaryButtonClass} w-full`}>
          Переглянути розбір відповідей
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onRetry} className={`${secondaryButtonClass} flex-1`}>
            Пройти ще раз
          </button>
          <button type="button" onClick={onClose} className={`${secondaryButtonClass} flex-1`}>
            До списку тестів
          </button>
        </div>
      </div>
    </Modal>
  )
}
