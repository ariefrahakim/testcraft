/**
 * Tipe domain kini tinggal di `packages/shared` supaya FE dan BE memakai
 * kontrak yang sama. Modul ini hanya meneruskannya.
 */
export type {
  BannerDto,
  CategoryDto,
  CertificateDto,
  ContentBlockDto,
  CourseDetailDto,
  CourseSummaryDto,
  CouponDto,
  EnrollmentDto,
  FaqDto,
  InstructorDto,
  LessonDto,
  MediaAssetDto,
  ModuleDto,
  PageDto,
  Paginated,
  PaymentDto,
  PricingPlanDto,
  SiteSettingsDto,
  TestimonialDto,
  UserDto,
} from '@testcraft/shared';

export { CourseStatus, Level, Role } from '@testcraft/shared';

/** Ringkasan learning path dari `GET /learning-paths`. */
export interface LearningPathDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon?: string | null;
  months: number;
  steps: Array<{
    order: number;
    course: {
      slug: string;
      title: string;
      icon?: string | null;
      durationMin: number;
      level: string;
      priceIDR: number;
    };
  }>;
}
