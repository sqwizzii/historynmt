import ErrorAlert from './ErrorAlert.jsx'
import Modal from './Modal.jsx'
import { secondaryButtonClass } from './styles.js'

export default function ConfirmDialog({ title, message, confirmLabel = 'Видалити', loading = false, error = '', onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={loading ? undefined : onCancel}>
      <div className="mt-3 space-y-3 text-sm text-[var(--color-mute)]">
        <p>{message}</p>
        <ErrorAlert message={error} />
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex flex-1 items-center justify-center bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Зачекайте…' : confirmLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className={`${secondaryButtonClass} flex-1`}>
          Скасувати
        </button>
      </div>
    </Modal>
  )
}
