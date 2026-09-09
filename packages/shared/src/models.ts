import type {
  BlockType,
  ContentStatus,
  CourseStatus,
  Currency,
  DiscountType,
  LessonType,
  Level,
  PaymentProvider,
  PaymentStatus,
  QuestionType,
  Role,
} from './enums';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  avatarUrl?: string | null;
  xp: number;
  level: number;
  streakDays: number;
  companyId?: string | null;
  createdAt: string;
}

export interface InstructorDto {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  headline: string;
  bio: string;
  expYears: number;
  rating: number;
  totalStudents: number;
  totalCourses: number;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  courseCount?: number;
}

export interface CourseSummaryDto {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  level: Level;
  status: CourseStatus;
  thumbnailUrl?: string | null;
  icon?: string | null;
  durationMin: number;
  lessonCount: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  priceIDR: number;
  priceUSD: number;
  compareAtIDR?: number | null;
  compareAtUSD?: number | null;
  isBestseller: boolean;
  isFree: boolean;
  category: CategoryDto;
  instructor: Pick<InstructorDto, 'id' | 'name' | 'headline' | 'avatarUrl'>;
}

export interface CourseDetailDto extends CourseSummaryDto {
  description: string;
  previewVideoUrl?: string | null;
  outcomes: string[];
  prerequisites: string[];
  targetAudience: string[];
  modules: ModuleDto[];
  publishedAt?: string | null;
}

export interface ModuleDto {
  id: string;
  title: string;
  order: number;
  lessons: LessonDto[];
  hasQuiz: boolean;
}

export interface LessonDto {
  id: string;
  title: string;
  order: number;
  type: LessonType;
  durationSec: number;
  isPreview: boolean;
  videoId?: string | null;
}

export interface EnrollmentDto {
  id: string;
  courseId: string;
  course?: CourseSummaryDto;
  progressPct: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string | null;
  deadline?: string | null;
  completedAt?: string | null;
}

export interface QuizQuestionDto {
  id: string;
  type: QuestionType;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  points: number;
}

export interface QuizAttemptResultDto {
  attemptId: string;
  scorePct: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  review: Array<{
    questionId: string;
    correct: boolean;
    explanation?: string | null;
  }>;
}

export interface CertificateDto {
  id: string;
  number: string;
  courseTitle: string;
  recipientName: string;
  scorePct: number;
  issuedAt: string;
  verifyUrl: string;
  pdfUrl?: string | null;
}

export interface PaymentDto {
  id: string;
  invoiceNo: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  currency: Currency;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  paymentUrl?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

/* ------------------------------- CMS ---------------------------------- */

export interface PageDto {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  blocks: ContentBlockDto[];
  publishedAt?: string | null;
  updatedAt: string;
}

export interface ContentBlockDto {
  id: string;
  type: BlockType;
  order: number;
  visible: boolean;
  /** Payload bebas per tipe blok — divalidasi backend per BlockType. */
  data: Record<string, unknown>;
}

export interface BannerDto {
  id: string;
  key: string;
  title: string;
  body?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  variant: string;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface PricingPlanDto {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  priceIDR: number;
  priceUSD: number;
  compareAtIDR?: number | null;
  interval: 'ONE_TIME' | 'MONTHLY' | 'YEARLY';
  features: string[];
  highlighted: boolean;
  active: boolean;
  order: number;
}

export interface CouponDto {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  maxUses?: number | null;
  usedCount: number;
  minPurchaseIDR?: number | null;
  appliesToCourseIds: string[];
  startsAt?: string | null;
  expiresAt?: string | null;
  active: boolean;
}

export interface SiteSettingsDto {
  brandName: string;
  tagline: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  contactEmail: string;
  whatsapp: string;
  address?: string | null;
  socials: Record<string, string>;
  defaultCurrency: Currency;
  usdRate: number;
  taxPercent: number;
  maintenanceMode: boolean;
}

export interface TestimonialDto {
  id: string;
  name: string;
  role?: string | null;
  company?: string | null;
  avatarUrl?: string | null;
  quote: string;
  rating: number;
  featured: boolean;
  order: number;
}

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
  group: string;
  order: number;
  published: boolean;
}

export interface MediaAssetDto {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  folder: string;
  createdAt: string;
}
