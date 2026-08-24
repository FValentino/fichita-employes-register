import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/api-middleware";
import { getSessionEmployee } from "@/lib/auth/session";
import { AppDataSource } from "@/backend/datasource";
import { WebAuthnCredential } from "@/backend/models/WebAuthnCredential";

/**
 * GET /api/webauthn/status
 * Returns whether the current employee has enrolled a passkey.
 */
export async function GET(request: Request) {
  const rl = withRateLimit(request, { windowMs: 60_000, maxRequests: 30 }, "wa:status");
  if (!rl.allowed) return rl.response;

  const session = await getSessionEmployee();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = AppDataSource.getRepository(WebAuthnCredential);
  const credential = await repo.findOne({
    where: { employeeId: session.id },
  });

  return NextResponse.json({
    enrolled: !!credential,
    credentialLabel: credential?.label ?? null,
  });
}
