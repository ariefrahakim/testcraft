/**
 * TestApiClient — direct HTTP API calls for seeding and teardown.
 *
 * This client operates outside the browser so it can create/delete
 * test data without going through the UI.  Use it in beforeAll/afterAll hooks.
 *
 * All requests target the NestJS API at API_URL (default http://localhost:4001/api/v1).
 */

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthApiResponse {
  user: { id: string; email: string; name: string; role: string };
  tokens: LoginResponse;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface CreateCoursePayload {
  title: string;
  slug: string;
  description?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  priceIDR?: number;
  categoryId?: string;
  instructorId?: string;
}

export class TestApiClient {
  private readonly apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = (apiUrl ?? process.env.API_URL ?? 'http://localhost:4001/api/v1').replace(/\/$/, '');
  }

  // ─── Internal helpers ────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    jwt?: string,
  ): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

    const res = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`[TestApiClient] ${method} ${path} → ${res.status}: ${text}`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return res.json() as Promise<T>;
    }
    return res.text() as unknown as T;
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  /**
   * POST /auth/login — returns an access token JWT.
   * Use this in beforeAll to obtain a bearer token for subsequent API calls.
   */
  async loginAs(email: string, password: string): Promise<string> {
    const data = await this.request<AuthApiResponse>('POST', '/auth/login', { email, password });
    return data.tokens.accessToken;
  }

  /**
   * POST /auth/register — create a new student account and return tokens.
   */
  async createUser(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    const res = await this.request<AuthApiResponse>('POST', '/auth/register', data);
    return res.tokens;
  }

  /**
   * GET /auth/me — return the profile of the authenticated user.
   */
  async getProfile(jwt: string): Promise<UserProfile> {
    return this.request<UserProfile>('GET', '/auth/me', undefined, jwt);
  }

  // ─── Courses ─────────────────────────────────────────────────────────────

  /**
   * POST /cms/courses — create a draft course as an admin/instructor.
   * Returns the created course object.
   */
  async createCourse(jwt: string, data: CreateCoursePayload): Promise<{ id: string; slug: string }> {
    const payload = {
      ...data,
      categoryId: data.categoryId ?? 'cms2njvfx000eei2llfjjho0s',
      instructorId: data.instructorId ?? 'cms2njvfm0004ei2lit50u28y',
      description: data.description ?? 'A course created by E2E automated testing framework',
    };
    return this.request<{ id: string; slug: string }>('POST', '/courses', payload, jwt);
  }

  /**
   * PATCH /courses/:id — publish a course draft by setting status to PUBLISHED.
   */
  async publishCourse(jwt: string, courseId: string): Promise<void> {
    await this.request('PATCH', `/courses/${courseId}`, { status: 'PUBLISHED' }, jwt);
  }

  /**
   * DELETE /cms/courses/:id — delete a course (used in afterAll cleanup).
   */
  async deleteCourse(jwt: string, courseId: string): Promise<void> {
    await this.request('DELETE', `/courses/${courseId}`, undefined, jwt);
  }

  /**
   * GET /courses — return the first page of published courses.
   */
  async getCourses(params?: string): Promise<{ data: { id: string; slug: string; title: string }[] }> {
    return this.request('GET', `/courses${params ? `?${params}` : ''}`);
  }

  // ─── Enrollments ─────────────────────────────────────────────────────────

  /**
   * POST /enrollments — enroll the authenticated user in a course.
   * Only works for free courses (priceIDR === 0).
   */
  async enrollInCourse(jwt: string, courseId: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', '/enrollments', { courseId }, jwt);
  }

  // ─── Health ──────────────────────────────────────────────────────────────

  /**
   * GET /health — check if the API is up.
   */
  async health(): Promise<{ status: string; database: string }> {
    return this.request('GET', '/health');
  }
}
