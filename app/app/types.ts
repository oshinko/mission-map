export interface Map {
  id: string;
  name: string;
  places: Place[]
}

export interface Place {
  mapId: string;
  localId: string;
  type: 'point' | 'area';
  name: string;
  address: string;
  coordinates: Coordinate[];
}

export interface Coordinate {
  mapId: string;
  placeLocalId: string;
  index: number;
  latitude: number;
  longitude: number;
}
