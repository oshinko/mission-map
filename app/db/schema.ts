import {
  boolean,
  check,
  date,
  decimal,
  foreignKey,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const maps = pgTable('maps', {
  id: varchar({ length: 11 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const mapRelations = relations(maps, ({ many }) => ({
  places: many(places),
}));

export const places = pgTable('places', {
  mapId: varchar('map_id', { length: 11 }),
  localId: varchar('local_id', { length: 32 }),
  name: varchar({ length: 255 }).notNull(),
  address: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, table => [primaryKey({ columns: [table.mapId, table.localId] })]);

export const placeRelations = relations(places, ({ one, many }) => ({
  map: one(maps, {
    fields: [places.mapId],
    references: [maps.id]
  }),
  coordinates: many(coordinates)
}));

export const coordinates = pgTable('coordinates', {
  mapId: varchar('map_id', { length: 11 }),
  placeLocalId: varchar('place_local_id', { length: 32 }),
  index: integer().notNull(),
  latitude: numeric({ precision: 9, scale: 6 }).notNull(),
  longitude: numeric({ precision: 9, scale: 6 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, table => [primaryKey({ columns: [table.mapId, table.placeLocalId, table.index] })]);

export const coordinateRelations = relations(coordinates, ({ one }) => ({
  place: one(places, {
    fields: [coordinates.mapId, coordinates.placeLocalId],
    references: [places.mapId, places.localId]
  })
}));

export const statuses = pgTable('statuses', {
  mapId: varchar('map_id', { length: 11 }),
  index: integer().notNull(),
  name: varchar({ length: 32 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, table => [primaryKey({ columns: [table.mapId, table.index] })]);

export const statusRelations = relations(statuses, ({ one }) => ({
  map: one(places, {
    fields: [statuses.mapId],
    references: [places.mapId]
  })
}));

export const eventType = pgEnum('type', ['status_change', 'comment']);

export const events = pgTable('events', {
  mapId: varchar('map_id', { length: 11 }),
  placeLocalId: varchar('place_local_id', { length: 32 }),
  type: eventType().notNull(),
  statusIndex: integer('status_index'),
  comment: text(),
  system: boolean().notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, table => [
  primaryKey({ columns: [table.mapId, table.placeLocalId, table.createdAt, table.type] }),
  check(
    'value_check',
    sql`
      (${table.type} = 'status_change' AND ${table.statusIndex} IS NOT NULL AND ${table.comment} IS NULL)
      OR
      (${table.type} = 'comment' AND ${table.comment} IS NOT NULL AND ${table.statusIndex} IS NULL)
    `)
]);

export const eventRelations = relations(events, ({ one }) => ({
  place: one(places, {
    fields: [events.mapId, events.placeLocalId],
    references: [places.mapId, places.localId]
  })
}));
