/**
 * Enum kontrak bersama FE & BE.
 * Nilai string di sini HARUS identik dengan enum di apps/api/prisma/schema.prisma.
 */

export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  STUDENT: 'STUDENT',
  CORPORATE_ADMIN: 'CORPORATE_ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Level = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;
export type Level = (typeof Level)[keyof typeof Level];

export const CourseStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  EXPIRED: 'EXPIRED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentProvider = {
  MIDTRANS: 'MIDTRANS',
  XENDIT: 'XENDIT',
  STRIPE: 'STRIPE',
  PAYPAL: 'PAYPAL',
  MANUAL_TRANSFER: 'MANUAL_TRANSFER',
  INVOICE: 'INVOICE',
} as const;
export type PaymentProvider =
  (typeof PaymentProvider)[keyof typeof PaymentProvider];

export const QuestionType = {
  MCQ: 'MCQ',
  MULTI_SELECT: 'MULTI_SELECT',
  TRUE_FALSE: 'TRUE_FALSE',
  DRAG_DROP: 'DRAG_DROP',
  MATCHING: 'MATCHING',
  FILL_BLANK: 'FILL_BLANK',
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const SubmissionStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  GRADED: 'GRADED',
  RETURNED: 'RETURNED',
} as const;
export type SubmissionStatus =
  (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const LessonType = {
  VIDEO: 'VIDEO',
  ARTICLE: 'ARTICLE',
  QUIZ: 'QUIZ',
  ASSIGNMENT: 'ASSIGNMENT',
  LIVE_SESSION: 'LIVE_SESSION',
} as const;
export type LessonType = (typeof LessonType)[keyof typeof LessonType];

export const DiscountType = {
  PERCENT: 'PERCENT',
  FIXED_IDR: 'FIXED_IDR',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const ContentStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  SCHEDULED: 'SCHEDULED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

export const BlockType = {
  HERO: 'HERO',
  RICH_TEXT: 'RICH_TEXT',
  COURSE_GRID: 'COURSE_GRID',
  STATS: 'STATS',
  TESTIMONIALS: 'TESTIMONIALS',
  FAQ: 'FAQ',
  PRICING_TABLE: 'PRICING_TABLE',
  CTA: 'CTA',
  LEARNING_PATHS: 'LEARNING_PATHS',
  LOGO_CLOUD: 'LOGO_CLOUD',
  HTML: 'HTML',
} as const;
export type BlockType = (typeof BlockType)[keyof typeof BlockType];

export const Currency = {
  IDR: 'IDR',
  USD: 'USD',
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];
