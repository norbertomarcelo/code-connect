# Integração do `apps/web` com o `apps/api` via axios

## Contexto

O backend NestJS já está pronto e verificado: `POST /users`, `POST /auth/login`, `GET /auth/me`, com Swagger em `/docs`. O frontend, por outro lado, só tem UI: os `onSubmit` de `LoginPage` e `SignupPage` são funções em escopo de módulo que fazem `console.info`. Não existe nenhuma camada de transporte no `apps/web` — sem axios, sem `fetch`, sem proxy do Vite, sem armazenamento de token, sem contexto de sessão, sem rota protegida. O `CLAUDE.md` registra isso: *"The web app does not call the API yet, and no Vite proxy or CORS is set up."*

O objetivo é fechar esse ciclo: cadastrar, entrar, manter a sessão entre reloads e proteger uma rota autenticada, usando axios como cliente HTTP.

### Contrato da API (confirmado no código)

| Endpoint | Request | Sucesso | Erros |
|---|---|---|---|
| `POST /users` | `{ name, email, password }` (senha ≥ 8) | `201` + `Location`, body `{ id, name, email }` | `409` email duplicado, `422` validação |
| `POST /auth/login` | `{ email, password }` | `200`, body `{ accessToken, expiresAt, user }` | `401` credenciais, `422` validação |
| `GET /auth/me` | `Authorization: Bearer <token>` | `200`, body `{ id, name, email }` | `401` |

Sem prefixo global, sem refresh token, JWT de 1h. `expiresAt` é um instante ISO-8601 absoluto. Os corpos de erro do Nest vêm em **três formatos**: `{ message: string[], error, statusCode }` (422), `{ message: string, error, statusCode }` (401 do controller / 409) e `{ message: 'Unauthorized', statusCode }` **sem a chave `error`** (401 do guard do passport). As mensagens do 422 são frases em inglês do class-validator, sem mapa campo→erro.

### Decisões tomadas com o usuário

1. **Proxy do Vite**, não CORS — o `apps/api` não é modificado.
2. **Token no `localStorage` quando "Lembrar-me" está marcado**, `sessionStorage` quando não.
3. **Sem auto-login após cadastro** — redireciona para `/login` com mensagem de sucesso.
4. **Rota `/inicio` protegida** com placeholder, mais `/recuperar-senha` (hoje é link morto).
5. **Renomear `identifier` → `email`** no `LoginForm` (o `LoginDto` tem `@IsEmail()`; não existe username no schema, e `plan/backend-auth.md` já registrava essa decisão).
6. **Cadastro leva `email` + `remember` para o login** via state da rota, e o `LoginForm` ganha `defaultEmail`/`defaultRemember`.

---

## Arquitetura

```
apps/web/src/
  lib/
    session.ts              # storage + expiração + pub/sub
    api/
      types.ts              # espelha os DTOs do Nest
      errors.ts             # ApiError + normalizeError (módulo separado: nunca é mockado)
      client.ts             # instância axios + interceptors
      auth.ts               # login(), getCurrentUser()
      users.ts              # createUser()
  auth/                     # NÃO é Atomic Design — comportamento transversal, sem UI
    AuthContext.ts          # contexto + tipos (sem JSX)
    AuthProvider.tsx        # só o componente
    useAuth.ts              # só o hook
    ProtectedRoute.tsx
    messages.ts             # ApiError → copy pt-BR
    index.ts
```

Direção das dependências (acíclica): `api/client → session`, `api/client → api/errors`, `api/auth|users → api/client`, `auth/* → api/* + session`.

**Por que `src/auth/` fora de `src/components/`:** `AuthProvider`, `useAuth` e `ProtectedRoute` não renderizam UI própria. Enfiá-los na hierarquia atômica quebraria a regra de "nunca importar para cima" (precisam importar `src/lib/`, que não é nível nenhum) e a regra de que atoms/molecules são apresentacionais. O `CLAUDE.md` ganha um parágrafo explicando isso no último commit.

**Por que três arquivos em `src/auth/`:** `.oxlintrc.json` tem `react/only-export-components`. Exportar `useAuth` e `AuthProvider` do mesmo arquivo dispara a regra e quebra o fast refresh da subárvore. O `index.ts` reexporta os dois — um barrel sem *definição* de componente não dispara a regra (mesmo formato dos `components/**/index.ts` existentes).

---

## Peças principais

### `vite.config.ts` — proxy

```ts
server: {
  proxy: {
    // A API não tem CORS nem prefixo global: o dev server encaminha /api/*
    // removendo o prefixo (/api/auth/login -> /auth/login).
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
},
```

`defineConfig` já vem de `vitest/config`, que estende o `UserConfig` do Vite — sem mudança de import.

### `src/lib/session.ts`

Módulo de estado no nível do módulo, importado tanto pelo cliente axios quanto pelo `AuthProvider`. **Essa é a solução para a dependência circular** — nada de o provider registrar um getter no cliente (isso criaria um buraco de ordem de inicialização: uma request disparada antes do `useEffect` do provider sairia sem token).

API: `readSession()`, `saveSession(session, remember)`, `clearSession()`, `getAccessToken()`, `subscribe(listener)`, `isExpired(expiresAt)`.

- `saveSession` escreve no `localStorage` ou `sessionStorage` conforme `remember`, e **remove do outro** para não ficarem duas sessões divergentes.
- `readSession` lê o storage a cada chamada (sem cache — cache é a origem clássica do bug "deslogou num lugar, continua logado no outro"), valida o formato, checa `expiresAt` com 5s de folga e **limpa a entrada** se estiver expirada ou corrompida. Todo `getItem`/`setItem`/`JSON.parse` dentro de `try/catch` (modo privado / cota).
- Fallback em memória usado **apenas** quando uma escrita realmente lançou, para não vazar entre testes.
- `subscribe` é o que permite ao interceptor derrubar a árvore React para `anonymous` num 401.

Checar `expiresAt` no cliente evita um round-trip garantidamente 401 no boot e o flash "autenticado por 300ms e chutado". O servidor continua sendo a autoridade.

### `src/lib/api/errors.ts`

`ApiError extends Error` com `kind: 'validation' | 'unauthorized' | 'conflict' | 'network' | 'server' | 'unknown'`, `status: number | null` e `messages: string[]`. `normalizeError(error)` achata os três formatos do Nest (array, string, sem `error`) e o caso sem `response` (rede). `hasMessageForField(error, 'password')` casa o prefixo da mensagem do class-validator.

Fica em módulo **separado** de propósito: os testes mockam `api/auth` e `api/users`, mas continuam podendo lançar `new ApiError(...)` com `instanceof` funcionando.

Sem enum (union type) e sem parameter properties — `erasableSyntaxOnly` exige.

### `src/lib/api/client.ts`

```ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})
```

- Request interceptor injeta `Authorization: Bearer` a partir de `getAccessToken()`.
- Response interceptor converte toda rejeição em `ApiError` — páginas e provider **nunca** veem `AxiosError`. Num `401` que **não** venha de `/auth/login`, chama `clearSession()` (um 401 no login é só senha errada).

Sem `.env` commitado: o proxy cobre `pnpm dev`, e o fallback `?? '/api'` é a saída para `vite preview` ou deploy separado. `apps/web/.gitignore` já ignora `*.local`; a variável fica documentada no `CLAUDE.md`.

### `src/auth/AuthContext.ts` + `AuthProvider.tsx`

```ts
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  signIn: (credentials: { email: string; password: string; remember: boolean }) => Promise<void>
  signUp: (values: CreateUserRequest) => Promise<AuthUser>
  signOut: () => void
}
```

Três estados, não um booleano: `loading` é exatamente o estado que o `ProtectedRoute` **não pode** tratar como anônimo, senão todo reload chuta o usuário para `/login`.

`AuthProvider`:
- **Bootstrap:** se não há sessão guardada → `anonymous` direto. Se há → `getCurrentUser()` valida; sucesso vira `authenticated`, falha limpa e vira `anonymous`. Flag `active` no cleanup.
- **Segundo efeito:** `subscribe(...)` — se a sessão sumiu (interceptor limpou num 401), zera `user` e vai para `anonymous`.
- `signIn` chama `login()`, `saveSession(session, remember)` e **relança** o `ApiError`; traduzir para pt-BR é trabalho da página.
- `signUp` só encaminha `createUser` (não toca estado de auth, mas fica no contexto para a página ter uma dependência só para stubar).
- `value` memoizado com `useMemo`; callbacks com `useCallback`.

### `src/auth/messages.ts`

As mensagens de 422 são frases em inglês — nunca renderizar cru para o usuário.

- `loginErrorMessage(error)`: `unauthorized` → `'Email ou senha inválidos'`; `validation` → `'Confira o email e a senha informados'`; `network` → `'Não foi possível conectar ao servidor. Verifique sua conexão.'`; resto → genérica.
- `signupErrorDisplay(error)`: `conflict` → `{ fieldErrors: { email: 'Este email já está cadastrado' } }`; `validation` → mapeia por prefixo para `name`/`email`/`password` (ex. `'A senha deve ter ao menos 8 caracteres'`); resto → `formError`.

### `src/auth/ProtectedRoute.tsx`

`loading` → `<p role="status">Carregando...</p>`. `anonymous` → `<Navigate to="/login" replace state={{ from: location }} />`. `authenticated` → children. Usa `children`, não `<Outlet />` — a tabela de rotas é plana e baseada em objetos.

---

## Mudanças nos componentes existentes

### `LoginForm` (`organisms/LoginForm/LoginForm.tsx`)

- `LoginFormValues.identifier` → `email`. Label `"Email ou usuário"` → `"Email"`, `type="email"`, placeholder `"Digite seu email"`.
- Validação: vazio → `'Informe seu email'`; formato inválido (`/^\S+@\S+\.\S+$/`) → `'Informe um email válido'`.
- Props novas, **todas opcionais** (não quebram compilação dos testes): `isSubmitting?`, `submitError?: string | null`, `defaultEmail?`, `defaultRemember?` (seed dos inicializadores de `useState`).
- Renderiza `{submitError && <p role="alert" className="text-sm text-danger">}`; `<Button disabled={isSubmitting}>{isSubmitting ? 'Entrando...' : 'Login'}</Button>` — `getByRole('button', { name: /login/i })` continua casando no estado ocioso.
- `onSubmit` **continua** `(values) => void`: TS aceita um handler `async` onde se espera `void`, e mudar a assinatura obrigaria a mexer em todo `vi.fn()` sem ganho.
- A página é dona do `isSubmitting` (CLAUDE.md: "data and side effects belong in pages"); o organism continua função pura das props.

### `SignupForm`

- Props novas opcionais: `isSubmitting?`, `submitError?`, `fieldErrors?: { name?, email?, password? }`.
- Validação de cliente mais forte para o 422 ficar raro: formato de email e `password.length < 8` → `'A senha deve ter ao menos 8 caracteres'`.
- Renderiza `error={errors.email ?? fieldErrors?.email}` — erro local fresco sempre ganha de erro de servidor velho.
- Mesmo alerta de `submitError` e botão desabilitado (`'Cadastrando...'`).

### `atoms/Button`

Não existe estilo de desabilitado hoje. Acrescentar à string base: `disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100` (o último neutraliza o `hover:brightness-95` da variante; no Tailwind v4 a variante empilhada vence). Sem token novo.

### `src/index.css`

Não existe token de erro — `FormField` usa `text-red-400` da paleta padrão do Tailwind, furando os tokens do `@theme`. Adicionar `--color-danger: #ff6b6b;` (≈7:1 sobre `--color-surface`, AA folgado) e trocar `FormField` para `text-danger`. A notícia de sucesso reaproveita `text-primary`.

---

## Páginas

### `LoginPage`

Handlers movem para **dentro** do componente (hoje estão em escopo de módulo e por isso não podem usar hooks). Usa `useAuth()`, `useNavigate()`, `useLocation()`.

- Lê `location.state` para `notice` (mensagem do cadastro), `email`/`remember` (pré-preenchimento) e `from.pathname` (destino pós-login, default `/inicio`).
- `handleSubmit`: `setIsSubmitting(true)` → `await signIn(...)` → `navigate(redirectTo, { replace: true })`; no `catch`, `setSubmitError(loginErrorMessage(error))` e `setIsSubmitting(false)`.
- `isSubmitting` **só** é resetado no `catch` — no sucesso o componente está desmontando e o botão deve continuar desabilitado (evita `setState` em árvore desmontando).
- O `notice` entra como mais um child do `AuthTemplate` — o template já recebe `children: ReactNode` e a página já passa dois filhos. **Zero mudança no `AuthTemplate`.**

### `SignupPage`

`await signUp({ name, email, password })` → `navigate('/login', { replace: true, state: { notice: 'Cadastro realizado! Faça login para continuar.', email: values.email, remember: values.remember } })`. No `catch`, distribui `signupErrorDisplay(error)` entre `submitError` e `fieldErrors`.

State da rota em vez de query param: URL limpa, some no F5 (mensagem flash não deve sobreviver a reload), nada para sanitizar, e o `MemoryRouter` suporta em teste via `initialEntries: [{ pathname, state }]`.

### Páginas novas

- `pages/HomePage` — `<h1>Olá, {user?.name}</h1>` + `<Button onClick={handleSignOut}>Sair</Button>` (que chama `signOut()` e navega para `/login`).
- `pages/ForgotPasswordPage` — placeholder com título, uma linha de texto e `<TextLink to="/login">`.

Ambas com `index.ts`, `*.test.tsx` e `*.a11y.test.tsx`, seguindo `LoginPage`.

### `App.tsx`

```tsx
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/inicio" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <SignupPage /> },
  { path: '/recuperar-senha', element: <ForgotPasswordPage /> },
  { path: '/inicio', element: <ProtectedRoute><HomePage /></ProtectedRoute> },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
```

`AuthProvider` envolve o `RouterProvider` (não vira layout route): o router é constante de módulo, e um provider acima dele nunca remonta em transição de rota. Custo: o `AuthProvider` não pode usar hooks de router — e não precisa, todo redirect é emitido por uma página ou pelo `ProtectedRoute`. `/` passa a apontar para `/inicio` e o guard decide: anônimo cai em `/login` como antes, autenticado entra direto.

---

## Testes

**Estratégia: mockar os nossos wrappers, não o axios, e sem MSW.** `vi.mock('../lib/api/auth', ...)` substitui o módulo antes de `client.ts` ser importado — o axios nunca carrega e o jsdom nunca tenta XHR. Melhor que mockar o axios (sem emular adapter/interceptors) e muito mais leve que adicionar MSW para três endpoints. Testes de página nem precisam disso: renderizam contra um contexto stubado.

**`src/test/renderWithAuth.tsx` (novo)** — helper separado, não um `renderWithRouter` sobrecarregado: `renderWithRouter` é usado por atoms/molecules que **não** devem conhecer auth. Compõe o mesmo `MemoryRouter` e injeta um `AuthContext.Provider` com valor default anônimo, aceitando `{ route, state, auth }` para sobrescrever o que está sob teste.

**`src/test/renderWithRouter.tsx`** — ganha a opção `state` (`initialEntries: [{ pathname: route, state }]`), retrocompatível.

**`src/test/setup.ts`** — `afterEach(() => { localStorage.clear(); sessionStorage.clear() })`.

### Testes existentes que quebram

| Arquivo | Motivo | Correção |
|---|---|---|
| `LoginForm.test.tsx` | label, mensagem e chave `identifier` | renomear para `'Email'` / `'Informe seu email'` / `email:`; somar casos de email inválido, `submitError`, `isSubmitting`, `defaultEmail` |
| `LoginPage.test.tsx` + `.a11y` | `useAuth` lança sem provider, e o label mudou | migrar para `renderWithAuth`; somar submit, falha 401 e `notice` |
| `SignupPage.test.tsx` + `.a11y` | provider | migrar para `renderWithAuth`; somar sucesso (args de `signUp` + redirect) e 409 no campo de email |
| `SignupForm.test.tsx` | não quebra | somar senha < 8, email inválido, `fieldErrors`, `submitError`, `isSubmitting` |
| `Button.test.tsx` | não quebra | somar o caso desabilitado (click não dispara `onClick`) |

### Testes novos

`session.test.ts` (localStorage vs sessionStorage e limpeza do outro, expirado, JSON corrompido, `subscribe`), `errors.test.ts` (os três formatos do Nest + erro de rede; montar input com `Object.assign(new Error('x'), { isAxiosError: true, response, config })`), `AuthProvider.test.tsx` (bootstrap nos três caminhos, `signIn` com/sem `remember`, `signOut`), `ProtectedRoute.test.tsx`, `useAuth.test.tsx`, `messages.test.ts`, e os testes + a11y das duas páginas novas.

---

## Sequência de commits

1. `docs(web): add frontend api integration plan` — `plan/integracao-frontend-api.md` (pt-BR, como os outros docs de `plan/`)
2. `build(web): add axios` — axios é JS puro, sem lifecycle script rodado pelo pnpm para tarball de registry; não precisa de entrada em `allowBuilds`
3. `feat(web): proxy api requests to the nest backend in dev` — `vite.config.ts`
4. `feat(web): add browser session storage helpers` — `lib/session.ts` + teste + limpeza no `setup.ts`
5. `feat(web): add the axios api client and error normalization` — `lib/api/*`
6. `feat(web): add the auth context and provider` — `auth/{AuthContext,AuthProvider,useAuth,messages,index}` + `test/renderWithAuth.tsx` + `state` no `renderWithRouter`
7. `feat(web): add the protected route guard`
8. `feat(web): add a danger color token for error text` — `index.css` + `FormField`
9. `feat(web): add a disabled state to the button atom`
10. `feat(web): use email and show submit state in the auth forms` — inclui a asserção de label no `LoginPage.test.tsx` para o commit ficar verde
11. `feat(web): connect the login page to the api`
12. `feat(web): connect the signup page to the api`
13. `feat(web): add the home and forgot password pages`
14. `feat(web): wire the auth provider and routes into the app`
15. `docs: document the web api integration` — `CLAUDE.md`: proxy, `src/lib/`, `src/auth/` e **por que** fica fora do Atomic Design, convenção de mock sem MSW, `renderWithAuth`, `VITE_API_URL`

Cada commit deixa `pnpm web build` (que roda `tsc -b`), `pnpm web lint` e `pnpm web test` verdes.

---

## Verificação

**Automática**, ao fim:

```bash
pnpm web test     # vitest: unidade + a11y
pnpm web lint     # oxlint (rules-of-hooks, only-export-components)
pnpm web build    # tsc -b + vite build — erro de tipo quebra o build
pnpm test         # os dois apps
```

**Manual (ponta a ponta)**, após o commit 14:

```bash
pnpm db:up && pnpm api db:migrate && pnpm dev
```

1. `/cadastro` → cadastrar → redireciona para `/login` com a mensagem de sucesso, email pré-preenchido
2. Cadastrar o mesmo email de novo → `'Este email já está cadastrado'` no campo de email (409)
3. Senha com menos de 8 caracteres → erro no campo, sem chamar a API
4. Login com senha errada → `'Email ou senha inválidos'` (401), botão volta a habilitar
5. Login correto **sem** "Lembrar-me" → `/inicio` com o nome; F5 mantém a sessão (`GET /auth/me` na aba Network); fechar e reabrir a aba → deslogado
6. Login **com** "Lembrar-me" → sobrevive a fechar o navegador
7. `/inicio` deslogado → redireciona para `/login`
8. "Sair" → volta para `/login`; `/inicio` bloqueia de novo
9. Confirmar no Network que as chamadas saem para `/api/...` e chegam no Nest sem erro de CORS

## Riscos conhecidos

- **Sem refresh token:** depois de 1h a sessão morre no meio do uso e o usuário é chutado para `/login` sem explicação. Melhoria futura: registrar *por que* a sessão foi limpa e passar `state: { notice: 'Sua sessão expirou.' }`.
- **`localStorage` é legível por qualquer XSS** — trade-off aceito junto com a decisão do "Lembrar-me".
- **Erros de campo vindos do servidor ficam velhos enquanto o usuário digita** (só limpam no próximo submit).
- **`StrictMode` dispara o bootstrap duas vezes em dev** — dois `GET /auth/me` no Network. Inofensivo (GET idempotente), mas confunde.
- **`App.tsx` continua sem teste**, como hoje. É uma casca cujas partes estão todas cobertas — lacuna consciente frente ao "a component without a test is not done".
- **Reiniciar a API com outro `JWT_SECRET`** invalida todo token guardado e parece um logout aleatório em dev. O cliente trata certo (401 → limpa → `/login`).
