const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-2'

export const inputClass =
  `block w-full rounded-xl border border-[#E6E8F0] bg-white px-3.5 py-2.5 text-sm text-[#20212B] placeholder:text-[#73758A]/70 shadow-sm transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`

const buttonBase =
  `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${focusRing} disabled:cursor-not-allowed disabled:opacity-50`

export const primaryButtonClass = `${buttonBase} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800`

export const secondaryButtonClass = `${buttonBase} border border-[#E6E8F0] bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100`

export const ghostButtonClass = `${buttonBase} text-slate-600 hover:bg-slate-100 hover:text-slate-900`

export const softButtonClass = `${buttonBase} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`

export const dangerButtonClass = `${buttonBase} bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800`

export const dangerGhostButtonClass = `${buttonBase} text-red-600 hover:bg-red-50`

export const cardClass = 'rounded-[0.875rem] border border-[#E6E8F0] bg-white shadow-card'

export const cardInteractiveClass =
  `${cardClass} transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lift`

export const panelClass = 'rounded-[0.875rem] border border-[#E6E8F0] bg-white shadow-card'

export const sectionTitleClass = 'text-base font-semibold tracking-tight text-[#20212B]'

export const mutedTextClass = 'text-sm text-[#73758A]'

export const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700'

export const badgeClass = (tone = 'slate') =>
  ({
    slate: 'bg-slate-100 text-slate-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    red: 'bg-red-50 text-red-700',
  })[tone] + ' inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium'

export const iconTileClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600'

export const navActiveClass = 'bg-indigo-50 text-indigo-700 shadow-sm'
export const navIdleClass = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
