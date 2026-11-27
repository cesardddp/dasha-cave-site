import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  role: text('role', { enum: ['admin', 'commenter'] }).notNull().default('commenter'),
  emailVerifiedAt: text('email_verified_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const authTokens = sqliteTable(
  'auth_tokens',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: text('purpose', { enum: ['email_verification', 'password_reset'] }).notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  table => [index('auth_tokens_user_purpose_idx').on(table.userId, table.purpose)],
)

export const oauthAccounts = sqliteTable(
  'oauth_accounts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  table => [
    uniqueIndex('oauth_accounts_provider_identity_unique').on(table.provider, table.providerUserId),
    uniqueIndex('oauth_accounts_user_provider_unique').on(table.userId, table.provider),
  ],
)

export const posts = sqliteTable(
  'posts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    content: text('content').notNull(),
    image: text('image'),
    badge: text('badge'),
    publishedAt: text('published_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  table => [index('posts_published_at_idx').on(table.publishedAt)],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type AuthToken = typeof authTokens.$inferSelect
export type AuthTokenPurpose = AuthToken['purpose']
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
