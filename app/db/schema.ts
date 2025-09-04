import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
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
  statuses: many(statuses)
}));

export const placeType = pgEnum('place_type', ['point', 'area']);

export const places = pgTable('places', {
  mapId: varchar('map_id', { length: 11 }),
  localId: varchar('local_id', { length: 32 }),
  type: placeType('type').default('point').notNull(),
  name: varchar({ length: 255 }).notNull(),
  address: text(),
  statusIndex: integer('status_index').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, table => [primaryKey({ columns: [table.mapId, table.localId] })]);

export const placeRelations = relations(places, ({ one, many }) => ({
  map: one(maps, {
    fields: [places.mapId],
    references: [maps.id]
  }),
  coordinates: many(coordinates),
  status: one(statuses, {
    fields: [places.mapId, places.statusIndex],
    references: [statuses.mapId, statuses.index],
  })
}));

export const coordinates = pgTable('coordinates', {
  mapId: varchar('map_id', { length: 11 }),
  placeLocalId: varchar('place_local_id', { length: 32 }),
  index: integer().default(0).notNull(),
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
  color: varchar({ length: 32 }).default('blue').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, table => [primaryKey({ columns: [table.mapId, table.index] })]);

export const statusRelations = relations(statuses, ({ one }) => ({
  map: one(maps, {
    fields: [statuses.mapId],
    references: [maps.id]
  })
}));

export const comments = pgTable('comments', {
  mapId: varchar('map_id', { length: 11 }),
  placeLocalId: varchar('place_local_id', { length: 32 }),
  text: text().notNull(),
  system: boolean().notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, table => [primaryKey({ columns: [table.mapId, table.placeLocalId, table.createdAt] })]);

export const commentRelations = relations(comments, ({ one }) => ({
  place: one(places, {
    fields: [comments.mapId, comments.placeLocalId],
    references: [places.mapId, places.localId]
  })
}));
