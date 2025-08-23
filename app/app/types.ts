export interface Place {
  mapId: string;
  localId: string;
  type: 'point' | 'area';
  name: string;
  address: string;
  points: Point[];
}

export interface Point {
  mapId: string;
  placeLocalId: string;
  index: number;
  latitude: number;
  longitude: number;
  geohash: string;
}
