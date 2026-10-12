import { useEffect, useEffectEvent, useState } from 'react'

/**
 * Завантажує дані при монтуванні та зміні `dependency`.
 * `reload()` повторює запит. З `keepPrevious` під час повторного завантаження
 * повертаються останні отримані дані (без блимання інтерфейсу).
 */
export function useAsyncData(fetcher, dependency = null, { keepPrevious = false } = {}) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const requestKey = `${dependency}:${attempt}`
  const run = useEffectEvent(fetcher)

  useEffect(() => {
    let cancelled = false
    run().then(
      (data) => !cancelled && setState({ key: requestKey, data, error: null }),
      (error) => !cancelled && setState((prev) => ({ key: requestKey, data: keepPrevious ? prev.data : null, error })),
    )
    return () => {
      cancelled = true
    }
  }, [requestKey, keepPrevious])

  const settled = state.key === requestKey
  return {
    data: settled || keepPrevious ? state.data : null,
    error: settled ? state.error : null,
    loading: !settled,
    reload: () => setAttempt((value) => value + 1),
  }
}
