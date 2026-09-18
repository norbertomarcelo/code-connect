/**
 * Mock data for local development. `pnpm api db:seed` runs it through
 * `seed.ts`; the unit test runs it against an in-process Postgres.
 *
 * Idempotent: it truncates every table first, so running it twice leaves the
 * same data. Every user gets the password `code-connect-2026`.
 *
 * Three posts have no thumbnail and one points at a dead host on purpose, so
 * both paths of the frontend placeholder can be exercised by hand.
 */
import * as bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import type { Database } from '../src/database/database.constants.js';
import * as schema from '../src/database/schema.js';
import { slugify } from '../src/tags/slugify.js';

export const PASSWORD = 'code-connect-2026';
const SALT_ROUNDS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const USERS = [
  { key: 'julio', name: 'Júlio Andrade', email: 'julio@codeconnect.dev' },
  { key: 'ana', name: 'Ana Souza', email: 'ana@codeconnect.dev' },
  { key: 'marcos', name: 'Marcos Lima', email: 'marcos@codeconnect.dev' },
  { key: 'bea', name: 'Beatriz Nunes', email: 'bea@codeconnect.dev' },
] as const;

type UserKey = (typeof USERS)[number]['key'];

const TAGS = [
  'React',
  'Front-end',
  'Acessibilidade',
  'TypeScript',
  'Node',
  'CSS',
  'Testes',
  'Carreira',
];

interface SeedReply {
  by: UserKey;
  body: string;
}

interface SeedComment extends SeedReply {
  replies?: SeedReply[];
}

interface SeedPost {
  by: UserKey;
  title: string;
  description: string;
  body: string;
  thumbnailUrl: string | null;
  tags: string[];
  likedBy: UserKey[];
  comments: SeedComment[];
}

const cover = (seed: string) =>
  `https://picsum.photos/seed/code-connect-${seed}/960/640`;

const POSTS: SeedPost[] = [
  {
    by: 'julio',
    title: 'Lista acessível com teclado em React',
    description:
      'Como navegar uma lista usando só as setas, com foco visível e leitura correta em leitores de tela.',
    body: `function Listbox({ items }) {
  const [active, setActive] = useState(0)

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') setActive((i) => Math.min(i + 1, items.length - 1))
    if (event.key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0))
  }

  return (
    <ul role="listbox" tabIndex={0} onKeyDown={onKeyDown}>
      {items.map((item, index) => (
        <li key={item} role="option" aria-selected={index === active}>
          {item}
        </li>
      ))}
    </ul>
  )
}`,
    thumbnailUrl: cover('1'),
    tags: ['React', 'Front-end', 'Acessibilidade'],
    likedBy: ['ana', 'marcos', 'bea', 'julio'],
    comments: [
      {
        by: 'ana',
        body: 'Achei muito bom seu código, Júlio, parabéns!',
        replies: [{ by: 'julio', body: 'Valeu, Ana! Foi um bom desafio.' }],
      },
      {
        by: 'marcos',
        body: 'Quanto tempo você levou para finalizar esse projeto?',
        replies: [
          { by: 'julio', body: 'Até que foi rápido, uns 3 dias!' },
          { by: 'bea', body: 'Invejável. Eu levaria uma semana.' },
        ],
      },
      { by: 'bea', body: 'Espero chegar um dia nesse nível! Muito bom!' },
    ],
  },
  {
    by: 'ana',
    title: 'Tailwind v4 sem arquivo de configuração',
    description:
      'Os tokens agora vivem no CSS, dentro do bloco @theme. Veja como migrar sem dor.',
    body: `@import "tailwindcss";

@theme {
  --color-primary: #81fe88;
  --color-surface: #0d1214;
  --font-sans: "Prompt", sans-serif;
}

/* Agora bg-primary e text-surface já existem como classes */`,
    thumbnailUrl: cover('2'),
    tags: ['CSS', 'Front-end'],
    likedBy: ['julio', 'bea'],
    comments: [
      {
        by: 'julio',
        body: 'Migrei aqui ontem e realmente ficou mais limpo.',
        replies: [
          {
            by: 'ana',
            body: 'Que bom! Cuidado só com as cores fora do @theme.',
          },
        ],
      },
      { by: 'marcos', body: 'E o modo escuro, como fica?' },
    ],
  },
  {
    by: 'marcos',
    title: 'Testando formulários com Testing Library',
    description:
      'Consulte pelo papel e pelo rótulo, do jeito que uma pessoa usaria, e pare de testar detalhes de implementação.',
    body: `it('mostra erro quando o email é inválido', async () => {
  const user = userEvent.setup()
  render(<LoginForm onSubmit={vi.fn()} />)

  await user.type(screen.getByLabelText('Email'), 'ana')
  await user.click(screen.getByRole('button', { name: /login/i }))

  expect(screen.getByText('Informe um email válido')).toBeInTheDocument()
})`,
    thumbnailUrl: null,
    tags: ['Testes', 'React'],
    likedBy: ['ana'],
    comments: [
      { by: 'bea', body: 'getByRole mudou minha vida.' },
      { by: 'julio', body: 'Ótimo material, vou passar para o time.' },
    ],
  },
  {
    by: 'bea',
    title: 'Drizzle e migrations versionadas',
    description:
      'Gere o SQL a partir do schema, revise à mão e commite. Sem surpresa em produção.',
    body: `export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
})

// pnpm api db:generate
// pnpm api db:migrate`,
    thumbnailUrl: cover('4'),
    tags: ['TypeScript', 'Node'],
    likedBy: ['julio', 'ana', 'marcos'],
    comments: [
      {
        by: 'marcos',
        body: 'Você usa push ou generate no dia a dia?',
        replies: [
          { by: 'bea', body: 'Sempre generate. O push não deixa histórico.' },
        ],
      },
    ],
  },
  {
    by: 'julio',
    title: 'Foco visível não é opcional',
    description:
      'Um contorno de foco bem feito ajuda quem navega pelo teclado e custa três linhas de CSS.',
    body: `button:focus-visible {
  outline: 2px solid #81fe88;
  outline-offset: 2px;
}`,
    thumbnailUrl: 'https://exemplo.invalido/nao-existe.png',
    tags: ['Acessibilidade', 'CSS'],
    likedBy: ['bea'],
    comments: [
      {
        by: 'ana',
        body: 'Sempre esqueço o outline-offset.',
        replies: [
          { by: 'julio', body: 'Ele faz toda a diferença no contraste.' },
        ],
      },
      {
        by: 'marcos',
        body: 'Concordo, é o primeiro que eu confiro numa revisão.',
      },
    ],
  },
  {
    by: 'ana',
    title: 'Como estruturei meu primeiro portfólio',
    description:
      'Três projetos bem explicados valem mais do que dez sem contexto. Este foi o meu roteiro.',
    body: `1. Problema
2. Solução
3. O que eu aprenderia diferente`,
    thumbnailUrl: null,
    tags: ['Carreira'],
    likedBy: [],
    comments: [
      { by: 'bea', body: 'Salvei para reler na próxima revisão do meu.' },
    ],
  },
  {
    by: 'marcos',
    title: 'Um servidor Node em vinte linhas',
    description:
      'Antes de um framework, vale entender o que acontece com uma requisição de verdade.',
    body: `import { createServer } from 'node:http'

createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify({ path: request.url }))
}).listen(3000)`,
    thumbnailUrl: cover('7'),
    tags: ['Node', 'TypeScript'],
    likedBy: [],
    comments: [{ by: 'julio', body: 'Simples e direto. Gostei.' }],
  },
  {
    by: 'bea',
    title: 'Componentes que aceitam variantes',
    description:
      'Mapeie props para classes em vez de concatenar strings e o código continua legível.',
    body: `const variantClasses = {
  primary: 'bg-primary text-surface',
  outline: 'border border-primary text-primary',
}

export function Button({ variant = 'primary', ...props }) {
  return <button className={variantClasses[variant]} {...props} />
}`,
    thumbnailUrl: null,
    tags: ['React', 'CSS', 'Front-end'],
    likedBy: [],
    comments: [],
  },
];

export interface SeedSummary {
  users: number;
  tags: number;
  posts: number;
}

export async function seedDatabase(db: Database): Promise<SeedSummary> {
  await db.execute(
    sql`TRUNCATE users, tags, posts, post_tags, post_likes, comments CASCADE`,
  );

  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  const insertedUsers = await db
    .insert(schema.users)
    .values(USERS.map(({ name, email }) => ({ name, email, passwordHash })))
    .returning();
  const userId = new Map<UserKey, string>(
    USERS.map((user) => [
      user.key,
      insertedUsers.find((row) => row.email === user.email)!.id,
    ]),
  );

  const insertedTags = await db
    .insert(schema.tags)
    .values(TAGS.map((label) => ({ slug: slugify(label), label })))
    .returning();
  const tagId = new Map(insertedTags.map((tag) => [tag.label, tag.id]));

  for (const [index, post] of POSTS.entries()) {
    // Older posts further down, so "Recentes" has a visible order.
    const createdAt = new Date(Date.now() - index * DAY_MS);

    const [created] = await db
      .insert(schema.posts)
      .values({
        authorId: userId.get(post.by)!,
        title: post.title,
        description: post.description,
        body: post.body,
        thumbnailUrl: post.thumbnailUrl,
        createdAt,
      })
      .returning({ id: schema.posts.id });

    await db.insert(schema.postTags).values(
      post.tags.map((label) => ({
        postId: created.id,
        tagId: tagId.get(label)!,
      })),
    );

    if (post.likedBy.length > 0) {
      await db.insert(schema.postLikes).values(
        post.likedBy.map((key) => ({
          postId: created.id,
          userId: userId.get(key)!,
        })),
      );
    }

    for (const [offset, comment] of post.comments.entries()) {
      const commentedAt = new Date(createdAt.getTime() + (offset + 1) * 60_000);
      const [root] = await db
        .insert(schema.comments)
        .values({
          postId: created.id,
          authorId: userId.get(comment.by)!,
          body: comment.body,
          createdAt: commentedAt,
        })
        .returning({ id: schema.comments.id });

      for (const [replyOffset, reply] of (comment.replies ?? []).entries()) {
        await db.insert(schema.comments).values({
          postId: created.id,
          authorId: userId.get(reply.by)!,
          parentId: root.id,
          body: reply.body,
          createdAt: new Date(
            commentedAt.getTime() + (replyOffset + 1) * 30_000,
          ),
        });
      }
    }
  }

  return { users: USERS.length, tags: TAGS.length, posts: POSTS.length };
}
