# Planejamento — Tela de Cadastro

## 1. Estado atual

A UI da tela de cadastro acaba de ser implementada em `apps/web`, replicando o node do Figma
(`Cadastro`, file `CodeConnect - Acervo`, node `155:3484` na versão desktop) e seguindo o mesmo
padrão Atomic Design já usado na tela de login:

- `pages/SignupPage` monta `AuthTemplate` (reaproveitado sem alterações) + `SignupForm` (novo
  organism) + `SocialLogin` (reaproveitado) + `AuthRedirect` (reaproveitado).
- `organisms/SignupForm` replica a validação client-side simples do `LoginForm` (campos
  obrigatórios: nome, email, senha) e expõe `onSubmit(values: SignupFormValues)`.
- Checkbox "Lembrar-me" existe no formulário porque está no design do Figma, mas semanticamente é
  estranho num cadastro — ver ponto em aberto na seção 7.
- Ícone `login` novo em `atoms/Icon` (glyph Material "login"), usado no link "Faça seu login!" do
  footer — espelha o ícone `clipboard` usado no footer da tela de login.
- Asset `banner-cadastro.png` baixado do Figma e commitado em `apps/web/public` (distinto do
  `banner-login.png`).
- Rota `/cadastro` registrada em `App.tsx`, apontando para `SignupPage`.
- `SignupPage` hoje só loga no console (`handleSubmit`, `handleSocialSelect`) — **não há chamada
  de API**, mesma situação em que a tela de login estava antes do plano em `tela-login.md`.
- Testes (`SignupForm.test.tsx`, `SignupPage.test.tsx`) cobrem validação, submit com valores
  preenchidos e a presença dos links/campos, seguindo os mesmos padrões (`getByRole`/
  `getByLabelText`) do restante do projeto.
- Validado visualmente contra o Figma (screenshot do dev server batendo com o design: textos,
  cores, espaçamento, ícones sociais e botão).

Ou seja: a UI está pronta, mas falta o mesmo caminho de ponta a ponta que o login também não tem
— API de cadastro real + integração no front. Este documento planeja esse trabalho, em paralelo
ao que já está descrito em `tela-login.md`.

## 2. Escopo

Cobrir o fluxo de cadastro completo: criação de usuário real contra a API, feedback de
loading/erro na UI, e o que fazer com a sessão após o cadastro (login automático ou redirect).

Fora de escopo por ora: verificação de email, recuperação de senha, login social (github/google)
real — fica com stub, igual ao login.

## 3. Backend (`apps/api`)

Modelar cadastro como criação de um recurso `users`, seguindo as convenções REST do projeto
(recurso, não verbo — nada de `/signup` ou `/register`):

- `POST /users`
  - Body: `{ name: string, email: string, password: string }`.
  - `201 Created` com `Location: /users/:id` e body `{ id, name, email }` (**nunca** devolver a
    senha, nem o hash).
  - `409 Conflict` se o email já estiver cadastrado.
  - `422 Unprocessable Entity` para dados bem-formados mas inválidos (email fora do formato,
    senha fora da política mínima) — `ValidationPipe` + `CreateUserDto` (`class-validator`).
  - `400 Bad Request` para body malformado (campo ausente/tipo errado).

Novo módulo `users`:
- `UsersController`, `UsersService`, `CreateUserDto`, `UserDto` (response, sem senha).
- Hash de senha com bcrypt antes de persistir.
- Nesta fase, sem banco configurado (mesmo ponto em aberto do plano de login) — pode reaproveitar
  o mesmo armazenamento in-memory mockado que o módulo `sessions` vier a usar, para os dois
  módulos ficarem consistentes.
- Após criar o usuário, decidir se `POST /users` já devolve um `accessToken` (cadastro loga
  automaticamente) ou se o front chama `POST /sessions` em seguida — ver seção 7.

## 4. Integração no frontend (`apps/web`)

- Reaproveitar o client HTTP e o proxy do Vite planejados em `tela-login.md` (`src/lib/api.ts`,
  `server.proxy['/api']`) em vez de criar um novo.
- Em `SignupPage`, trocar o `console.info` por chamada real:
  - `handleSubmit`: `POST /users`. Tratar `409` mostrando erro no campo de email ("email já
    cadastrado"), `422`/`400` com mensagens de validação, sucesso guarda sessão (se a API já
    devolver token) ou encadeia `POST /sessions` e redireciona.
  - `handleSocialSelect`: mantém como stub, igual ao login.
- Adicionar estado de loading/erro ao `SignupForm` (mesma abordagem sugerida para o `LoginForm`:
  prop `isSubmitting`/`submitError`), desabilitando o botão "Cadastrar" durante o request.
- Reavaliar o checkbox "Lembrar-me": se ficar, ele deveria controlar a mesma persistência de
  sessão do login (`localStorage` vs. memória); se for decidido que não faz sentido no cadastro,
  remover do `SignupForm` e do design (comunicar a divergência).
- Pós-cadastro: redirecionar para a mesma rota autenticada definida no plano de login (`/inicio`
  ou equivalente), ou para `/login` com mensagem de sucesso, dependendo da decisão da seção 3.

## 5. Testes

- API: unit tests do `UsersService` (criação com sucesso, email duplicado, senha inválida) com
  Vitest; e2e (`test/*.e2e-spec.ts`) cobrindo `POST /users` (201, 409, 422).
- Web: estender `SignupForm.test.tsx`/`SignupPage.test.tsx` para cobrir loading/erro de submit
  (mockando o client HTTP), seguindo o mesmo padrão já usado no plano de login.

## 6. Ordem sugerida de implementação

1. Backend: módulo `users` com armazenamento in-memory + hash de senha (idealmente junto com o
   módulo `sessions` do plano de login, para não duplicar o mock de usuários).
2. Decidir se cadastro loga automaticamente (token direto em `POST /users`) ou exige login
   separado.
3. Ligar `SignupForm`/`SignupPage` à API real (loading + erro).
4. Resolver o checkbox "Lembrar-me" (manter com propósito real ou remover).
5. Testes (api e web) cobrindo os casos novos.

## 7. Pontos em aberto (decidir antes de implementar)

- Cadastro loga automaticamente o usuário ou redireciona para `/login`?
- Política mínima de senha (tamanho, caracteres) — hoje o front só valida "campo preenchido".
- Onde persistir usuários de verdade (banco de dados) — mesmo ponto em aberto do plano de login;
  os dois módulos (`users`/`sessions`) deveriam nascer já pensando no mesmo armazenamento.
- Sentido do checkbox "Lembrar-me" no formulário de cadastro (existe no Figma, mas não tem
  comportamento óbvio fora do contexto de login).
