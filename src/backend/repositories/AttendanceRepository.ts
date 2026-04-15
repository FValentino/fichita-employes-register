import { Repository, MoreThanOrEqual, LessThan, Between } from "typeorm";
import { Attendance, AttendanceType } from "../models";
import { AppDataSource } from "../datasource";

export interface CreateAttendanceDTO {
  employee_id: number;
  recorded_by?: number | null;
  type: AttendanceType;
  timestamp: Date;
}

export interface AttendanceFilters {
  employeeId?: number;
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
  private repository: Repository<Attendance>;

  private constructor() {
    this.repository = AppDataSource.getRepository(Attendance);
  }

  public static getInstance(): AttendanceRepository {
    if (!AttendanceRepository.instance) {
      AttendanceRepository.instance = new AttendanceRepository();
    }
    return AttendanceRepository.instance;
  }

  public async findAll(): Promise<Attendance[]> {
    return this.repository.find({
      relations: ["employee", "recordedBy"],
      order: { timestamp: "DESC" },
    });
  }

  public async findById(id: number): Promise<Attendance | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["employee", "recordedBy"],
    });
  }

  public async findByEmployee(employeeId: number): Promise<Attendance[]> {
    return this.repository.find({
      where: { employee_id: employeeId },
      relations: ["employee", "recordedBy"],
      order: { timestamp: "DESC" },
    });
  }

  public async findByEmployeeAndDate(
    employeeId: number,
    date: Date
  ): Promise<Attendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.repository.find({
      where: {
        employee_id: employeeId,
        timestamp: Between(startOfDay, endOfDay),
      },
      relations: ["employee", "recordedBy"],
      order: { timestamp: "ASC" },
    });
  }

  public async findByEmployeeAndDateRange(
    employeeId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Attendance[]> {
    return this.repository.find({
      where: {
        employee_id: employeeId,
        timestamp: Between(startDate, endDate),
      },
      relations: ["employee", "recordedBy"],
      order: { timestamp: "ASC" },
    });
  }

  public async findTodayByEmployee(employeeId: number): Promise<Attendance[]> {
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
      relations: ["employee", "recordedBy"],
      order: { timestamp: "ASC" },
    });
  }

  public async hasEntryToday(employeeId: number): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const entry = await this.repository.findOne({
      where: {
        employee_id: employeeId,
        type: AttendanceType.ENTRADA,
        timestamp: Between(startOfDay, endOfDay),
      },
    });

    return entry !== null;
  }

  public async findLastByEmployee(employeeId: number): Promise<Attendance | null> {
    return this.repository.findOne({
      where: { employee_id: employeeId },
      relations: ["employee", "recordedBy"],
      order: { timestamp: "DESC" },
    });
  }

  public async findLastByEmployeeToday(employeeId: number): Promise<Attendance | null> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.repository.findOne({
      where: {
        employee_id: employeeId,
        timestamp: Between(startOfDay, endOfDay),
      },
      relations: ["employee", "recordedBy"],
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
      .createQueryBuilder("attendance")
      .leftJoinAndSelect("attendance.employee", "employee")
      .leftJoinAndSelect("attendance.recordedBy", "recordedBy");

    if (filters.employeeId) {
      queryBuilder.andWhere("attendance.employee_id = :employeeId", {
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
