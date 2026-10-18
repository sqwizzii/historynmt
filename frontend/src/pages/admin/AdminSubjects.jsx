import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import ErrorAlert from '../../components/ErrorAlert.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/PageState.jsx'
import { badgeClass, cardClass, inputClass, primaryButtonClass } from '../../components/styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { adminService, getErrorMessage } from '../../services/api.js'

function SubjectRow({ subject, onChanged, onRemove, onError }) {
  const [name, setName] = useState(subject.name)
  const [busy, setBusy] = useState(false)

  async function save(patch) {
    setBusy(true)
    onError('')
    try {
      await adminService.updateSubject(subject.id, { name: patch.name ?? name, sortOrder: subject.sortOrder, active: patch.active ?? subject.active })
      onChanged()
    } catch (err) {
      onError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <input aria-label={`Назва предмета ${subject.slug}`} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== subject.name && save({ name: name.trim() })} className={`${inputClass} min-w-0 flex-1 basis-56`} />
      <span className="text-xs text-[var(--color-mute)]">{subject.slug}</span>
      <span className={badgeClass('slate')}>Матеріалів: {subject.materials}</span>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-ink-soft)]">
        <input type="checkbox" checked={subject.active} disabled={busy} onChange={(e) => save({ active: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
        Активний
      </label>
      <button type="button" onClick={() => onRemove(subject)} className="rounded-lg p-2 text-[var(--color-mute-soft)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-fg)]" aria-label={`Видалити предмет ${subject.name}`}><Trash2 className="h-4 w-4" /></button>
    </li>
  )
}

export default function AdminSubjects() {
  const { data, error, reload } = useAsyncData(adminService.subjects, null, { keepPrevious: true })
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [creating, setCreating] = useState(false)
  const [toRemove, setToRemove] = useState(null)
  const [removeError, setRemoveError] = useState('')

  async function create(event) {
    event.preventDefault()
    if (!name.trim()) return setFormError('Вкажіть назву предмета.')
    setCreating(true)
    setFormError('')
    try {
      await adminService.createSubject({ name: name.trim(), slug: slug.trim() || null })
      setName('')
      setSlug('')
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  async function confirmRemove() {
    setRemoveError('')
    try {
      await adminService.removeSubject(toRemove.id)
      setToRemove(null)
      reload()
    } catch (err) {
      setRemoveError(getErrorMessage(err))
    }
  }

  return (
    <>
      <PageHeader title="Предмети" description="Довідник предметів для тестів і модулів. Використаний предмет можна лише вимкнути." />
      <form onSubmit={create} className={`${cardClass} mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto] sm:items-end`} noValidate>
        <div>
          <label htmlFor="subject-name" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">Новий предмет</label>
          <input id="subject-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Наприклад, Економіка" />
        </div>
        <div>
          <label htmlFor="subject-slug" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">Slug (необов'язково)</label>
          <input id="subject-slug" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder="economics" />
        </div>
        <button type="submit" disabled={creating} className={primaryButtonClass}><Plus className="h-4 w-4" aria-hidden="true" />Додати</button>
        {formError && <div className="sm:col-span-3"><ErrorAlert message={formError} /></div>}
      </form>
      <ErrorAlert message={actionError} />
      {error && !data ? <ErrorState message={getErrorMessage(error)} onRetry={reload} />
        : !data ? <LoadingState />
        : data.length === 0 ? <EmptyState title="Предметів немає" text="Додайте перший предмет." />
        : <ul className={`${cardClass} mt-2 divide-y divide-[var(--color-line-soft)]`}>{data.map((s) => <SubjectRow key={`${s.id}-${s.name}-${s.active}`} subject={s} onChanged={reload} onRemove={setToRemove} onError={setActionError} />)}</ul>}
      {toRemove && (
        <ConfirmDialog title="Видалити предмет?" message={`Предмет «${toRemove.name}» буде видалено. Якщо він використовується, видалення буде відхилено.`} error={removeError} onConfirm={confirmRemove} onCancel={() => { setToRemove(null); setRemoveError('') }} />
      )}
    </>
  )
}
