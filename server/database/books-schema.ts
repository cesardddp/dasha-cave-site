import type { DatabaseSync } from 'node:sqlite'

export function createBooksSchema(sqlite: DatabaseSync) {
  sqlite.exec(`
    create table if not exists books (
      slug text primary key,
      title text not null,
      subtitle text not null default '',
      amazon_url text not null,
      image text not null default '',
      image_alt text not null default '',
      themes text not null default '[]',
      synopsis text not null default '[]',
      age_rating text not null default '',
      details text not null default '[]',
      accent text not null default '#1a8173',
      secondary_accent text not null default '#00626f',
      sort_order integer not null default 0,
      updated_at text not null
    )
  `)

  const columns = sqlite.prepare('pragma table_info(books)').all() as { name: string }[]
  const needsSecondaryAccentMigration = !columns.some(column => column.name === 'secondary_accent')
  if (needsSecondaryAccentMigration) {
    sqlite.exec("alter table books add column secondary_accent text not null default '#00626f'")
  }

  sqlite.exec(`
    create table if not exists books_meta (
      key text primary key,
      value text not null
    )
  `)

  return needsSecondaryAccentMigration
}
