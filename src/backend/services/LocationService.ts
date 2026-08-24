import { Location } from "../models/Location";
import { locationRepository } from "../repositories/LocationRepository";
import { CreateLocationDTO, UpdateLocationDTO } from "../types/locations";

export class LocationService {
  private static instance: LocationService | null = null;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public async getAll(): Promise<Location[]> {
    return locationRepository.findAll();
  }

  public async getActive(): Promise<Location[]> {
    return locationRepository.findActive();
  }

  public async getById(id: string): Promise<Location | null> {
    return locationRepository.findById(id);
  }

  public async create(data: CreateLocationDTO): Promise<Location> {
    return locationRepository.create(data);
  }

  public async update(id: string, data: UpdateLocationDTO): Promise<Location | null> {
    const location = await locationRepository.findById(id);
    if (!location) {
      throw new Error("Ubicación no encontrada");
    }
    return locationRepository.update(id, data);
  }

  public async delete(id: string): Promise<boolean> {
    const location = await locationRepository.findById(id);
    if (!location) {
      throw new Error("Ubicación no encontrada");
    }
    return locationRepository.delete(id);
  }
}

export const locationService = LocationService.getInstance();
