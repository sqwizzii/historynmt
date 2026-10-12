import { BarChart3, ClipboardList, Layers } from 'lucide-react'
import { useState } from 'react'
import ModulesManager from '../components/teacher/ModulesManager.jsx'
import StudentsResults from '../components/teacher/StudentsResults.jsx'
import TestsManager from '../components/teacher/TestsManager.jsx'

const TABS = [
  { id: 'tests', label: 'Тести та питання', Icon: ClipboardList },
  { id: 'cards', label: 'Картки', Icon: Layers },
  { id: 'results', label: 'Учні та результати', Icon: BarChart3 },
]

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

      {tab === 'tests' && <TestsManager />}
      {tab === 'cards' && <ModulesManager />}
      {tab === 'results' && <StudentsResults />}
    </div>
  )
}
