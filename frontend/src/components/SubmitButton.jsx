import { Loader2 } from 'lucide-react'

export default function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 btn-shine rounded-xl bg-gradient-to-b from-blue-600 to-blue-800 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/25 ring-1 ring-inset ring-white/10 transition hover:-translate-y-px hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
