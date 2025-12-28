# Deployment Guide - Vercel + Neon PostgreSQL

## Overzicht

Deze guide beschrijft de complete deployment van het Ainexo naar productie met:

- **Hosting**: Vercel (Next.js applicatie)
- **Database**: Neon PostgreSQL (Serverless)
- **Storage**: Vercel Blob Storage
- **AI**: OpenAI API

---

## 1. Voorbereiding

### 1.1 Vereiste Accounts

1. **Vercel Account** - https://vercel.com
2. **Neon Account** - https://console.neon.tech
3. **OpenAI Account** - https://platform.openai.com
4. **GitHub Account** - Voor version control

### 1.2 Repository Setup

```bash
# Initialiseer Git repository
git init
git add .
git commit -m "Initial commit"

# Maak GitHub repository en push
git remote add origin https://github.com/username/chatbot-platform.git
git branch -M main
git push -u origin main

2. Neon Database Setup
2.1 Create Project

Log in op https://console.neon.tech
Klik op "New Project"
Configuratie:

Project name: chatbot-platform
Region: AWS us-east-2 (kies dichtst bij gebruikers)
Postgres version: 16
Compute size: Scale to Zero (0.25 - 2 CU)



2.2 Enable pgvector Extension

Open SQL Editor in Neon dashboard
Run:

sqlCREATE EXTENSION IF NOT EXISTS vector;

Verify:

sqlSELECT * FROM pg_extension WHERE extname = 'vector';
2.3 Get Connection Strings
Neon biedt twee connection strings:
Pooled Connection (voor applicatie):
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/chatbot_prod?sslmode=require&pgbouncer=true
Direct Connection (voor migraties):
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/chatbot_prod?sslmode=require
2.4 Create Database Branches
bash# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Create branches
neonctl branches create --name staging --parent main
neonctl branches create --name development --parent main
Branch Strategy:

main - Production database
staging - Staging environment
development - Development/testing


3. Environment Variables
3.1 Production Variables
Create .env.production:
env# Database (Neon Pooled Connection)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/chatbot_prod?sslmode=require&pgbouncer=true"

# Database (Neon Direct Connection - for migrations)
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/chatbot_prod?sslmode=require"

# Auth.js v5
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="https://your-domain.vercel.app"

# OpenAI
OPENAI_API_KEY="sk-prod-your-key-here"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"

# App
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NODE_ENV="production"
3.2 Generate Secrets
bash# Generate AUTH_SECRET (min 32 characters)
openssl rand -base64 32

# Output: bijvoorbeeld "T8f9K2mP3nQ4rS5tU6vW7xY8zA1bC2dE3fG4hJ5kL6M="

4. Vercel Deployment
4.1 Install Vercel CLI
bashnpm install -g vercel
4.2 Login
bashvercel login
4.3 Link Project
bash# In project root
vercel link

# Follow prompts:
# ? Set up "~/chatbot-platform"? Yes
# ? Which scope? Your Name
# ? Link to existing project? No
# ? What's your project's name? chatbot-platform
# ? In which directory is your code located? ./
4.4 Configure Environment Variables
Via CLI:
bash# Production
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add AUTH_SECRET production
vercel env add AUTH_URL production
vercel env add OPENAI_API_KEY production
vercel env add BLOB_READ_WRITE_TOKEN production
vercel env add NEXT_PUBLIC_APP_URL production

# Preview (optional)
vercel env add DATABASE_URL preview
# ... repeat for all variables
Via Dashboard:

Go to https://vercel.com/dashboard
Select your project
Go to Settings → Environment Variables
Add each variable with appropriate scope:

Production - For production deployments
Preview - For branch previews
Development - For local vercel dev



4.5 Configure Build Settings
Create vercel.json:
json{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    },
    "app/api/chat/message/route.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
Explanation:

buildCommand - Run Prisma migrations before build
regions - Deploy to US East (IAD1)
functions.maxDuration - Extend timeout for AI requests
crons - Daily cleanup at 2 AM UTC

4.6 Update next.config.mjs
javascript/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },

  // Optimize for production
  swcMinify: true,

  // Webpack config
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
      })
    }
    return config
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Chatbot-API-Key' },
        ],
      },
      {
        source: '/widget/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
4.7 Deploy to Production
bash# Deploy to production
vercel --prod

# Output:
# 🔗 Production: https://chatbot-platform.vercel.app

5. Database Migrations
5.1 Run Initial Migration
bash# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Deploy to production (runs automatically in build)
npx prisma migrate deploy
5.2 Seed Production Database
bash# Set DATABASE_URL to production
export DATABASE_URL="postgresql://..."

# Run seed
npx prisma db seed

# Verify
npx prisma studio
5.3 Migration Strategy
Development:
bashnpx prisma migrate dev --name description
Production (automatic):

Migrations run automatically during Vercel build
Via buildCommand in vercel.json

Rollback (if needed):
bash# List migrations
npx prisma migrate status

# Rollback last migration
# (Manual - Prisma doesn't support automatic rollback)
# Use Neon's point-in-time recovery

6. Vercel Blob Storage Setup
6.1 Create Blob Store

Go to Vercel Dashboard → Storage
Click "Create Database" → Blob
Name: chatbot-files
Region: Same as your app

6.2 Get Access Token

After creation, copy the BLOB_READ_WRITE_TOKEN
Add to environment variables in Vercel

6.3 Storage Implementation
Already implemented in lib/storage.ts:
typescriptimport { put, del, list } from '@vercel/blob'

export async function uploadFile(file: File, filename: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const blob = await put(filename, buffer, {
    access: 'public',
    addRandomSuffix: true,
  })
  return blob.url
}

7. Widget Deployment
7.1 Build Widget
bash# Build widget
cd widget
npm run build

# Output: public/widget/
# - widget-bundle.js
# - widget-bundle.css
7.2 Serve Widget Files
Widget files zijn automatisch beschikbaar via:

https://your-domain.vercel.app/widget/widget-bundle.js
https://your-domain.vercel.app/widget/widget-bundle.css
https://your-domain.vercel.app/widget/loader.js

7.3 Update Loader Script
Update public/widget/loader.js:
javascriptconst config = {
  apiUrl: scriptTag.getAttribute('data-api-url') || 'https://your-domain.vercel.app',
  // ... rest of config
}

8. Custom Domain Setup
8.1 Add Domain in Vercel

Go to Project Settings → Domains
Add your domain: chatbot.yourdomain.com
Configure DNS:

For Subdomain:
Type: CNAME
Name: chatbot
Value: cname.vercel-dns.com
For Root Domain:
Type: A
Name: @
Value: 76.76.21.21
8.2 Update Environment Variables
bash# Update AUTH_URL
vercel env rm AUTH_URL production
vercel env add AUTH_URL production
# Enter: https://chatbot.yourdomain.com

# Update NEXT_PUBLIC_APP_URL
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://chatbot.yourdomain.com
8.3 Redeploy
bashvercel --prod

9. CI/CD Setup
9.1 GitHub Actions Workflow
Create .github/workflows/deploy.yml:
yamlname: Deploy to Vercel

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Build widget
        run: |
          cd widget
          npm ci
          npm run build

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}

      - name: Deploy to Vercel
        if: github.ref == 'refs/heads/main'
        run: |
          npm i -g vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }} --yes
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
9.2 Add GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions
Add secrets:

VERCEL_TOKEN - From Vercel account settings
VERCEL_ORG_ID - From .vercel/project.json
VERCEL_PROJECT_ID - From .vercel/project.json
DATABASE_URL_TEST - Test database URL



9.3 Get Vercel Token
bash# Generate token
vercel whoami
# Go to: https://vercel.com/account/tokens
# Create new token with deployment scope

10. Monitoring & Analytics
10.1 Vercel Analytics
bashnpm install @vercel/analytics
Update app/layout.tsx:
tsximport { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
10.2 Error Tracking (Optional - Sentry)
bashnpm install @sentry/nextjs
Create sentry.client.config.ts:
typescriptimport * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
10.3 Performance Monitoring
Enable in Vercel Dashboard:

Real User Monitoring (RUM)
Web Vitals tracking
Function performance metrics


11. Post-Deployment Checklist
11.1 Verify Deployment

 Application accessible via URL
 Database connection working
 API endpoints responding
 Authentication working
 File uploads functioning
 Widget loading correctly
 SSL certificate active

11.2 Test Core Features
bash# Test document upload
curl -X POST https://your-domain.vercel.app/api/documents/upload \
  -H "Cookie: next-auth.session-token=..." \
  -F "file=@test.pdf"

# Test chat endpoint
curl -X POST https://your-domain.vercel.app/api/chat/message \
  -H "X-Chatbot-API-Key: cbk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"question": "Test vraag"}'

# Test health endpoint
curl https://your-domain.vercel.app/api/system/health
11.3 Security Checks

 Environment variables niet in code
 API keys niet exposed in client
 CORS correct geconfigureerd
 Rate limiting actief
 HTTPS enforced

11.4 Performance Checks

 Lighthouse score > 90
 First Contentful Paint < 1.5s
 Time to Interactive < 3s
 API response times < 2s


12. Backup & Recovery
12.1 Database Backups
Neon Automatic Backups:

Daily automated backups
7 days retention (free tier)
30 days retention (paid tier)

Manual Backup:
bash# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Compress
gzip backup-$(date +%Y%m%d).sql
Restore:
bash# Decompress
gunzip backup-20250930.sql.gz

# Restore
psql $DATABASE_URL < backup-20250930.sql
12.2 Point-in-Time Recovery
Via Neon Dashboard:

Go to Branches
Click "Restore"
Select timestamp
Creates new branch with restored data

12.3 Code Backup

Git repository (GitHub)
Automated via CI/CD
Tag releases: git tag v1.0.0


13. Scaling
13.1 Database Scaling (Neon)
Auto-scaling (enabled by default):

Scales from 0.25 to 2 CU automatically
Based on load
Pay only for what you use

Manual Scaling:

Go to Neon Dashboard → Project Settings
Adjust Compute Size:

Free: 0.25 - 0.5 CU
Launch: 0.25 - 2 CU
Scale: 0.25 - 8 CU



13.2 Application Scaling (Vercel)
Automatic:

Serverless functions scale automatically
No configuration needed
Pay per invocation

Limits (Hobby tier):

100GB bandwidth
100 hours function execution
1000GB-hours edge requests

Pro tier:

Unlimited bandwidth
Unlimited function execution
Priority support

13.3 Caching Strategy
typescript// API route caching
export const revalidate = 60 // 1 minute

// Dynamic rendering
export const dynamic = 'force-dynamic'

// Edge runtime for low latency
export const runtime = 'edge'

14. Cost Estimation
14.1 Monthly Costs
ServicePlanCostVercelPro$20NeonLaunch$19OpenAIUsage-based$50-200Vercel BlobIncluded$0Total$90-240
14.2 OpenAI Cost Breakdown
Embeddings (text-embedding-3-small):

$0.02 per 1M tokens
1000 documents × 5000 tokens = 5M tokens
Cost: ~$0.10 one-time

Chat Completions (gpt-4o-mini):

Input: $0.15 per 1M tokens
Output: $0.60 per 1M tokens
1000 conversations/month × 500 tokens avg = 500k tokens
Cost: ~$50/month

Upgrade to GPT-4o:

Input: $2.50 per 1M tokens
Output: $10.00 per 1M tokens
Cost: ~$500/month for same usage

14.3 Cost Optimization

Use GPT-4o-mini for most queries
Cache frequent questions
Optimize prompts (reduce tokens)
Implement query rewriting (shorter context)
Rate limiting prevents abuse


15. Troubleshooting
15.1 Common Issues
Build Failures:
bash# Check build logs
vercel logs

# Test build locally
npm run build

# Clear cache
rm -rf .next
npm run build
Database Connection Issues:
bash# Test connection
psql $DATABASE_URL

# Check Prisma schema
npx prisma validate

# Regenerate client
npx prisma generate
Environment Variable Issues:
bash# List all variables
vercel env ls

# Pull to local
vercel env pull .env.local

# Verify in deployment
vercel logs | grep "Environment"
15.2 Debug Mode
Enable verbose logging:
typescript// lib/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
15.3 Support Resources

Vercel: https://vercel.com/support
Neon: https://neon.tech/docs
OpenAI: https://help.openai.com
Next.js: https://nextjs.org/docs


16. Maintenance
16.1 Regular Tasks
Daily:

Monitor error logs
Check API response times
Review conversation quality

Weekly:

Review analytics
Check cost metrics
Update dependencies (if needed)

Monthly:

Database cleanup (old conversations)
Review and optimize queries
Update documentation

16.2 Updates
bash# Check for updates
npm outdated

# Update dependencies
npm update

# Test
npm run build
npm test

# Deploy
vercel --prod
16.3 Monitoring Dashboard
Create monitoring dashboard tracking:

Uptime (99.9% target)
Response times (<2s target)
Error rate (<1% target)
API costs
Database size

```
