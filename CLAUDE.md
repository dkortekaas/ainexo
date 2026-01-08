# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ainexo** is a production-ready AI chatbot platform built with Next.js 15, featuring multi-tenant architecture, subscription management, RAG-powered conversations, and an embeddable widget. The platform enables users to create AI assistants powered by their knowledge bases (documents, websites, FAQs) with comprehensive analytics and subscription management.

## Common Commands

### Development
```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production (includes widget build and Prisma generation)
npm start                # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # Run TypeScript type checking
```

### Database
```bash
npx prisma migrate dev   # Create and apply migration
npx prisma migrate deploy # Apply migrations in production
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio
npm run db:seed          # Seed database with test accounts

# Performance migrations (10-100x faster semantic search)
npx prisma db execute --file prisma/migrations/add_vector_index.sql
npx prisma db execute --file prisma/migrations/add_compound_indexes.sql
```

### Testing
```bash
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:ci          # Run tests for CI/CD
```

### Widget Development
```bash
npm run widget:dev       # Start widget dev server
npm run widget:build     # Build widget (auto-runs in main build)
```

### Running a Single Test
```bash
npm test -- path/to/test.test.ts                # Run specific test file
npm test -- --testNamePattern="test name"       # Run tests matching pattern
npm test -- path/to/test.test.ts --watch        # Run specific test in watch mode
```

## Architecture Overview

### Three-Tier Architecture
1. **Admin Portal** - Next.js 15 app for platform management (App Router)
2. **Backend API** - Next.js API routes with authentication, RAG pipeline, subscription management
3. **Chatbot Widget** - Standalone React widget built with Vite, embeddable via `<script>` tag with Shadow DOM isolation

### Key Technology Decisions

**Database**: PostgreSQL with pgvector extension for semantic search
- Prisma ORM with preview features enabled for vector support
- HNSW vector indexing for 10-100x faster searches
- Compound indexes for optimized query performance

**Authentication**: NextAuth.js v4 with Prisma adapter
- Session-based authentication with 7-day timeout
- Role-based access control (SUPERUSER, ADMIN, USER)
- Two-factor authentication (TOTP) with backup codes
- Email verification with 24-hour token expiration
- Brute force protection with account lockout

**AI/RAG Pipeline**: OpenAI with custom retrieval system
- `text-embedding-3-small` (1536 dimensions) for embeddings
- `gpt-4o-mini` for cost-effective responses
- Cosine similarity search with 0.7 threshold
- Context-aware prompt engineering with configurable tone
- Source attribution and confidence scoring

**Subscriptions**: Stripe with webhook integration
- 4 subscription plans (Starter, Professional, Business, Enterprise)
- 30-day trial period for new users
- Automatic usage limit enforcement
- Webhook-based subscription status sync

**Internationalization**: next-intl with 5 languages
- Dutch (nl), English (en), German (de), French (fr), Spanish (es)
- Locale-based routing (e.g., `/nl/dashboard`, `/en/dashboard`)
- 1250+ translated strings per language

**Email**: Resend for production-ready email delivery
- Welcome emails, verification, password reset, 2FA recovery
- Multi-language support with HTML templates

**Content Management**: Sanity CMS for website content
- Headless CMS with Sanity Studio at `/studio`
- Dynamic pages and blog posts
- Version history and draft/publish workflow

## Database Schema

### Core Models

**User Management**
- `User` - User accounts with subscription data, 2FA settings, trial tracking
- `Account` - OAuth account connections (NextAuth)
- `Session` - User sessions with token-based authentication
- `VerificationToken` - Email verification and password reset tokens

**AI Assistant System**
- `Assistant` (renamed from `ChatbotSettings`) - AI assistant configuration (appearance, behavior, API keys)
- `ActionButton` - Quick interaction buttons with priority ordering
- `Document` - Uploaded files with status tracking (PENDING, PROCESSING, COMPLETED, FAILED)
- `DocumentChunk` - Processed text chunks with vector embeddings (pgvector)
- `Website` - Website integration with scraping configuration and status
- `WebsitePage` - Individual scraped pages with content and links
- `FAQ` - Frequently asked questions with order and enabled status
- `KnowledgeBase` - Junction table linking FAQs, websites, and documents to assistants

**Conversation Tracking**
- `ConversationSession` - Complete conversation sessions with metadata
  - Session tracking with unique session IDs
  - Performance metrics (message count, total tokens, avg response time)
  - Rating system (1-5 stars) with comments
- `ConversationMessage` - Individual messages with performance data
  - Message type (USER, ASSISTANT, SYSTEM)
  - Response time, tokens used, confidence scores
  - Model information and source attribution
- `ConversationSource` - Documents used for specific answers
  - Relevance scores for source effectiveness
  - Links to both messages and legacy conversations

**Notification System**
- `Notification` - System notifications with targeting
  - Types: INFO, WARNING, ERROR, SUCCESS, MAINTENANCE
  - Priority levels: LOW, MEDIUM, HIGH, URGENT
  - User targeting (specific users or broadcast)
  - Expiration dates and read status

**Subscription Management**
- Subscription data stored in `User` model
- `SubscriptionStatus` enum: TRIAL, ACTIVE, PAST_DUE, CANCELED, EXPIRED
- `SubscriptionPlan` enum: STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE
- Stripe customer ID and subscription ID for webhook sync

**Content Management (CMS)**
- `CmsPage` - Website pages with SEO, versioning, and status management
- `CmsPageVersion` - Complete version history for pages
- `CmsBlogPost` - Blog articles with reading time and analytics
- `CmsBlogVersion` - Blog post version history
- `CmsMedia` - Media library with usage tracking
- `CmsCategory` - Hierarchical content categorization
- `CmsTag` - Simple tagging system

### Important Indexes
- Vector index on `DocumentChunk.embedding` (HNSW for fast similarity search)
- Compound indexes on common query patterns:
  - `User(isActive, subscriptionStatus, role, companyId)`
  - `ConversationSession(assistantId, createdAt)`
  - `Document(chatbotId, status)`
  - `Website(chatbotId, status)`

## RAG (Retrieval-Augmented Generation) Pipeline

### Document Ingestion Flow
1. **Text Extraction** - Extract from PDF, DOCX, TXT, or scrape from URLs
2. **Text Chunking** - Split into 1000-char chunks with 200-char overlap
3. **Embedding Generation** - Generate OpenAI embeddings (batch processing)
4. **Storage** - Store chunks with embeddings in PostgreSQL (pgvector)

### Query Flow
1. **Query Embedding** - Generate embedding for user question
2. **Vector Search** - Cosine similarity search (top 5 results, 0.7 threshold)
3. **Context Building** - Assemble relevant chunks with source attribution
4. **Prompt Engineering** - Build system prompt based on chatbot tone
5. **LLM Generation** - Generate answer with GPT-4o-mini
6. **Response** - Return answer with sources, confidence, and metadata

### Key Files
- `lib/openai.ts` - OpenAI client configuration
- `lib/document-processor.ts` - Text extraction from various formats
- `lib/chunking.ts` - Text chunking strategies
- `lib/embedding.ts` - Embedding generation (single and batch)
- `lib/vector-search.ts` - Semantic and hybrid search
- `lib/rag.ts` - Complete RAG pipeline with answer generation

### Performance Optimizations
- **Caching**: LRU cache for embeddings and search results
- **Batch Processing**: Process multiple documents in parallel
- **Vector Index**: HNSW index for 10-100x faster searches
- **Context Optimization**: 40% reduction in OpenAI costs through prompt optimization

## API Route Structure

### Authentication (`app/api/auth/`)
- `signup` - User registration with email verification
- `forgot-password` - Password reset request
- `reset-password` - Password reset with token
- `verify-email` - Email verification
- `resend-verification` - Resend verification email
- `2fa/setup` - Generate TOTP secret and QR code
- `2fa/verify` - Verify TOTP code during setup
- `2fa/verify-login` - Verify 2FA code during login
- `2fa/disable` - Disable 2FA
- `2fa/regenerate-backup-codes` - Generate new backup codes
- `2fa/request-recovery` - Request email recovery code

### Assistants (`app/api/assistants/`)
- CRUD operations for AI assistants
- Configuration management (appearance, behavior, API keys)
- Rate limiting and domain whitelisting

### Knowledge Base
- `app/api/faqs/` - FAQ CRUD with bulk CSV import
- `app/api/websites/` - Website scraping and sync management
- `app/api/files/` - File upload and management
- `app/api/knowledge/` - Junction table for linking knowledge to assistants

### Conversations (`app/api/conversations/`)
- `sessions` - List conversation sessions with filtering
- `sessions/stats` - Session statistics and analytics
- `sessions/[id]/rate` - Rate conversation sessions

### Chat (`app/api/chat/`)
- `message` - Send message and receive AI response
  - Automatic session creation and management
  - Message storage with performance metrics
  - Source tracking and confidence scoring

### Admin (`app/api/admin/`)
- `users` - User management (SUPERUSER only)
- `subscriptions` - Subscription overview and management

### Billing (`app/api/billing/`)
- Get complete billing data (subscription, invoices, payment methods)
- Update billing details (company info, VAT, address)
- Sync subscription from Stripe
- Stripe webhook handler for subscription events

### CMS (`app/api/cms/`)
- `pages` - CMS page CRUD with versioning
- `blog` - Blog post management
- `media` - Media library with upload and usage tracking
- `preview` - Enter/exit preview mode
- `cron/publish` - Scheduled publishing (Vercel Cron)

## Subscription & Billing System

### Plans
- **Starter**: €19/mo - 1 chatbot, 100 conversations/mo
- **Professional**: €49/mo - 3 chatbots, 500 conversations/mo
- **Business**: €149/mo - 10 chatbots, 2000 conversations/mo
- **Enterprise**: €499/mo - Unlimited chatbots and conversations

### Trial Management
- 30-day trial for all new users
- Trial tracking with `trialStartDate` and `trialEndDate`
- Automatic upgrade prompts when trial expires

### Usage Limits
- Assistant creation limits enforced at creation time
- Conversation limits tracked per assistant per month
- Automatic assistant disabling when conversation limit reached
- Document and website limits per assistant

### Stripe Integration
- Checkout sessions for subscription creation
- Webhook handling for subscription events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `checkout.session.completed`
- Customer Portal for self-service billing management

## Security Implementation

### Path Traversal Protection
- Crypto-based filenames for uploads
- Whitelist validation for file types
- Centralized security configuration in `lib/config/security.ts`

### Password Security
- 12+ character requirement with complexity validation
- Bcrypt cost factor 12 (standardized)
- Password hashing helper in security config

### Rate Limiting
- Registration rate limiting: 5 attempts/hour per IP
- Distributed rate limiting with Upstash Redis
- Automatic fallback to in-memory when Redis unavailable
- Rate limit headers (X-RateLimit-Limit, Remaining, Reset)

### Brute Force Protection
- Account lockout after 10 failed login attempts
- reCAPTCHA required after 3 failed attempts
- 30-minute automatic lockout duration
- Admin unlock capability

### Session Management
- 7-day session timeout
- HTTP-only cookies
- CSRF protection via NextAuth.js

### Security Audit Logging
- Comprehensive logging for all authentication events
- 2FA events logged for audit purposes
- Failed login tracking

## Internationalization (i18n)

### Configuration
- next-intl for internationalization
- Locale-based routing with `i18n/routing.ts`
- Request configuration in `i18n/request.ts`

### Translation Files
- `messages/nl.json` - Dutch (default)
- `messages/en.json` - English
- `messages/de.json` - German
- `messages/fr.json` - French
- `messages/es.json` - Spanish

### Usage Pattern
```typescript
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  return <button>{t('submit')}</button>;
}
```

### Route Structure
- All user-facing routes are prefixed with locale: `/[locale]/...`
- Authentication routes bypass locale prefix (configured in middleware)
- API routes are not localized

## Middleware

The middleware (`middleware.ts`) handles:
1. **Internationalization** - Locale detection and routing
2. **Authentication** - Protected route enforcement
3. **Public Paths** - Paths accessible without authentication
4. **2FA Flow** - Special handling for two-factor authentication pages

### Path Categories
- **No Locale Paths**: Authentication pages (login, register, 2fa-verify, etc.)
- **Public Paths**: Homepage, pricing, blog, contact, etc.
- **Protected Paths**: Everything else requires authentication

## Widget Architecture

### Build Process
- Built with Vite for optimal bundle size (~50KB gzipped)
- Outputs to `public/widget/` directory
- CSS inlined in JS bundle
- IIFE format for standalone execution

### Integration
```html
<script
  src="https://your-app.vercel.app/widget/loader.js"
  data-chatbot-id="cbk_live_abc123xyz789"
></script>
```

### Key Features
- Shadow DOM isolation (no style conflicts)
- Persistent session and message storage
- Responsive design (desktop and mobile)
- Configurable via data attributes (colors, position, texts)

### API Endpoints Used by Widget
- `POST /api/chat/message` - Send message and receive response
- `GET /api/chatbot/public-config` - Fetch chatbot configuration

## Environment Variables

### Required for Development
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
```

### Production Services
```env
# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PROFESSIONAL_PRICE_ID="price_..."
STRIPE_BUSINESS_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# reCAPTCHA (optional but recommended)
RECAPTCHA_SITE_KEY="..."
RECAPTCHA_SECRET_KEY="..."

# Sanity CMS (optional)
NEXT_PUBLIC_SANITY_PROJECT_ID="..."
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_TOKEN="..."
SANITY_PREVIEW_SECRET="..."

# Sentry (optional)
SENTRY_DSN="..."
SENTRY_AUTH_TOKEN="..."
```

### Environment Validation
- Runtime validation system in `lib/config/env-validation.ts`
- Zod schema validation for all config
- Production-specific security checks
- Server won't start with invalid configuration

## Testing

### Test Structure
- Test files: `**/__tests__/**/*.test.{ts,tsx}` or `**/*.test.{ts,tsx}`
- Jest with jsdom environment
- React Testing Library for component tests

### Coverage Targets
- Currently set to 0% (no strict requirements)
- Coverage collected from `app/`, `components/`, `lib/`
- Excludes `node_modules/`, `.next/`, `dist/`

### Running Tests
```bash
npm test                                          # Run all tests
npm test -- path/to/test.test.ts                # Run specific test
npm test -- --testNamePattern="test name"       # Run by pattern
npm run test:watch                               # Watch mode
npm run test:coverage                            # With coverage
```

## Code Style & Patterns

### Component Structure
- Use functional components with TypeScript
- Prefer server components (Next.js App Router default)
- Use `'use client'` directive only when needed (hooks, state, events)

### Form Handling
- React Hook Form + Zod for validation
- Shadcn/ui form components
- Server actions for form submission

### Data Fetching
- Server Components: Direct database queries with Prisma
- Client Components: TanStack Query (React Query) with API routes
- SWR for real-time data (optional)

### Error Handling
- Try-catch in API routes with proper status codes
- Error boundaries for client-side errors
- Sentry integration for production error tracking

### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Files: kebab-case for utilities (`user-profile-utils.ts`)
- Database models: PascalCase singular (`User`, `Document`)
- API routes: kebab-case (`/api/action-buttons`)

## Important Implementation Details

### Vector Search Performance
- HNSW index provides 10-100x faster similarity search
- Requires PostgreSQL extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- Migrations available in `prisma/migrations/`

### Document Processing
- Text extraction supports PDF, DOCX, TXT formats
- Chunking strategy: 1000 chars with 200 overlap for context preservation
- Embeddings batched (100 per request) for efficiency

### Conversation Management
- Session-based tracking with unique session IDs
- Individual message storage with performance metrics
- Source attribution at message level (not session level)
- Rating system applies to entire sessions

### Notification System
- Real-time notification bell with unread count
- Superuser can create system-wide notifications
- Targeting: specific users or broadcast to all
- Automatic expiration with date-based filtering

### User Management
- Superuser-only access to user CRUD operations
- Cannot delete own account (safety check)
- Email uniqueness validation
- Password reset available for admins

## Deployment Checklist

See `DEPLOYMENT_CHECKLIST.md` for comprehensive production deployment guide including:
- Database migrations
- Environment variable configuration
- Stripe webhook setup
- Email service configuration
- Security hardening
- Performance optimization verification

## Migration Guide

See `MIGRATION_GUIDE.md` for:
- Database migration instructions
- Performance migration steps (vector index, compound indexes)
- Automated migration scripts
- Rollback procedures

## Recent Major Changes (2026-01-04)

### Performance & Security Audit
- **Security**: Path traversal protection, strong password policy, registration rate limiting
- **Performance**: Vector index (10-100x faster), compound indexes (2-3x faster), N+1 query fixes
- **Usability**: Dynamic locale support, functional contact form, improved accessibility
- **Code Quality**: Removed 2,300+ lines of unused code, 9 unused packages (~15-20 MB)
- **Financial Impact**: $1,320-2,640/year savings

### CMS System (v2.6.0)
- Complete headless CMS with pages, blog posts, media library
- Version control with automatic history
- Draft/publish workflow and scheduled publishing
- Preview mode with secure token-based authentication

### FAQ Management (v2.5.0)
- Complete FAQ CRUD operations
- Bulk CSV import with validation
- Search, sort, pagination, and preview
- KnowledgeBase junction model

### Security Enhancements (v2.4.0)
- Two-factor authentication (TOTP)
- Email verification on registration
- Brute force protection with account lockout
- reCAPTCHA integration

## Documentation

- `README.md` - Comprehensive project overview and setup guide
- `docs/ARCHITECTURE.md` - System architecture and tech stack details
- `docs/RAG.md` - Complete RAG pipeline implementation guide
- `docs/development-guidelines.md` - Development standards and best practices
- `docs/DEPLOYMENT.md` - Deployment and infrastructure guide
- `docs/2FA_SYSTEM.md` - Two-factor authentication implementation
- `docs/GDPR_COMPLIANCE.md` - GDPR compliance features
- `docs/WIDGET.md` - Widget integration guide
- `DEPLOYMENT_CHECKLIST.md` - Production deployment checklist
- `MIGRATION_GUIDE.md` - Database migration instructions
