export interface Map {
  id: string;
  name: string;
  places: Place[];
  statuses: Status[];
}

export interface Place {
  mapId: string;
  localId: string;
  type: 'point' | 'area';
  name: string;
  address: string;
  coordinates: Coordinate[];
  status: Status;
}

export interface Coordinate {
  mapId: string;
  placeLocalId: string;
  index: number;
  latitude: number;
  longitude: number;
}

export interface Status {
  mapId: string;
  index: number;
  name: string;
  color: string;
}
