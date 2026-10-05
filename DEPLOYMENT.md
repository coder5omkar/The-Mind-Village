# Deploying The Village

**Chosen path: AWS Amplify Hosting + Neon PostgreSQL + Google OAuth.**
(Cloudflare Workers is kept below as an alternative.)

The app uses Prisma with the WASM client engine (`engineType = "client"`) and
driver adapters, so it runs on Lambda/Workers without native binaries.
`lib/prisma.ts` picks the driver automatically: Neon adapter on Cloudflare
Workers, node-postgres everywhere else (local, Amplify/Lambda, EC2).

---

# Part 1 — AWS Amplify Hosting + Neon

## 0. Prerequisites

- AWS account (free tier is fine to start)
- Neon account (free tier)
- Google account (OAuth)
- The repo pushed to GitHub (Amplify deploys from Git)

## 1. Neon database

1. https://neon.tech → create a project (e.g. `the-village`, region near you).
2. Copy the **pooled** connection string:

   ```
   postgresql://<user>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/<db>?sslmode=require
   ```

3. Apply the schema and seed **once** from your machine:

   ```powershell
   $env:DATABASE_URL="postgresql://...neon.tech/village?sslmode=require"
   npx prisma migrate deploy
   npx prisma db seed
   ```

   (The seed creates the 79 residents. Relationships are never seeded — each
   user builds their own village through readings.)

## 2. Google OAuth

1. https://console.cloud.google.com/apis/credentials → create a project.
2. **OAuth consent screen** → External → app name, support email, developer
   email → Save. Default scopes are fine. Add your Gmail under **Test users**.
3. **Create credentials → OAuth client ID → Web application**.
4. Authorized redirect URIs (both):

   ```
   http://localhost:3000/api/auth/callback/google
   https://main.<your-app-id>.amplifyapp.com/api/auth/callback/google
   ```

   Amplify shows your app URL after the first deploy — you can add the second
   URI then and save again.

5. Copy the **Client ID** and **Client Secret**.

## 3. Amplify app

1. AWS Console → **Amplify** → *Create new app* → **Host your web app** →
   connect your GitHub repo and the `main` branch.
2. Amplify auto-detects Next.js; the build spec is committed as `amplify.yml`
   (`npm ci` → `prisma generate` → `next build`). The repo also has `.nvmrc`
   pinned to Node 20.
3. **Environment variables** (App settings → Environment variables):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string |
   | `NEXTAUTH_URL` | `https://main.<your-app-id>.amplifyapp.com` |
   | `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
   | `GOOGLE_CLIENT_ID` | from step 2 |
   | `GOOGLE_CLIENT_SECRET` | from step 2 |
   | `JEV_API_KEY` | your Jev (TypeSafe) key |
   | `DEEPSEEK_API_KEY` | optional fallback |
   | `DEEPSEEK_BASE_URL` | optional, defaults are fine |
   | `DEEPSEEK_MODEL` | optional |

4. **Save and deploy**. The first build takes a few minutes.
5. Open the app URL, sign in with Google (test users only until the consent
   screen is published), and add the production redirect URI in Google Console
   if you hadn't already.

> Visitor mode works even before Google OAuth is configured — anyone can open
> the app and chat; sign-in only adds saving progress to an account.

## Amplify notes / troubleshooting

- **Build fails with `DATABASE_URL is not set`** — add the env var before the
  first build (the Prisma client is created at import time).
- **`redirect_uri_mismatch`** — the Google callback must match
  `NEXTAUTH_URL` + `/api/auth/callback/google` exactly (HTTPS, no trailing
  slash).
- **Prisma errors at runtime** — make sure the build ran `npx prisma generate`
  (it is in `amplify.yml` and also the `postinstall` hook).
- **Free tier** — Amplify's free tier runs 12 months; after that it is
  pay-as-you-go (usually a few dollars a month at this scale).

---

# Part 2 — Local development

Use Neon directly, or run Postgres locally:

```powershell
docker run -d --name village-pg -e POSTGRES_PASSWORD=village -e POSTGRES_USER=village -e POSTGRES_DB=village -p 5432:5432 postgres:16-alpine
```

`.env`:

```
DATABASE_URL="postgresql://village:village@localhost:5432/village"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-only-secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
JEV_API_KEY="..."
```

```powershell
npx prisma migrate deploy   # or: npx prisma migrate dev
npx prisma db seed
npm run dev
```

---

# Part 3 — Alternative: Cloudflare Workers + Neon

The repo is also configured for Cloudflare (OpenNext). The Worker bundle is
~5.3 MB gzipped, which needs the **Workers Paid** plan ($5/mo, 10 MB limit).

```powershell
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler secret put NEXTAUTH_SECRET
npx wrangler secret put NEXTAUTH_URL        # https://the-village.<subdomain>.workers.dev
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put JEV_API_KEY
npm run cf:deploy
```

Then add `https://the-village.<subdomain>.workers.dev/api/auth/callback/google`
to the Google OAuth client.

---

# Cost summary

| Item | Cost |
| --- | --- |
| AWS Amplify Hosting | free tier 12 months, then a few $/mo |
| Neon Postgres | free tier is plenty |
| Google OAuth | free |
| Jev readings | ~$0.0002 per reading (two ranked neighbours + reasons) |
| Domain (optional) | ~$10/year (not required on Amplify) |
| Cloudflare Workers (alternative) | $5/mo paid plan |
