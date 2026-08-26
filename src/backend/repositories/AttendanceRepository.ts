import { Repository, MoreThanOrEqual, LessThan, Between } from "typeorm";
import { Attendance, AttendanceType } from "../models/Attendance";
import { AppDataSource } from "../datasource";

export interface CreateAttendanceDTO {
  employeeId: string;
  type: AttendanceType;
  timestamp: Date;
  deviceInfo?: {
    fingerprint?: string;
    userAgent?: string;
    verificationMethod?: "biometric" | "password";
  } | null;
  recordedBy?: string | null;
}

export interface AttendanceFilters {
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AttendanceRepository {
  private static instance: AttendanceRepository | null = null;
  private _repository: Repository<Attendance> | null = null;

  private constructor() {}

  /** Lazy — resolves the TypeORM repository only after DataSource is initialized. */
  private get repository(): Repository<Attendance> {
    if (!this._repository) {
      this._repository = AppDataSource.getRepository(Attendance);
    }
    return this._repository;
  }

  public static getInstance(): AttendanceRepository {
    if (!AttendanceRepository.instance) {
      AttendanceRepository.instance = new AttendanceRepository();
    }
    return AttendanceRepository.instance;
  }

public async findAll(): Promise<Attendance[]> {
    return this.repository.find({
      order: { timestamp: "DESC" },
    });
  }

public async findById(id: string): Promise<Attendance | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  public async findByEmployee(employeeId: string): Promise<Attendance[]> {
    return this.repository.find({
      where: { employeeId },
      order: { timestamp: "DESC" },
    });
  }

  public async findByEmployeeAndDate(
    employeeId: string,
    date: Date
  ): Promise<Attendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.repository.find({
      where: {
        employeeId,
        timestamp: Between(startOfDay, endOfDay),
      },
      order: { timestamp: "ASC" },
    });
  }

  public async findByEmployeeAndDateRange(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Attendance[]> {
    return this.repository.find({
      where: {
        employeeId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: "ASC" },
    });
  }

  /**
   * Batch query: fetch attendances for ALL employees in a date range.
   * Replaces the N+1 pattern of querying per-employee in a loop.
   */
  public async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Attendance[]> {
    return this.repository.find({
      where: {
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: "ASC" },
    });
  }

  public async findTodayByEmployee(employeeId: string): Promise<Attendance[]> {
    return this.findByEmployeeAndDate(employeeId, new Date());
  }

  public async findToday(): Promise<Attendance[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.repository.find({
      where: {
        timestamp: Between(startOfDay, endOfDay),
      },
      order: { timestamp: "ASC" },
    });
  }

public async hasEntryToday(employeeId: string): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const entry = await this.repository.findOne({
      where: {
        employeeId,
        type: AttendanceType.ENTRADA,
        timestamp: Between(startOfDay, endOfDay),
      },
    });

    return entry !== null;
  }

  public async findLastByEmployee(employeeId: string): Promise<Attendance | null> {
    return this.repository.findOne({
      where: { employeeId },
      order: { timestamp: "DESC" },
    });
  }

  public async findLastByEmployeeToday(employeeId: string): Promise<Attendance | null> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.repository.findOne({
      where: {
        employeeId,
        timestamp: Between(startOfDay, endOfDay),
      },
      order: { timestamp: "DESC" },
    });
  }

  public async create(data: CreateAttendanceDTO): Promise<Attendance> {
    const attendance = this.repository.create(data);
    return this.repository.save(attendance);
  }

public async findWithFilters(
    filters: AttendanceFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Attendance>> {
    const queryBuilder = this.repository
      .createQueryBuilder("attendance");

    if (filters.employeeId) {
      queryBuilder.andWhere("attendance.employeeId = :employeeId", {
        employeeId: filters.employeeId,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere("attendance.timestamp >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      queryBuilder.andWhere("attendance.timestamp <= :endDate", {
        endDate: endOfDay,
      });
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy("attendance.timestamp", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async findWeekEntries(startDate: Date, endDate: Date): Promise<Attendance[]> {
    return this.repository.find({
      where: {
        type: AttendanceType.ENTRADA,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: "ASC" },
    });
  }
}

export const attendanceRepository = AttendanceRepository.getInstance();
