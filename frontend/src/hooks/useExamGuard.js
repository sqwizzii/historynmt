import { useEffect, useEffectEvent } from 'react'

/**
 * Захист під час тесту: попередження при закритті вкладки, блокування переходів по посиланнях,
 * облік виходів зі сторінки (згортання, інша вкладка чи вікно) та автозавершення при тривалій відсутності.
 */
export function useExamGuard({ active, awayLimitSeconds, onLeave, onReturn, onTooLong, onBlockedNavigation }) {
  const handleLeave = useEffectEvent(onLeave)
  const handleReturn = useEffectEvent(onReturn)
  const handleTooLong = useEffectEvent(onTooLong)
  const handleBlocked = useEffectEvent(onBlockedNavigation)

  useEffect(() => {
    if (!active) return undefined

    const beforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    const blockLinks = (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!link) return
      event.preventDefault()
      event.stopPropagation()
      handleBlocked()
    }

    const lockHistory = () => window.history.pushState(null, '', window.location.href)
    lockHistory()
    window.addEventListener('popstate', lockHistory)
    window.addEventListener('popstate', handleBlocked)

    let awayStart = null
    let timer = null

    const goAway = () => {
      if (awayStart !== null) return
      awayStart = Date.now()
      handleLeave()
      timer = setTimeout(handleTooLong, awayLimitSeconds * 1000)
    }

    const comeBack = () => {
      if (awayStart === null || document.visibilityState !== 'visible' || !document.hasFocus()) return
      clearTimeout(timer)
      const awaySeconds = (Date.now() - awayStart) / 1000
      awayStart = null
      if (awaySeconds > awayLimitSeconds) handleTooLong()
      else handleReturn(Math.round(awaySeconds))
    }

    const onVisibility = () => (document.visibilityState === 'hidden' ? goAway() : comeBack())

    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', blockLinks, true)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', goAway)
    window.addEventListener('focus', comeBack)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', blockLinks, true)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', goAway)
      window.removeEventListener('focus', comeBack)
      window.removeEventListener('popstate', lockHistory)
      window.removeEventListener('popstate', handleBlocked)
    }
  }, [active, awayLimitSeconds])
}
