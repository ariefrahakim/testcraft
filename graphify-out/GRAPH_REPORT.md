# Graph Report - /Users/ariefrahman/Desktop/testcraft  (2026-09-08)

## Corpus Check
- 249 files · ~128,337 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1842 nodes · 4166 edges · 104 communities (67 shown, 37 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.9)
- Token cost: 65,856 input · 0 output

## Community Hubs (Navigation)
- Admin Portal Pages
- LMS Public Pages
- Courses API Layer
- QA Test Profile
- Course Categories API
- CMS Admin API
- Admin CMS UI Panels
- NestJS Core Setup
- LMS Web Dependencies
- Marketing Site Config
- Auth Module
- Enrollment Flow
- Payment Pipeline
- Instructor Module
- Prisma Data Layer
- Notification System
- Certificate Service
- Quiz & Assessment
- User Management
- Learning Path Logic
- CI/CD Workflows
- Docker Infrastructure
- Shared Types Package
- E2E Playwright Tests
- API Security Guards
- Coupon & Discount
- Lead Capture
- Marketing Content
- Site Settings
- Health Check
- Role-Based Access
- Refresh Token System
- Search & Filters
- Course Progress Tracking
- Review & Rating
- Assignment Grading
- API Pagination
- Dashboard Analytics
- Marketing Components
- Swagger/OpenAPI Docs
- Module Group 40
- Module Group 41
- Module Group 42
- Module Group 43
- Module Group 44
- Module Group 45
- Module Group 46
- Module Group 47
- Module Group 48
- Module Group 49
- Module Group 50
- Module Group 51
- Module Group 52
- Module Group 53
- Module Group 54
- Module Group 55
- Module Group 56
- Module Group 57
- Module Group 58
- Module Group 59
- Module Group 60
- Module Group 61
- Module Group 62
- Module Group 63
- Module Group 64
- Module Group 65
- Module Group 66
- Module Group 67
- Module Group 68
- Module Group 69
- Module Group 70
- Module Group 71
- Module Group 72
- Module Group 73
- Module Group 74
- Module Group 75
- Module Group 76
- Module Group 77
- Module Group 78
- Module Group 79
- Module Group 80
- Module Group 81
- Module Group 82
- Module Group 83
- Module Group 84
- Module Group 85
- Module Group 86
- Module Group 87
- Module Group 88
- Module Group 89
- Module Group 90
- Module Group 91
- Module Group 92
- Module Group 93
- Module Group 94
- Module Group 95
- Module Group 96
- Module Group 97
- Module Group 98
- Module Group 100
- Module Group 103

## God Nodes (most connected - your core abstractions)
1. `useT()` - 85 edges
2. `useApi()` - 56 edges
3. `PrismaService` - 54 edges
4. `cn()` - 46 edges
5. `CmsService` - 43 edges
6. `CmsController` - 40 edges
7. `PaginationQueryDto` - 34 edges
8. `Card()` - 33 edges
9. `CardBody()` - 31 edges
10. `PageHeader()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `TestCraft Brand Icon (shield with teal gradient and checkmark)` --conceptually_related_to--> `TestCraft Indonesia`  [INFERRED]
  apps/web/src/app/icon.svg → .claude/app-profile.md
- `TestCraft Website Homepage Screenshot` --conceptually_related_to--> `Marketing App (apps/marketing, port 3001)`  [INFERRED]
  testcraft-website-home.png → .claude/app-profile.md
- `TestCraft Website Homepage Screenshot` --references--> `TestCraft Indonesia`  [EXTRACTED]
  testcraft-website-home.png → .claude/app-profile.md
- `TestCraft Brand Icon (shield with teal gradient and checkmark)` --conceptually_related_to--> `LMS Portal (apps/web) — Next.js 14`  [INFERRED]
  apps/web/src/app/icon.svg → apps/web/README.md
- `UI Prototype (HTML/CSS mockup — full LMS UI)` --conceptually_related_to--> `LMS Portal (apps/web) — Next.js 14`  [INFERRED]
  prototype/index.html → apps/web/README.md

## Import Cycles
- None detected.

## Communities (104 total, 37 thin omitted)

### Community 0 - "Admin Portal Pages"
Cohesion: 0.11
Nodes (47): AdminLeadsPage(), LeadRow, AdminMediaPage(), Overview, TopCourse, AdminPagesPage(), PageRow, PageBlockEditor() (+39 more)

### Community 1 - "LMS Public Pages"
Cohesion: 0.07
Nodes (50): FACTS, InstructorRow, metadata, AdminAssignmentsPage(), AssignmentForm(), AssignmentRow, LessonOption, RubricItem (+42 more)

### Community 2 - "Courses API Layer"
Cohesion: 0.08
Nodes (37): ApiParam, CoursesController, STAFF, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, Body (+29 more)

### Community 3 - "QA Test Profile"
Cohesion: 0.06
Nodes (55): Auth Flow (register → login → logout → forgot-password → session), JWT Auth (access + refresh rotation), LMS App (apps/web, port 3000), Marketing App (apps/marketing, port 3001), Midtrans Payment Gateway, NestJS API (apps/api, port 4001), Payment Flow (checkout → Midtrans webhook → enrollment → email), Playwright E2E Tests (tests/e2e) (+47 more)

### Community 4 - "Course Categories API"
Cohesion: 0.06
Nodes (33): CategoriesController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Delete, Get (+25 more)

### Community 5 - "CMS Admin API"
Cohesion: 0.09
Nodes (12): CmsController, ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, Controller, Delete, Get (+4 more)

### Community 6 - "Admin CMS UI Panels"
Cohesion: 0.07
Nodes (42): AlwaysLabel(), Banner, BannersPage(), COLUMNS, FIELDS, CategoriesPage(), Category, COLUMNS (+34 more)

### Community 7 - "NestJS Core Setup"
Cohesion: 0.10
Nodes (30): AppModule, Module, AllExceptionsFilter, buildMessage(), FieldError, firstString(), mapPrismaError(), statusName() (+22 more)

### Community 8 - "LMS Web Dependencies"
Cohesion: 0.04
Nodes (46): dependencies, class-variance-authority, clsx, lucide-react, next, react, react-dom, tailwind-merge (+38 more)

### Community 9 - "Marketing Site Config"
Cohesion: 0.05
Nodes (43): dependencies, clsx, lucide-react, next, react, react-dom, tailwind-merge, @testcraft/shared (+35 more)

### Community 10 - "Auth Module"
Cohesion: 0.08
Nodes (29): AssignmentsController, AssignmentsService, CreateAssignmentDto, RubricItemDto, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional (+21 more)

### Community 11 - "Enrollment Flow"
Cohesion: 0.11
Nodes (22): AdminUpdateUserDto, ApiPropertyOptional, IsBoolean, IsEnum, IsOptional, IsString, MinLength, UpdateProfileDto (+14 more)

### Community 12 - "Payment Pipeline"
Cohesion: 0.07
Nodes (22): JwtAuthGuard, Injectable, RolesGuard, Injectable, AppConfig, AuthModule, Module, CmsModule (+14 more)

### Community 13 - "Instructor Module"
Cohesion: 0.09
Nodes (24): CreateLeadDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString (+16 more)

### Community 14 - "Prisma Data Layer"
Cohesion: 0.10
Nodes (15): CurrentUser, EnrollmentsController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get (+7 more)

### Community 15 - "Notification System"
Cohesion: 0.11
Nodes (22): googleStrategyProvider, USER_SELECT, AuthTokensDto, LoginDto, RefreshTokenDto, RegisterDto, ApiProperty, ApiPropertyOptional (+14 more)

### Community 16 - "Certificate Service"
Cohesion: 0.10
Nodes (32): UserRow, AuthContextValue, AuthResponse, BlockType, ContentStatus, CourseStatus, Currency, DiscountType (+24 more)

### Community 17 - "Quiz & Assessment"
Cohesion: 0.14
Nodes (24): HIGHLIGHTS, Logo(), LogoMark(), CatalogFilters(), Category, FilterChip(), LEVELS, SORTS (+16 more)

### Community 18 - "User Management"
Cohesion: 0.06
Nodes (33): npm-run-all, description, devDependencies, npm-run-all, prettier, typescript, engines, node (+25 more)

### Community 19 - "Learning Path Logic"
Cohesion: 0.06
Nodes (33): devDependencies, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma, supertest, ts-jest (+25 more)

### Community 20 - "CI/CD Workflows"
Cohesion: 0.12
Nodes (25): AdminCoursesPage(), AdminOverview(), PricingPage(), CourseDetailPage(), generateMetadata(), getCourse(), StudentDashboard(), InstructorCertificatesPage() (+17 more)

### Community 21 - "Docker Infrastructure"
Cohesion: 0.07
Nodes (28): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+20 more)

### Community 22 - "Shared Types Package"
Cohesion: 0.29
Nodes (25): DEFAULT_SETTINGS, ContentBlockDto, CreateBannerDto, CreateCouponDto, CreateFaqDto, CreateNavItemDto, CreatePageDto, CreatePricingPlanDto (+17 more)

### Community 23 - "E2E Playwright Tests"
Cohesion: 0.07
Nodes (27): fixtures/*, node, pages/*, results, utils/*, compilerOptions, baseUrl, esModuleInterop (+19 more)

### Community 24 - "API Security Guards"
Cohesion: 0.14
Nodes (21): paginate(), PaginationMetaDto, PaginationQueryDto, ApiProperty, ApiPropertyOptional, IsInt, IsOptional, IsString (+13 more)

### Community 25 - "Coupon & Discount"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 26 - "Lead Capture"
Cohesion: 0.13
Nodes (17): SECTIONS, AuthCallbackPage(), SECTIONS, ProfilePage(), InstructorLayout(), PendingSummary, LoginForm(), Navbar() (+9 more)

### Community 27 - "Marketing Content"
Cohesion: 0.08
Nodes (25): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+17 more)

### Community 28 - "Site Settings"
Cohesion: 0.15
Nodes (13): AuthUser, InstructorController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get (+5 more)

### Community 29 - "Health Check"
Cohesion: 0.16
Nodes (15): ApiBody, ApiExcludeEndpoint, AuthController, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, Body (+7 more)

### Community 30 - "Role-Based Access"
Cohesion: 0.16
Nodes (12): Roles(), PaymentsController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Get (+4 more)

### Community 31 - "Refresh Token System"
Cohesion: 0.13
Nodes (13): CertificatesController, ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, Controller, Get, Param (+5 more)

### Community 32 - "Search & Filters"
Cohesion: 0.09
Nodes (23): dependencies, class-transformer, class-validator, helmet, nanoid, @nestjs/common, nestjs-pino, @nestjs/platform-express (+15 more)

### Community 33 - "Course Progress Tracking"
Cohesion: 0.13
Nodes (12): NotificationsController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get, Param, Patch (+4 more)

### Community 34 - "Review & Rating"
Cohesion: 0.12
Nodes (13): FAQ(), FAQS, Hero(), FormValues, LeadForm(), PROGRAMS, MarketingFooter(), Navbar() (+5 more)

### Community 35 - "Assignment Grading"
Cohesion: 0.13
Nodes (13): metadata, PricingPage(), CourseGridBlock(), FaqBlock(), LearningPathsBlock(), num(), PricingBlock(), TestimonialsBlock() (+5 more)

### Community 36 - "API Pagination"
Cohesion: 0.15
Nodes (10): AnalyticsController, ApiBearerAuth, ApiOperation, ApiTags, Controller, Get, AnalyticsModule, Module (+2 more)

### Community 37 - "Dashboard Analytics"
Cohesion: 0.15
Nodes (16): HomePage(), BlockRenderer(), PromoBanner(), TONES, getBanners(), getPage(), safe(), FALLBACK_FAQS (+8 more)

### Community 38 - "Marketing Components"
Cohesion: 0.10
Nodes (19): dotenv, @playwright/test, dependencies, devDependencies, dotenv, @playwright/test, @types/node, typescript (+11 more)

### Community 39 - "Swagger/OpenAPI Docs"
Cohesion: 0.15
Nodes (15): AboutPage(), ContactPage(), metadata, CorporatePage(), metadata, PrivacyPage(), SECTIONS, metadata (+7 more)

### Community 40 - "Module Group 40"
Cohesion: 0.13
Nodes (15): inter, metadata, poppins, viewport, BARE_PREFIXES, SiteChrome(), AuthProvider(), detectLocale() (+7 more)

### Community 42 - "Module Group 42"
Cohesion: 0.12
Nodes (16): scripts, build, db:deploy, db:generate, db:migrate, db:push, db:seed, db:studio (+8 more)

### Community 43 - "Module Group 43"
Cohesion: 0.17
Nodes (9): adminStatePath, AUTH_STATE_DIR, AuthFixtures, instructorStatePath, studentStatePath, test, TestUser, testUsers (+1 more)

### Community 44 - "Module Group 44"
Cohesion: 0.13
Nodes (15): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, testEnvironment, testRegex (+7 more)

### Community 45 - "Module Group 45"
Cohesion: 0.27
Nodes (8): PublicContentController, ApiOperation, ApiQuery, ApiTags, Controller, Get, Param, Query

### Community 46 - "Module Group 46"
Cohesion: 0.21
Nodes (11): GradeSubmissionDto, GradingQueueQueryDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsEnum, IsInt, IsOptional (+3 more)

### Community 47 - "Module Group 47"
Cohesion: 0.19
Nodes (11): GoogleIcon(), IconProps, InstagramIcon(), LinkedInIcon(), MastercardIcon(), VisaIcon(), WhatsAppIcon(), YouTubeIcon() (+3 more)

### Community 48 - "Module Group 48"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir, rootDir (+6 more)

### Community 49 - "Module Group 49"
Cohesion: 0.19
Nodes (8): Public(), HealthController, ApiOperation, ApiTags, Controller, Get, HealthModule, Module

### Community 50 - "Module Group 50"
Cohesion: 0.38
Nodes (13): configure_firewall(), create_env_template(), err(), install_docker(), install_gh_cli(), log(), main(), require_root() (+5 more)

### Community 51 - "Module Group 51"
Cohesion: 0.21
Nodes (5): Patch, UpdateBannerDto, UpdateCouponDto, UpdateNavItemDto, UpdatePricingPlanDto

### Community 52 - "Module Group 52"
Cohesion: 0.15
Nodes (12): devDependencies, typescript, exports, typescript, main, name, private, scripts (+4 more)

### Community 53 - "Module Group 53"
Cohesion: 0.29
Nodes (3): @playwright/test, CourseFormData, studentState

### Community 54 - "Module Group 54"
Cohesion: 0.17
Nodes (10): allCourses, apiCourse, CourseFixture, freeCourse, newCourseDraft, paidCourse, adminState, CreateCoursePayload (+2 more)

### Community 55 - "Module Group 55"
Cohesion: 0.23
Nodes (11): EnrollDto, SubmitAssignmentDto, TrackProgressDto, ApiPropertyOptional, IsArray, IsBoolean, IsInt, IsOptional (+3 more)

### Community 57 - "Module Group 57"
Cohesion: 0.35
Nodes (5): AuthService, hashToken(), Injectable, ttlToMs(), AuthResponseDto

### Community 65 - "Module Group 65"
Cohesion: 0.36
Nodes (4): AUTH_PATHS, AUTH_STATE_DIR, ensureAuthDir(), loginAndSaveState()

### Community 66 - "Module Group 66"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, plugins, $schema, sourceRoot

### Community 67 - "Module Group 67"
Cohesion: 0.29
Nodes (6): description, name, prisma, seed, private, version

### Community 68 - "Module Group 68"
Cohesion: 0.33
Nodes (6): CATEGORIES, COURSES, INSTRUCTORS, LEARNING_PATHS, main(), prisma

### Community 69 - "Module Group 69"
Cohesion: 0.48
Nodes (6): buildHref(), CatalogPage(), metadata, SearchParams, getCategories(), getCourses()

### Community 71 - "Module Group 71"
Cohesion: 0.40
Nodes (3): inter, metadata, poppins

### Community 72 - "Module Group 72"
Cohesion: 0.60
Nodes (3): err(), log(), deploy.sh script

### Community 74 - "Module Group 74"
Cohesion: 0.50
Nodes (3): ApiError, AuthTokens, PaginationMeta

## Knowledge Gaps
- **445 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `plugins` (+440 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Roles()` connect `Role-Based Access` to `Courses API Layer`, `API Pagination`, `CMS Admin API`, `Course Categories API`, `Auth Module`, `Enrollment Flow`, `Instructor Module`, `Module Group 46`, `Module Group 49`, `Shared Types Package`, `API Security Guards`, `Site Settings`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `Prisma Data Layer` to `Courses API Layer`, `Course Categories API`, `CMS Admin API`, `NestJS Core Setup`, `Auth Module`, `Enrollment Flow`, `Payment Pipeline`, `Instructor Module`, `Notification System`, `Shared Types Package`, `API Security Guards`, `Site Settings`, `Role-Based Access`, `Refresh Token System`, `Course Progress Tracking`, `API Pagination`, `Module Group 46`, `Module Group 49`, `Module Group 76`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Public()` connect `Module Group 49` to `Courses API Layer`, `Course Categories API`, `Enrollment Flow`, `Module Group 45`, `Instructor Module`, `Notification System`, `API Security Guards`, `Health Check`, `Role-Based Access`, `Refresh Token System`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _445 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Portal Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.11292114031840059 - nodes in this community are weakly interconnected._
- **Should `LMS Public Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.07355242566510173 - nodes in this community are weakly interconnected._
- **Should `Courses API Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.08299240210403273 - nodes in this community are weakly interconnected._