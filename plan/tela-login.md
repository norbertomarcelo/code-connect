# Planejamento — Tela de Login

## 1. Estado atual

A UI da tela de login já está implementada em `apps/web`, seguindo Atomic Design:

- `pages/LoginPage` monta `AuthTemplate` + `LoginForm` + `SocialLogin` + `AuthRedirect`.
- `organisms/LoginForm` já faz validação client-side simples (campos obrigatórios) e expõe `onSubmit(values: LoginFormValues)`.
- `organisms/SocialLogin` expõe `onSelect(provider: 'github' | 'google')`.
- `LoginPage` hoje só loga no console (`handleSubmit`, `handleSocialSelect`) — **não há chamada de API**.
- Links para `/cadastro` e `/recuperar-senha` existem na tela, mas essas rotas não estão registradas em `App.tsx` e não têm páginas.
- `apps/api` ainda é o template padrão do Nest (só `AppController`/`AppService`), sem módulo de autenticação, usuário ou sessão.
- Não há proxy do Vite nem CORS configurado entre `web` e `api` (confirmado em `CLAUDE.md`).

Ou seja: falta todo o caminho de ponta a ponta (API de auth + integração no front). Este documento planeja esse trabalho.

## 2. Escopo

Cobrir o fluxo de login completo: autenticação real contra a API, feedback de loading/erro na UI, persistência de sessão e as rotas dependentes (cadastro, recuperar senha) na medida em que bloqueiam o login.

Fora de escopo por ora: cadastro e recuperação de senha em si (apenas garantir que as rotas existam para não quebrar os links), login social (github/google) real — fica com stub.

## 3. Backend (`apps/api`)

Modelar login como criação de um recurso `sessions`, seguindo as convenções REST do projeto (recurso, não verbo):

- `POST /sessions`
  - Body: `{ identifier: string, password: string }` (email ou usuário).
  - `201 Created` com `Location: /sessions/:id` e body `{ accessToken, expiresAt, user: { id, name, email } }`.
  - `401 Unauthorized` para credenciais inválidas.
  - `422 Unprocessable Entity` para body malformado (campos ausentes/tipo errado) — usar `ValidationPipe` + DTO (`class-validator`).
- `DELETE /sessions/:id` (logout) — `204 No Content`. Pode ficar como placeholder para depois, já que JWT stateless não exige revogação imediata.

Novo módulo `auth` (ou `sessions`):
- `SessionsController`, `SessionsService`, `CreateSessionDto`.
- Hash de senha (bcrypt) e emissão de JWT (`@nestjs/jwt`) — mesmo que o "banco" de usuários seja mockado/in-memory nesta fase, para não bloquear o front.
- Erros lançados com `UnauthorizedException` (Nest cuida do corpo JSON padrão).

## 4. Integração no frontend (`apps/web`)

- Configurar proxy do Vite (`server.proxy['/api']`) apontando para a API em dev, evitando problemas de CORS.
- Criar um client HTTP simples (`src/lib/api.ts` ou similar) para centralizar `fetch` + base URL + tratamento de erro — sem introduzir libs novas a menos que já exista alguma no `package.json`.
- Em `LoginPage`, trocar os `console.info` por chamadas reais:
  - `handleSubmit`: `POST /sessions`, tratar `401` mostrando erro no formulário, sucesso guarda o token e redireciona.
  - `handleSocialSelect`: manter como stub (`console.info` ou toast "em breve") até login social entrar em escopo.
- Adicionar estado de loading/erro ao `LoginForm` (prop nova, ex. `isSubmitting`, `submitError`) — desabilitar o botão durante o request e exibir mensagem de erro geral (credenciais inválidas) além dos erros de campo já existentes.
- Persistência de sessão: guardar o `accessToken` (ex. em memória + `localStorage` para sobreviver a reload) e anexar `Authorization: Bearer <token>` nas próximas chamadas (mantém a API stateless, conforme `CLAUDE.md`).
- Registrar rotas faltantes em `App.tsx`: `/cadastro` e `/recuperar-senha`, mesmo que como páginas placeholder, para os links de `AuthRedirect`/`TextLink` não quebrarem.
- Pós-login: redirecionar para uma rota autenticada (a definir — pode ser um placeholder `/inicio`) usando `react-router`.

## 5. Testes

- API: unit tests do `SessionsService` (senha correta/incorreta) com Vitest; e2e (`test/*.e2e-spec.ts`) cobrindo `POST /sessions` (201 e 401).
- Web: atualizar `LoginPage.test.tsx` e `LoginForm.test.tsx` para cobrir loading/erro de submit (mockando o client HTTP). Manter queries por `getByRole`/`getByLabelText`.

## 6. Ordem sugerida de implementação

1. Backend: módulo `sessions` com usuário mockado in-memory + JWT.
2. Vite proxy + client HTTP no front.
3. Ligar `LoginForm`/`LoginPage` à API real (loading + erro).
4. Persistir token e redirecionar após login.
5. Rotas placeholder `/cadastro` e `/recuperar-senha`.
6. Testes (api e web) cobrindo os casos novos.

## 7. Pontos em aberto (decidir antes de implementar)

- Onde persistir usuários de verdade (banco de dados) — hoje não há nenhum configurado em `apps/api`.
- Estratégia de refresh de token (se necessário) e tempo de expiração do JWT.
- Se login social (github/google) entra neste ciclo ou fica para depois.
