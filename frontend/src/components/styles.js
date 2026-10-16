const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3F4F8]'

export const inputClass =
  `block w-full rounded-lg border border-[#E2E4EC] bg-white px-3.5 py-2.5 text-sm text-[#14151C] placeholder:text-[#6B6E7B]/75 shadow-[0_1px_0_rgb(20_21_28/0.02)] transition hover:border-[#C9CCD8] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-[#F3F4F8] disabled:text-[#6B6E7B]`

const buttonBase =
  `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-tight transition ${focusRing} disabled:cursor-not-allowed disabled:opacity-45`

export const primaryButtonClass =
  `${buttonBase} bg-indigo-600 text-white shadow-[0_1px_0_rgb(0_0_0/0.05),0_1px_2px_rgb(57_48_184/0.25)] hover:bg-indigo-700 active:bg-indigo-800`

export const secondaryButtonClass =
  `${buttonBase} border border-[#E2E4EC] bg-white text-[#14151C] shadow-[0_1px_0_rgb(20_21_28/0.03)] hover:bg-[#F3F4F8] hover:border-[#C9CCD8] active:bg-[#EBECEF]`

export const ghostButtonClass = `${buttonBase} text-[#6B6E7B] hover:bg-[#EBECEF] hover:text-[#14151C]`

export const softButtonClass = `${buttonBase} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`

export const dangerButtonClass = `${buttonBase} bg-red-600 text-white hover:bg-red-700 active:bg-red-800`

export const dangerGhostButtonClass = `${buttonBase} text-red-600 hover:bg-red-50`

export const cardClass =
  'rounded-xl border border-[#E2E4EC] bg-white shadow-card'

export const cardInteractiveClass =
  `${cardClass} transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lift`

export const panelClass = cardClass

export const sectionTitleClass = 'text-base font-semibold tracking-tight text-[#14151C]'

export const mutedTextClass = 'text-sm text-[#6B6E7B]'

export const labelClass = 'mb-1.5 block text-sm font-medium text-[#3A3C48]'

export const badgeClass = (tone = 'slate') =>
  ({
    slate: 'bg-[#F0F1F5] text-[#3A3C48]',
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-900',
    red: 'bg-red-50 text-red-700',
  })[tone] + ' inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tracking-tight'

export const iconTileClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600'

export const navActiveClass = 'bg-indigo-50 text-indigo-700'
export const navIdleClass = 'text-[#6B6E7B] hover:bg-[#F0F1F5] hover:text-[#14151C]'

export const tableWrapClass =
  'relative overflow-x-auto rounded-xl border border-[#E2E4EC] bg-white shadow-card'
