import { Repository, IsNull } from "typeorm";
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

  public async findLastByEmployee(employeeId: number): Promise<Attendance | null> {
    return this.repository.findOne({
      where: { employee_id: employeeId },
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
