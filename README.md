# Ritual PFP Maker

A community tool for Ritual members to brand their profile pictures with the official Ritual logo.

## Features
- Upload your PFP (PNG, JPG, WEBP)
- Official Ritual logo auto-loads (baked in — no user upload needed)
- Drag logo to reposition on canvas
- 9 preset snap positions
- Logo size, opacity & padding controls
- Circular crop for X/Twitter profiles
- Live 1000×1000px preview
- Download as PNG
- Copy to clipboard
- Share directly to X/Twitter

## Deploy to Vercel (5 minutes)

### Step 1: Push to GitHub

1. Create a new repository on [github.com](https://github.com/new)
2. Open your terminal and run:

```bash
cd ritual-pfp-maker
git init
git add .
git commit -m "Initial commit — Ritual PFP Maker"
git remote add origin https://github.com/YOUR_USERNAME/ritual-pfp-maker.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (free account works)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel auto-detects Next.js — just click **"Deploy"**
5. Your app is live at `https://ritual-pfp-maker.vercel.app` (or your custom domain)

### Step 3: Custom Domain (optional)

In your Vercel project settings → Domains → add `pfp.ritual.net` or similar.

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Updating the Logo

Replace `public/ritual-logo.jpg` with the new logo file (keep the same filename), then redeploy.

For best results, use a PNG with transparent background named `ritual-logo.png` and update the reference in `src/app/page.tsx`:
```
img.src = '/ritual-logo.png'
```

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- HTML5 Canvas API
- Deployed on Vercel
