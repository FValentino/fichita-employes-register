export interface Location {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  radiusMeters: number;
  address: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocationDTO {
  name: string;
  lat?: number | null;
  lng?: number | null;
  radiusMeters?: number;
  address?: string;
}

export interface UpdateLocationDTO {
  name?: string;
  lat?: number | null;
  lng?: number | null;
  radiusMeters?: number;
  address?: string;
  active?: boolean;
}
