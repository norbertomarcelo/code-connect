import { ApiError, hasMessageForField } from '../lib/api/errors'

const OFFLINE = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
const GENERIC_LOAD = 'Não foi possível carregar as publicações. Tente novamente.'
const GENERIC_PUBLISH = 'Não foi possível publicar. Tente novamente.'
const GENERIC_COMMENT = 'Não foi possível enviar o comentário. Tente novamente.'

export function postsErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_LOAD

  // A malformed id (400) is, for the reader, a post that does not exist.
  if (error.status === 400) return 'Publicação não encontrada.'

  switch (error.kind) {
    case 'not-found':
      return 'Publicação não encontrada.'
    case 'network':
      return OFFLINE
    case 'unauthorized':
      return 'Entre na sua conta para continuar.'
    default:
      return GENERIC_LOAD
  }
}

export interface PostFieldErrors {
  title?: string
  description?: string
  body?: string
  thumbnailUrl?: string
  tags?: string
}

export interface NewPostErrorDisplay {
  formError?: string
  fieldErrors?: PostFieldErrors
}

export function newPostErrorDisplay(error: unknown): NewPostErrorDisplay {
  if (!(error instanceof ApiError)) return { formError: GENERIC_PUBLISH }

  if (error.kind === 'validation') {
    const fieldErrors: PostFieldErrors = {}
    if (hasMessageForField(error, 'title')) {
      fieldErrors.title = 'Informe o nome do projeto'
    }
    if (hasMessageForField(error, 'description')) {
      fieldErrors.description = 'Informe uma descrição'
    }
    if (hasMessageForField(error, 'body')) {
      fieldErrors.body = 'Informe o código'
    }
    // hasMessageForField compares against the lowercased message.
    if (hasMessageForField(error, 'thumbnailurl')) {
      fieldErrors.thumbnailUrl = 'Informe uma URL válida (http ou https)'
    }
    if (hasMessageForField(error, 'tags')) {
      fieldErrors.tags = 'Confira as tags informadas'
    }

    return Object.keys(fieldErrors).length > 0
      ? { fieldErrors }
      : { formError: 'Confira os dados informados' }
  }

  if (error.kind === 'network') return { formError: OFFLINE }
  if (error.kind === 'unauthorized') {
    return { formError: 'Entre na sua conta para publicar.' }
  }
  return { formError: GENERIC_PUBLISH }
}

export function commentErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_COMMENT

  switch (error.kind) {
    case 'validation':
      return error.messages.some((message) => message.includes('one level'))
        ? 'Só é possível responder a um comentário principal.'
        : 'Escreva um comentário.'
    case 'unauthorized':
      return 'Entre na sua conta para comentar.'
    case 'not-found':
      return 'Esta publicação não existe mais.'
    case 'network':
      return OFFLINE
    default:
      return GENERIC_COMMENT
  }
}
