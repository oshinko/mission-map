import { coordinates, maps, places, statuses } from '@/db/schema';

export type Map = typeof maps.$inferInsert & {
  places: Place[];
  statuses: Status[];
};

export type Place = typeof places.$inferInsert & {
  mapId: string;
  localId: string;
  coordinates: Coordinate[];
  status: Status;
};

export type Coordinate = typeof coordinates.$inferInsert;

export type Status = typeof statuses.$inferInsert;
