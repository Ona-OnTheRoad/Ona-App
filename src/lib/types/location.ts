export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserLocation {
  /** Full human address from Google/Nominatim (street + area + city) */
  label: string;
  /** Area / city line for Uber-style subtitle under the street */
  city: string;
  coordinates: Coordinates;
}
