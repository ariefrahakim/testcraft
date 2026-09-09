/**
 * Sample course data used to seed test courses via the API client
 * or to verify catalog content in UI tests.
 */

export interface CourseFixture {
  title: string;
  slug: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  priceIDR: number;
  category: string;
}

/** A free beginner course — safe to use for enrollment smoke tests. */
export const freeCourse: CourseFixture = {
  title: 'Pengantar Software Testing',
  slug: 'pengantar-software-testing',
  description:
    'Kelas gratis untuk pemula yang ingin memulai karier di QA dan software testing.',
  level: 'BEGINNER',
  priceIDR: 0,
  category: 'Software Testing',
};

/** A paid intermediate course. */
export const paidCourse: CourseFixture = {
  title: 'Playwright Automation End-to-End',
  slug: 'playwright-automation-e2e',
  description: 'Kuasai Playwright dari dasar hingga CI/CD pipeline.',
  level: 'INTERMEDIATE',
  priceIDR: 299_000,
  category: 'QA Automation',
};

/** An advanced API testing course. */
export const apiCourse: CourseFixture = {
  title: 'API Testing dengan Postman & Jest',
  slug: 'api-testing-postman-jest',
  description: 'Menguji REST API secara mendalam menggunakan Postman Collections dan Jest.',
  level: 'ADVANCED',
  priceIDR: 399_000,
  category: 'API Testing',
};

/** All fixtures as an array — handy for iteration. */
export const allCourses: CourseFixture[] = [freeCourse, paidCourse, apiCourse];

/** Draft course data used when testing course creation in the admin CMS. */
export const newCourseDraft = {
  title: `E2E Draft Course ${Date.now()}`,
  slug: `e2e-draft-${Date.now()}`,
  description: 'Auto-generated draft created by Playwright E2E test.',
  level: 'BEGINNER' as const,
  priceIDR: 0,
  category: 'Software Testing',
};
