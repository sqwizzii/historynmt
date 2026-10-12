import { Landmark } from 'lucide-react'

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-blue-50 via-white to-amber-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-amber-300 shadow-lg shadow-blue-700/20">
            <Landmark className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
        {footer && <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>}
      </div>
    </div>
  )
}
