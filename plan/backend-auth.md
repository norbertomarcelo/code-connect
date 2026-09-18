# Backend de autenticação (cadastro, login, usuário logado)

## Contexto

O frontend já tem as telas de login e cadastro prontas (`LoginPage`/`LoginForm`, `SignupPage`/`SignupForm`), mas só fazem `console.info` no submit — não existe API para elas chamarem ainda. Antes desta tarefa, já foi feito um planejamento do lado do frontend, salvo em `plan/tela-login.md` e `plan/tela-cadastro.md`, que já define parte do contrato REST (`POST /users` para cadastro, `POST /sessions` para login) seguindo as convenções REST do `CLAUDE.md` (recursos, não verbos).

Esta tarefa implementa o backend correspondente em `apps/api`, que hoje é só o template padrão do Nest (sem JWT, sem Passport, sem class-validator, sem Swagger, sem banco — tudo por adicionar). Os 3 endpoints pedidos:

1. `POST /users` — cadastro (nome, email, senha)
2. `POST /auth/login` — login (retorna JWT)
3. `GET /auth/me` — dados do usuário logado, protegido por guard, seguindo o padrão oficial de autenticação do NestJS (Passport strategies + guards)

Armazenamento em memória (array), sem ORM/banco — isso é explícito e intencional nesta fase.

Duas decisões que os planos do frontend deixavam em aberto foram confirmadas com o usuário:
- Login usa o campo `email` (não `identifier`), já que hoje não existe username.
- `POST /users` retorna só o usuário criado (sem auto-login); o frontend chama `POST /sessions` em seguida.

**Novo padrão de processo:** a partir de agora, todo planejamento de implementação deve ser salvo como arquivo permanente em `plan/` (este arquivo de plan mode é efêmero e não fica no repo). O primeiro passo da implementação é criar `plan/backend-auth.md` com este conteúdo.

> **Nota pós-implementação:** as seções abaixo foram atualizadas para refletir decisões tomadas durante a implementação, que divergiram um pouco do plano original. As mudanças relevantes:
> - `bcrypt` foi trocado por `bcryptjs`: o pnpm bloqueou o build nativo do `bcrypt` (`ERR_PNPM_IGNORED_BUILDS`) e o usuário preferiu evitar rodar scripts de instalação de terceiros a aprovar o build.
> - `LocalStrategy`/`LocalAuthGuard` (passport-local) foram removidos do login. Guards rodam antes de Pipes no ciclo de vida do Nest, então um `LocalAuthGuard` leria `req.body` antes do `ValidationPipe` validar — um body malformado cairia em `401` em vez do `422` esperado. Como o pedido original só exigia o padrão oficial do Nest (guard) para o endpoint de usuário logado, `POST /sessions` ficou mais simples: valida o `CreateSessionDto` via `ValidationPipe` normalmente e chama `authService.validateUser` direto no controller, lançando `UnauthorizedException` na falha.
> - `UsersModule` precisou importar `PassportModule.register({ defaultStrategy: 'jwt' })` (não o `PassportModule` "vazio"). Sem isso, o `JwtAuthGuard` (que estende o mixin `AuthGuard('jwt')` do `@nestjs/passport`) falha ao resolver sua dependência opcional `AuthModuleOptions` dentro do `TestingModule` do Vitest — mesmo sendo `@Optional()`, o injector de teste do Nest não tolera a ausência total do provider no grafo do módulo.
>
> **Segunda rodada de ajuste (pedido explícito do usuário):** os paths dos endpoints de autenticação foram trocados de recursos REST (`/sessions`, `/users/me`) para rotas de ação sob um único controller: `POST /auth/login` e `GET /auth/me`. Isso diverge conscientemente da regra de "recursos, não verbos" do `CLAUDE.md`, mas foi um pedido direto do usuário para estes dois endpoints específicos. Consequências:
> - `SessionsController` virou `AuthController` (`@Controller('auth')`), reunindo `login` e `getCurrentUser` num só arquivo — já que ambos vivem sob `/auth` e o guard de `/auth/me` precisa estar no mesmo módulo que o registra.
> - `CreateSessionDto`/`SessionResponseDto` foram renomeados para `LoginDto`/`LoginResponseDto` (o nome "session" não fazia mais sentido fora do modelo de recurso).
> - `POST /auth/login` deixou de retornar `201` + `Location` (não há mais um recurso "sessão" sendo criado) e passou a retornar `200 OK` com o mesmo body `{ accessToken, expiresAt, user }`.
> - `GET /users/me` saiu do `UsersController` (que agora só tem `POST /users`); a dependência de `PassportModule` migrou de `UsersModule` para `AuthModule`, que agora importa `PassportModule.register({ defaultStrategy: 'jwt' })` em vez do `PassportModule` vazio, pelo mesmo motivo de resolução de `AuthModuleOptions` explicado acima.
> - Os specs e2e `sessions.e2e-spec.ts` e `users-me.e2e-spec.ts` foram consolidados em `test/auth.e2e-spec.ts`.

## Dependências novas (`apps/api`)

```
@nestjs/jwt @nestjs/passport @nestjs/swagger passport passport-jwt bcryptjs class-validator class-transformer
```
Dev: `@types/passport-jwt` (bcryptjs já inclui seus próprios tipos)

IDs gerados com `crypto.randomUUID()` (nativo do Node, sem dependência extra).

## Estrutura de arquivos

```
apps/api/src/
  users/
    dto/create-user.dto.ts        # name, email, password + class-validator + @ApiProperty
    dto/user-response.dto.ts      # id, name, email (nunca a senha)
    entities/user.entity.ts       # { id, name, email, passwordHash }
    users.service.ts              # array em memória: create, findByEmail
    users.controller.ts           # POST /users
    users.module.ts
    users.service.spec.ts
    users.controller.spec.ts

  auth/
    constants.ts                  # jwtConstants (secret via JWT_SECRET, fallback dev; expiresIn)
    dto/login.dto.ts              # email, password
    dto/login-response.dto.ts     # accessToken, expiresAt, user: UserResponseDto
    interfaces/jwt-payload.interface.ts        # { sub, email, name }
    interfaces/authenticated-user.interface.ts # { id, name, email }
    strategies/jwt.strategy.ts    # valida token, retorna { id, name, email } do payload (sem tocar UsersService)
    guards/jwt-auth.guard.ts      # extends AuthGuard('jwt')
    decorators/current-user.decorator.ts   # @CurrentUser() lê request.user
    auth.service.ts               # validateUser(email, password), login(user)
    auth.controller.ts            # POST /auth/login, GET /auth/me
    auth.module.ts
    auth.service.spec.ts
    auth.controller.spec.ts

  app.module.ts   # + UsersModule, AuthModule
  main.ts         # + ValidationPipe global, Swagger

apps/api/test/
  users.e2e-spec.ts  # cadastro feliz, 409 email duplicado, 422 validação
  auth.e2e-spec.ts   # login feliz, 401 credenciais inválidas, 422 validação, GET /auth/me com/sem token
```

**Wiring entre módulos:** `AuthModule` importa `UsersModule` (o `AuthService` precisa do `UsersService` para `validateUser`) e `PassportModule.register({ defaultStrategy: 'jwt' })` (necessário para o `JwtAuthGuard` usado em `GET /auth/me`, que vive no próprio `AuthController`). `UsersModule` não depende de `AuthModule` nem de Passport — só tem `POST /users`, sem rotas protegidas.

## Contrato dos endpoints

### `POST /users`
- Body: `{ name: string; email: string; password: string }`
- Validação: `name` não vazio; `email` formato válido; `password` mínimo 8 caracteres
- `201 Created`, header `Location: /users/:id`, body `{ id, name, email }`
- `409 Conflict` se o email já existe (`ConflictException`)
- `422 Unprocessable Entity` para falha de validação (via `ValidationPipe` com `errorHttpStatusCode: 422`)
- Senha é hasheada com `bcryptjs` antes de guardar (nunca sai na resposta)

### `POST /auth/login`
- Body: `{ email: string; password: string }`, validado por `LoginDto` + `ValidationPipe` (sem guard — ver nota no topo sobre por que `LocalStrategy` foi descartada)
- Fluxo: o controller chama `AuthService.validateUser(email, password)` diretamente (busca por email, `bcryptjs.compare`); se retornar `null`, lança `UnauthorizedException`
- `200 OK`, body `{ accessToken, expiresAt, user: { id, name, email } }` — sem `Location` header, já que não modela criação de um recurso
- `401 Unauthorized` para credenciais inválidas
- `422 Unprocessable Entity` para body malformado (email inválido, campos faltando) — validado antes do handler rodar, já que não há guard na frente
- JWT payload: `{ sub: user.id, email: user.email, name: user.name }`, expiração 1h (`jwtConstants.expiresIn`)

### `GET /auth/me`
- Protegido por `JwtAuthGuard` (Passport JWT strategy, token via header `Authorization: Bearer <token>`)
- `JwtStrategy.validate(payload)` retorna `{ id: payload.sub, name: payload.name, email: payload.email }` direto do token — sem nova consulta ao `UsersService`, igual ao exemplo oficial da doc do Nest
- `200 OK`, body `{ id, name, email }`
- `401 Unauthorized` se o token faltar ou for inválido/expirado (padrão do `AuthGuard('jwt')`)

## `main.ts`

- `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, errorHttpStatusCode: 422 }))`
- Swagger: `DocumentBuilder` com `.addBearerAuth()`, `SwaggerModule.setup('docs', app, document)` — documentar `CreateUserDto`, `UserResponseDto`, `LoginDto`, `LoginResponseDto` com `@ApiProperty`, e os controllers com `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth()` na rota protegida

## Testes

- **Unit**: `UsersService` (criação, `findByEmail`, conflito de email duplicado), `AuthService.validateUser` (senha certa → usuário sem hash; senha errada / email inexistente → `null`)
- **Controller specs**: `UsersController` e `AuthController` com services mockados, verificando status code e formato do body
- **E2E** (`test/*.e2e-spec.ts`, contra o `AppModule` completo via supertest, seguindo o padrão de `test/app.e2e-spec.ts`):
  - cadastro → `POST /auth/login` → `GET /auth/me` com o token retornado
  - `409` ao cadastrar email repetido
  - `401` login com senha errada
  - `401` em `/auth/me` sem header ou com token inválido
  - `422` em payloads inválidos nos dois `POST`

## Verificação

1. `pnpm api test` — specs unitárias ✅ 12 testes passando
2. `pnpm api test:e2e` — fluxo completo de ponta a ponta ✅ 10 testes passando (incluindo o `app.e2e-spec.ts` pré-existente)
3. `pnpm api lint` — oxlint type-aware, exit code 0 (1 warning trivial de `unbound-method` em spec, padrão comum de asserção de mock)
4. `pnpm dev:api`/`pnpm api start` e teste manual via curl: cadastro → 201 com `Location`; cadastro duplicado → 409; payload inválido → 422; `POST /auth/login` → 200 com `accessToken`/`expiresAt`/`user`; login errado → 401; `GET /auth/me` com token → 200; sem token → 401; rotas antigas (`/sessions`, `/users/me`) → 404. Swagger em `/docs` responde 200. Todos os casos confirmados manualmente.
