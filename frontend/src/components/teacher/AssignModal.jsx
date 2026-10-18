import { useState } from 'react'
import ErrorAlert from '../ErrorAlert.jsx'
import Modal from '../Modal.jsx'
import { ErrorState, LoadingState } from '../PageState.jsx'
import { primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { assignmentService, getErrorMessage, resultService } from '../../services/api.js'

function AssignForm({ testId, students, assigned, onClose }) {
  const [mode, setMode] = useState(assigned.length === 0 ? 'all' : 'selected')
  const [selected, setSelected] = useState(() => new Set(assigned))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  async function save() {
    if (mode === 'selected' && selected.size === 0) return setError('Оберіть хоча б одного учня або дозвольте тест усім.')
    setSaving(true)
    setError('')
    try {
      await assignmentService.save(testId, mode === 'all' ? [] : [...selected])
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  const radio = 'flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--color-line)] p-3 text-sm has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50'
  return (
    <div className="mt-4 space-y-3">
      <ErrorAlert message={error} />
      <label className={radio}>
        <input type="radio" name="mode" checked={mode === 'all'} onChange={() => setMode('all')} className="mt-0.5 accent-indigo-600" />
        <span><span className="block font-medium text-[var(--color-ink)]">Усім моїм учням</span><span className="text-[var(--color-mute)]">Тест бачать усі учні, прив'язані до вас.</span></span>
      </label>
      <label className={radio}>
        <input type="radio" name="mode" checked={mode === 'selected'} onChange={() => setMode('selected')} className="mt-0.5 accent-indigo-600" />
        <span><span className="block font-medium text-[var(--color-ink)]">Лише вибраним</span><span className="text-[var(--color-mute)]">Решта учнів тест не побачать.</span></span>
      </label>
      {mode === 'selected' && (
        <ul className="max-h-56 divide-y divide-[var(--color-line-soft)] overflow-y-auto rounded-lg border border-[var(--color-line)]" aria-label="Учні">
          {students.length === 0 && <li className="p-4 text-center text-sm text-[var(--color-mute)]">Учнів поки немає. Поділіться кодом запрошення.</li>}
          {students.map((s) => (
            <li key={s.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-[var(--color-surface-muted)]">
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="h-4 w-4 accent-indigo-600" />
                <span className="font-medium text-[var(--color-ink)]">{s.fullName}</span>
                <span className="text-[var(--color-mute)]">{s.username}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
        <button type="button" onClick={save} disabled={saving} className={`${primaryButtonClass} flex-1`}>{saving ? 'Зберігаємо…' : 'Зберегти'}</button>
        <button type="button" onClick={onClose} disabled={saving} className={`${secondaryButtonClass} flex-1`}>Скасувати</button>
      </div>
    </div>
  )
}

export default function AssignModal({ testId, onClose }) {
  const students = useAsyncData(resultService.getStudents)
  const assigned = useAsyncData(() => assignmentService.get(testId), testId)
  const error = students.error || assigned.error
  return (
    <Modal title="Призначення тесту" onClose={onClose}>
      {error ? <ErrorState message={getErrorMessage(error)} onRetry={() => { students.reload(); assigned.reload() }} />
        : !students.data || !assigned.data ? <LoadingState />
        : <AssignForm testId={testId} students={students.data} assigned={assigned.data} onClose={onClose} />}
    </Modal>
  )
}
