import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../atoms/Button'
import { Checkbox } from '../../atoms/Checkbox'
import { FormField } from '../../molecules/FormField'

export interface SignupFormValues {
  name: string
  email: string
  password: string
  remember: boolean
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
}

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void
  isSubmitting?: boolean
  submitError?: string | null
  /** Errors reported by the API, e.g. a duplicate email (409). */
  fieldErrors?: FormErrors
}

const emailPattern = /^\S+@\S+\.\S+$/
const MIN_PASSWORD_LENGTH = 8

export function SignupForm({
  onSubmit,
  isSubmitting = false,
  submitError,
  fieldErrors,
}: SignupFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    if (!name.trim()) {
      nextErrors.name = 'Informe seu nome completo'
    }
    if (!email.trim()) {
      nextErrors.email = 'Informe seu email'
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Informe um email válido'
    }
    if (!password) {
      nextErrors.password = 'Informe uma senha'
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = 'A senha deve ter ao menos 8 caracteres'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({ name: name.trim(), email: email.trim(), password, remember })
  }

  return (
    <form noValidate className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FormField
        label="Nome"
        placeholder="Nome completo"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name ?? fieldErrors?.name}
      />
      <FormField
        label="Email"
        type="email"
        placeholder="Digite seu email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email ?? fieldErrors?.email}
      />
      <FormField
        label="Senha"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password ?? fieldErrors?.password}
      />

      <Checkbox
        checked={remember}
        onChange={(event) => setRemember(event.target.checked)}
      >
        Lembrar-me
      </Checkbox>

      {submitError ? (
        <p role="alert" className="text-sm text-danger">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" icon="arrow-right" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
      </Button>
    </form>
  )
}
