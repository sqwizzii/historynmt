export default function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <header className="page-header-enter mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-indigo-600">{eyebrow}</p>
        )}
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-[var(--color-ink)] sm:text-[1.5rem]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--color-mute)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
    </header>
  )
}
