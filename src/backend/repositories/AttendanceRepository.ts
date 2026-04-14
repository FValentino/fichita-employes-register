import { Repository, MoreThanOrEqual, LessThan, Between } from "typeorm";
import { Attendance, AttendanceType } from "../models";
import { AppDataSource } from "../datasource";

export interface CreateAttendanceDTO {
  employee_id: number;
  recorded_by: number;
  type: AttendanceType;
  timestamp: Date;
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
}

export const attendanceRepository = AttendanceRepository.getInstance();
