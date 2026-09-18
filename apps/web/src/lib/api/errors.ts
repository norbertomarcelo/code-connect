import axios from 'axios'

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'not-found'
  | 'conflict'
  | 'network'
  | 'server'
  | 'unknown'

/**
 * Nest's default error bodies come in three shapes:
 *   422 -> { message: string[], error, statusCode }
 *   401 (controller) / 409 -> { message: string, error, statusCode }
 *   401 (passport guard) -> { message: 'Unauthorized', statusCode }  (no `error`)
 */
interface NestErrorBody {
  message?: string | string[]
  error?: string
  statusCode?: number
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly messages: string[]

  constructor(kind: ApiErrorKind, status: number | null, messages: string[]) {
    super(messages[0] ?? 'Request failed')
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.messages = messages
  }
}

function kindFor(status: number | null): ApiErrorKind {
  if (status === null) return 'network'
  if (status === 401) return 'unauthorized'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  if (status === 422) return 'validation'
  if (status >= 500) return 'server'
  return 'unknown'
}

function messagesFrom(data: unknown, status: number | null): string[] {
  const body = (typeof data === 'object' && data !== null ? data : {}) as NestErrorBody

  if (Array.isArray(body.message)) {
    return body.message.filter(
      (item): item is string => typeof item === 'string',
    )
  }
  if (typeof body.message === 'string') return [body.message]
  if (typeof body.error === 'string') return [body.error]

  return [
    status === null ? 'Network error' : `Request failed with status ${status}`,
  ]
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null
    return new ApiError(
      kindFor(status),
      status,
      messagesFrom(error.response?.data, status),
    )
  }

  return new ApiError('unknown', null, [
    error instanceof Error ? error.message : 'Unexpected error',
  ])
}

/** class-validator messages are prefixed with the field name, e.g. "email must be an email". */
export function hasMessageForField(error: ApiError, field: string): boolean {
  return error.messages.some((message) =>
    message.toLowerCase().startsWith(field),
  )
}
