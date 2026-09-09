# TestCraft Indonesia — Marketing Site

This is the public-facing marketing website for TestCraft Indonesia. It is an SEO-optimized landing page designed to attract new students and capture leads.

**Live URL:** https://testcraft.id *(production)*
**Local URL:** http://localhost:3001 *(development)*

---

## Purpose

The marketing site serves a different purpose from the LMS app:

| Marketing Site (port 3001) | LMS App (port 3000) |
|-----------------------------|---------------------|
| Public — no login needed | Requires login for most features |
| Focused on SEO and conversion | Focused on learning experience |
| Minimal JavaScript — fast load | Full React app |
| Shows services, testimonials, FAQ | Shows courses, progress, certificates |
| Submits leads to the API | Full course enrollment and payment |

---

## How to Run Locally

### Prerequisites

- Node.js 20+ installed
- (Optional) API running if you want the lead form to submit successfully

### Start the Marketing Site

```bash
# From the root of the project
npm run dev:marketing

# Or to start all apps at once (recommended):
npm run dev
```

The marketing site will be available at **http://localhost:3001**.

### First Time Setup

```bash
# Install dependencies (from root)
npm install

# Copy the environment file
cp apps/marketing/.env.example apps/marketing/.env.local

# Start the site
npm run dev:marketing
```

---

## Environment Variables

Create `apps/marketing/.env.local` (gitignored — never commit it):

```bash
cp apps/marketing/.env.example apps/marketing/.env.local
```

| Variable | Default Value | Explanation |
|----------|---------------|-------------|
| `NEXT_PUBLIC_LMS_URL` | `http://localhost:3000` | Where the "Login" and "Daftar Sekarang" buttons link to. Points to the LMS app. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3001` | The base URL of this marketing site. Used for SEO meta tags and canonical URLs. |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4001/api/v1` | The backend API URL. Used by the lead form to submit contact info. |
| `NEXT_PUBLIC_SITE_NAME` | `TestCraft Indonesia` | The site name used in page titles and meta tags. |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `Pelatihan Software Testing & QA Engineering` | The meta description used for SEO. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | *(empty)* | Google Analytics 4 Measurement ID (e.g., `G-XXXXXXXXXX`). Leave empty to disable. |

---

## Pages

| URL | Page | Description |
|-----|------|-------------|
| `/` | Homepage | Hero, services, programs, testimonials, FAQ, lead form |
| `/privacy` | Privacy Policy | Privacy policy content |
| `/terms` | Terms of Service | Terms and conditions content |

---

## Page Structure and Components

```
apps/marketing/src/
├── app/
│   ├── layout.tsx              ← Root layout (fonts, metadata)
│   ├── page.tsx                ← Homepage (assembles all sections)
│   ├── privacy/
│   │   └── page.tsx            ← Privacy policy
│   └── terms/
│       └── page.tsx            ← Terms of service
│
└── components/
    └── marketing/
        ├── navbar.tsx          ← Navigation bar with logo and CTA buttons
        ├── hero.tsx            ← Hero section (headline, subheadline, CTA)
        ├── stats-bar.tsx       ← Key statistics (students, courses, etc.)
        ├── programs-grid.tsx   ← Services/programs section
        ├── testimonials.tsx    ← Student testimonials
        ├── faq.tsx             ← Frequently asked questions
        ├── lead-form.tsx       ← Contact/registration lead capture form
        └── marketing-footer.tsx ← Footer with links and social media
```

---

## How to Update Content

Content on the marketing site is written directly in the React components. There is no database or CMS behind the marketing site — it is static content.

### Updating the Hero Section

Edit `apps/marketing/src/components/marketing/hero.tsx`:

```tsx
export function Hero() {
  return (
    <section>
      <h1>Your New Headline Here</h1>
      <p>Your new subheadline here.</p>
      <a href={process.env.NEXT_PUBLIC_LMS_URL + '/register'}>
        Daftar Sekarang
      </a>
    </section>
  );
}
```

### Updating Statistics

Edit `apps/marketing/src/components/marketing/stats-bar.tsx`:

```tsx
const STATS = [
  { value: '5.000+', label: 'Alumni' },
  { value: '50+', label: 'Kursus' },
  // Add or modify stats here
];
```

### Updating Testimonials

Edit `apps/marketing/src/components/marketing/testimonials.tsx`:

```tsx
const TESTIMONIALS = [
  {
    name: 'Budi Santoso',
    role: 'QA Engineer at Gojek',
    quote: 'TestCraft mengubah karir saya...',
    avatar: '/images/avatars/budi.jpg',
  },
  // Add more testimonials here
];
```

### Updating FAQ

Edit `apps/marketing/src/components/marketing/faq.tsx`:

```tsx
const FAQS = [
  {
    question: 'Apakah kursus ini cocok untuk pemula?',
    answer: 'Ya, kami menerima peserta dari level apapun.',
  },
  // Add more FAQ items here
];
```

### Updating Privacy Policy or Terms

Edit the respective page files:
- Privacy: `apps/marketing/src/app/privacy/page.tsx`
- Terms: `apps/marketing/src/app/terms/page.tsx`

---

## Lead Form

The lead form on the homepage captures contact information from potential students and submits it to the API.

### What the Form Collects

- Name (Nama)
- Email
- Phone number (WhatsApp)
- Area of interest (program selection)

### How It Submits

When the form is submitted, it sends a `POST` request to `{NEXT_PUBLIC_API_URL}/leads`:

```javascript
// Simplified version of what the lead form does
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Budi Santoso',
    email: 'budi@email.com',
    phone: '+628123456789',
    interest: 'QA Automation',
    source: 'landing-page',
  }),
});
```

### Viewing Submitted Leads

Leads are stored in the database and can be viewed:

1. Log in to the admin panel: http://localhost:3000/admin
2. Navigate to the "Leads" menu

Or use the API:
```bash
curl http://localhost:4001/api/v1/leads \
  -H "Authorization: Bearer <admin-token>"
```

---

## SEO

The marketing site is server-rendered by Next.js, which means search engines can read the content. Key SEO features:

- **Meta titles and descriptions**: Set in `app/layout.tsx` and individual page files
- **Open Graph tags**: For social media sharing previews
- **Structured data**: For rich search results
- **Sitemap**: Auto-generated by Next.js

To update the global SEO settings, edit `apps/marketing/src/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'TestCraft Indonesia — Pelatihan Software Testing',
  description: 'Tingkatkan kemampuan QA Anda bersama TestCraft Indonesia...',
  openGraph: {
    // Open Graph settings for social sharing
  },
};
```

---

## Building for Production

```bash
# Build the marketing site
npm run build --workspace @testcraft/marketing

# Or use Docker
docker build -f apps/marketing/Dockerfile -t testcraft-marketing:local .
docker run -p 3001:3001 testcraft-marketing:local
```
