import { Loader2 } from 'lucide-react'

export default function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-none border border-black bg-black px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-black disabled:hover:text-white"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
