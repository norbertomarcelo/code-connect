# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pnpm workspace monorepo (`apps/*`) with two independent apps, both still close to their generator templates:

- `apps/api` — NestJS 12 backend (Express platform), listens on `PORT` (default 3000)
- `apps/web` — React 19 + Vite 8 frontend

The apps share no code and no workspace packages. The web app calls the API through axios, via a Vite dev proxy (see "Web ↔ API integration"); the API has no CORS configured.

## Commands

Run from the repo root. `pnpm api <script>` and `pnpm web <script>` pass the script through to that app (`pnpm --filter`).

```bash
pnpm install
pnpm dev                 # runs dev:web (vite) and dev:api (nest start --watch) in parallel
pnpm build               # builds every app
pnpm lint                # oxlint in every app
pnpm test                # unit tests for both apps (api: vitest, web: vitest + Testing Library)

pnpm api test:e2e        # api e2e tests (test/**/*.e2e-spec.ts, supertest against the full AppModule)
pnpm api test:cov        # coverage (v8)
pnpm api test:watch
pnpm api format          # prettier (api only; web has no formatter configured)

# Single test file / single test by name
pnpm api exec vitest run src/app.controller.spec.ts
pnpm api exec vitest run -t "should return"
```

## Conventions that aren't obvious

**API is native ESM.** `apps/api/package.json` has `"type": "module"` and tsconfig uses `module`/`moduleResolution: nodenext`. So:
- Relative imports need an explicit `.js` extension, even though the files are `.ts` (e.g. `import { AppService } from './app.service.js'`).
- `main.ts` uses top-level `await bootstrap()`.

**API testing uses Vitest, not Jest** (even though this is a Nest project). Globals are enabled (`describe`/`it`/`expect` need no import; the `vitest/globals` types come from tsconfig). Unit specs live next to the code as `*.spec.ts` (`vitest.config.ts`). E2E specs live in `test/` as `*.e2e-spec.ts` and use a separate config (`vitest.config.e2e.ts`). Both configs use `vite-tsconfig-paths`, so tsconfig path aliases resolve in tests.

**Linting is oxlint, not ESLint.**
- API: runs type-aware (`--type-aware`, via `oxlint-tsgolint`), with `typescript/no-floating-promises` set to error. Every promise must be awaited or handled.
- Web: react, typescript, and oxc plugins, with `rules-of-hooks` set to error.

**Code style differs between apps.**
- API: Prettier with single quotes, trailing commas, and semicolons.
- Web: follows the Vite template (single quotes, no semicolons), with no formatter enforcing it.

**Web TypeScript** uses bundler mode with `verbatimModuleSyntax` (type-only imports need `import type`), `erasableSyntaxOnly` (no `enum`s or parameter properties), and `noUnusedLocals`/`noUnusedParameters`. `pnpm web build` runs `tsc -b` before `vite build`, so type errors fail the build.

## Database (`apps/api`)

PostgreSQL 18 runs from `docker-compose.yml` at the repo root, with the named volume `postgres-data` keeping the data across restarts (`docker compose down -v` wipes it). The ORM is Drizzle (`drizzle-orm` + `pg`); the rationale is in `plan/banco-de-dados.md`.

```bash
pnpm db:up                  # start postgres and wait until healthy
pnpm db:down                # stop it (data stays in the volume)
pnpm api db:generate        # generate a SQL migration in apps/api/drizzle after editing the schema
pnpm api db:migrate         # apply migrations to DATABASE_URL
```

- The schema lives in `apps/api/src/database/schema.ts`; entity types are inferred from it (`$inferSelect`). Commit the generated migrations.
- `DATABASE_URL` defaults to the compose database (see `apps/api/.env.example`). The API does not run migrations on startup, so run `pnpm api db:migrate` after `pnpm db:up`.
- Unit tests run against PGlite (in-process Postgres, no Docker) via `test/support/test-database.ts`. E2E tests need `pnpm db:up` first: they use the separate `codeconnect_test` database, migrated by the vitest global setup and truncated in each spec's `beforeEach`.
- `docker/postgres/init/` only runs when the volume is first created; on an existing volume, create `codeconnect_test` by hand.
- Services that touch the database must be `async`. `no-floating-promises` catches a missing `await`.
- Specs reset the database through `test/support/reset-database.ts` (one `TRUNCATE ... CASCADE` over every table). **Add a new table to it**, or foreign keys will make `TRUNCATE users` fail in every spec.
- `pnpm api db:seed` fills the database with mock users, tags, posts, likes and comments (`apps/api/scripts/seed.ts`, logic in `seed-database.ts`, which has its own PGlite spec). It truncates first, so it is idempotent. Log in as `julio@codeconnect.dev` / `code-connect-2026`. A few posts have no thumbnail and one has a dead image URL on purpose, to exercise the frontend placeholder.
- **Full-text search.** drizzle-orm has no full-text helpers: `posts.search_vector` is a `customType` generated `tsvector` (`'portuguese'`, weighted title > description > body) with a GIN index, and queries use raw `sql` fragments (`@@ websearch_to_tsquery`, `ts_rank`). User input is always a bound parameter. **Never run `drizzle-kit push` or `studio` against this schema**: Postgres normalizes the generated expression, so `push` tries to recreate the column every time. Use `db:generate` + `db:migrate`, and read the generated SQL by hand.

## Frontend rules (`apps/web`)

**Tailwind, routing and testing are installed.** Tailwind runs via `@tailwindcss/vite` (no `tailwind.config.*`; tokens live in the `@theme` block of `src/index.css`). Routing is `react-router`, wired in `src/App.tsx`. Tests run with Vitest + React Testing Library (`jsdom`), configured in the `test` block of `apps/web/vite.config.ts` with `src/test/setup.ts` as the setup file. `pnpm web test` runs them once; `pnpm web test:watch` watches. The root `pnpm test` runs both apps. `src/test/renderWithRouter.tsx` wraps `render` in a `MemoryRouter` for any component that renders a `Link` (most atoms don't need it; molecules/organisms/pages that use `TextLink` do).

**Atomic Design.** Components live under `src/components/`, grouped by level:

```
src/components/
  atoms/       # smallest building blocks: Button, Input, Label, Icon
  molecules/   # small groups of atoms: SearchField (Label + Input + Button)
  organisms/   # larger sections: Header, PostCard, CommentList
  templates/   # page layouts with slots and no real data
src/pages/     # templates filled with real data and state
```

- A component may import only from its own level or the levels below it (atoms import no components; molecules import atoms; and so on). Never import upward.
- Each component gets its own folder: `atoms/Button/Button.tsx`, `Button.test.tsx`, and an `index.ts` that re-exports it.
- Atoms and molecules are presentational. They receive data through props and don't fetch data or read global state. Data and side effects belong in pages, or in organisms when needed.

**Tailwind for styling.** Style with Tailwind utility classes in JSX. Don't add CSS files, CSS modules, or inline `style` objects for anything Tailwind can express. `App.css` and most of `index.css` are template leftovers; remove them as components replace them, and keep only the Tailwind import and true globals in `index.css`. For variants, map props to class names instead of building class strings by concatenation.

**Every component needs a test.** Each component ships with a `*.test.tsx` next to it that covers its essential use: it renders with the typical props, shows the content it should, and responds to its main interaction (click, input, submit) by calling the right callback or changing what's shown. Query the way a user would (`getByRole`, `getByLabelText`) instead of by class names or test IDs, and don't test Tailwind classes or implementation details. A component without a test is not done.

## Web ↔ API integration (`apps/web`)

- **Proxy, not CORS.** `vite.config.ts` forwards `/api/*` to `http://localhost:3000` with the `/api` prefix stripped (`/api/auth/login` → `/auth/login`). The axios client uses `baseURL: import.meta.env.VITE_API_URL ?? '/api'`; set `VITE_API_URL` (e.g. in an untracked `apps/web/.env.local`) only when the app is served without the dev proxy, such as `vite preview`.
- **`src/lib/`** holds the transport layer, outside Atomic Design: `session.ts` (token storage) and `api/` (`client.ts` axios instance and interceptors, `errors.ts`, `types.ts`, and one module per resource: `auth.ts`, `users.ts`). Pages and components never see an `AxiosError`: the response interceptor turns every failure into an `ApiError` (`kind`, `status`, `messages`), flattening Nest's three error body shapes. `types.ts` mirrors the Nest DTOs.
- **`src/auth/`** holds `AuthProvider`, `useAuth`, `ProtectedRoute` and `messages.ts` (ApiError → pt-BR copy). It sits outside `src/components/` on purpose: these render no UI of their own and must import `src/lib/`, which would break the "never import upward" rule. The provider, context and hook live in separate files because `react/only-export-components` would otherwise break fast refresh.
- **Session.** The token is stored under `code-connect.session`, in `localStorage` when "Lembrar-me" is checked and in `sessionStorage` otherwise. `session.ts` checks `expiresAt` client-side, and a 401 on any request except `/auth/login` clears the session, which flips the provider to `anonymous`. There is no refresh token: the JWT lasts 1h.
- **Registration does not log in.** `POST /users` returns no token, so `SignupPage` redirects to `/login` with `{ notice, email, remember }` in the router state.
- **Testing.** No MSW. Component and page tests use `src/test/renderWithAuth.tsx`, which stubs the auth context (override pieces with `auth: { signIn }`). Tests that need the real provider `vi.mock` our own `src/lib/api/auth` and `src/lib/api/users` modules, not axios. Throw `ApiError` (from `src/lib/api/errors.ts`, deliberately a separate module so it is never mocked) to simulate failures.

## Posts feed (`apps/web`)

- **Layout route.** `App.tsx` nests the feed, post, publish, profile and about pages under a layout route (`AppShell` + `<Outlet />`), so the sidebar mounts once. `AppShell` owns the `<main>` landmark, like `AuthTemplate`: **pages render their own `<h1>` and never a `<main>`** (this includes anything that renders inside it, such as `ProtectedRoute`'s loading state). Page a11y tests render inside `AppShell`, which is the real composition and what catches duplicate landmarks.
- **URL is the state of the feed.** `q`, `tags` (comma-separated slugs), `sort` and `page` live in the query string, so a filtered feed is a shareable link and the back button works. Typing goes through `useDebouncedCallback` and writes with `replace`; chips and sort write with a push. Any filter change resets `page`. `LoginPage` sends a visitor back to `from.pathname + from.search`.
- **`src/hooks/`** (`useAsyncData`, `useDebouncedCallback`) and **`src/posts/`** (`messages.ts`, pt-BR copy for post errors) sit outside Atomic Design for the same reason as `src/auth/` and `src/lib/`. `useAsyncData(load, deps)` takes an explicit list of primitives (it is serialized into a key, and a result only counts while its key is current, which discards responses that arrive out of order); it exposes `reload` and `setData` for optimistic updates. Pass `status` from `useAuth()` in `deps` when the response depends on the token.
- **Icons.** `Icon` renders Material Symbols as ligatures (`<span aria-hidden translate="no">account_circle</span>`) and keeps the inline SVG map for `arrow-right`, `clipboard` and `login`. The SVG map wins when a name is in both. The font link uses `display=block` so the ligature name is never shown as text while it loads. Never query an icon with `getByText`.
- **Font sizes use the default Tailwind tokens** (`text-sm`, `text-lg`, `text-xl`...), never `text-[Npx]`. Colors come from `@theme`: `graphite` is the feed shell background, `page` is both the body and the feed card/sidebar surface, and `surface` is the darker auth card and code panel.
- **`PostThumbnail`** is the image placeholder: it falls back both when `src` is `null` and when the image fails to load. Use it for any post image.
- **Test helpers.** `renderWithRouter` and `renderWithAuth` accept a `route` with a query string (`'/feed?tags=react'`). `src/test/fixtures.ts` has `makePost`, `makePostDetail`, `makeComment` and `makeThread`. Pages mock `src/lib/api/*` with `vi.mock`, never axios.
- The signed-out sidebar item is **Login**, the signed-in one is **Sair**, and neither shows while the session is still being validated.

## Backend rules (`apps/api`): REST

Every endpoint must follow REST conventions:

- **Resources, not actions.** Paths are plural nouns in kebab-case (`/posts`, `/posts/:id`, `/user-profiles`) and never contain verbs (`/getPosts` and `/posts/create` are wrong). An operation that doesn't fit CRUD gets modeled as a resource (`POST /posts/:id/likes`, not `POST /posts/:id/like-post`).
- **HTTP methods by meaning.**
  - `GET` reads and has no side effects.
  - `POST` creates an item in a collection.
  - `PUT` fully replaces a resource (idempotent).
  - `PATCH` partially updates a resource.
  - `DELETE` removes a resource (idempotent).
- **Status codes.**
  - `200` for successful reads and updates that return a body.
  - `201 Created` for `POST`, with a `Location` header pointing to the new resource and the created resource in the body.
  - `204 No Content` for `DELETE` and for updates that return no body.
  - `400` for malformed input, `401`/`403` for auth failures, `404` for a missing resource, `409` for conflicts (such as duplicates), `422` for input that is well-formed but fails validation.
  - Never return `200` with an error in the body.
- **Nest defaults to watch for.** Nest returns `201` for `@Post()` and `200` for everything else, so use `@HttpCode(HttpStatus.NO_CONTENT)` where `204` is needed. Raise errors with Nest's built-in exceptions (`NotFoundException`, `ConflictException`, …), which produce a consistent JSON error body. Don't set status codes by hand on the response object.
- **Hierarchy.** Nest at most one level (`/posts/:postId/comments`). For anything deeper, expose the child as a top-level resource (`/comments/:id`).
- **Query params for collections.** Use query params for filtering, sorting, and pagination (`GET /posts?author=42&sort=-createdAt&page=2&limit=20`), never path segments or request bodies. Paginated responses include the pagination metadata.
- **JSON representations.** Request and response bodies are JSON with camelCase fields. Use DTOs for input and output, and don't expose persistence entities directly.
- **Stateless.** Each request carries everything needed to handle it (for example, auth in the `Authorization` header). Keep no client session state on the server.

## Posts feed (`apps/api`)

- **Anonymous reads, authenticated writes.** `GET /posts` and `GET /posts/:id` use `OptionalJwtAuthGuard`: a valid token fills `request.user`, a missing or invalid one leaves it `undefined` instead of raising 401, so the feed can tell whether the caller liked each post. Writes use `JwtAuthGuard`. `@CurrentUser()` returns `AuthenticatedUser | undefined` and TypeScript does not check the parameter annotation against the guard: annotate `AuthenticatedUser` behind `JwtAuthGuard` and `AuthenticatedUser | undefined` behind the optional one.
- **Every `:id` param uses `ParseUUIDPipe`**, so a malformed id is a 400 instead of a Postgres error surfacing as 500. Validation errors stay 422 (`ValidationPipe`), malformed ids are 400.
- **Never expose an author's email.** The feed is public. Authors are `{ id, name, handle }`, with the handle derived from the email local part in `users/handle.ts` (not unique, no `username` column yet).
- **Comments nest one level.** `parentId` is a self-FK, and the service rejects a reply to a reply with 422; Postgres cannot express that rule. Comments are exposed at `/posts/:postId/comments` and `/comments/:id`, so a created comment's `Location` resolves.
- **Likes:** `POST /posts/:id/likes` (201, 409 if already liked, the composite PK raises the 23505) and an idempotent `DELETE` (204 even without a like).
- Service specs boot one PGlite each; `vitest.config.ts` raises `hookTimeout` so several starting at once do not flake.

## Git: Conventional Commits

Both apps use [Conventional Commits](https://www.conventionalcommits.org/). No commitlint is configured, so follow the format by hand:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

- **type**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **scope**: the app touched, `api` or `web`. Leave it out for changes that span the whole repo (root config, workspace, `CLAUDE.md`). If a change touches both apps for different reasons, split it into separate commits.
- **description**: imperative mood, lowercase, no trailing period (`feat(web): add button atom`, `fix(api): return 404 for missing post`).
- **Breaking changes**: add `!` after the type or scope (`feat(api)!: rename posts endpoint`) and a `BREAKING CHANGE:` footer that explains the change.
