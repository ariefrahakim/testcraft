/**
 * Pesan error API dalam dua bahasa.
 *
 * Kontrak dengan klien:
 * - `code` bersifat stabil dan tidak pernah diterjemahkan — itulah yang boleh
 *   dijadikan patokan logika di frontend maupun test.
 * - `message` mengikuti header `Accept-Language`, jadi klien yang tidak punya
 *   kamus sendiri tetap menerima kalimat yang bisa dibaca pengguna.
 *
 * Menambah pesan: tambahkan kunci di `id`, TypeScript akan memaksa kamus `en`
 * ikut dilengkapi.
 */

export const SUPPORTED_LOCALES = ['id', 'en'] as const;
export type ApiLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: ApiLocale = 'id';

const id = {
  // Autentikasi
  'auth.invalidCredentials': 'Email atau password salah',
  'auth.accountInactive': 'Akun Anda dinonaktifkan. Hubungi admin kami.',
  'auth.emailTaken': 'Email ini sudah terdaftar. Coba masuk atau gunakan email lain.',
  'auth.refreshInvalid': 'Sesi tidak valid. Silakan masuk kembali.',
  'auth.refreshExpired': 'Sesi Anda sudah berakhir. Silakan masuk kembali.',
  'auth.required': 'Anda perlu masuk untuk mengakses halaman ini.',
  'auth.googleEmailUnverified':
    'Email Google Anda belum terverifikasi sehingga tidak bisa ditautkan.',
  'auth.forbiddenRole': 'Akun Anda tidak memiliki akses ke bagian ini.',

  // Validasi umum
  'validation.failed': 'Periksa kembali isian Anda.',
  'validation.email.required': 'Email wajib diisi',
  'validation.email.invalid': 'Masukkan alamat email yang valid',
  'validation.password.required': 'Password wajib diisi',
  'validation.password.tooShort': 'Password minimal 8 karakter',
  'validation.password.weak': 'Password harus memuat huruf dan angka',
  'validation.name.required': 'Nama wajib diisi',
  'validation.name.tooShort': 'Nama minimal 2 karakter',
  'validation.contact.required': 'Isi email atau nomor telepon',

  // Sumber daya
  'course.notFound': 'Kursus tidak ditemukan',
  'course.notPublished': 'Kursus ini belum tersedia',
  'lesson.notFound': 'Materi tidak ditemukan',
  'assignment.notFound': 'Tugas tidak ditemukan',
  'submission.notFound': 'Pengumpulan tugas tidak ditemukan',
  'page.notFound': 'Halaman tidak ditemukan',
  'invoice.notFound': 'Invoice tidak ditemukan',
  'certificate.notFound': 'Nomor sertifikat tidak ditemukan',
  'record.notFound': 'Data tidak ditemukan',

  // Pembelajaran
  'enrollment.paymentRequired':
    'Kursus ini berbayar. Selesaikan pembayaran terlebih dahulu.',
  'enrollment.notEnrolled': 'Anda belum terdaftar di kursus ini',
  'enrollment.alreadyEnrolled': 'Anda sudah terdaftar di salah satu kursus tersebut',

  // Pembayaran
  'checkout.courseMissing': 'Sebagian kursus tidak ditemukan atau belum terbit',
  'coupon.invalid': 'Kupon tidak valid atau sudah kedaluwarsa',
  'coupon.exhausted': 'Kuota kupon sudah habis',
  'coupon.minPurchase': 'Belanja Anda belum memenuhi minimum untuk kupon ini',
  'coupon.notApplicable': 'Kupon tidak berlaku untuk kursus yang dipilih',
  'coupon.alreadyUsed': 'Anda sudah memakai kupon ini',

  // Penilaian
  'grading.notYourCourse': 'Tugas ini bukan dari kursus yang Anda ampu',
  'instructor.profileMissing': 'Profil instruktur belum dibuat',

  // Basis data & lain-lain
  'db.duplicate': 'Data dengan nilai tersebut sudah ada',
  'db.invalidReference': 'Referensi data tidak valid',
  'db.error': 'Terjadi kesalahan pada basis data',
  'server.error': 'Terjadi kesalahan pada server. Coba beberapa saat lagi.',
  'rate.limited': 'Terlalu banyak permintaan. Coba lagi sebentar.',
} as const;

export type MessageCode = keyof typeof id;

const en = {
  'auth.invalidCredentials': 'Incorrect email or password',
  'auth.accountInactive': 'Your account has been deactivated. Please contact our admin.',
  'auth.emailTaken': 'This email is already registered. Try signing in or use another email.',
  'auth.refreshInvalid': 'Invalid session. Please sign in again.',
  'auth.refreshExpired': 'Your session has expired. Please sign in again.',
  'auth.required': 'You need to sign in to access this page.',
  'auth.googleEmailUnverified':
    'Your Google email is not verified, so it cannot be linked.',
  'auth.forbiddenRole': 'Your account does not have access to this area.',

  'validation.failed': 'Please check the details you entered.',
  'validation.email.required': 'Email is required',
  'validation.email.invalid': 'Enter a valid email address',
  'validation.password.required': 'Password is required',
  'validation.password.tooShort': 'Password must be at least 8 characters',
  'validation.password.weak': 'Password must contain both letters and numbers',
  'validation.name.required': 'Name is required',
  'validation.name.tooShort': 'Name must be at least 2 characters',
  'validation.contact.required': 'Enter an email address or phone number',

  'course.notFound': 'Course not found',
  'course.notPublished': 'This course is not available yet',
  'lesson.notFound': 'Lesson not found',
  'assignment.notFound': 'Assignment not found',
  'submission.notFound': 'Submission not found',
  'page.notFound': 'Page not found',
  'invoice.notFound': 'Invoice not found',
  'certificate.notFound': 'Certificate number not found',
  'record.notFound': 'Record not found',

  'enrollment.paymentRequired': 'This is a paid course. Please complete payment first.',
  'enrollment.notEnrolled': 'You are not enrolled in this course',
  'enrollment.alreadyEnrolled': 'You are already enrolled in one of those courses',

  'checkout.courseMissing': 'Some courses were not found or are not published',
  'coupon.invalid': 'This coupon is invalid or has expired',
  'coupon.exhausted': 'This coupon has run out of uses',
  'coupon.minPurchase': 'Your order does not meet the minimum for this coupon',
  'coupon.notApplicable': 'This coupon does not apply to the selected courses',
  'coupon.alreadyUsed': 'You have already used this coupon',

  'grading.notYourCourse': 'This assignment is not from a course you teach',
  'instructor.profileMissing': 'Instructor profile has not been created',

  'db.duplicate': 'A record with that value already exists',
  'db.invalidReference': 'Invalid data reference',
  'db.error': 'A database error occurred',
  'server.error': 'Something went wrong on our side. Please try again shortly.',
  'rate.limited': 'Too many requests. Please try again in a moment.',
} satisfies Record<MessageCode, string>;

const dictionaries: Record<ApiLocale, Record<MessageCode, string>> = { id, en };

/** True bila string tersebut memang kode pesan yang dikenal. */
export function isMessageCode(value: unknown): value is MessageCode {
  return typeof value === 'string' && value in id;
}

/**
 * Menerjemahkan kode. Placeholder `{nama}` diisi dari `vars`.
 * Kode yang tidak dikenal dikembalikan apa adanya agar tidak ada teks hilang.
 */
export function translate(
  code: string,
  locale: ApiLocale = DEFAULT_LOCALE,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const template = isMessageCode(code)
    ? (dict[code] ?? dictionaries[DEFAULT_LOCALE][code])
    : code;

  if (!vars) return template;
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

/**
 * Membaca bahasa dari header `Accept-Language`.
 * Contoh masukan: "en-US,en;q=0.9,id;q=0.8" → "en".
 */
export function resolveLocale(header?: string): ApiLocale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) {
      return base as ApiLocale;
    }
  }
  return DEFAULT_LOCALE;
}
