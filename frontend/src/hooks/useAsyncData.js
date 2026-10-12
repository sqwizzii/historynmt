import { useEffect, useEffectEvent, useState } from 'react'

/**
 * Завантажує дані при монтуванні та зміні `dependency`.
 * `reload()` повторює запит (наприклад, після помилки).
 */
export function useAsyncData(fetcher, dependency = null) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const requestKey = `${dependency}:${attempt}`
  const run = useEffectEvent(fetcher)

  useEffect(() => {
    let cancelled = false
    run().then(
      (data) => !cancelled && setState({ key: requestKey, data, error: null }),
      (error) => !cancelled && setState({ key: requestKey, data: null, error }),
    )
    return () => {
      cancelled = true
    }
  }, [requestKey])

  const settled = state.key === requestKey
  return {
    data: settled ? state.data : null,
    error: settled ? state.error : null,
    loading: !settled,
    reload: () => setAttempt((value) => value + 1),
  }
}
