/**
 * Seed database TestCraft LMS.
 * Idempoten — aman dijalankan berulang (memakai upsert pada kunci unik).
 *
 *   npm run db:seed --workspace @testcraft/api
 */
import { PrismaClient, Level, CourseStatus, BlockType, ContentStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@testcraft.id';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin#12345';

const CATEGORIES = [
  { name: 'Manual Testing', slug: 'manual-testing', icon: '📋', order: 1, featured: true },
  { name: 'Automation Testing', slug: 'automation-testing', icon: '🤖', order: 2, featured: true },
  { name: 'API Testing', slug: 'api-testing', icon: '🔗', order: 3, featured: true },
  { name: 'Performance Testing', slug: 'performance-testing', icon: '⚡', order: 4, featured: true },
  { name: 'AI for QA', slug: 'ai-for-qa', icon: '🧠', order: 5, featured: true },
  { name: 'DevOps', slug: 'devops', icon: '🔧', order: 6 },
  { name: 'Mobile Testing', slug: 'mobile-testing', icon: '📱', order: 7 },
];

const INSTRUCTORS = [
  {
    email: 'budi.santoso@testcraft.id',
    name: 'Budi Santoso',
    headline: 'Principal SDET · ex-Gojek',
    bio: 'Memimpin platform test automation yang melayani 50 juta+ pengguna. Spesialis Playwright & Selenium, tersertifikasi ISTQB-CTAL.',
    expYears: 12,
    rating: 4.9,
    totalStudents: 8420,
  },
  {
    email: 'sari.wulandari@testcraft.id',
    name: 'Sari Wulandari',
    headline: 'QA Lead · ex-Tokopedia',
    bio: 'Pakar API testing dan performance engineering. Pembicara di SeleniumConf Asia.',
    expYears: 10,
    rating: 4.8,
    totalStudents: 6210,
  },
  {
    email: 'andi.prasetyo@testcraft.id',
    name: 'Andi Prasetyo',
    headline: 'DevOps Architect · ex-Traveloka',
    bio: 'Membangun CI/CD untuk QA dalam skala besar. Penggiat Docker, Kubernetes, dan GitHub Actions.',
    expYears: 11,
    rating: 4.9,
    totalStudents: 5130,
  },
  {
    email: 'maya.kusuma@testcraft.id',
    name: 'Maya Kusuma',
    headline: 'AI Testing Researcher',
    bio: 'Perintis test generation berbasis AI dan self-healing automation.',
    expYears: 8,
    rating: 4.7,
    totalStudents: 3890,
  },
];

const COURSES = [
  {
    slug: 'pengantar-software-testing',
    title: 'Pengantar Software Testing',
    subtitle: 'Fondasi QA untuk pemula — mulai dari nol, gratis!',
    category: 'manual-testing',
    instructor: 0,
    level: Level.BEGINNER,
    icon: '🎓',
    durationMin: 120,
    priceIDR: 0,
    priceUSD: 0,
    compareAtIDR: null,
    compareAtUSD: null,
    rating: 4.9,
    reviewCount: 3200,
    studentCount: 12500,
    isBestseller: false,
    isFeatured: true,
    description:
      'Kelas gratis untuk pemula yang ingin memulai karier di QA dan software testing. Pelajari konsep dasar, siklus pengujian, dan teknik manual testing.',
    outcomes: [
      'Memahami dasar-dasar software testing',
      'Menulis test case yang efektif',
      'Mengenal jenis-jenis bug',
      'Membuat laporan defect',
    ],
    prerequisites: [],
    targetAudience: ['Pemula yang ingin belajar QA', 'Fresh graduate IT'],
  },
  {
    slug: 'playwright-zero-to-expert',
    title: 'Playwright Automation Testing from Zero to Expert',
    subtitle: 'Bangun framework automation modern dengan Playwright + TypeScript',
    category: 'automation-testing',
    instructor: 0,
    level: Level.BEGINNER,
    icon: '🎭',
    durationMin: 1920,
    priceIDR: 1250000,
    priceUSD: 79,
    compareAtIDR: 2500000,
    compareAtUSD: 158,
    rating: 4.9,
    reviewCount: 1240,
    studentCount: 4215,
    isBestseller: true,
    isFeatured: true,
    description:
      'Kuasai web automation modern dengan Playwright dan TypeScript — dari skrip pertama sampai framework enterprise lengkap dengan CI/CD, pola Page Object Model, API mocking, dan visual regression testing.',
    outcomes: [
      'Membangun framework Playwright yang scalable',
      'Menguasai locator & web-first assertions',
      'Page Object Model dan fixtures',
      'API testing & network interception',
      'Visual regression testing',
      'Docker + GitHub Actions CI/CD',
    ],
    prerequisites: ['HTML/CSS dasar', 'Tidak perlu pengalaman automation'],
    targetAudience: ['Manual tester yang ingin beralih ke automation', 'Frontend developer'],
  },
  {
    slug: 'cypress-e2e',
    title: 'Cypress End-to-End Testing',
    subtitle: 'E2E testing modern dengan time-travel debugging',
    category: 'automation-testing',
    instructor: 0,
    level: Level.INTERMEDIATE,
    icon: '🌲',
    durationMin: 1440,
    priceIDR: 1150000,
    priceUSD: 72,
    compareAtIDR: 2200000,
    rating: 4.8,
    reviewCount: 890,
    studentCount: 3180,
    description:
      'E2E testing modern dengan Cypress: time-travel debugging, custom commands, network intercept, dan paralelisasi lewat Cypress Cloud.',
    outcomes: ['Suite E2E yang tangguh', 'Custom commands', 'Network stubbing', 'Component testing'],
    prerequisites: ['Dasar JavaScript'],
    targetAudience: ['QA Engineer', 'Frontend developer'],
  },
  {
    slug: 'selenium-java',
    title: 'Selenium WebDriver with Java',
    subtitle: 'Selenium 4, TestNG, Maven, dan hybrid framework',
    category: 'automation-testing',
    instructor: 0,
    level: Level.BEGINNER,
    icon: '☕',
    durationMin: 2280,
    priceIDR: 1350000,
    priceUSD: 85,
    compareAtIDR: 2700000,
    rating: 4.8,
    reviewCount: 1560,
    studentCount: 5320,
    isBestseller: true,
    description:
      'Selenium 4 dengan Java, TestNG, Maven, Extent Reports, Selenium Grid, dan proyek hybrid framework yang lengkap.',
    outcomes: ['Selenium 4 & relative locators', 'TestNG parallel runs', 'Data-driven testing', 'Selenium Grid'],
    prerequisites: ['Tidak ada — Java diajarkan dari nol'],
    targetAudience: ['Pemula automation', 'QA Engineer'],
  },
  {
    slug: 'restassured-api',
    title: 'RestAssured API Automation',
    subtitle: 'Automasi REST API di Java',
    category: 'api-testing',
    instructor: 1,
    level: Level.INTERMEDIATE,
    icon: '🔗',
    durationMin: 1200,
    priceIDR: 1050000,
    priceUSD: 66,
    compareAtIDR: 2000000,
    rating: 4.7,
    reviewCount: 620,
    studentCount: 2470,
    description:
      'Automasi REST API di Java dengan RestAssured: request specification, JSON path, schema validation, OAuth2, dan desain framework.',
    outcomes: ['Automasi CRUD API', 'Schema validation', 'Autentikasi OAuth2/JWT', 'Serialisasi POJO'],
    prerequisites: ['Core Java', 'Dasar HTTP'],
    targetAudience: ['QA Engineer', 'Backend developer'],
  },
  {
    slug: 'postman-api',
    title: 'Postman API Testing',
    subtitle: 'Dari request pertama sampai pipeline otomatis',
    category: 'api-testing',
    instructor: 1,
    level: Level.BEGINNER,
    icon: '📮',
    durationMin: 840,
    priceIDR: 750000,
    priceUSD: 47,
    compareAtIDR: 1500000,
    rating: 4.8,
    reviewCount: 1810,
    studentCount: 6110,
    isBestseller: true,
    isFeatured: true,
    description:
      'Dari request pertama sampai pipeline otomatis: collections, environments, scripting, Newman CLI, dan monitors.',
    outcomes: ['Collection terstruktur', 'Request chaining', 'Assertion JavaScript', 'Newman + CI'],
    prerequisites: ['Tidak ada'],
    targetAudience: ['Semua level QA', 'Product manager teknis'],
  },
  {
    slug: 'jmeter-performance',
    title: 'Performance Testing using JMeter',
    subtitle: 'Load, stress, dan spike testing',
    category: 'performance-testing',
    instructor: 1,
    level: Level.INTERMEDIATE,
    icon: '⚡',
    durationMin: 1080,
    priceIDR: 1100000,
    priceUSD: 69,
    compareAtIDR: 2100000,
    rating: 4.7,
    reviewCount: 480,
    studentCount: 1980,
    description:
      'Load, stress, dan spike testing dengan JMeter: thread group, korelasi, distributed testing, dan dashboard Grafana.',
    outcomes: ['Model beban realistis', 'Korelasi', 'Distributed load', 'Analisis bottleneck'],
    prerequisites: ['Dasar HTTP'],
    targetAudience: ['QA Engineer', 'SRE'],
  },
  {
    slug: 'k6-performance',
    title: 'Performance Testing using k6',
    subtitle: 'Load testing yang developer-friendly',
    category: 'performance-testing',
    instructor: 2,
    level: Level.INTERMEDIATE,
    icon: '📈',
    durationMin: 900,
    priceIDR: 1050000,
    priceUSD: 66,
    compareAtIDR: 1900000,
    rating: 4.8,
    reviewCount: 350,
    studentCount: 1420,
    description:
      'Load testing yang developer-centric dengan Grafana k6: scripting JavaScript, thresholds sebagai SLO, scenario executor, dan k6 browser.',
    outcomes: ['Scripting k6', 'Scenario & executor', 'Thresholds sebagai SLO', 'k6 browser'],
    prerequisites: ['Dasar JavaScript'],
    targetAudience: ['QA Engineer', 'Backend developer', 'SRE'],
  },
  {
    slug: 'ai-for-testing',
    title: 'AI for Software Testing',
    subtitle: 'LLM untuk test generation & self-healing automation',
    category: 'ai-for-qa',
    instructor: 3,
    level: Level.ADVANCED,
    icon: '🧠',
    durationMin: 1320,
    priceIDR: 1450000,
    priceUSD: 92,
    compareAtIDR: 2900000,
    rating: 4.9,
    reviewCount: 740,
    studentCount: 2890,
    isBestseller: true,
    isFeatured: true,
    description:
      'Manfaatkan LLM untuk QA: AI test generation, self-healing locator, visual AI, copilot, dan membangun AI QA agent sendiri.',
    outcomes: [
      'Prompt engineering untuk test',
      'Test generation dengan LLM',
      'Self-healing automation',
      'Capstone: AI QA agent',
    ],
    prerequisites: ['Pengalaman automation', 'Dasar Python'],
    targetAudience: ['Senior QA', 'SDET'],
  },
  {
    slug: 'git-cicd-qa',
    title: 'Git & CI/CD for QA Engineers',
    subtitle: 'Version control dan pipeline untuk tester',
    category: 'devops',
    instructor: 2,
    level: Level.BEGINNER,
    icon: '🔧',
    durationMin: 720,
    priceIDR: 650000,
    priceUSD: 41,
    compareAtIDR: 1300000,
    rating: 4.8,
    reviewCount: 920,
    studentCount: 3540,
    description:
      'Version control dan pipeline untuk tester: Git workflow, GitHub Actions, environment testing berbasis Docker, dan quality gates.',
    outcomes: ['Git branching', 'Pipeline test', 'Suite ter-dockerize', 'Quality gates'],
    prerequisites: ['Tidak ada'],
    targetAudience: ['QA Engineer', 'Manual tester'],
  },
  {
    slug: 'appium-mobile',
    title: 'Mobile Testing with Appium',
    subtitle: 'Automasi Android & iOS dengan Appium 2',
    category: 'mobile-testing',
    instructor: 0,
    level: Level.INTERMEDIATE,
    icon: '📱',
    durationMin: 1560,
    priceIDR: 1250000,
    priceUSD: 79,
    compareAtIDR: 2400000,
    rating: 4.6,
    reviewCount: 410,
    studentCount: 1760,
    description:
      'Automasi Android & iOS dengan Appium 2: inspector, gesture, aplikasi hybrid, device cloud, dan eksekusi paralel.',
    outcomes: ['Setup Appium 2', 'Locator mobile', 'Gesture & deep link', 'Device farm'],
    prerequisites: ['Dasar Java atau JavaScript'],
    targetAudience: ['Mobile QA'],
  },
  {
    slug: 'qa-leadership',
    title: 'Test Strategy & QA Leadership',
    subtitle: 'Untuk QA senior yang naik ke level kepemimpinan',
    category: 'manual-testing',
    instructor: 1,
    level: Level.ADVANCED,
    icon: '🎯',
    durationMin: 960,
    priceIDR: 1550000,
    priceUSD: 98,
    compareAtIDR: 3000000,
    rating: 4.9,
    reviewCount: 380,
    studentCount: 1340,
    description:
      'Untuk QA senior: menyusun test strategy, risk-based testing, metrik QA, membangun tim, dan komunikasi dengan stakeholder.',
    outcomes: ['Test strategy skala perusahaan', 'Prioritas berbasis risiko', 'Metrik QA', 'Membangun tim'],
    prerequisites: ['Pengalaman QA 3+ tahun'],
    targetAudience: ['QA Lead', 'Engineering Manager'],
  },
  {
    slug: 'istqb-foundation',
    title: 'ISTQB Foundation Preparation',
    subtitle: 'Silabus CTFL v4.0 + 600 soal latihan',
    category: 'manual-testing',
    instructor: 1,
    level: Level.BEGINNER,
    icon: '📜',
    durationMin: 1200,
    priceIDR: 850000,
    priceUSD: 54,
    compareAtIDR: 1700000,
    rating: 4.8,
    reviewCount: 2100,
    studentCount: 7250,
    isBestseller: true,
    description:
      'Silabus CTFL v4.0 lengkap dengan 600+ soal latihan, simulasi ujian, dan strategi lulus pada percobaan pertama.',
    outcomes: ['6 bab silabus', 'Teknik pengujian', '600+ soal', '3 simulasi ujian'],
    prerequisites: ['Tidak ada'],
    targetAudience: ['Pemula QA', 'Fresh graduate'],
  },
];

const LEARNING_PATHS = [
  {
    slug: 'qa-automation-engineer',
    title: 'QA Automation Engineer',
    description: 'Dari manual testing sampai menguasai automation secara utuh',
    icon: '⚙️',
    months: 6,
    courses: ['istqb-foundation', 'git-cicd-qa', 'selenium-java', 'playwright-zero-to-expert'],
  },
  {
    slug: 'api-testing-specialist',
    title: 'API Testing Specialist',
    description: 'Jadi ahli kualitas backend yang dibutuhkan setiap tim',
    icon: '🔗',
    months: 4,
    courses: ['postman-api', 'restassured-api', 'k6-performance', 'git-cicd-qa'],
  },
  {
    slug: 'ai-powered-qa-engineer',
    title: 'AI-Powered QA Engineer',
    description: 'Amankan karier Anda dengan keahlian AI testing',
    icon: '🧠',
    months: 5,
    courses: ['playwright-zero-to-expert', 'ai-for-testing', 'k6-performance', 'qa-leadership'],
  },
];

async function main(): Promise<void> {
  console.log('🌱 Menyemai database TestCraft LMS…');

  /* ------------------------------ Users -------------------------------- */
  const adminHash = await argon2.hash(ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'SUPER_ADMIN', passwordHash: adminHash },
    create: {
      email: ADMIN_EMAIL,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash: adminHash,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  const studentHash = await argon2.hash('Student#123');
  const student = await prisma.user.upsert({
    where: { email: 'student@testcraft.id' },
    update: {},
    create: {
      email: 'student@testcraft.id',
      name: 'Rizky Ananda',
      role: 'STUDENT',
      passwordHash: studentHash,
      emailVerifiedAt: new Date(),
      xp: 1250,
      level: 4,
      streakDays: 12,
    },
  });
  console.log(`  ✓ Student demo: ${student.email}`);

  /* --------------------------- Instructors ----------------------------- */
  const instructorHash = await argon2.hash('Instructor#123');
  const instructorProfiles = [];
  for (const i of INSTRUCTORS) {
    const user = await prisma.user.upsert({
      where: { email: i.email },
      update: {},
      create: {
        email: i.email,
        name: i.name,
        role: 'INSTRUCTOR',
        passwordHash: instructorHash,
        emailVerifiedAt: new Date(),
      },
    });
    const profile = await prisma.instructorProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: i.headline,
        bio: i.bio,
        expYears: i.expYears,
        rating: i.rating,
        totalStudents: i.totalStudents,
      },
      create: {
        userId: user.id,
        headline: i.headline,
        bio: i.bio,
        expYears: i.expYears,
        rating: i.rating,
        totalStudents: i.totalStudents,
      },
    });
    instructorProfiles.push(profile);
  }
  console.log(`  ✓ ${instructorProfiles.length} instruktur`);

  /* ---------------------------- Categories ----------------------------- */
  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    categoryBySlug.set(c.slug, cat.id);
  }
  console.log(`  ✓ ${CATEGORIES.length} kategori`);

  /* ------------------------------ Courses ------------------------------ */
  const courseBySlug = new Map<string, string>();
  for (const c of COURSES) {
    const { category, instructor, ...data } = c;
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        ...data,
        categoryId: categoryBySlug.get(category)!,
        instructorId: instructorProfiles[instructor].id,
        status: CourseStatus.PUBLISHED,
      },
      create: {
        ...data,
        categoryId: categoryBySlug.get(category)!,
        instructorId: instructorProfiles[instructor].id,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    courseBySlug.set(c.slug, course.id);

    // Kurikulum contoh: 3 modul × 3 lesson, lesson pertama bisa di-preview.
    const existingModules = await prisma.module.count({ where: { courseId: course.id } });
    if (existingModules === 0) {
      for (let m = 1; m <= 3; m++) {
        const mod = await prisma.module.create({
          data: {
            courseId: course.id,
            title: `Modul ${m}: ${['Fondasi', 'Implementasi', 'Proyek & CI/CD'][m - 1]}`,
            order: m,
          },
        });
        for (let l = 1; l <= 3; l++) {
          await prisma.lesson.create({
            data: {
              moduleId: mod.id,
              title: `${c.title.split(' ').slice(0, 2).join(' ')} — Bagian ${m}.${l}`,
              order: l,
              type: 'VIDEO',
              durationSec: 600 + l * 120,
              isPreview: m === 1 && l === 1,
            },
          });
        }
        await prisma.quiz.create({
          data: {
            moduleId: mod.id,
            title: `Kuis Modul ${m}`,
            passingPct: 80,
            questions: {
              create: [
                {
                  type: 'MCQ',
                  prompt: 'Apa tujuan utama automation testing?',
                  options: [
                    { id: 'a', text: 'Mengganti seluruh tester manual' },
                    { id: 'b', text: 'Mempercepat umpan balik regresi' },
                    { id: 'c', text: 'Menambah jumlah bug' },
                  ],
                  answer: ['b'],
                  explain:
                    'Automation dipakai untuk mempercepat umpan balik pada pengujian regresi, bukan menggantikan exploratory testing.',
                  order: 1,
                },
                {
                  type: 'TRUE_FALSE',
                  prompt: 'Page Object Model membuat test lebih mudah dirawat.',
                  options: [
                    { id: 'true', text: 'Benar' },
                    { id: 'false', text: 'Salah' },
                  ],
                  answer: ['true'],
                  order: 2,
                },
              ],
            },
          },
        });
      }
      const lessonCount = await prisma.lesson.count({ where: { module: { courseId: course.id } } });
      await prisma.course.update({ where: { id: course.id }, data: { lessonCount } });
    }
  }
  console.log(`  ✓ ${COURSES.length} kursus + kurikulum`);

  /* --------------------------- Learning paths -------------------------- */
  for (const [i, p] of LEARNING_PATHS.entries()) {
    const path = await prisma.learningPath.upsert({
      where: { slug: p.slug },
      update: { title: p.title, description: p.description, icon: p.icon, months: p.months, order: i },
      create: { slug: p.slug, title: p.title, description: p.description, icon: p.icon, months: p.months, order: i },
    });
    await prisma.learningPathStep.deleteMany({ where: { pathId: path.id } });
    await prisma.learningPathStep.createMany({
      data: p.courses.map((slug, order) => ({
        pathId: path.id,
        courseId: courseBySlug.get(slug)!,
        order,
      })),
    });
  }
  console.log(`  ✓ ${LEARNING_PATHS.length} learning path`);

  /* -------------------------------- CMS -------------------------------- */
  await prisma.siteSetting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      data: {
        brandName: 'TestCraft Indonesia',
        tagline: 'Learn. Build. Automate.',
        primaryColor: '#0E9C9C',
        contactEmail: 'testcraftindonesia@gmail.com',
        whatsapp: '6282395568743',
        address: 'Jakarta, Indonesia',
        socials: { linkedin: 'https://www.linkedin.com/company/testcraft-indonesia' },
        defaultCurrency: 'IDR',
        usdRate: 16000,
        taxPercent: 11,
        maintenanceMode: false,
      },
    },
  });

  const homePage = await prisma.page.upsert({
    where: { slug: 'home' },
    update: {},
    create: {
      slug: 'home',
      title: 'Beranda',
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      seoTitle: 'TestCraft Indonesia — Kursus Software Testing & QA Automation',
      seoDescription:
        'Pelatihan software testing, QA automation, API testing, performance testing, dan AI for QA oleh praktisi industri.',
    },
  });
  const blockCount = await prisma.contentBlock.count({ where: { pageId: homePage.id } });
  if (blockCount === 0) {
    await prisma.contentBlock.createMany({
      data: [
        {
          pageId: homePage.id,
          type: BlockType.HERO,
          order: 0,
          data: {
            heading: 'Kuasai Software Testing dari Nol sampai Mahir',
            subheading:
              'Kursus QA automation, API testing, performance testing, dan AI for QA — diajarkan praktisi dari Gojek, Tokopedia, dan Traveloka.',
            ctaLabel: 'Lihat Katalog',
            ctaUrl: '/catalog',
            secondaryCtaLabel: 'Konsultasi Gratis',
            secondaryCtaUrl: 'https://wa.me/6282395568743',
          },
        },
        {
          pageId: homePage.id,
          type: BlockType.STATS,
          order: 1,
          data: {
            items: [
              { value: '28.400+', label: 'Peserta Aktif' },
              { value: '48', label: 'Kelas Expert' },
              { value: '24', label: 'Instruktur Industri' },
              { value: '12.400+', label: 'Sertifikat Terbit' },
            ],
          },
        },
        {
          pageId: homePage.id,
          type: BlockType.COURSE_GRID,
          order: 2,
          data: { heading: 'Kelas Unggulan', filter: 'featured', limit: 6 },
        },
        {
          pageId: homePage.id,
          type: BlockType.LEARNING_PATHS,
          order: 3,
          data: { heading: 'Jalur Belajar Terstruktur' },
        },
        {
          pageId: homePage.id,
          type: BlockType.TESTIMONIALS,
          order: 4,
          data: { heading: 'Apa Kata Alumni' },
        },
        {
          pageId: homePage.id,
          type: BlockType.FAQ,
          order: 5,
          data: { heading: 'Pertanyaan yang Sering Diajukan' },
        },
        {
          pageId: homePage.id,
          type: BlockType.CTA,
          order: 6,
          data: {
            heading: 'Siap memulai karier QA Anda?',
            body: 'Konsultasi gratis dengan tim kami untuk memilih jalur belajar yang tepat.',
            ctaLabel: 'Chat via WhatsApp',
            ctaUrl: 'https://wa.me/6282395568743',
          },
        },
      ],
    });
  }

  await prisma.banner.upsert({
    where: { key: 'top-promo' },
    update: {},
    create: {
      key: 'top-promo',
      title: 'Promo Merdeka — diskon 50% semua kelas automation',
      body: 'Pakai kode MERDEKA50 saat checkout. Berlaku sampai 31 Agustus.',
      ctaLabel: 'Ambil Promo',
      ctaUrl: '/catalog',
      variant: 'promo',
      active: true,
    },
  });

  const PLANS = [
    {
      slug: 'single-course',
      name: 'Per Kelas',
      description: 'Bayar sesuai kelas yang Anda ambil',
      priceIDR: 750000,
      priceUSD: 47,
      features: ['Akses selamanya 1 kelas', 'Sertifikat kelulusan', 'Forum diskusi'],
      order: 0,
    },
    {
      slug: 'pro-bootcamp',
      name: 'Pro Bootcamp',
      description: 'Akses semua kelas + mentoring',
      priceIDR: 4990000,
      priceUSD: 312,
      compareAtIDR: 7990000,
      features: [
        'Akses semua kelas selama 12 bulan',
        'Mentoring 1-on-1 bulanan',
        'Review CV & simulasi interview',
        'Sertifikat semua kelas',
      ],
      highlighted: true,
      order: 1,
    },
    {
      slug: 'corporate',
      name: 'Corporate',
      description: 'Pelatihan tim dengan laporan progres',
      priceIDR: 0,
      priceUSD: 0,
      features: ['Kuota kursi fleksibel', 'Dashboard progres tim', 'Kurikulum custom', 'Invoice & PO'],
      order: 2,
    },
  ];
  for (const p of PLANS) {
    await prisma.pricingPlan.upsert({ where: { slug: p.slug }, update: p, create: p });
  }

  const existingCoupon = await prisma.coupon.findUnique({ where: { code: 'MERDEKA50' } });
  if (!existingCoupon) {
    await prisma.coupon.create({
      data: {
        code: 'MERDEKA50',
        description: 'Promo kemerdekaan — 50% semua kelas',
        discountType: 'PERCENT',
        value: 50,
        maxUses: 500,
        active: true,
        expiresAt: new Date(new Date().getFullYear(), 7, 31),
      },
    });
  }

  const TESTIMONIALS = [
    {
      name: 'Dewi Lestari',
      role: 'QA Engineer',
      company: 'Bukalapak',
      quote:
        'Tiga bulan setelah menyelesaikan jalur QA Automation, saya pindah dari manual tester ke SDET dengan kenaikan gaji 70%.',
      rating: 5,
      featured: true,
      order: 0,
    },
    {
      name: 'Fajar Nugroho',
      role: 'Test Lead',
      company: 'Bank Mandiri',
      quote:
        'Materi performance testing-nya langsung saya pakai untuk load test sistem core banking. Sangat aplikatif.',
      rating: 5,
      featured: true,
      order: 1,
    },
    {
      name: 'Putri Handayani',
      role: 'SDET',
      company: 'Shopee',
      quote:
        'Kelas AI for Software Testing membuka cara pandang baru. Self-healing locator menghemat waktu maintenance kami separuhnya.',
      rating: 5,
      featured: true,
      order: 2,
    },
  ];
  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({ data: TESTIMONIALS });
  }

  const FAQS = [
    {
      question: 'Apakah sertifikatnya diakui industri?',
      answer:
        'Sertifikat TestCraft mencantumkan nomor unik dan QR verifikasi yang bisa dicek publik di halaman /verify. Banyak alumni memakainya di LinkedIn dan lamaran kerja.',
      group: 'sertifikat',
      order: 0,
    },
    {
      question: 'Berapa lama akses kelas berlaku?',
      answer: 'Pembelian per kelas memberi akses selamanya, termasuk semua pembaruan materi.',
      group: 'umum',
      order: 1,
    },
    {
      question: 'Apakah ada metode pembayaran cicilan?',
      answer:
        'Ya. Kami mendukung Midtrans dan Xendit dengan opsi kartu kredit cicilan 0%, virtual account, dan e-wallet.',
      group: 'pembayaran',
      order: 2,
    },
    {
      question: 'Bisakah perusahaan mendaftarkan banyak karyawan?',
      answer:
        'Bisa. Paket Corporate menyediakan kuota kursi, dashboard progres tim, dan penagihan lewat invoice/PO.',
      group: 'corporate',
      order: 3,
    },
  ];
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({ data: FAQS });
  }

  const NAV = [
    { menu: 'header', label: 'Katalog', url: '/catalog', order: 0 },
    { menu: 'header', label: 'Jalur Belajar', url: '/paths', order: 1 },
    { menu: 'header', label: 'Corporate', url: '/corporate', order: 2 },
    { menu: 'header', label: 'Verifikasi Sertifikat', url: '/verify', order: 3 },
    { menu: 'footer-product', label: 'Semua Kelas', url: '/catalog', order: 0 },
    { menu: 'footer-product', label: 'Harga', url: '/pricing', order: 1 },
    { menu: 'footer-company', label: 'Tentang Kami', url: '/about', order: 0 },
    { menu: 'footer-company', label: 'Hubungi Kami', url: '/contact', order: 1 },
  ];
  if ((await prisma.navigationItem.count()) === 0) {
    await prisma.navigationItem.createMany({ data: NAV });
  }
  console.log('  ✓ Konten CMS (settings, page, banner, plan, kupon, testimoni, FAQ, menu)');

  /* --------------------------- Data demo student ------------------------ */
  const demoCourseId = courseBySlug.get('postman-api')!;
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: demoCourseId } },
    update: {},
    create: {
      userId: student.id,
      courseId: demoCourseId,
      source: 'FREE',
      progressPct: 33,
      completedLessons: 3,
      lastAccessedAt: new Date(),
    },
  });

  console.log('\n✅ Seed selesai.');
  console.log(`   Admin    : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('   Student  : student@testcraft.id / Student#123');
  console.log('   Instruktur: budi.santoso@testcraft.id / Instructor#123');
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
