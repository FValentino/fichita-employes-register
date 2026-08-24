import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { employeeRepository } from "@/backend/repositories/EmployeeRepository";
import { getSessionUser, getSessionEmployee } from "@/lib/auth/session";
import type { Employee } from "@/backend/models/Employee";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/backend/repositories/EmployeeRepository", () => ({
  employeeRepository: {
    findByAuthUserId: jest.fn(),
  },
}));

const createServerClientMock = createServerClient as jest.Mock;
const cookiesMock = cookies as jest.Mock;
const findByAuthUserIdMock = employeeRepository.findByAuthUserId as jest.Mock;

function mockRequestCookies(cookieNames: string[]) {
  const store = cookieNames.map((name) => ({ name, value: `${name}-value` }));
  cookiesMock.mockResolvedValue({ getAll: () => store });
  return store;
}

function mockAuthClient(getUserResult: { data: unknown; error?: unknown }) {
  const getUser = jest.fn().mockResolvedValue(getUserResult);
  createServerClientMock.mockReturnValue({ auth: { getUser } });
  return { getUser };
}

describe("getSessionUser", () => {
  const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
    if (ORIGINAL_KEY === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_KEY;
  });

  it("returns null without touching Supabase when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await expect(getSessionUser()).resolves.toBeNull();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("returns the verified auth user id", async () => {
    mockRequestCookies(["sb-project-auth-token"]);
    const { getUser } = mockAuthClient({ data: { user: { id: "auth-1" } } });

    await expect(getSessionUser()).resolves.toEqual({ authUserId: "auth-1" });
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("binds the client to the request cookies via getAll (read-only adapter)", async () => {
    const store = mockRequestCookies(["sb-project-auth-token"]);

    let received: unknown;
    createServerClientMock.mockImplementation(
      (_url: string, _key: string, options: { cookies: { getAll: () => unknown } }) => {
        received = options.cookies.getAll();
        return { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "auth-1" } } }) } };
      }
    );

    await getSessionUser();
    expect(received).toEqual(store);
  });

  it("returns null when the cookie store is empty (unauthenticated)", async () => {
    mockRequestCookies([]);
    mockAuthClient({ data: { user: null } });

    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("returns null when Supabase reports an error (invalid/expired token)", async () => {
    mockRequestCookies(["sb-project-auth-token"]);
    mockAuthClient({ data: { user: null }, error: { message: "invalid claim" } });

    await expect(getSessionUser()).resolves.toBeNull();
  });
});

describe("getSessionEmployee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("returns the employee linked to the session authUserId", async () => {
    mockRequestCookies(["sb-project-auth-token"]);
    mockAuthClient({ data: { user: { id: "auth-1" } } });
    const employee = { id: "emp-1", authUserId: "auth-1" } as Employee;
    findByAuthUserIdMock.mockResolvedValue(employee);

    await expect(getSessionEmployee()).resolves.toBe(employee);
    expect(findByAuthUserIdMock).toHaveBeenCalledWith("auth-1");
  });

  it("does not query employees when unauthenticated", async () => {
    mockRequestCookies([]);
    mockAuthClient({ data: { user: null } });

    await expect(getSessionEmployee()).resolves.toBeNull();
    expect(findByAuthUserIdMock).not.toHaveBeenCalled();
  });

  it("returns null for an authenticated account with no linked employee", async () => {
    mockRequestCookies(["sb-project-auth-token"]);
    mockAuthClient({ data: { user: { id: "auth-orphan" } } });
    findByAuthUserIdMock.mockResolvedValue(null);

    await expect(getSessionEmployee()).resolves.toBeNull();
  });
});
