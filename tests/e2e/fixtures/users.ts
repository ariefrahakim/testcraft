/**
 * Test user fixtures.
 *
 * Values are read from env vars so they can be overridden per environment
 * without changing source code.  Copy .env.example → .env.test and fill in
 * real seeded credentials before running the suite.
 */

export interface TestUser {
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

export const testUsers: Record<'admin' | 'student' | 'instructor', TestUser> = {
  admin: {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
    role: 'SUPER_ADMIN',
  },
  student: {
    email: process.env.STUDENT_EMAIL!,
    password: process.env.STUDENT_PASSWORD!,
    role: 'STUDENT',
  },
  instructor: {
    email: process.env.INSTRUCTOR_EMAIL!,
    password: process.env.INSTRUCTOR_PASSWORD!,
    role: 'INSTRUCTOR',
  },
};

/** A randomly generated email safe to use for registration smoke tests. */
export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}+${Date.now()}@testcraft.id`;
}
