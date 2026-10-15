import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND_NAME } from '../config/brand.js'

export default function Brand({ to = '/', onClick, light = false }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5 rounded-lg focus-visible:outline-offset-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className={`text-base font-semibold leading-tight tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>{BRAND_NAME}</span>
    </Link>
  )
}
