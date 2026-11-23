import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { initialBooks } from '../../shared/data/books'
import type { Book } from '../../shared/types/book'
import { createBooksSchema } from '../database/books-schema'

interface BookRow {
  slug: string
  title: string
  subtitle: string
  amazon_url: string
  image: string
  image_alt: string
  themes: string
  synopsis: string
  age_rating: string
  details: string
  accent: string
  secondary_accent: string
}

let connection: DatabaseSync | undefined

function decodeBook(row: BookRow): Book {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    amazonUrl: row.amazon_url,
    image: row.image,
    imageAlt: row.image_alt,
    themes: JSON.parse(row.themes) as string[],
    synopsis: JSON.parse(row.synopsis) as string[],
    ageRating: row.age_rating,
    details: JSON.parse(row.details) as string[],
    accent: row.accent,
    secondaryAccent: row.secondary_accent,
  }
}

function database() {
  if (connection) return connection

  const configured = useRuntimeConfig().booksDatabasePath
  const file = isAbsolute(configured) ? configured : resolve(process.cwd(), configured)
  mkdirSync(dirname(file), { recursive: true })
  const sqlite = new DatabaseSync(file)
  try {
    sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;')
    const migratedSecondaryAccent = createBooksSchema(sqlite)

    if (migratedSecondaryAccent) {
      const updateAccent = sqlite.prepare('update books set secondary_accent = ? where slug = ?')
      initialBooks.forEach(book => updateAccent.run(book.secondaryAccent, book.slug))
    }

    const seeded = sqlite.prepare('select value from books_meta where key = ?').get('initial_books_seeded')
    if (!seeded) {
      const insert = sqlite.prepare(`
        insert or ignore into books (
          slug, title, subtitle, amazon_url, image, image_alt,
          themes, synopsis, age_rating, details, accent, secondary_accent, sort_order, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      initialBooks.forEach((book, index) => {
        insert.run(
          book.slug,
          book.title,
          book.subtitle,
          book.amazonUrl,
          book.image,
          book.imageAlt,
          JSON.stringify(book.themes),
          JSON.stringify(book.synopsis),
          book.ageRating,
          JSON.stringify(book.details),
          book.accent,
          book.secondaryAccent,
          index,
          new Date().toISOString(),
        )
      })

      sqlite.prepare('insert into books_meta (key, value) values (?, ?)').run('initial_books_seeded', 'true')
    }

    sqlite.exec('PRAGMA query_only = ON;')
  }
  catch (cause) {
    sqlite.close()
    throw cause
  }

  connection = sqlite
  return sqlite
}

const selectFields = `
  slug, title, subtitle, amazon_url, image, image_alt,
  themes, synopsis, age_rating, details, accent, secondary_accent
`

export function listBooks() {
  const rows = database()
    .prepare(`select ${selectFields} from books order by sort_order, title collate nocase`)
    .all() as unknown as BookRow[]

  return rows.map(decodeBook)
}

export function findBook(slug: string) {
  const row = database()
    .prepare(`select ${selectFields} from books where slug = ?`)
    .get(slug) as unknown as BookRow | undefined

  return row ? decodeBook(row) : null
}

function withBookDatabaseWrite<T>(write: (sqlite: DatabaseSync) => T): T {
  const sqlite = database()
  sqlite.exec('PRAGMA query_only = OFF;')
  try {
    return write(sqlite)
  }
  finally {
    sqlite.exec('PRAGMA query_only = ON;')
  }
}

export function createBook(book: Book) {
  withBookDatabaseWrite((sqlite) => {
    const sortOrder = Number(
      sqlite.prepare('select coalesce(max(sort_order), -1) + 1 as next from books').get()?.next ?? 0,
    )

    sqlite.prepare(`
      insert into books (
        slug, title, subtitle, amazon_url, image, image_alt,
        themes, synopsis, age_rating, details, accent, secondary_accent, sort_order, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      book.slug,
      book.title,
      book.subtitle,
      book.amazonUrl,
      book.image,
      book.imageAlt,
      JSON.stringify(book.themes),
      JSON.stringify(book.synopsis),
      book.ageRating,
      JSON.stringify(book.details),
      book.accent,
      book.secondaryAccent,
      sortOrder,
      new Date().toISOString(),
    )
  })

  return findBook(book.slug)
}

export function updateBook(originalSlug: string, book: Book) {
  withBookDatabaseWrite((sqlite) => {
    sqlite.prepare(`
      update books set
        slug = ?, title = ?, subtitle = ?, amazon_url = ?, image = ?, image_alt = ?,
        themes = ?, synopsis = ?, age_rating = ?, details = ?, accent = ?, secondary_accent = ?, updated_at = ?
      where slug = ?
    `).run(
      book.slug,
      book.title,
      book.subtitle,
      book.amazonUrl,
      book.image,
      book.imageAlt,
      JSON.stringify(book.themes),
      JSON.stringify(book.synopsis),
      book.ageRating,
      JSON.stringify(book.details),
      book.accent,
      book.secondaryAccent,
      new Date().toISOString(),
      originalSlug,
    )
  })

  return findBook(book.slug)
}

export function removeBook(slug: string) {
  return withBookDatabaseWrite(sqlite =>
    Number(sqlite.prepare('delete from books where slug = ?').run(slug).changes) > 0,
  )
}
