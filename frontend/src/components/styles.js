export const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 disabled:bg-slate-100 disabled:text-slate-500'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export const primaryButtonClass = `${buttonBase} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800`

export const secondaryButtonClass = `${buttonBase} border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100`

export const dangerButtonClass = `${buttonBase} bg-red-600 text-white shadow-sm hover:bg-red-700`

export const cardClass = 'rounded-xl border border-slate-200 bg-white shadow-card'

export const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700'

export const badgeClass = (tone = 'slate') =>
  ({
    slate: 'bg-slate-100 text-slate-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    red: 'bg-red-50 text-red-700',
  })[tone] + ' inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium'
