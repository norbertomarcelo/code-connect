import { ApiError, hasMessageForField } from '../lib/api/errors'

const GENERIC_LOGIN = 'Não foi possível entrar. Tente novamente.'
const GENERIC_SIGNUP = 'Não foi possível concluir o cadastro. Tente novamente.'
const OFFLINE = 'Não foi possível conectar ao servidor. Verifique sua conexão.'

export function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_LOGIN

  switch (error.kind) {
    case 'unauthorized':
      return 'Email ou senha inválidos'
    case 'validation':
      return 'Confira o email e a senha informados'
    case 'network':
      return OFFLINE
    default:
      return GENERIC_LOGIN
  }
}

export interface SignupFieldErrors {
  name?: string
  email?: string
  password?: string
}

export interface SignupErrorDisplay {
  formError?: string
  fieldErrors?: SignupFieldErrors
}

export function signupErrorDisplay(error: unknown): SignupErrorDisplay {
  if (!(error instanceof ApiError)) return { formError: GENERIC_SIGNUP }

  if (error.kind === 'conflict') {
    return { fieldErrors: { email: 'Este email já está cadastrado' } }
  }

  if (error.kind === 'validation') {
    const fieldErrors: SignupFieldErrors = {}
    if (hasMessageForField(error, 'name')) {
      fieldErrors.name = 'Informe seu nome completo'
    }
    if (hasMessageForField(error, 'email')) {
      fieldErrors.email = 'Informe um email válido'
    }
    if (hasMessageForField(error, 'password')) {
      fieldErrors.password = 'A senha deve ter ao menos 8 caracteres'
    }

    return Object.keys(fieldErrors).length > 0
      ? { fieldErrors }
      : { formError: 'Confira os dados informados' }
  }

  if (error.kind === 'network') return { formError: OFFLINE }
  return { formError: GENERIC_SIGNUP }
}
