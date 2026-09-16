import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../atoms/Button'
import { Checkbox } from '../../atoms/Checkbox'
import { TextLink } from '../../atoms/TextLink'
import { FormField } from '../../molecules/FormField'

export interface LoginFormValues {
  identifier: string
  password: string
  remember: boolean
}

interface LoginFormProps {
  forgotPasswordTo: string
  onSubmit: (values: LoginFormValues) => void
}

interface FormErrors {
  identifier?: string
  password?: string
}

export function LoginForm({ forgotPasswordTo, onSubmit }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    if (!identifier.trim()) {
      nextErrors.identifier = 'Informe seu email ou usuário'
    }
    if (!password) {
      nextErrors.password = 'Informe sua senha'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({ identifier, password, remember })
  }

  return (
    <form noValidate className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FormField
        label="Email ou usuário"
        placeholder="usuario123"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        error={errors.identifier}
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

      <Button type="submit" icon="arrow-right" fullWidth>
        Login
      </Button>
    </form>
  )
}
