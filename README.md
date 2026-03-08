# ⚡ N & N Audio Systems — Frontend

> Precision Audio, Made in India

Next.js 14 · TypeScript · Tailwind CSS · Zustand · React Query · Razorpay

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/nn-audio-frontend.git
cd nn-audio-frontend

# 2. Install
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Fill in your values

# 4. Run dev server
npm run dev
# → http://localhost:3000
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay publishable key |
| `NEXTAUTH_URL` | App URL (localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Random 32-char secret |

Generate `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploy to Vercel (GitHub Actions)

### Required GitHub Secrets

Go to **Settings → Secrets → Actions** in your repo and add:

| Secret | How to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Run `vercel link` and check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same as above |

Also add these **Environment Variables** in Vercel Dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

### Workflow

- **Push to `main`** → Auto-deploys to production
- **Open a PR** → Deploys preview + posts URL in PR comment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + JARVIS Design System
- **State**: Zustand (cart + auth)
- **Data**: TanStack React Query v5 + Axios
- **Payments**: Razorpay JS SDK
- **Animations**: Framer Motion
- **Charts**: Recharts (admin analytics)
- **Icons**: Lucide React

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, categories, bestsellers |
| `/products` | Catalog with search & filter |
| `/products/[slug]` | Product detail with gallery |
| `/cart` | Shopping cart |
| `/checkout` | 3-step checkout (Address → Payment → Confirm) |
| `/checkout/success` | Order confirmation |
| `/account/orders` | Order history |
| `/account/orders/[id]` | Order detail |
| `/account/profile` | Edit profile & change password |
| `/account/addresses` | Address book |
| `/auth/login` | Login |
| `/auth/register` | Register |
| `/admin` | Admin dashboard |
| `/admin/products` | Product management |
| `/admin/products/[id]` | Edit/create product |
| `/admin/orders` | Order management |
| `/admin/customers` | Customer list |
| `/admin/analytics` | Sales charts |

---

**N & N Audio Systems** · Precision Audio, Made in India
