import { CheckCircle2, ClipboardCopy, FileUp, TriangleAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import ErrorAlert from '../ErrorAlert.jsx'
import Modal from '../Modal.jsx'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { getErrorMessage, testService } from '../../services/api.js'
import { fileToDataUrl } from '../../utils/imageFile.js'

async function shrinkImages(payload) {
  for (const q of payload.questions) {
    if (!q.image) continue
    try {
      const blob = await (await fetch(q.image)).blob()
      q.image = await fileToDataUrl(new File([blob], 'image', { type: blob.type }))
    } catch {
      q.image = null
    }
  }
}

const SCRIPT = `function exportForm() {
  var form = FormApp.getActiveForm();
  var out = { title: form.getTitle(), description: form.getDescription(), questions: [] };
  var pendingImage = null;
  form.getItems().forEach(function (item) {
    var type = item.getType();
    if (type === FormApp.ItemType.IMAGE) {
      var blob = item.asImageItem().getImage();
      pendingImage = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
      return;
    }
    var q;
    var kind;
    if (type === FormApp.ItemType.MULTIPLE_CHOICE) { q = item.asMultipleChoiceItem(); kind = 'SINGLE'; }
    else if (type === FormApp.ItemType.LIST) { q = item.asListItem(); kind = 'SINGLE'; }
    else if (type === FormApp.ItemType.CHECKBOX) { q = item.asCheckboxItem(); kind = 'MULTIPLE'; }
    else { return; }
    var fb = q.getFeedbackForCorrect();
    out.questions.push({
      title: item.getTitle(),
      help: item.getHelpText(),
      type: kind,
      explanation: fb ? fb.getText() : '',
      image: pendingImage,
      options: q.getChoices().map(function (c) {
        return { text: c.getValue(), correct: c.isCorrectAnswer() };
      })
    });
    pendingImage = null;
  });
  var file = DriveApp.createFile('nmt-form-export.json', JSON.stringify(out), MimeType.PLAIN_TEXT);
  Logger.log('Файл створено: ' + file.getUrl());
}`

export default function ImportFormModal({ onClose, onImported }) {
  const [json, setJson] = useState('')
  const [minutes, setMinutes] = useState(60)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const fileInput = useRef(null)

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(SCRIPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Не вдалося скопіювати. Виділіть скрипт вручну.')
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) setJson(await file.text())
  }

  async function submit() {
    setError('')
    let payload
    try {
      payload = JSON.parse(json.trim())
    } catch {
      return setError('Не вдалося прочитати дані. Скопіюйте весь рядок з журналу виконання скрипта, від { до }.')
    }
    if (!payload || !Array.isArray(payload.questions)) return setError('У даних немає списку питань.')
    setLoading(true)
    try {
      await shrinkImages(payload)
      setResult(await testService.importGoogleForm({ ...payload, timeLimitMinutes: Number(minutes) || 60 }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <Modal title="Тест імпортовано" onClose={() => onImported(result.testId)}>
        <div className="mt-3 space-y-3 text-sm text-[var(--color-ink-soft)]">
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success-fg)]" aria-hidden="true" />
            «{result.title}»: додано питань {result.imported}.
          </p>
          {result.skipped.length > 0 && (
            <div className="rounded-xl bg-[var(--color-surface-muted)] p-3.5 text-[var(--color-ink)]">
              <p className="mb-1.5 flex items-center gap-2 font-semibold">
                <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                Пропущено: {result.skipped.length}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs">
                {result.skipped.map((s, i) => (
                  <li key={i}>
                    {s.question}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.warnings?.length > 0 && (
            <ul className="list-disc space-y-1 rounded-xl bg-[var(--color-surface-muted)] p-3.5 pl-8 text-xs text-[var(--color-ink)]">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-[var(--color-mute)]">Перегляньте питання у редакторі й додайте теми та пояснення за потреби.</p>
        </div>
        <button type="button" onClick={() => onImported(result.testId)} className={`${primaryButtonClass} mt-5 w-full`}>
          Відкрити тест
        </button>
      </Modal>
    )
  }

  return (
    <Modal title="Імпорт тесту з Google Forms" onClose={loading ? undefined : onClose}>
      <div className="mt-3 space-y-4 text-sm text-[var(--color-ink-soft)]">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Відкрийте свою форму в Google Forms на редагування. Для правильних відповідей форма має бути у режимі «Тест».</li>
          <li>
            Меню «⋮», потім «Редактор скриптів». Вставте скрипт нижче, натисніть «Виконати» і дозвольте доступ до форми.
          </li>
          <li>У «Журналі виконання» з'явиться посилання на файл у вашому Google Drive. Завантажте цей файл і оберіть його нижче.</li>
        </ol>

        <div>
          <button type="button" onClick={copyScript} className={secondaryButtonClass}>
            <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
            {copied ? 'Скопійовано' : 'Скопіювати скрипт'}
          </button>
        </div>

        <div>
          <label htmlFor="import-json" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
            Файл зі скрипта (або вставлені дані)
          </label>
          <textarea
            id="import-json"
            rows={6}
            className={`${inputClass} font-mono text-xs`}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{"title":"...","questions":[...]}'
          />
          <input ref={fileInput} type="file" accept=".json,.txt,application/json" onChange={handleFile} className="hidden" aria-label="Файл з даними" />
          <button type="button" onClick={() => fileInput.current?.click()} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent-fg)] hover:underline">
            <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
            Обрати файл
          </button>
        </div>

        <div className="w-40">
          <label htmlFor="import-minutes" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
            Час, хвилин
          </label>
          <input id="import-minutes" type="number" min="1" max="300" className={inputClass} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>

        <p className="text-xs text-[var(--color-mute)]">
          Імпортуються питання з однією відповіддю, списки й «прапорці». Текстові відповіді та інші типи пропускаються. Переноситься фото, додане у формі окремим блоком «Зображення» перед питанням; фото всередині самого питання чи варіантів Google не віддає, їх додайте вже на сайті.
        </p>
        <ErrorAlert message={error} />
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
        <button type="button" onClick={submit} disabled={loading || !json.trim()} className={`${primaryButtonClass} flex-1`}>
          {loading ? 'Імпортуємо…' : 'Імпортувати'}
        </button>
        <button type="button" onClick={onClose} disabled={loading} className={`${secondaryButtonClass} flex-1`}>
          Скасувати
        </button>
      </div>
    </Modal>
  )
}
