import { Hammer } from 'lucide-react'

export default function ComingSoon({ title, message = 'Цей розділ з\'явиться на наступному кроці розробки.' }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <Hammer className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">{message}</p>
    </div>
  )
}
