import type {
  BannerDto,
  CourseSummaryDto,
  FaqDto,
  Paginated,
  PageDto,
  PricingPlanDto,
  SiteSettingsDto,
  TestimonialDto,
} from '@testcraft/shared';
import { api } from './api';
import { FALLBACK_SETTINGS } from './data';
import type { LearningPathDto } from '@/types';

/**
 * Pembungkus fetch konten CMS untuk server component.
 * Kegagalan API tidak boleh menjatuhkan halaman marketing — kembalikan
 * nilai cadangan agar halaman tetap ter-render.
 */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const getSettings = () =>
  safe(
    () => api.get<SiteSettingsDto>('/content/settings', { revalidate: 300 }),
    FALLBACK_SETTINGS as SiteSettingsDto,
  );

export const getPage = (slug: string) =>
  safe(() => api.get<PageDto>(`/content/pages/${slug}`, { revalidate: 60 }), null);

export const getBanners = () =>
  safe(() => api.get<BannerDto[]>('/content/banners', { revalidate: 60 }), []);

export const getPlans = () =>
  safe(
    () => api.get<PricingPlanDto[]>('/content/pricing-plans', { revalidate: 300 }),
    [],
  );

export const getTestimonials = () =>
  safe(
    () =>
      api.get<TestimonialDto[]>('/content/testimonials?featured=true', {
        revalidate: 300,
      }),
    [],
  );

export const getFaqs = () =>
  safe(() => api.get<FaqDto[]>('/content/faqs', { revalidate: 300 }), []);

export const getCourses = (query = '') =>
  safe(
    () =>
      api.get<Paginated<CourseSummaryDto>>(`/courses${query}`, { revalidate: 60 }),
    { data: [], meta: { page: 1, limit: 0, total: 0, totalPages: 1, hasNext: false, hasPrev: false } },
  );

export const getCategories = () =>
  safe(
    () =>
      api.get<Array<{ id: string; name: string; slug: string; icon?: string | null; courseCount: number }>>(
        '/categories',
        { revalidate: 300 },
      ),
    [],
  );

export const getLearningPaths = () =>
  safe(() => api.get<LearningPathDto[]>('/learning-paths', { revalidate: 300 }), []);
