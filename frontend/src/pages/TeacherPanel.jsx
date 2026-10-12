import { BarChart3, ClipboardList, Layers } from 'lucide-react'
import { useState } from 'react'
import { ErrorState, LoadingState } from '../components/PageState.jsx'
import ModuleForm from '../components/teacher/ModuleForm.jsx'
import QuestionForm from '../components/teacher/QuestionForm.jsx'
import StudentsResults from '../components/teacher/StudentsResults.jsx'
import TestForm from '../components/teacher/TestForm.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { getErrorMessage, testService } from '../services/api.js'

const TABS = [
  { id: 'tests', label: 'Тести та питання', Icon: ClipboardList },
  { id: 'cards', label: 'Картки', Icon: Layers },
  { id: 'results', label: 'Учні та результати', Icon: BarChart3 },
]

function TestsTab() {
  const { data, error, reload } = useAsyncData(testService.getAll)
  const [created, setCreated] = useState([])

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!data) return <LoadingState />

  const tests = [...created, ...data]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="self-start">
        <TestForm onCreated={(test) => setCreated((prev) => [test, ...prev])} />
      </div>
      <QuestionForm tests={tests} />
    </div>
  )
}

export default function TeacherPanel() {
  const [tab, setTab] = useState('tests')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Панель вчителя</h1>
        <p className="mt-1 text-sm text-slate-600">Створюйте тести, питання із зображеннями, картки та переглядайте результати учнів.</p>
      </header>

      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'tests' && <TestsTab />}
      {tab === 'cards' && <ModuleForm />}
      {tab === 'results' && <StudentsResults />}
    </div>
  )
}
