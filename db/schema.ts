import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const credentials = sqliteTable('bl_credentials', {id:text('id').primaryKey(), user:text('user').notNull(), publicKey:text('public_key').notNull(), counter:integer('counter').notNull(), transports:text('transports').notNull(), created:integer('created').notNull()});
export const challenges = sqliteTable('bl_challenges', {id:text('id').primaryKey(), user:text('user').notNull(), kind:text('kind').notNull(), challenge:text('challenge').notNull(), expires:integer('expires').notNull()});
export const sessions = sqliteTable('bl_unlock_sessions', {id:text('id').primaryKey(), user:text('user').notNull(), expires:integer('expires').notNull()});
