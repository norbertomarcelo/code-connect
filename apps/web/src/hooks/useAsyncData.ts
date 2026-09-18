import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeError } from '../lib/api/errors'
import type { ApiError } from '../lib/api/errors'

export type AsyncState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: ApiError }

export interface AsyncResult<T> {
  state: AsyncState<T>
  /** Fetches again from scratch, going back through `loading`. */
  reload: () => void
  /** Changes the loaded data locally, for optimistic updates. */
  setData: (updater: (previous: T) => T) => void
}

const LOADING = { status: 'loading', data: null, error: null } as const

/**
 * Runs `load` whenever `deps` change.
 *
 * `deps` is an explicit list of primitives, like useEffect's: `load` is a new
 * closure on every render, so it cannot be the dependency itself. It is
 * serialized into a key, and a result only counts while its key is still the
 * current one. That is also what discards a slow response that arrives after a
 * newer request, which the debounced feed search makes routine.
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  deps: unknown[],
): AsyncResult<T> {
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState<{
    key: string
    state: Exclude<AsyncState<T>, { status: 'loading' }>
  } | null>(null)

  const key = JSON.stringify([...deps, reloadCount])
  const loadRef = useRef(load)

  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    let active = true

    loadRef
      .current()
      .then((data) => {
        if (active) {
          setResult({ key, state: { status: 'success', data, error: null } })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setResult({
            key,
            state: { status: 'error', data: null, error: normalizeError(error) },
          })
        }
      })

    return () => {
      active = false
    }
  }, [key])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  const setData = useCallback((updater: (previous: T) => T) => {
    setResult((current) => {
      if (!current || current.state.status !== 'success') return current
      return {
        key: current.key,
        state: { ...current.state, data: updater(current.state.data) },
      }
    })
  }, [])

  const state = result && result.key === key ? result.state : LOADING

  return { state, reload, setData }
}
