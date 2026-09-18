import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../atoms/Button'
import { Checkbox } from '../../atoms/Checkbox'
import { TextLink } from '../../atoms/TextLink'
import { FormField } from '../../molecules/FormField'

export interface LoginFormValues {
  email: string
  password: string
  remember: boolean
}

interface LoginFormProps {
  forgotPasswordTo: string
  onSubmit: (values: LoginFormValues) => void
  isSubmitting?: boolean
  submitError?: string | null
  defaultEmail?: string
  defaultRemember?: boolean
}

interface FormErrors {
  email?: string
  password?: string
}

const emailPattern = /^\S+@\S+\.\S+$/

export function LoginForm({
  forgotPasswordTo,
  onSubmit,
  isSubmitting = false,
  submitError,
  defaultEmail = '',
  defaultRemember = false,
}: LoginFormProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(defaultRemember)
  const [errors, setErrors] = useState<FormErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    if (!email.trim()) {
      nextErrors.email = 'Informe seu email'
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Informe um email válido'
    }
    if (!password) {
      nextErrors.password = 'Informe sua senha'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({ email: email.trim(), password, remember })
  }

  return (
    <form noValidate className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FormField
        label="Email"
        type="email"
        placeholder="Digite seu email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      <FormField
        label="Senha"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />

      <div className="flex items-center justify-between">
        <Checkbox
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
        >
          Lembrar-me
        </Checkbox>
        <TextLink to={forgotPasswordTo}>Esqueci a senha</TextLink>
      </div>

      {submitError ? (
        <p role="alert" className="text-sm text-danger">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" icon="arrow-right" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Login'}
      </Button>
    </form>
  )
}
