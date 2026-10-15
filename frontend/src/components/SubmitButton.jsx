import { Loader2 } from 'lucide-react'
import { primaryButtonClass } from './styles.js'

export default function SubmitButton({ loading, children }) {
  return (
    <button type="submit" disabled={loading} className={`${primaryButtonClass} w-full py-3`}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
