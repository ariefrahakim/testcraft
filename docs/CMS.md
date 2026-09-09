# CMS — Content Management Guide

This document explains how to manage the content on the TestCraft public website: pages, banners, testimonials, FAQ, site settings, and more.

---

## What is the CMS?

The CMS (Content Management System) is not a separate application — it is built directly into the LMS admin panel. It allows admins to edit public website content without touching any code.

| Part | Where | Purpose |
|------|-------|---------|
| Admin UI | `http://localhost:3000/admin` | Visual interface for managing content |
| API endpoints | `/api/v1/cms/*` | Write operations (create, update, delete) |
| Public endpoints | `/api/v1/content/*` | Read-only, returns published content |

Because everything uses the same database, changes made in the admin panel appear **immediately** on the public site — no cache to clear, no sync to wait for.

**Security:** All `/cms/*` endpoints require Admin or Super Admin role. The public `/content/*` endpoints are read-only and only return published/active content.

---

## What Can Be Managed

### Marketing Content

| Menu | Location | What It Controls |
|------|----------|-----------------|
| Pages & Blocks | `/admin/pages` | Public website pages (homepage, pricing, etc.) |
| Banners | `/admin/banners` | Promotional announcements at the top of the site |
| Testimonials | `/admin/testimonials` | Student testimonials on the homepage |
| FAQ | `/admin/faqs` | Frequently asked questions |

### Academic Content

| Menu | Location | What It Controls |
|------|----------|-----------------|
| Courses | `/admin/courses` | Course catalog, status (draft/published), pricing |
| Categories | `/admin/categories` | Course category filters |
| Assignments | `/admin/assignments` | Assignment instructions, points, deadlines, rubrics |

### Commercial

| Menu | Location | What It Controls |
|------|----------|-----------------|
| Course Pricing | `/admin/courses` → Edit | IDR/USD prices, original price (for strikethrough), free flag |
| Pricing Plans | `/admin/pricing-plans` | Bundles and subscriptions for the pricing page |
| Coupons | `/admin/coupons` | Discount codes with quotas, expiry dates, minimum spend |
| Transactions | `/admin/payments` | Payment monitoring |

### Users and System

| Menu | Location | What It Controls |
|------|----------|-----------------|
| Users | `/admin/users` | Change user roles and active status |
| Leads | `/admin/leads` | Leads from the marketing site form |
| Site Settings | `/admin/settings` | Company info, social links, tax rate (PPN), currency exchange rate, maintenance mode |

---

## Content Blocks

Public pages are built from stacked content blocks. Each block has a `type` and a `data` payload that varies by type.

### Available Block Types

#### `HERO`
The main banner at the top of the page.

```json
{
  "heading": "Kuasai QA Engineering Bersama Kami",
  "subheading": "Kursus online berkualitas tinggi untuk Software Tester dan QA Engineer",
  "ctaLabel": "Lihat Kursus",
  "ctaUrl": "/catalog",
  "secondaryCtaLabel": "Daftar Gratis",
  "secondaryCtaUrl": "/register"
}
```

#### `STATS`
A row of statistics (e.g., number of alumni, courses, instructors).

```json
{
  "items": [
    { "value": "5.000+", "label": "Alumni" },
    { "value": "50+", "label": "Kursus" },
    { "value": "4.9", "label": "Rating Rata-rata" },
    { "value": "10+", "label": "Instruktur Berpengalaman" }
  ]
}
```

#### `COURSE_GRID`
Displays a grid of course cards pulled from the database.

```json
{
  "heading": "Kursus Unggulan",
  "filter": "featured",
  "limit": 6
}
```

`filter` options:
- `featured` — courses marked as featured
- `popular` — courses with the most enrollments

#### `TESTIMONIALS`
Displays published testimonials from the Testimonials table.

```json
{
  "heading": "Apa Kata Alumni Kami"
}
```

#### `FAQ`
Displays published FAQ entries from the FAQ table.

```json
{
  "heading": "Pertanyaan yang Sering Diajukan"
}
```

#### `PRICING_TABLE`
Displays pricing plans from the PricingPlan table.

```json
{
  "heading": "Pilihan Paket Belajar"
}
```

#### `CTA`
A call-to-action section with a headline, body text, and a button.

```json
{
  "heading": "Siap Memulai Karir QA Anda?",
  "body": "Bergabunglah dengan ribuan alumni yang telah berhasil.",
  "ctaLabel": "Daftar Sekarang",
  "ctaUrl": "/register"
}
```

#### `RICH_TEXT`
Freeform HTML content (only admins can edit this — be careful with HTML).

```json
{
  "html": "<h2>Judul</h2><p>Paragraf pertama...</p>"
}
```

#### `LEARNING_PATHS`
Displays all published learning paths.

```json
{
  "heading": "Jalur Belajar Kami"
}
```

---

## How to Add a New Page (Step-by-Step)

### Via the Admin UI

1. Log in to http://localhost:3000/admin
2. Navigate to **Pages** in the sidebar
3. Click **Buat Halaman** (Create Page)
4. Fill in:
   - **Title**: The page name (e.g., "About Us")
   - **Slug**: The URL path (e.g., `about` → URL will be `/about`)
5. Click Save
6. Click on the new page to open the block editor
7. Click **Tambah Blok** (Add Block) and choose a block type
8. Fill in the block's data
9. Drag blocks to reorder them
10. When ready, click **Terbitkan** (Publish)

### Via the API (curl examples)

**Step 1 — Get an admin token:**

```bash
TOKEN=$(curl -s -X POST http://localhost:4001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@testcraft.id","password":"Admin#12345"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['tokens']['accessToken'])")
```

**Step 2 — Create the page:**

```bash
curl -X POST http://localhost:4001/api/v1/cms/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "About Us",
    "slug": "about"
  }'
```

Note the `id` in the response.

**Step 3 — Add blocks to the page:**

```bash
# Replace PAGE_ID with the id from step 2
curl -X PATCH http://localhost:4001/api/v1/cms/pages/PAGE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [
      {
        "type": "HERO",
        "position": 1,
        "data": {
          "heading": "Tentang TestCraft Indonesia",
          "subheading": "Kami adalah komunitas QA engineer terbesar di Indonesia",
          "ctaLabel": "Lihat Kursus",
          "ctaUrl": "/catalog"
        }
      },
      {
        "type": "RICH_TEXT",
        "position": 2,
        "data": {
          "html": "<p>TestCraft Indonesia berdiri sejak 2021...</p>"
        }
      }
    ]
  }'
```

**Step 4 — Publish the page:**

```bash
curl -X POST http://localhost:4001/api/v1/cms/pages/PAGE_ID/publish \
  -H "Authorization: Bearer $TOKEN"
```

The page is now live at `http://localhost:3000/about`.

---

## How to Update the Homepage

The homepage is a CMS page with slug `home`.

1. Log in to `/admin`
2. Go to **Pages**
3. Click on the **home** page
4. Edit any block's content
5. Reorder blocks by dragging
6. Hide a block temporarily using the visibility toggle (eye icon)
7. Click **Simpan** (Save) — changes appear immediately

Alternatively, via API:

```bash
# Get the home page details
curl http://localhost:4001/api/v1/content/pages/home
```

---

## Banner Management

Banners appear at the top of the site (above the navbar) to announce promotions, news, or maintenance windows.

### Create a Banner

Via admin UI: `/admin/banners` → Click **Tambah Banner**

Via API:

```bash
curl -X POST http://localhost:4001/api/v1/cms/banners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Diskon 50% untuk kursus Selenium! Gunakan kode QA50",
    "ctaLabel": "Lihat Kursus",
    "ctaUrl": "/catalog",
    "isActive": true,
    "startsAt": "2026-09-01T00:00:00Z",
    "endsAt": "2026-09-30T23:59:59Z"
  }'
```

### Deactivate a Banner

```bash
curl -X PATCH http://localhost:4001/api/v1/cms/banners/BANNER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

Only banners with `isActive: true` and within the `startsAt`/`endsAt` window are shown publicly.

---

## Site Settings

Site settings are global configuration values used across the site.

### Common Settings

| Key | Example Value | What It Controls |
|-----|---------------|-----------------|
| `companyName` | `TestCraft Indonesia` | Company name used in emails and footers |
| `companyEmail` | `info@testcraft.id` | Public contact email |
| `companyWhatsApp` | `+628239556874` | WhatsApp number for CTA buttons |
| `ppnPct` | `11` | Indonesian VAT percentage (PPN) applied to course prices |
| `usdToIdr` | `16000` | USD to IDR exchange rate for price conversion |
| `maintenanceMode` | `false` | Set to `true` to show a maintenance page |
| `socialInstagram` | `https://instagram.com/testcraft_id` | Social media links |
| `socialLinkedIn` | `https://linkedin.com/company/testcraft-id` | Social media links |

### Read Current Settings

```bash
curl http://localhost:4001/api/v1/content/settings
```

### Update a Setting

```bash
curl -X PATCH http://localhost:4001/api/v1/cms/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ppnPct": "11",
    "usdToIdr": "15800"
  }'
```

---

## Adding a New Block Type

If you need a block type that does not exist yet (e.g., a "Video Banner" block), here is the process:

1. **Add the enum value** in `apps/api/prisma/schema.prisma`:
   ```prisma
   enum BlockType {
     // ... existing types ...
     VIDEO_BANNER  ← Add here
   }
   ```

2. **Run the migration:**
   ```bash
   npm run db:migrate
   ```

3. **Add the shared enum** in `packages/shared/src/enums.ts`:
   ```typescript
   export enum BlockType {
     // ... existing types ...
     VIDEO_BANNER = 'VIDEO_BANNER',
   }
   ```

4. **Create the renderer component** in `apps/web/src/components/blocks/block-renderer.tsx`:
   ```tsx
   case 'VIDEO_BANNER':
     return <VideoBannerBlock data={block.data} />;
   ```

5. **Add the block template** in the admin page editor so it appears in the "Add Block" menu.

Blocks with unknown types are silently ignored by the renderer, so step 4 not being done yet will not break the site.

---

## Adding a New CMS Entity

The CMS admin uses a `ResourceManager` component that auto-generates CRUD tables from a schema definition. To add a new manageable entity (e.g., "Webinars"):

```tsx
// In apps/web/src/app/admin/webinars/page.tsx

const COLUMNS: ColumnSpec<Webinar>[] = [
  { key: 'title', label: 'Judul', render: (w) => w.title },
  { key: 'startsAt', label: 'Mulai', render: (w) => formatDate(w.startsAt) },
];

const FIELDS: FieldSpec[] = [
  { name: 'title', label: 'Judul', type: 'text', required: true },
  { name: 'startsAt', label: 'Tanggal mulai', type: 'date' },
  { name: 'speakers', label: 'Pembicara', type: 'list', span: 2 },
  { name: 'published', label: 'Terbitkan', type: 'boolean' },
];

export default function WebinarsPage() {
  return (
    <ResourceManager<Webinar>
      title="Webinar"
      endpoint="/cms/webinars"
      columns={COLUMNS}
      fields={FIELDS}
    />
  );
}
```

**Supported field types for the form editor:**

| Type | Renders As |
|------|-----------|
| `text` | Single-line text input |
| `textarea` | Multi-line text area |
| `number` | Number input |
| `currency` | Currency input (formats with IDR/USD) |
| `boolean` | Toggle switch |
| `select` | Dropdown with predefined options |
| `date` | Date picker |
| `list` | Multi-value list (one item per line) |

---

## CMS Security Notes

- All `/cms/*` API endpoints require `ADMIN` or `SUPER_ADMIN` role
- Public `/content/*` endpoints only return content that is published/active
- `RICH_TEXT` blocks use `dangerouslySetInnerHTML` — only admins should be able to write HTML content
- An `AuditLog` model exists in the schema to record changes, but is not yet wired up in the service layer
