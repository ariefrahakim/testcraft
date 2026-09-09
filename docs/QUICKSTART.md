# Quickstart Guide for QA Engineers

This guide is written for someone who is a QA engineer — you understand testing, but you may not be familiar with backend development or DevOps. Follow these steps in order and you will have the full TestCraft platform running on your computer.

Estimated time: **20–30 minutes** (most of which is waiting for things to download).

---

## What You Are Setting Up

By the end of this guide, you will have three apps running locally on your computer:

| App | URL | What it is |
|-----|-----|-----------|
| LMS Web App | http://localhost:3000 | The student/admin portal you will test |
| Marketing Site | http://localhost:3001 | The public landing page |
| API | http://localhost:4001/api/v1 | The backend (you mostly interact with this through the other apps) |

---

## Step 1 — Install Prerequisites

You need to install four tools. If you already have them, skip ahead.

### 1a — Node.js (JavaScript Runtime)

Node.js is what runs the apps on your computer.

1. Go to https://nodejs.org/
2. Download the **LTS** version (the one that says "Recommended for most users")
3. Install it (click through the installer)
4. Verify it works by opening a terminal and typing:
   ```bash
   node --version
   # Should print something like: v20.15.0
   ```

### 1b — Docker Desktop (Container Tool)

Docker Desktop runs the database and other services in isolated containers.

1. Go to https://www.docker.com/products/docker-desktop/
2. Download Docker Desktop for your operating system (Mac or Windows)
3. Install and launch it
4. Wait for Docker Desktop to finish starting (you will see the Docker whale icon in your taskbar/menu bar)
5. Verify it works:
   ```bash
   docker --version
   # Should print something like: Docker version 27.0.3
   ```

### 1c — VS Code (Code Editor)

VS Code is a free code editor that is excellent for TypeScript/JavaScript projects.

1. Go to https://code.visualstudio.com/
2. Download and install it

**Recommended Extensions:**
- **Playwright Test for VSCode**: Lets you run and debug Playwright tests inside VS Code
- **Prisma**: Syntax highlighting for the database schema file
- **TypeScript**: Comes built-in, but make sure it is enabled

### 1d — Git (Version Control)

Git lets you download ("clone") and manage the project code.

1. Go to https://git-scm.com/
2. Download and install for your OS

Verify:
```bash
git --version
# Should print something like: git version 2.45.0
```

---

## Step 2 — Get the Code

Open a terminal (Terminal on Mac, Command Prompt or Git Bash on Windows) and run:

```bash
# Download the project code to your computer
git clone <repository-url> testcraft

# Move into the project folder
cd testcraft
```

Replace `<repository-url>` with the actual Git repository URL (ask your team lead if you don't have it).

---

## Step 3 — Install Dependencies

The project uses many third-party libraries. This command downloads all of them:

```bash
# Make sure you are in the testcraft folder
npm install
```

This might take 2–5 minutes. You will see a lot of text scroll by — this is normal.

**What is happening:** `npm install` reads the `package.json` file and downloads all the listed libraries from the internet into a `node_modules` folder.

---

## Step 4 — Start the Database

The database runs in Docker. Start it with:

```bash
npm run docker:up
```

You should see output like:
```
[+] Running 2/2
 ✔ Container testcraft-db     Started
 ✔ Container testcraft-redis  Started
```

**Wait about 10 seconds** for the database to finish starting up.

Verify the database is running:
```bash
docker ps
# You should see testcraft-db and testcraft-redis in the list
```

---

## Step 5 — Configure Environment Variables

Environment variables are configuration settings (like database passwords and API keys) that are kept outside the code.

```bash
# Copy the template environment file for the API
cp apps/api/.env.example apps/api/.env
```

For local development, **you do not need to change anything**. The default values in `.env` will work.

Also create the web app environment file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Again, defaults work for local development.

---

## Step 6 — Set Up the Database

This creates all the database tables and fills them with test data:

```bash
# Create database tables (run the schema migrations)
npm run db:migrate

# Fill the database with test users, courses, and sample data
npm run db:seed
```

You should see output ending with something like:
```
✅ Seeded: admin@testcraft.id
✅ Seeded: student@testcraft.id
✅ Seeded: instructor@testcraft.id
✅ Database seeded successfully
```

---

## Step 7 — Start All Apps

```bash
npm run dev
```

This starts all three apps simultaneously. Wait about 30–60 seconds for them all to compile and start.

You should eventually see lines like:
```
API   → http://localhost:4001/api/v1
Docs  → http://localhost:4001/docs
✓ Ready - started server on http://localhost:3000
✓ Ready - started server on http://localhost:3001
```

---

## Step 8 — Verify Everything Is Working

Open your browser and check each of these:

### Checklist

- [ ] **LMS App**: Open http://localhost:3000 — should see the TestCraft homepage
- [ ] **Marketing Site**: Open http://localhost:3001 — should see the marketing landing page
- [ ] **API Health**: Open http://localhost:4001/api/v1/health — should show `{"status":"ok"}`
- [ ] **API Docs**: Open http://localhost:4001/docs — should see the Swagger UI
- [ ] **Login**: Go to http://localhost:3000/login and log in with `admin@testcraft.id` / `Admin#12345`
- [ ] **Admin Panel**: After login, you should be redirected to http://localhost:3000/admin
- [ ] **Student Login**: Log out, log in as `student@testcraft.id` / `Student#12345`
- [ ] **Student Dashboard**: Should see http://localhost:3000/dashboard
- [ ] **Database Viewer**: Run `npm run db:studio` (in a new terminal) and open http://localhost:5555

If all items are checked, you are ready to go!

---

## Step 9 — Run Your First Test

Now let's run the automated E2E tests to make sure everything works:

```bash
# Navigate to the test folder
cd tests/e2e

# Install test dependencies (first time only)
npm install

# Install the Playwright browser (first time only)
npm run install:browsers

# Copy the test environment file
cp .env.example .env.test
```

Make sure the apps are still running in another terminal, then:

```bash
# Run all E2E tests
npm test
```

After the tests finish, view the results:

```bash
npm run test:report
```

This opens an HTML report in your browser showing which tests passed and which failed.

---

## How to Read Test Results

The HTML test report shows:

### Summary View

- **Green** = Test passed (the feature works as expected)
- **Red** = Test failed (something is broken, or the test has a bug)
- **Yellow** = Test was skipped

### When a Test Fails

Click on the failed test to see:
1. **Error message** — what went wrong
2. **Steps** — which action caused the failure
3. **Screenshot** — what the browser looked like when it failed
4. **Video** — a recording of the test run (on CI retry)

### Common Reasons Tests Fail

| Reason | What to Do |
|--------|-----------|
| App is not running | Make sure `npm run dev` is running in another terminal |
| Database not seeded | Run `npm run db:seed` from the root |
| Wrong environment variables | Check that `.env.test` has the right values |
| Flaky network timing | Run the test again — intermittent failures sometimes happen |
| Actual bug found | This is what tests are for! Report it as a defect |

---

## Common Issues and Solutions

### "npm install" fails

**Symptom:** Error messages during `npm install`

**Try this:**
```bash
# Delete the installed packages and try again
rm -rf node_modules
npm install
```

If that doesn't work, check your Node.js version:
```bash
node --version  # Must be 20.0.0 or higher
```

### "Cannot connect to database"

**Symptom:**
```
Error: Can't reach database server at localhost:5433
```

**Fix:** The database container is not running.
```bash
npm run docker:up
# Wait 10 seconds and try again
```

If Docker is not running, open Docker Desktop first.

### Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE :::3000
```

**Fix:** Something else is already using that port. Find and close it, or restart your computer.

### "Module not found" Errors

**Symptom:**
```
Cannot find module '@testcraft/shared'
```

**Fix:**
```bash
npm install  # Re-run install
npm run db:generate  # Regenerate Prisma client
```

### Tests Time Out

**Symptom:** Tests hang or show timeout errors

**Fix:** Make sure all three apps are running. Open these in your browser:
- http://localhost:3000 (must show LMS homepage)
- http://localhost:3001 (must show marketing site)
- http://localhost:4001/api/v1/health (must show `{"status":"ok"}`)

### Login Does Not Work

**Symptom:** Login page shows error even with correct credentials

**Fix:** The database might not be seeded.
```bash
npm run db:seed
```

Then try logging in again with `admin@testcraft.id` / `Admin#12345`.

### Docker Containers Keep Stopping

**Symptom:** `docker ps` shows no running containers

**Fix:**
```bash
# Start containers again
npm run docker:up

# Check logs if they keep stopping
docker logs testcraft-db
```

---

## Useful Commands Reference

### Day-to-Day Commands

```bash
# Start everything (from root folder)
npm run dev

# Stop everything (Ctrl+C in the terminal running npm run dev)

# Start only the database (and keep it in background)
npm run docker:up

# Stop the database containers
npm run docker:down
```

### Database Commands

```bash
# Open the visual database browser
npm run db:studio  # Then open http://localhost:5555

# Reseed test data (does not delete existing data — uses upsert)
npm run db:seed

# Completely reset and reseed the database
cd apps/api && npx prisma migrate reset && cd ../.. && npm run db:seed
```

### Test Commands (from tests/e2e/ folder)

```bash
# Run all tests
npm test

# Run with visible browser
npm run test:headed

# Open interactive test UI (best for development)
npm run test:ui

# View the last test report
npm run test:report

# Run a specific test file
npx playwright test specs/auth/login.spec.ts

# Run tests matching a keyword
npx playwright test --grep "login"
```

---

## What Each App Does (Plain English)

### API (`apps/api/`) — The Brain

The API is a program that runs in the background and responds to requests. When you click "Enroll" on a course, the LMS app sends a request to the API. The API checks if you are logged in, checks if you have paid, records the enrollment in the database, and sends back a confirmation.

You do not interact with the API directly most of the time, but it is helpful to know it exists and that you can view its documentation at http://localhost:4001/docs.

### LMS App (`apps/web/`) — The Main Interface

This is the main app that students, instructors, and admins use. It is a website that runs in your browser. When it needs data (like the list of courses), it asks the API for it.

### Marketing Site (`apps/marketing/`) — The Landing Page

This is a separate, simpler website focused on attracting new students. It has fewer features and no login. The "Sign Up" button links to the LMS app's registration page.

---

## Next Steps

Now that your environment is set up, here is what to explore:

1. **Read the test documentation**: [tests/e2e/README.md](../tests/e2e/README.md) — learn how to write and run tests
2. **Explore the database**: Run `npm run db:studio` and browse the data
3. **Try the admin panel**: Log in as admin and explore the CMS
4. **Read about API endpoints**: [docs/API-ENDPOINTS.md](API-ENDPOINTS.md) — understand what the API can do
5. **Learn about the CMS**: [docs/CMS.md](CMS.md) — manage content
6. **Deployment guide**: [docs/DEPLOYMENT.md](DEPLOYMENT.md) — how to deploy to production

---

## Getting Help

If you are stuck, check these resources in order:

1. This guide — re-read the relevant section
2. The README files for each app (`apps/api/README.md`, `apps/web/README.md`, etc.)
3. The docs folder (`docs/`)
4. Ask a team member
5. **WhatsApp:** +62 823-9556-8743
6. **Email:** testcraftindonesia@gmail.com
