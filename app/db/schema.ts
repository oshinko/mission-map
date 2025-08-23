import {
  date,
  decimal,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const deleteme = pgTable('deleteme', {
  id: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
