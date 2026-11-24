import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import * as schema from '../database/schema'
import type { ManagedUserRole } from '../../shared/types/user'

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
export type { ManagedUserRole }

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

/** Conexão SQLite crua, útil para prepared statements que o Drizzle não cobre. */
export async function useSqlite(): Promise<DatabaseSync> {
  await useDatabase()

  if (!connection) {
    throw new Error('O banco de dados não foi inicializado')
  }

  return connection.sqlite
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

  await db.run(sql`
    create table if not exists oauth_accounts (
      id integer primary key autoincrement,
      provider text not null,
      provider_user_id text not null,
      user_id integer not null references users (id) on delete cascade,
      created_at text not null,
      unique (provider, provider_user_id),
      unique (user_id, provider)
    )
  `)

  await db.run(sql`create index if not exists posts_published_at_idx on posts (published_at desc)`)
}

export interface GoogleAccountProfile {
  id: string
  email: string
  name: string
  avatar: string | null
}

export interface AuthAccount {
  id: number
  name: string
  email: string
  avatar: string | null
}

function findGoogleAccount(sqlite: DatabaseSync, googleId: string): AuthAccount | undefined {
  return sqlite.prepare(`
    select users.id, users.name, users.email, users.avatar
    from oauth_accounts
    join users on users.id = oauth_accounts.user_id
    where oauth_accounts.provider = 'google' and oauth_accounts.provider_user_id = ?
  `).get(googleId) as AuthAccount | undefined
}

function findAccountByEmail(sqlite: DatabaseSync, email: string): AuthAccount | undefined {
  return sqlite.prepare(`
    select id, name, email, avatar from users where email = ?
  `).get(email) as AuthAccount | undefined
}

function withDatabaseTransaction<T>(sqlite: DatabaseSync, write: () => T): T {
  sqlite.exec('BEGIN IMMEDIATE;')
  try {
    const result = write()
    sqlite.exec('COMMIT;')
    return result
  }
  catch (cause) {
    sqlite.exec('ROLLBACK;')
    throw cause
  }
}

export async function createUserAccount(account: {
  name: string
  email: string
  passwordHash: string
  role?: ManagedUserRole
}): Promise<AuthAccount> {
  const sqlite = await useSqlite()

  const result = sqlite.prepare(`
    insert into users (name, email, password_hash, role, created_at)
    values (?, ?, ?, ?, ?)
  `).run(
    account.name,
    account.email,
    account.passwordHash,
    account.role ?? 'commenter',
    new Date().toISOString(),
  )

  return {
    id: Number(result.lastInsertRowid),
    name: account.name,
    email: account.email,
    avatar: null,
  }
}

export async function updateManagedUserRole(
  id: number,
  role: ManagedUserRole,
  configuredAdminIds: readonly number[],
): Promise<'updated' | 'not-found' | 'config-admin' | 'last-admin'> {
  const sqlite = await useSqlite()

  return withDatabaseTransaction(sqlite, () => {
    const users = sqlite.prepare('select id, role from users').all() as { id: number, role: ManagedUserRole }[]
    const target = users.find(user => user.id === id)
    if (!target) return 'not-found'
    if (configuredAdminIds.includes(id) && role !== 'admin') return 'config-admin'

    const effectiveAdminCount = users.filter(user =>
      user.role === 'admin' || configuredAdminIds.includes(user.id),
    ).length
    const isAdmin = target.role === 'admin' || configuredAdminIds.includes(id)
    if (isAdmin && role !== 'admin' && effectiveAdminCount <= 1) return 'last-admin'

    sqlite.prepare('update users set role = ? where id = ?').run(role, id)
    return 'updated'
  })
}

export async function deleteManagedUser(
  id: number,
  configuredAdminIds: readonly number[],
): Promise<'deleted' | 'not-found' | 'config-admin' | 'last-admin'> {
  const sqlite = await useSqlite()

  return withDatabaseTransaction(sqlite, () => {
    const users = sqlite.prepare('select id, role from users').all() as { id: number, role: ManagedUserRole }[]
    const target = users.find(user => user.id === id)
    if (!target) return 'not-found'
    if (configuredAdminIds.includes(id)) return 'config-admin'

    const effectiveAdminCount = users.filter(user =>
      user.role === 'admin' || configuredAdminIds.includes(user.id),
    ).length
    if (target.role === 'admin' && effectiveAdminCount <= 1) return 'last-admin'

    sqlite.prepare('delete from users where id = ?').run(id)
    return 'deleted'
  })
}

export async function updateManagedUserPassword(id: number, passwordHash: string): Promise<boolean> {
  const sqlite = await useSqlite()

  const result = sqlite.prepare('update users set password_hash = ? where id = ?').run(passwordHash, id)
  return result.changes > 0
}

export async function getOrCreateGoogleAccount(profile: GoogleAccountProfile): Promise<AuthAccount> {
  const sqlite = await useSqlite()

  const existingAccount = findGoogleAccount(sqlite, profile.id)
  if (existingAccount) {
    return existingAccount
  }

  const accountByEmail = findAccountByEmail(sqlite, profile.email)
  const generatedPasswordHash = accountByEmail
    ? null
    : await hashPassword(randomBytes(32).toString('base64url'))

  return withDatabaseTransaction(sqlite, () => {
    const linkedAccount = findGoogleAccount(sqlite, profile.id)
    if (linkedAccount) {
      return linkedAccount
    }

    let account = findAccountByEmail(sqlite, profile.email)
    if (!account) {
      if (!generatedPasswordHash) {
        throw new Error('A conta Google apareceu durante a vinculação, mas o hash não foi gerado')
      }

      const inserted = sqlite.prepare(`
        insert into users (name, email, password_hash, avatar, created_at)
        values (?, ?, ?, ?, ?)
      `).run(
        profile.name,
        profile.email,
        generatedPasswordHash,
        profile.avatar,
        new Date().toISOString(),
      )
      account = {
        id: Number(inserted.lastInsertRowid),
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
      }
    }

    sqlite.prepare(`
      insert into oauth_accounts (provider, provider_user_id, user_id, created_at)
      values ('google', ?, ?, ?)
    `).run(profile.id, account.id, new Date().toISOString())

    return account
  })
}

const SEED_POSTS = [
  {
    slug: 'zen-do-python',
    title: 'Zen do Python',
    description: 'Os 19 aforismos de Tim Peters, traduzidos e comentados pela caverna.',
    image: null,
    badge: 'Código',
    publishedAt: '2025-11-14T21:00:00.000Z',
    content: `## Zen do Python

Digite \`import this\` em qualquer interpretador Python e você recebe **O Zen do Python**,
de Tim Peters: 19 aforismos sobre como escrever código bonito. Dominio público, sabedoria eterna.

### Os aforismos

1. **Bonito é melhor que feio.**
2. **Explícito é melhor que implícito.**
3. **Simples é melhor que complexo.**
4. **Complexo é melhor que complicado.**
5. **Plano é melhor que aninhado.**
6. **Esparso é melhor que denso.**
7. **Legibilidade conta.**
8. **Casos especiais não são especiais o suficiente para quebrar as regras.**
9. *Embora praticidade vença pureza.*
10. **Erros nunca devem passar em silêncio.**
11. *A menos que sejam silenciados explicitamente.*
12. **Diante da ambiguidade, recuse a tentação de adivinhar.**
13. **Deveria haver um — e preferencialmente apenas um — jeito óbvio de fazer isso.**
14. *Embora esse jeito pode não ser óbvio a princípio, a menos que você seja holandês.*
15. **Agora é melhor que nunca.**
16. *Embora nunca frequentemente seja melhor que* ***agora*** *mesmo.*
17. **Se a implementação é difícil de explicar, é uma má ideia.**
18. **Se a implementação é fácil de explicar, pode ser uma boa ideia.**
19. **Namespaces são uma ideia genial — vamos fazer mais desses!**

> Bonito é melhor que feio. — Tim Peters

É um manifesto para qualquer linguagem, não só Python.`,
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
