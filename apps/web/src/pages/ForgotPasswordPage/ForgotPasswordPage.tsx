import { TextLink } from '../../components/atoms/TextLink'

export function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-3xl font-semibold text-offwhite">Recuperar senha</h1>
      <p className="text-muted">
        Em breve você poderá redefinir sua senha por aqui.
      </p>
      <TextLink to="/login">Voltar para o login</TextLink>
    </main>
  )
}
