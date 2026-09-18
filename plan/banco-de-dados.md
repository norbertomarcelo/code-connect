# Persistência de usuários em PostgreSQL (Drizzle ORM)

## Contexto

Hoje o `UsersService` (`apps/api/src/users/users.service.ts`) guarda os usuários num array em memória. Isso foi uma decisão intencional da primeira fase (`plan/backend-auth.md`), e os planos do frontend deixaram "onde persistir usuários de verdade" como questão em aberto. Com o array, todo restart da API apaga os cadastros.

Objetivo:
- persistir os usuários em PostgreSQL, rodando via `docker-compose.yml` na raiz com volume nomeado;
- escolher e justificar um ORM;
- trocar o array por esse mecanismo sem mudar o contrato HTTP. `POST /users`, `POST /auth/login` e `GET /auth/me` continuam com os mesmos status e bodies.

Decisão já tomada com o usuário: os **unit tests usam PGlite** (Postgres em WASM, dentro do processo, sem Docker), e os **e2e usam o Postgres do compose**, num banco de teste separado.

Primeiro passo da implementação: salvar este plano em `plan/banco-de-dados.md` (regra permanente do repo).

## Escolha do ORM: Drizzle ORM

**Por que o Drizzle:**
- **Encaixa no projeto como ele é.** A API é ESM nativo (`nodenext`, imports com `.js`), e o Drizzle é ESM nativo e TypeScript puro, sem etapa de codegen e sem binário de engine.
- **Não esbarra no bloqueio de install scripts do pnpm** (`ERR_PNPM_IGNORED_BUILDS`, o mesmo que obrigou a trocar `bcrypt` por `bcryptjs`). `drizzle-orm` e `pg` não têm scripts. O único é o `esbuild`, que vem pelo `drizzle-kit`, e o postinstall dele é dispensável (o binário vem do pacote opcional `@esbuild/linux-x64`).
- **O schema é código TypeScript**, fonte única de verdade. Os tipos de `User` são inferidos da tabela (`$inferSelect`), então não há DSL separada nem tipos que saiam de sincronia.
- **Queries com cara de SQL**, transparentes e com tipagem forte, inclusive em selects parciais.
- **Migrations em SQL versionado** geradas pelo `drizzle-kit`, revisáveis e commitadas.
- **A mesma API roda sobre `node-postgres` e PGlite.** É isso que permite a estratégia de testes escolhida: SQL e migrations reais nos unit tests, sem Docker.
- **Contra, honestamente:** não existe módulo oficial `@nestjs/drizzle`. Resolvo com um `DatabaseModule` próprio de cerca de 30 linhas (provider com injection token).

**Outros considerados:**
- **Prisma.** Tem o melhor DX e a maior comunidade, mas:
  - exige `prisma generate` a cada mudança de schema;
  - os pacotes `prisma`/`@prisma/engines` têm scripts de instalação, que caem no bloqueio do pnpm e na preferência já registrada de não aprovar scripts de terceiros;
  - o schema fica numa DSL própria (`.prisma`);
  - o cliente gerado pede configuração extra de output/generator para funcionar bem com ESM `nodenext`.
- **TypeORM.** Tem integração oficial (`@nestjs/typeorm`) e decorators no estilo Nest, mas:
  - a tipagem é fraca em queries (select parcial não é inferido);
  - tem atritos conhecidos com ESM (relações circulares exigem o wrapper `Relation<>`, e os globs de entidades complicam com `.js`);
  - o histórico de manutenção é irregular;
  - o `synchronize` é perigoso fora de dev.
- **MikroORM.** Bom suporte a ESM e TypeScript, com Unit of Work e identity map. Mas carrega conceitos (request context, flush) pesados demais para o tamanho atual do domínio.
- **Kysely.** Excelente query builder type-safe, mas não é ORM: os tipos do schema são declarados à mão e as migrations são escritas manualmente.

## Infra: `docker-compose.yml` (raiz)

- Serviço `postgres` com imagem `postgres:18-alpine`:
  - `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` via `${VAR:-codeconnect}`, com defaults de dev;
  - porta `${POSTGRES_PORT:-5432}:5432`;
  - `healthcheck` com `pg_isready`;
  - `restart: unless-stopped`.
- **Volume nomeado `postgres-data` montado em `/var/lib/postgresql`.** No Postgres 18 o `PGDATA` passou a ser `/var/lib/postgresql/18/docker`, e a imagem recomenda montar o diretório pai, não `/data`. Os dados sobrevivem a `docker compose down` e só somem com `down -v`.
- `./docker/postgres/init/01-create-test-db.sql` fica montado em `/docker-entrypoint-initdb.d` e faz `CREATE DATABASE codeconnect_test;` para os e2e. Esse script só roda na primeira inicialização do volume, e o README/CLAUDE.md vai dizer isso.
- Scripts no `package.json` da raiz:
  - `db:up`: `docker compose up -d --wait`
  - `db:down`: `docker compose down`

## Dependências (`apps/api`)

- **Runtime:** `drizzle-orm` e `pg`.
- **Dev:** `drizzle-kit`, `@types/pg` e `@electric-sql/pglite` (JS/WASM puro, sem install script).
- **Se o pnpm acusar o `esbuild`**, negar com `pnpm approve-builds '!esbuild'`, seguindo o padrão já usado para o `@scarf/scarf`. Não aprovar nada sem consultar.

## Arquivos

### Novos

- **`apps/api/src/database/schema.ts`**, tabela `users`:
  - `id`: `uuid` pk com `defaultRandom()`
  - `name`: `text` not null
  - `email`: `text` not null, unique
  - `passwordHash`: `text('password_hash')` not null
  - `createdAt`: `timestamp('created_at', { withTimezone: true })` com `defaultNow()` not null

  O arquivo só importa de `drizzle-orm/pg-core`, sem imports relativos, para o `drizzle-kit` ler sem atrito.
- **`apps/api/src/database/database.constants.ts`:**
  - `DRIZZLE` e `PG_POOL` (injection tokens);
  - `databaseUrl = process.env.DATABASE_URL ?? 'postgres://codeconnect:codeconnect@localhost:5432/codeconnect'`, no mesmo padrão do `jwtConstants` em `src/auth/constants.ts`;
  - `type Database = PgDatabase<PgQueryResultHKT, typeof schema>`, o tipo base comum a `node-postgres` e PGlite. Assim o teste injeta PGlite sem cast.
- **`apps/api/src/database/database.module.ts`:**
  - `@Global()`;
  - provider `PG_POOL` (`new Pool({ connectionString: databaseUrl })`);
  - provider `DRIZZLE` (`drizzle({ client: pool, schema })`), que exporta `DRIZZLE`;
  - implementa `OnApplicationShutdown` com `pool.end()`. Sem isso o `app.close()` dos e2e deixa o processo pendurado.
- **`apps/api/src/database/unique-violation.ts`:** `isUniqueViolation(error)` checa o código `23505` em `error.code` ou `error.cause.code`. O Drizzle embrulha erros do driver em `DrizzleQueryError`, e o erro do PGlite traz o mesmo código.
- **`apps/api/drizzle.config.ts`:**
  - `dialect: 'postgresql'`
  - `schema: './src/database/schema.ts'`
  - `out: './drizzle'`
  - `dbCredentials.url`, com o mesmo fallback de `DATABASE_URL`
- **`apps/api/drizzle/`:** migration inicial gerada por `drizzle-kit generate` e commitada.
- **`apps/api/.env.example`:** documenta `DATABASE_URL`, `JWT_SECRET` e `PORT`. O `.env` já está no `.gitignore`.
- **`apps/api/test/support/test-database.ts`:** `createTestDatabase()` cria `new PGlite()`, faz `drizzle({ client, schema })`, roda `migrate()` de `drizzle-orm/pglite/migrator` com `migrationsFolder: 'drizzle'` e retorna `{ db, close }`. Fica fora de `src` para não entrar no build (`tsconfig.build.json` só inclui `src`), já que a PGlite é dev dependency.
- **`apps/api/test/support/global-setup.ts`:** globalSetup dos e2e. Roda `migrate()` de `drizzle-orm/node-postgres/migrator` no banco de teste e fecha o pool.
- **`docker-compose.yml`** e **`docker/postgres/init/01-create-test-db.sql`**, na raiz.

### Modificados

- **`apps/api/src/users/entities/user.entity.ts`:** a classe manual vira `export type User = typeof users.$inferSelect;`. Os controllers continuam mapeando para o `UserResponseDto`, então a entidade de persistência nunca é exposta (regra do CLAUDE.md).
- **`apps/api/src/users/users.service.ts`:**
  - o construtor injeta `@Inject(DRIZZLE) private readonly db: Database`;
  - `create`: `db.insert(users).values({ name, email, passwordHash }).returning()`. Sem pre-check: se `isUniqueViolation` → `ConflictException('Email already registered')`, o que também elimina a corrida entre dois cadastros simultâneos. Remove o `randomUUID` (o id vem do banco);
  - `findByEmail` passa a ser `async`, com retorno `Promise<User | undefined>` via `db.select().from(users).where(eq(users.email, email)).limit(1)`.
- **`apps/api/src/auth/auth.service.ts`:** `validateUser` passa a fazer `await this.usersService.findByEmail(email)`. Sem o `await`, o `!user` nunca daria falso e o lint de `no-floating-promises` ajuda a pegar isso.
- **`apps/api/src/app.module.ts`:** importa `DatabaseModule`.
- **`apps/api/src/main.ts`:** `app.enableShutdownHooks()`, para fechar o pool em SIGTERM/SIGINT.
- **`apps/api/package.json`:** scripts `db:generate` (`drizzle-kit generate`), `db:migrate` (`drizzle-kit migrate`) e `db:studio` (`drizzle-kit studio`).
- **`apps/api/vitest.config.e2e.ts`:**
  - `test.env.DATABASE_URL` aponta para `.../codeconnect_test`;
  - `globalSetup: ['./test/support/global-setup.ts']`;
  - `fileParallelism: false`, porque os dois arquivos e2e usam a mesma tabela.
- **Specs:**
  - `users.service.spec.ts` e `auth.service.spec.ts`:
    - `beforeAll` com `createTestDatabase()`;
    - provider `{ provide: DRIZZLE, useValue: db }`;
    - `beforeEach` com `TRUNCATE users`;
    - `afterAll` com `close()`;
    - o teste de `findByEmail` passa a usar `await`.
  - `users.e2e-spec.ts` e `auth.e2e-spec.ts`: no `beforeEach`, depois do `app.init()`, fazem `app.get(DRIZZLE).execute(sql\`TRUNCATE users\`)`.
  - `users.controller.spec.ts` e `auth.controller.spec.ts` já mockam os services e não mudam.
- **`CLAUDE.md`:** nova seção sobre banco, cobrindo:
  - compose e volume;
  - `pnpm db:up`;
  - `pnpm api db:generate` / `db:migrate`;
  - que o e2e exige o compose de pé;
  - que os unit tests usam PGlite;
  - onde fica o schema.
- **`plan/backend-auth.md`:** nota curta de que o armazenamento em memória foi substituído (link para `plan/banco-de-dados.md`).

Decisões fora do escopo, mantidas como estão: e-mail continua case-sensitive, como hoje. `JwtStrategy` continua sem consultar o banco.

## Verificação

1. `pnpm install`, sem `ERR_PNPM_IGNORED_BUILDS` pendente.
2. `pnpm db:up`, depois `docker compose ps` mostrando o container `healthy`.
3. `pnpm api db:generate` gera a migration em `apps/api/drizzle/`, e `pnpm api db:migrate` aplica. Conferir com `docker compose exec postgres psql -U codeconnect -c '\d users'`.
4. `pnpm api test`: unit tests passando com PGlite, sem Docker.
5. `pnpm api test:e2e`: os 10 e2e passando contra `codeconnect_test`.
6. `pnpm api lint` com exit 0, e `pnpm api build` ok (a PGlite não pode aparecer no `dist`).
7. **Teste manual de persistência:**
   - `pnpm dev:api` e `curl -X POST /users` → 201;
   - reiniciar a API e fazer `POST /auth/login` com o mesmo usuário → 200;
   - `docker compose down && pnpm db:up` e login de novo → 200 (volume persistiu);
   - cadastro duplicado → 409.
