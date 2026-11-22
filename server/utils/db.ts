import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import * as schema from '../database/schema'

/**
 * Drizzle ORM sobre `node:sqlite`: sem build nativo, funciona em Node e Bun.
 * O proxy traduz cada query gerada pelo Drizzle em uma prepared statement.
 */
function createDrizzle(sqlite: DatabaseSync) {
  return drizzle(
    async (query, params, method) => {
      const statement = sqlite.prepare(query)
      statement.setReturnArrays(true)

      switch (method) {
        case 'run':
          statement.run(...params)
          return { rows: [] }
        case 'all':
        case 'values':
          return { rows: statement.all(...params) as unknown[][] }
        default:
          return { rows: statement.get(...params) as unknown[] | undefined }
      }
    },
    { schema },
  )
}

export type Database = ReturnType<typeof createDrizzle>

interface Connection {
  db: Database
  sqlite: DatabaseSync
}

let connection: Connection | undefined
let booting: Promise<Connection> | undefined

function connect(file: string): Connection {
  mkdirSync(dirname(file), { recursive: true })
  const sqlite = new DatabaseSync(file)
  sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')

  return { db: createDrizzle(sqlite), sqlite }
}

async function initialize(): Promise<Connection> {
  const configured = useRuntimeConfig().databasePath
  const file = isAbsolute(configured) ? configured : resolve(process.cwd(), configured)
  const instance = connect(file)

  await createTables(instance.db, instance.sqlite)
  await seed(instance.db)
  instance.sqlite.exec('PRAGMA query_only = ON;')

  return instance
}

/** Cliente Drizzle pronto para uso, inicializado uma única vez por processo. */
export async function useDatabase(): Promise<Database> {
  if (connection) return connection.db

  booting ??= initialize().then((instance) => {
    connection = instance
    return instance
  })

  return (await booting).db
}

/** Fecha a conexão SQLite (usado no encerramento do processo). */
export function closeDatabase() {
  connection?.sqlite.close()
  connection = undefined
  booting = undefined
}

async function createTables(db: Database, sqlite: DatabaseSync) {
  await db.run(sql`
    create table if not exists users (
      id integer primary key autoincrement,
      name text not null,
      email text not null unique,
      password_hash text not null,
      avatar text,
      bio text,
      role text not null default 'commenter' check (role in ('admin', 'commenter')),
      created_at text not null
    )
  `)

  const userColumns = sqlite.prepare('pragma table_info(users)').all()
  if (!userColumns.some(column => column.name === 'role')) {
    sqlite.exec("alter table users add column role text not null default 'commenter' check (role in ('admin', 'commenter'))")
  }

  await db.run(sql`
    create table if not exists posts (
      id integer primary key autoincrement,
      slug text not null unique,
      title text not null,
      description text not null,
      content text not null,
      image text,
      badge text,
      published_at text not null,
      author_id integer not null references users (id) on delete cascade
    )
  `)

  await db.run(sql`create index if not exists posts_published_at_idx on posts (published_at desc)`)
}

const SEED_POSTS = [
  {
    slug: 'afrodite',
    title: 'Afrodite: o novo single',
    description: 'Guitarras densas, batida lenta e um refrão que não sai da cabeça.',
    image: '/imagens/titulo_capa_afrodite.png',
    badge: 'Single',
    publishedAt: '2025-11-14T21:00:00.000Z',
    content: `## Afrodite

**Afrodite** nasceu de uma noite inteira gravando um riff que não queria ir embora.

A faixa abre com um baixo arrastado, ganha peso no meio e termina em um refrão quase
sussurrado. É o tipo de música que pede volume alto e um quarto escuro.

### Ficha técnica

- Produção: Dasha
- Mixagem: Dasha
- Gravado na caverna, entre 2 e 4 da manhã

> "Tudo que eu tinha era um pedal quebrado e teimosia." — Dasha`,
  },
  {
    slug: 'la-calamita',
    title: 'La Calamita, faixa por faixa',
    description: 'O que existe por trás de cada uma das sete músicas do EP.',
    image: '/imagens/titulo_capa_la_calamita.png',
    badge: 'EP',
    publishedAt: '2025-09-02T18:30:00.000Z',
    content: `## La Calamita

Sete faixas, quarenta minutos e uma obsessão: fazer barulho que ainda seja melódico.

### As faixas

1. **Ímã** — abre o EP com uma introdução de bateria crua.
2. **Ferrugem** — a mais lenta, a mais triste.
3. **Norte** — a única que nasceu no violão.
4. **Calamita** — a faixa título, com um final de seis minutos.
5. **Vidro** — textura de sintetizador e voz quase falada.
6. **Cinza** — punk, direto, dois minutos.
7. **Depois** — fecha tudo em silêncio.

O EP foi gravado ao longo de oito meses, em três estúdios diferentes e na sala de casa.`,
  },
  {
    slug: 'como-gravamos-na-caverna',
    title: 'Como gravamos dentro da caverna',
    description: 'Um guia honesto de home studio: o que funcionou e o que foi dinheiro jogado fora.',
    image: '/imagens/dasha_icon.jpg',
    badge: 'Diário',
    publishedAt: '2025-06-21T12:00:00.000Z',
    content: `## Home studio, sem romantismo

Gravar em casa é mais barato e infinitamente mais lento. Depois de dois EPs, algumas
verdades ficaram claras.

### O que funcionou

- **Uma boa interface** vale mais que cinco plugins.
- **Tratamento acústico** barato: cobertas, estantes cheias, tapete.
- **Gravar de noite** — a rua silencia e o ruído de fundo cai.

### O que não funcionou

- Comprar microfones demais antes de aprender a posicionar um.
- Monitorar com fone de celular.
- Deixar a mixagem para o último dia.

> O melhor equipamento é o que você já sabe usar.`,
  },
]

async function seed(db: Database) {
  const [existing] = await db.select({ id: schema.posts.id }).from(schema.posts).limit(1)
  if (existing) return

  let [author] = await db.select({ id: schema.users.id }).from(schema.users).limit(1)

  if (!author) {
    const password = process.env.SEED_PASSWORD ?? 'dasha-cave'

    ;[author] = await db
      .insert(schema.users)
      .values({
        name: 'Dasha',
        email: 'dasha@dashacave.com.br',
        passwordHash: await hashPassword(password),
        avatar: '/imagens/dasha_icon.jpg',
        bio: 'Anfitriã da caverna. Escreve sobre música pesada, noites longas e o que sobra depois delas.',
      })
      .returning({ id: schema.users.id })
  }

  await db.insert(schema.posts).values(SEED_POSTS.map(post => ({ ...post, authorId: author.id })))
}
