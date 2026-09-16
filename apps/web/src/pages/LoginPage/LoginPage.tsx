import { AuthRedirect } from '../../components/molecules/AuthRedirect'
import { LoginForm } from '../../components/organisms/LoginForm'
import type { LoginFormValues } from '../../components/organisms/LoginForm'
import { SocialLogin } from '../../components/organisms/SocialLogin'
import type { SocialProvider } from '../../components/organisms/SocialLogin'
import { AuthTemplate } from '../../components/templates/AuthTemplate'

function handleSubmit(values: LoginFormValues) {
  console.info('login submit', values)
}

function handleSocialSelect(provider: SocialProvider) {
  console.info('login social', provider)
}

export function LoginPage() {
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
      <LoginForm forgotPasswordTo="/recuperar-senha" onSubmit={handleSubmit} />
      <SocialLogin
        label="ou entre com outras contas"
        onSelect={handleSocialSelect}
      />
    </AuthTemplate>
  )
}
