import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { loginErrorMessage } from '../../auth/messages'
import { useAuth } from '../../auth/useAuth'
import { AuthRedirect } from '../../components/molecules/AuthRedirect'
import { LoginForm } from '../../components/organisms/LoginForm'
import type { LoginFormValues } from '../../components/organisms/LoginForm'
import { SocialLogin } from '../../components/organisms/SocialLogin'
import type { SocialProvider } from '../../components/organisms/SocialLogin'
import { AuthTemplate } from '../../components/templates/AuthTemplate'

interface LoginLocationState {
  notice?: string
  email?: string
  remember?: boolean
  from?: { pathname?: string }
}

function handleSocialSelect(provider: SocialProvider) {
  console.info('login social', provider)
}

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const state = (location.state ?? null) as LoginLocationState | null
  const redirectTo = state?.from?.pathname ?? '/inicio'

  async function handleSubmit(values: LoginFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await signIn(values)
      await navigate(redirectTo, { replace: true })
    } catch (error) {
      setSubmitError(loginErrorMessage(error))
      setIsSubmitting(false)
    }
  }

  return (
    <AuthTemplate
      bannerSrc="/banner-login.webp"
      bannerAlt="Code Connect"
      bannerWidth={407}
      bannerHeight={628}
      title="Login"
      subtitle="Boas-vindas! Faça seu login."
      footer={
        <AuthRedirect
          question="Ainda não tem conta?"
          linkText="Crie seu cadastro!"
          to="/cadastro"
          icon="clipboard"
        />
      }
    >
      {state?.notice ? (
        <p role="status" className="text-sm text-primary">
          {state.notice}
        </p>
      ) : null}
      <LoginForm
        forgotPasswordTo="/recuperar-senha"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        defaultEmail={state?.email}
        defaultRemember={state?.remember}
      />
      <SocialLogin
        label="ou entre com outras contas"
        onSelect={handleSocialSelect}
      />
    </AuthTemplate>
  )
}
