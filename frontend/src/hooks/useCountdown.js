import { useEffect, useEffectEvent, useState } from 'react'

/** Зворотний відлік до `deadline` (мс). `onExpire` викликається один раз, коли час вичерпано. */
export function useCountdown(deadline, paused, onExpire) {
  const [now, setNow] = useState(() => Date.now())
  const handleExpire = useEffectEvent(onExpire)

  useEffect(() => {
    if (paused) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [paused])

  const remainingMs = Math.max(0, deadline - now)
  const expired = remainingMs === 0

  useEffect(() => {
    if (expired && !paused) handleExpire()
  }, [expired, paused])

  return remainingMs
}
