import { NextResponse } from "next/server";
import { waitForDb, AppDataSource } from "@/backend/datasource";
import { Employee } from "@/backend/models/Employee";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authUserId = searchParams.get("authUserId");

    if (!authUserId) {
      return NextResponse.json({ error: "authUserId is required" }, { status: 400 });
    }

    await waitForDb();
    const repo = AppDataSource.getRepository(Employee);
    const employee = await repo.findOne({ where: { authUserId } });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      role: employee.role,
      name: employee.name,
      lastName: employee.lastName,
    });

    // Set role cookie server-side with httpOnly so client JS cannot forge it.
    response.headers.set(
      "Set-Cookie",
      `fichita-role=${employee.role}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax; HttpOnly; Secure`
    );

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
