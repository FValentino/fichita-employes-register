import { Repository } from "typeorm";
import { Location } from "../models/Location";
import { AppDataSource } from "../datasource";
import { CreateLocationDTO, UpdateLocationDTO } from "../types/locations";

class LocationRepository {
  private static instance: LocationRepository | null = null;
  private repository: Repository<Location>;

  private constructor() {
    this.repository = AppDataSource.getRepository(Location);
  }

  public static getInstance(): LocationRepository {
    if (!LocationRepository.instance) {
      LocationRepository.instance = new LocationRepository();
    }
    return LocationRepository.instance;
  }

  public async findAll(): Promise<Location[]> {
    return this.repository.find({ order: { name: "ASC" } });
  }

  public async findActive(): Promise<Location[]> {
    return this.repository.find({ where: { active: true }, order: { name: "ASC" } });
  }

  public async findById(id: string): Promise<Location | null> {
    return this.repository.findOne({ where: { id } });
  }

  public async create(data: CreateLocationDTO): Promise<Location> {
    const location = this.repository.create(data);
    return this.repository.save(location);
  }

  public async update(id: string, data: UpdateLocationDTO): Promise<Location | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

export const locationRepository = LocationRepository.getInstance();
