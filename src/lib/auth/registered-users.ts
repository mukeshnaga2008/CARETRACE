import crypto from "crypto";

export interface RegisteredUser {
  id: string;
  email: string;
  fullName: string;
  role: "patient" | "family" | "caregiver" | "doctor" | "admin";
  patientId?: string;
  passwordHash: string;
  createdAt: string;
}

// Global salt for password hashing in local/demo environment
const AUTH_SALT = process.env.ACCESS_PIN_SALT || "caretrace-secure-salt-2026";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(`${AUTH_SALT}:${password}`).digest("hex");
}

// Built-in synthetic demonstration credentials matching CARETRACE_Synthetic_Demo_Dataset
const BUILTIN_USERS: RegisteredUser[] = [
  // Patient 1: Margaret Sullivan (DEMO-001) Network
  {
    id: "usr-david-001",
    email: "david@caretrace.health",
    fullName: "David Sullivan",
    role: "family",
    patientId: "DEMO-001",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-david-demo-001",
    email: "david.demo@example.test",
    fullName: "David Sullivan",
    role: "family",
    patientId: "DEMO-001",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-margaret-002",
    email: "margaret@caretrace.health",
    fullName: "Margaret Sullivan",
    role: "patient",
    patientId: "DEMO-001",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-sarah-003",
    email: "nurse.sarah@caretrace.health",
    fullName: "Nurse Sarah Jenkins, RN",
    role: "caregiver",
    patientId: "DEMO-001",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-sarah-demo-003",
    email: "sarah.demo@example.test",
    fullName: "Sarah Jenkins",
    role: "caregiver",
    patientId: "DEMO-001",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },

  // Patient 2: Arthur Bennett (DEMO-002) Network
  {
    id: "usr-helen-004",
    email: "helen@caretrace.health",
    fullName: "Helen Bennett",
    role: "family",
    patientId: "DEMO-002",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-helen-demo-004",
    email: "helen.demo@example.test",
    fullName: "Helen Bennett",
    role: "family",
    patientId: "DEMO-002",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-arthur-005",
    email: "arthur@caretrace.health",
    fullName: "Arthur Bennett",
    role: "patient",
    patientId: "DEMO-002",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },

  // Patient 3: Leela Raman (DEMO-003) Network
  {
    id: "usr-kavitha-006",
    email: "kavitha@caretrace.health",
    fullName: "Kavitha Raman",
    role: "family",
    patientId: "DEMO-003",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-kavitha-demo-006",
    email: "kavitha.demo@example.test",
    fullName: "Kavitha Raman",
    role: "family",
    patientId: "DEMO-003",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-leela-007",
    email: "leela@caretrace.health",
    fullName: "Leela Raman",
    role: "patient",
    patientId: "DEMO-003",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },

  // Patient 4: Josephine Carter (DEMO-004) Network
  {
    id: "usr-michael-008",
    email: "michael@caretrace.health",
    fullName: "Michael Carter",
    role: "family",
    patientId: "DEMO-004",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-michael-demo-008",
    email: "michael.demo@example.test",
    fullName: "Michael Carter",
    role: "family",
    patientId: "DEMO-004",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-josephine-009",
    email: "josephine@caretrace.health",
    fullName: "Josephine Carter",
    role: "patient",
    patientId: "DEMO-004",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },

  // Patient 5: Ravi Narayanan (DEMO-005) Network
  {
    id: "usr-meena-010",
    email: "meena@caretrace.health",
    fullName: "Meena Narayanan",
    role: "family",
    patientId: "DEMO-005",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-meena-demo-010",
    email: "meena.demo@example.test",
    fullName: "Meena Narayanan",
    role: "family",
    patientId: "DEMO-005",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-ravi-011",
    email: "ravi@caretrace.health",
    fullName: "Ravi Narayanan",
    role: "patient",
    patientId: "DEMO-005",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },

  // Clinician & Administrator
  {
    id: "usr-vance-012",
    email: "dr.vance@caretrace.health",
    fullName: "Dr. Robert Vance, MD",
    role: "doctor",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-admin-013",
    email: "admin@caretrace.health",
    fullName: "System Administrator",
    role: "admin",
    passwordHash: hashPassword("Caretrace2026!"),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

// Persistent global store across Next.js HMR in development & serverless instances
declare global {
  // eslint-disable-next-line no-var
  var __CARETRACE_REGISTERED_USERS__: Map<string, RegisteredUser> | undefined;
}

function getUserStore(): Map<string, RegisteredUser> {
  if (!global.__CARETRACE_REGISTERED_USERS__) {
    const store = new Map<string, RegisteredUser>();
    for (const u of BUILTIN_USERS) {
      store.set(u.email.toLowerCase(), u);
    }
    global.__CARETRACE_REGISTERED_USERS__ = store;
  }
  return global.__CARETRACE_REGISTERED_USERS__;
}

/**
 * Authenticates a user by email and plain-text password.
 */
export function authenticateUser(email: string, password: string): Omit<RegisteredUser, "passwordHash"> | null {
  const store = getUserStore();
  const normalizedEmail = email.trim().toLowerCase();
  const user = store.get(normalizedEmail);

  if (!user) {
    return null;
  }

  const hash = hashPassword(password);
  if (user.passwordHash !== hash) {
    return null;
  }

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Registers a new user into the CARETRACE account repository.
 */
export function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  role?: "patient" | "family" | "caregiver";
  patientId?: string;
}): { success: true; user: Omit<RegisteredUser, "passwordHash"> } | { success: false; error: string } {
  const store = getUserStore();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (store.has(normalizedEmail)) {
    return {
      success: false,
      error: "An account with this email address is already registered with CARETRACE.",
    };
  }

  const validRole = input.role === "family" || input.role === "caregiver" ? input.role : "patient";
  const newUser: RegisteredUser = {
    id: `usr-${crypto.randomUUID().slice(0, 8)}`,
    email: normalizedEmail,
    fullName: input.fullName.trim(),
    role: validRole,
    patientId: input.patientId || "DEMO-001",
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  store.set(normalizedEmail, newUser);

  const { passwordHash: _, ...safeUser } = newUser;
  return { success: true, user: safeUser };
}

/**
 * Retrieves a user by their registered email address.
 */
export function getUserByEmail(email: string): Omit<RegisteredUser, "passwordHash"> | null {
  const store = getUserStore();
  const user = store.get(email.trim().toLowerCase());
  if (!user) return null;
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Retrieves a user by their ID.
 */
export function getUserById(id: string): Omit<RegisteredUser, "passwordHash"> | null {
  const store = getUserStore();
  for (const user of store.values()) {
    if (user.id === id) {
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }
  }
  return null;
}
