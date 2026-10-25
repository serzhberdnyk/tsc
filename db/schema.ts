import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {id:text('id').primaryKey(),data:text('data').notNull()});
export const metadata = sqliteTable('metadata', {key:text('key').primaryKey(),data:text('data').notNull()});
export const events = sqliteTable('events', {id:text('id').primaryKey(),kind:text('kind').notNull(),at:text('at').notNull(),data:text('data').notNull()});
export const runs = sqliteTable('runs', {id:text('id').primaryKey(),data:text('data').notNull()});
export const locks = sqliteTable('locks', {id:text('id').primaryKey(),owner:text('owner').notNull(),expiresAt:integer('expires_at').notNull()});
