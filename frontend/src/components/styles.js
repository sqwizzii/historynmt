const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]'

export const inputClass =
  `block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[0.9375rem] leading-snug text-[var(--color-ink)] placeholder:text-[var(--color-mute-soft)] shadow-[inset_0_1px_0_rgb(11_12_16/0.02)] transition duration-200 hover:border-[var(--color-line-strong)] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-mute)]`

const buttonBase =
  `inline-flex items-center justify-center gap-2 rounded-lg px-4.5 py-2.5 text-[0.9375rem] font-semibold tracking-tight transition duration-[180ms] ease-out ${focusRing} disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.97]`

export const primaryButtonClass =
  `${buttonBase} bg-indigo-600 text-white shadow-[0_1px_0_rgb(0_0_0/0.06),0_10px_24px_-10px_rgb(57_48_184/0.6)] hover:-translate-y-1 hover:bg-indigo-500 hover:shadow-[0_1px_0_rgb(0_0_0/0.06),0_20px_36px_-12px_rgb(57_48_184/0.72)] active:translate-y-0 active:bg-indigo-700`

export const secondaryButtonClass =
  `${buttonBase} border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[0_1px_0_rgb(11_12_16/0.03)] hover:-translate-y-1 hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-muted)] hover:shadow-lift active:translate-y-0`

export const ghostButtonClass =
  `${buttonBase} text-[var(--color-mute)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]`

export const softButtonClass =
  `${buttonBase} bg-[var(--color-accent-soft)] text-[var(--color-accent-fg)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0`

export const dangerButtonClass =
  `${buttonBase} bg-red-600 text-white hover:-translate-y-0.5 hover:bg-red-700 active:translate-y-0 active:bg-red-800`

export const dangerGhostButtonClass = `${buttonBase} text-red-600 hover:bg-[var(--color-danger-soft)]`

export const cardClass =
  'rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-card transition duration-200'

export const cardInteractiveClass =
  `${cardClass} hover:-translate-y-1.5 hover:border-indigo-200/80 hover:shadow-lift`

export const panelClass = cardClass

export const sectionTitleClass = 'text-[0.9375rem] font-semibold tracking-tight text-[var(--color-ink)]'

export const mutedTextClass = 'text-[0.9375rem] text-[var(--color-mute)]'

export const labelClass = 'mb-1.5 block text-[0.9375rem] font-medium text-[var(--color-ink-soft)]'

export const badgeClass = (tone = 'slate') =>
  ({
    slate: 'bg-[var(--color-surface-muted)] text-[var(--color-ink-soft)]',
    indigo: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-fg)]',
    green: 'bg-[var(--color-success-soft)] text-[var(--color-success-fg)]',
    amber: 'bg-[var(--color-warning-soft)] text-[var(--color-warning-fg)]',
    red: 'bg-[var(--color-danger-soft)] text-[var(--color-danger-fg)]',
  })[tone] + ' inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold tracking-tight transition duration-150'

export const iconTileClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-indigo-600 transition duration-200 group-hover:scale-105 group-hover:brightness-110'

/** Dark solid tile with light glyph — safe in both themes (unlike bg-ink + text-white). */
export const inverseIconTileClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-inverse)] text-[var(--color-on-inverse)] transition duration-200 group-hover:scale-105 group-hover:bg-indigo-600'

export const navActiveClass = 'bg-white/10 text-white'
export const navIdleClass = 'text-white/55 hover:bg-white/[0.06] hover:text-white'

export const tableWrapClass =
  'relative overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-card'

export const listRowActiveClass = 'bg-[var(--color-accent-soft)] text-[var(--color-accent-fg)]'
export const listRowIdleClass = 'hover:bg-[var(--color-surface-muted)] transition-colors duration-150'
