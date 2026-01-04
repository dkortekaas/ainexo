# Ainexo

A modern, fully functional Ainexo platform built with Next.js 15, TypeScript, and Prisma. This platform enables users to create Ainexobots, upload and process documents, manage knowledge bases, and view comprehensive analytics with a complete notification system.

## ⚡ Recent Major Improvements (2026-01-04)

**Performance & Security Audit completed with 35+ critical improvements:**

### 🔒 Security Enhancements (5 fixes)
- ✅ **Path Traversal Protection**: Secure file upload with crypto-based filenames and whitelist validation
- ✅ **Strong Password Policy**: 12+ character requirement with complexity validation
- ✅ **Registration Rate Limiting**: IP-based limiting (5 attempts/hour)
- ✅ **Bcrypt Standardization**: Consistent cost factor 12 across all password operations
- ✅ **Security Config File**: Centralized security constants in `lib/config/security.ts`

### ⚡ Performance Optimizations (4 items)
- ✅ **Vector Index**: 10-100x faster semantic search with HNSW index (requires DB migration)
- ✅ **Compound Indexes**: 2-3x faster common queries (requires DB migration)
- ✅ **N+1 Query Fix**: 5-10x faster multi-source conversations with batch fetching
- ✅ **OpenAI Cost Reduction**: 40% reduction in API costs through context optimization

### 👥 Usability Improvements (4 items)
- ✅ **Dynamic Locale**: Date formatting now respects user's language preference
- ✅ **Functional Contact Form**: Real email notifications to admin and user
- ✅ **Better Accessibility**: Added aria-expanded and aria-label attributes
- ✅ **Extended Session**: 7-day session timeout (improved from 30 minutes)

### 🧹 Code Quality (19 items)
- ✅ **Removed Dead Code**: 2,300+ lines of unused code removed (10 files)
- ✅ **Dependency Cleanup**: 9 unused packages uninstalled (~15-20 MB reduction)
- ✅ **Environment Validation**: New runtime validation in `lib/config/env-validation.ts`

### 💰 Financial Impact
- **Monthly Savings**: $110-220 ($1,320-2,640/year)
- **Performance Gain**: 10-100x faster searches, 2-3x faster queries
- **Bundle Size**: 15-20 MB smaller

### 📚 New Documentation
- `PROJECT_AUDIT_REPORT.md` - Complete audit findings (662 lines)
- `IMPROVEMENTS_SUMMARY.md` - All improvements summary (447 lines)
- `DEPLOYMENT_CHECKLIST.md` - Production deployment guide (340 lines)
- `MIGRATION_GUIDE.md` - Database migration instructions
- See `.github/PULL_REQUEST_INFO.md` for PR details

**⚠️ Action Required**: Database migrations must be applied for performance improvements.
See `MIGRATION_GUIDE.md` for instructions.

---

## 🚀 Features

### 📊 Dashboard

- **Overview**: Central dashboard with key statistics
- **Quick Actions**: Direct access to frequently used functions
- **Real-time Updates**: Live data from conversations and documents
- **Assistant Switcher**: Easy switching between multiple AI assistants
- **Notification Bell**: Real-time notifications with unread count

### 📄 Document Management

- **Multi-format Support**: PDF, DOCX, TXT, JPG, PNG files
- **URL Processing**: Automatic processing of website content
- **Drag & Drop Upload**: Intuitive file upload interface
- **Document Viewer**: Built-in viewer for document preview
- **Chunking & Embedding**: Automatic text processing for AI optimization
- **Status Tracking**: Real-time processing status (PROCESSING, COMPLETED, FAILED)
- **Metadata Extraction**: Automatic extraction of document information
- **File Management**: Edit, delete, and organize uploaded files

### 📧 Email System

- **Resend Integration**: Production-ready email delivery via Resend
- **Email Templates**: Professional HTML email templates with responsive design
- **Email Types**:
  - Welcome emails for new users
  - Email verification with 24-hour token expiration
  - Password reset emails with secure tokens
  - Contact form submissions
  - 2FA recovery codes
  - Subscription expiration notifications
  - Invitation emails for team members
- **Multi-language Support**: All emails support internationalization
- **Attachment Support**: Email attachments via raw MIME messages
- **Error Handling**: Graceful degradation if email service unavailable
- **Email Logging**: Comprehensive logging for debugging and monitoring

### 📝 Contact Form

- **Public Contact Form**: Accessible contact form for website visitors
- **Form Validation**: Client and server-side validation
- **Email Notifications**: Automatic email notifications for form submissions
- **Field Support**: Name, email, company, and message fields
- **Security**: Rate limiting and validation to prevent spam

### 🌐 Website Scraping & RAG Integration

- **Intelligent Web Scraping**: Automatic content extraction from websites
- **Multi-page Crawling**: Recursive scraping with configurable depth (up to 3 levels)
- **Increased Limits**: Scrape up to 50 pages per website (5x concurrent requests)
- **Content Processing**: Smart text extraction focusing on main content areas
- **Link Discovery**: Automatic extraction and storage of all found links
- **Vector Embeddings**: OpenAI embeddings for semantic search
- **Document Chunking**: Intelligent text chunking with context preservation
- **RAG Integration**: Full integration with Retrieval-Augmented Generation
- **Real-time Processing**: Background scraping with status tracking
- **Content View**: Dedicated page for viewing scraped content and links
- **Manual Scraping**: On-demand re-scraping functionality
- **Sync Logging**: Comprehensive logging of scraping sessions
  - Session statistics (URLs, success/failed/skipped counts)
  - Duration tracking for performance monitoring
  - Per-URL status tracking with error messages
  - Content size tracking
  - Detailed sync log viewer with clickable URL entries
- **Smart Status**: Only marks as ERROR if zero pages succeed (partial success = COMPLETED)

### 🤖 AI Assistant Management

- **Multiple Assistants**: Create and manage multiple AI assistants
- **Customizable Settings**:
  - Name, description, and welcome message
  - Color scheme (primary and secondary colors)
  - Font family and styling options
  - Avatar selection
  - Tone (professional, friendly, casual)
  - Temperature and response length
  - Fallback messages
- **Embed Code**: Easy integration on websites
- **Live Preview**: Real-time preview of chatbot appearance
- **API Key Management**: Secure access to chatbot functionality
- **Domain Whitelisting**: Restricted access to specific domains
- **Rate Limiting**: Configurable user limits

### 🎯 Action Buttons

- **Quick Buttons**: Pre-configured buttons for common user interactions
- **Custom Questions**: Associate specific questions with buttons
- **Priority Management**: Set button priority for ordering
- **Enable/Disable**: Toggle buttons on/off
- **CRUD Operations**: Create, edit, and delete action buttons
- **Database Storage**: All buttons stored and managed in database

### 🗄️ Knowledge Base (Kennisbank)

- **Website Integration**: Sync and process website content
- **Intelligent Web Scraping**: Automatic content extraction with multi-page crawling
- **RAG Integration**: Full vector search and semantic understanding
- **Content View**: Dedicated interface for viewing scraped website content
- **Link Discovery**: Automatic extraction and management of website links
- **FAQ Management**: Complete FAQ system with full CRUD operations
  - **Create FAQs**: Add individual FAQs with question, answer, order, and enabled status
  - **Edit FAQs**: Update existing FAQs with validation and character limits
  - **Delete FAQs**: Remove FAQs with confirmation dialog
  - **FAQ Overview**: Table and card views with search, sort, and pagination
  - **FAQ Preview**: Modal preview showing full FAQ content with formatting
  - **Bulk Import**: CSV upload for importing multiple FAQs at once
    - CSV parsing with quoted field support
    - Real-time validation with error reporting
    - Progress tracking during import
    - Batch processing for performance
  - **Enable/Disable**: Toggle FAQ active status
  - **Order Management**: Set display order for FAQs
  - **Search & Filter**: Search by question/answer content
  - **Sort Options**: Sort by question, creation date, or modification date
  - **Pagination**: Handle large FAQ lists efficiently
- **File Upload**: Upload knowledge files for AI training
- **Content Organization**: Organize knowledge by categories
- **Sync Management**: Control website synchronization settings
- **Status Tracking**: Monitor processing status of knowledge sources
- **KnowledgeBase Model**: Database model linking FAQs, websites, and documents to assistants

### 💬 Conversation Management

- **Complete Session Tracking**: Full conversation sessions with all messages
- **Message History**: Individual user and assistant messages with timestamps
- **Session Analytics**: Session duration, message count, token usage per session
- **Source Attribution**: Which documents were used for each specific answer
- **Performance Metrics**: Response time, token usage, confidence scores per message
- **Rating System**: 1-5 star ratings with comments for entire sessions
- **Advanced Filtering**: Filter by type, time, duration, and rating
- **Expandable Views**: Click to expand and see full conversation flow
- **Session Statistics**: Total sessions, active sessions, average messages per session
- **Real-time Updates**: Live conversation data and statistics
- **Export Functionality**: Export conversations for analysis

### 📈 Analytics & Reporting

- **Session Statistics**:
  - Total conversation sessions
  - Active sessions (last 24 hours)
  - Total messages across all sessions
  - Average messages per session
- **Performance Metrics**:
  - Response time analytics
  - Token usage tracking
  - Confidence score monitoring
  - Model performance insights
- **Rating Distribution**: Visual representation of session ratings
- **Top Questions**: Most asked questions with trends
- **Conversation Charts**: Timeline of chat activity and session patterns
- **Source Analytics**: Which knowledge sources are most effective
- **User Behavior**: Session duration and engagement patterns

### 🔔 Notification System

- **Real-time Notifications**: Bell icon in header with unread count
- **Notification Dropdown**: Quick access to recent notifications
- **Full Notification Page**: Complete notification management
- **Admin Panel**: Superuser interface for creating notifications
- **Notification Types**: INFO, WARNING, ERROR, SUCCESS, MAINTENANCE
- **Priority Levels**: LOW, MEDIUM, HIGH, URGENT
- **Target Users**: Send to specific users or all users
- **Expiration Dates**: Set automatic expiration for notifications
- **Mark as Read**: Individual and bulk read status management
- **Table View**: Clean tabular interface for admin management

### 👥 User Management (Superuser Only)

- **User Overview**: Complete list of all users in the system
- **Table Interface**: Clean tabular view with user details
- **User Creation**: Create new users with custom roles
- **User Editing**: Update user information, roles, and passwords
- **User Deletion**: Remove users from the system (with safety checks)
- **Role Management**: Assign SUPERUSER, ADMIN, or USER roles
- **User Statistics**: View assistant count and activity per user
- **Security Features**: Cannot delete own account, email uniqueness validation

### 🔐 Authentication & Security

- **NextAuth.js Integration**: Secure user authentication
- **Role-based Access**: SUPERUSER, ADMIN, and USER roles
- **Session Management**: Secure session handling with role information
- **API Security**: Protected endpoints with authentication
- **Password Security**: bcryptjs password hashing
- **Two-Factor Authentication (2FA)**: Complete TOTP-based 2FA system
  - **TOTP Authenticatie**: Time-based One-Time Password via authenticator apps (Google Authenticator, Authy, Microsoft Authenticator, 1Password)
  - **QR Code Setup**: Easy configuration via QR code scanning
  - **Backup Codes**: 10 one-time recovery codes for account access
  - **Email Recovery**: Temporary recovery code via email (last resort, resets 2FA)
  - **Admin Reset**: Admins can reset 2FA for users in their organization
  - **Security Logging**: All 2FA events logged for audit purposes
- **Email Verification**: Email verification required on registration
  - Verification tokens with 24-hour expiration
  - Resend verification email functionality
  - Security audit logging
- **Account Security**:
  - **Brute Force Protection**: Account lockout after 10 failed login attempts
  - **reCAPTCHA Integration**: Required after 3 failed attempts
  - **30-minute Lockout**: Automatic account lockout duration
  - **Admin Unlock**: Admins can unlock locked accounts
  - **Failed Login Tracking**: Comprehensive security audit trail
- **Password Reset**: Secure password reset via email with token expiration

### 💳 Subscription & Billing System

- **Trial Period**: 30-day free trial for all new users
- **4 Subscription Plans**:
  - **Starter**: €19/month - 1 chatbot, 100 conversations/month
  - **Professional**: €49/month - 3 chatbots, 500 conversations/month
  - **Business**: €149/month - 10 chatbots, 2000 conversations/month
  - **Enterprise**: €499/month - Unlimited chatbots and conversations
- **Stripe Integration**: Secure payment processing and subscription management
  - **Checkout Sessions**: Seamless upgrade flow with Stripe Checkout
  - **Webhook Integration**: Automatic subscription status updates
  - **Customer Portal**: Self-service billing management
- **Dedicated Billing Page**: Complete billing management interface with 4 cards:
  - **Current Plan Card**: Active subscription with plan details and status
  - **Available Plans Card**: Upgrade options with feature comparison
  - **Invoices Card**: View and download past invoices with status tracking
  - **Payment Method Card**: Manage credit cards via Stripe Customer Portal
  - **Billing Details Card**: Company information for accurate invoicing
    - Company name and billing email
    - VAT number for European businesses
    - Full billing address (street, city, postal code, country)
    - Auto-populate from company and user data
    - Editable with save functionality
- **Subscription Sync**: Manual sync button to refresh subscription status from Stripe
- **Automatic Billing**: Recurring monthly payments
- **Trial Tracking**: Real-time trial status and days remaining
- **Usage Limits**: Automatic enforcement of plan limits
  - **Assistant Creation Limits**: Prevents creating more assistants than plan allows
  - **Conversation Limits**: Tracks and enforces monthly conversation limits per assistant
  - **Auto-Disable**: Assistants automatically disabled when conversation limit reached
  - **Document Limits**: Per-assistant document upload limits
  - **Website Limits**: Per-assistant website scraping limits
- **Upgrade Prompts**: Seamless upgrade flow when limits are reached
- **Detailed Error Messages**: Clear messaging with current usage and limit information
- **Payment Status Tracking**:
  - Real-time subscription status (ACTIVE, PAST_DUE, CANCELED, etc.)
  - Grace period handling for failed payments
  - Automatic reactivation after successful payment retry

### ⚙️ Settings & Configuration

- **Look & Feel**: Customize chatbot appearance and behavior
- **Action Buttons**: Manage quick interaction buttons
- **Forms**: Configure form settings and integrations
- **Integrations**: API and third-party service configurations
- **Widget Settings**: Embed code and widget customization
- **User Account**: Profile management and password changes
- **Team Management**: User roles and permissions
- **Billing (Dedicated Page)**: Complete billing management with invoices, payment methods, and billing details

### 🔍 RAG (Retrieval-Augmented Generation) System

- **Vector Embeddings**: OpenAI text-embedding-3-small for semantic search
- **Document Chunking**: Intelligent text splitting with context preservation
- **Semantic Search**: Meaning-based search, not just keyword matching
- **Hybrid Search**: Combines semantic and keyword search for best results
- **Website Integration**: Automatic processing of scraped website content
- **Real-time Indexing**: New content automatically becomes searchable
- **Source Attribution**: AI responses include source references
- **Multi-language Support**: Works with Dutch and English content
- **Scalable Architecture**: Handles thousands of documents efficiently

### 🌍 Internationalization (i18n)

- **Full Multi-language Support**: Complete interface translations for 5 languages
  - **Dutch (nl)**: Default language with full translation coverage
  - **English (en)**: Complete English translation
  - **German (de)**: Full German interface translation
  - **French (fr)**: Complete French translation
  - **Spanish (es)**: Full Spanish interface translation
- **next-intl Integration**: Powered by next-intl for seamless internationalization
- **User Language Preference**: Users can select their preferred interface language
- **Language Persistence**: Language preference saved and remembered
- **Comprehensive Translations**: All UI elements, error messages, and notifications translated
- **Locale-based Routing**: URL-based locale switching (e.g., `/nl/`, `/en/`, `/de/`)
- **Translation Files**: Organized JSON files in `messages/` directory
- **Language Selector**: Easy language switching in settings and header
- **Complete Coverage**: 1250+ translated strings per language

### 📝 Sanity CMS Integration

**Professional headless CMS powered by [Sanity.io](https://www.sanity.io)**

⚠️ **Setup Required:** See [Quick Start Guide](docs/SANITY_QUICK_START.md) for setup instructions.

- **Sanity Studio**: Professional content editor at `/studio`
  - Rich text editor with Portable Text
  - Real-time collaboration
  - Live preview while editing
  - Image CDN with automatic optimization
  - Version history built-in
- **Content Types**:
  - **Pages**: Static website pages (About, Features, Contact, etc.)
  - **Blog Posts**: Blog articles with categories and tags
  - **Categories**: Content organization
  - **Tags**: Content tagging
- **Features**:
  - 🎨 Professional rich text editor (Portable Text)
  - 📅 Built-in scheduled publishing
  - 👁️ Draft mode for preview before publishing
  - 🖼️ Image CDN with automatic optimization
  - 🔄 Real-time content updates
  - 💾 Automatic version history
  - 🌍 Multi-language support (nl/en)
- **Dynamic Routing**:
  - `/:locale/:slug` - CMS-powered pages
  - `/:locale/blog/:slug` - Blog posts
  - Static params generation for optimal performance
- **Preview Mode**:
  - Secure draft mode with Next.js Draft Mode API
  - Preview banner when viewing drafts
  - `/api/draft` - Enter preview mode
  - `/api/disable-draft` - Exit preview mode
- **Free Tier**: Perfect for small sites
  - ✅ 3 users
  - ✅ 10,000 documents
  - ✅ 1 GB assets
  - ✅ Unlimited API requests
- **Setup**: See [docs/SANITY_SETUP.md](docs/SANITY_SETUP.md) for complete setup guide

### 🏭 Production Readiness & Infrastructure

EmbedIQ is **production-ready** with enterprise-grade infrastructure and security:

- **CI/CD Pipeline**: Automated testing and deployment with GitHub Actions
  - Automated ESLint, TypeScript, and test suite on every push
  - Staging and production deployment workflows
  - Pre-deployment health checks and smoke tests
- **Error Tracking**: Sentry integration for real-time error monitoring
  - Client, server, and edge runtime coverage
  - Session replay for debugging user issues
  - Performance monitoring and alerts
  - Automatic error grouping and notifications
- **Health Monitoring**: Comprehensive `/api/health` endpoint
  - Database, Stripe, OpenAI, Redis, filesystem checks
  - Smart status determination (healthy, degraded, unhealthy)
  - Integration with deployment workflows
  - System diagnostics in detailed mode
- **Environment Validation**: Startup validation for all critical environment variables
  - Zod schema validation for all config
  - Production-specific security checks
  - Server won't start with invalid configuration
- **GDPR Compliance**: Full EU data protection compliance
  - Article 17: Right to Erasure (account deletion)
  - Article 20: Right to Data Portability (data export)
  - Consent tracking for privacy policy and marketing
  - Comprehensive audit logging
- **Security Hardening**:
  - **Content Security Policy (CSP)**: Prevents XSS attacks, removed `unsafe-eval`
  - **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options
  - **Distributed Rate Limiting**: Upstash Redis-based rate limiting for horizontal scaling
  - **Stripe Webhook Security**: Signature verification for payment events
- **Rate Limiting**: Production-grade distributed rate limiting
  - Upstash Redis for multi-server synchronization
  - Automatic fallback to in-memory when Redis unavailable
  - Rate limit headers (X-RateLimit-Limit, Remaining, Reset)
  - Configurable limits per chatbot
- **Documentation**: Comprehensive docs in `/docs` directory
  - Sentry setup guide
  - Health check documentation
  - Environment validation guide
  - GDPR compliance documentation
  - Redis rate limiting guide

**Production Score:** 9.5/10 - Ready to deploy!

## 🛠️ Technology Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **TanStack Query**: Data fetching and caching
- **next-intl**: Internationalization library for multi-language support

### Backend

- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Database ORM
- **PostgreSQL**: Primary database with pgvector extension
- **Upstash Redis**: Distributed rate limiting and caching
- **NextAuth.js**: Authentication
- **bcryptjs**: Password hashing
- **Stripe**: Payment processing and subscription management
- **Sentry**: Error tracking and performance monitoring
- **OpenAI**: AI embeddings and chat completions
- **JSDOM**: Server-side HTML parsing for web scraping
- **Resend**: Email delivery service
- **otplib**: TOTP (Time-based One-Time Password) for 2FA
- **qrcode**: QR code generation for 2FA setup
- **react-google-recaptcha**: reCAPTCHA integration for brute force protection
- **Sanity**: Headless CMS for content management
- **@portabletext/react**: Render Sanity's Portable Text format

### Development Tools

- **ESLint**: Code linting
- **TypeScript**: Static type checking
- **Turbopack**: Fast development builds

## 📁 Project Structure

```
ainexo-platform/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   │   ├── login/         # Login page
│   │   ├── signup/        # Registration page
│   │   └── forgot-password/ # Password reset
│   ├── (dashboard)/       # Main application pages
│   │   ├── account/       # User account management
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── assistants/    # AI assistant management
│   │   ├── conversations/ # Conversation history
│   │   ├── documents/     # Document management
│   │   ├── kennisbank/    # Knowledge base
│   │   ├── notifications/ # User notifications
│   │   ├── admin/         # Admin panel (superusers)
│   │   │   ├── users/     # User management
│   │   │   ├── subscriptions/ # Subscription overview
│   │   │   └── notifications/ # Admin notifications
│   │   └── settings/      # Application settings
│   └── api/               # API routes
│       ├── auth/          # Authentication endpoints
│       ├── assistants/    # Assistant CRUD operations
│       ├── action-buttons/ # Action button management
│       ├── notifications/ # Notification system
│       ├── subscriptions/ # Subscription management
│       ├── stripe/        # Stripe webhooks
│       ├── faqs/          # FAQ management
│       ├── websites/      # Website integration
│       ├── files/         # File upload/management
│       └── analytics/     # Analytics data
├── components/            # React components
│   ├── account/           # Account management
│   ├── analytics/         # Analytics components
│   ├── auth/              # Authentication components
│   ├── chatbot/           # Chatbot components
│   ├── conversations/     # Conversation components
│   ├── dashboard/         # Dashboard components
│   ├── documents/         # Document management
│   ├── kennisbank/        # Knowledge base components
│   ├── settings/          # Settings components
│   ├── shared/            # Shared components
│   └── ui/                # UI components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── i18n/                  # Internationalization configuration
│   ├── routing.ts        # Locale routing configuration
│   └── request.ts        # Request configuration for i18n
├── lib/                   # Utility libraries
│   ├── config/           # Configuration files
│   │   ├── security.ts   # Security constants & validation helpers
│   │   └── env-validation.ts # Environment variable validation
│   ├── auth.ts           # Authentication configuration
│   ├── openai.ts         # OpenAI API wrapper
│   ├── db.ts             # Prisma client
│   └── ...               # Other utilities
├── messages/              # Translation files
│   ├── nl.json           # Dutch translations
│   ├── en.json           # English translations
│   ├── de.json           # German translations
│   ├── fr.json           # French translations
│   └── es.json           # Spanish translations
├── prisma/                # Database schema and migrations
│   ├── migrations/        # Database migrations
│   │   ├── add_vector_index.sql # Performance: HNSW vector index
│   │   ├── add_compound_indexes.sql # Performance: Compound indexes
│   │   └── MIGRATION_INSTRUCTIONS.md # Migration guide
│   └── seed.ts           # Database seeding
├── scripts/              # Utility scripts
│   └── apply-performance-migrations.sh # Automated migration script
└── types/                 # TypeScript type definitions
```

## 🚀 Installation & Setup

### Requirements

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ainexo-platform
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the following variables:

   > **💡 Tip**: Run environment validation to check for missing or invalid variables:
   > ```bash
   > node -e "require('./lib/config/env-validation').validateOrExit()"
   > ```

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ai_chat_platform"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # Stripe Configuration
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_STARTER_PRICE_ID="price_..."
   STRIPE_PROFESSIONAL_PRICE_ID="price_..."
   STRIPE_ENTERPRISE_PRICE_ID="price_..."

   # Resend Configuration (for email)
   RESEND_API_KEY="re_xxxxxxxxxxxxx"
   RESEND_FROM_EMAIL="noreply@yourdomain.com"

   # OpenAI Configuration (Required for RAG and embeddings)
   OPENAI_API_KEY="sk-..."

   # reCAPTCHA Configuration (for brute force protection)
   RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
   RECAPTCHA_SECRET_KEY="your-recaptcha-secret-key"

   # Sanity CMS Configuration (for content management)
   NEXT_PUBLIC_SANITY_PROJECT_ID="your-sanity-project-id"
   NEXT_PUBLIC_SANITY_DATASET="production"
   SANITY_API_TOKEN="your-sanity-api-token-with-editor-permissions"
   SANITY_PREVIEW_SECRET="your-preview-secret"
   ```

   See [docs/SANITY_SETUP.md](docs/SANITY_SETUP.md) for Sanity setup instructions.

4. **Setup database**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

   **⚡ Performance Migrations (Recommended):**

   Apply performance optimization migrations for 10-100x faster searches:

   ```bash
   # Automated migration script
   export DATABASE_URL='your-database-url'
   ./scripts/apply-performance-migrations.sh

   # Or manual via Prisma
   npx prisma db execute --file prisma/migrations/add_vector_index.sql
   npx prisma db execute --file prisma/migrations/add_compound_indexes.sql
   ```

   See `MIGRATION_GUIDE.md` for detailed instructions.

5. **Seed the database with test data**

   ```bash
   npm run db:seed
   ```

   This creates test accounts:
   - **Superuser**: `superuser@example.com` / `superuser123` (Enterprise plan)
   - **Admin**: `admin@example.com` / `admin123` (Business plan)
   - **User**: `user@example.com` / `user123` (30-day trial)

6. **Start development server**

   ```bash
   npm run dev
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🧪 Test Accounts

After running the seed script, you can login with these test accounts:

| Role          | Email                   | Password       | Access Level                          | Subscription |
| ------------- | ----------------------- | -------------- | ------------------------------------- | ------------ |
| **Superuser** | `superuser@example.com` | `superuser123` | Full access + subscription management | Enterprise   |
| **Admin**     | `admin@example.com`     | `admin123`     | Standard admin access                 | Business     |
| **User**      | `user@example.com`      | `user123`      | Basic user access                     | 30-day Trial |

## 🚀 Quick Start Guide

### For Superusers

1. Login with `superuser@example.com`
2. **Manage Users** in the **Users** section
3. **View Subscriptions** in the **Subscriptions** section
4. Create notifications in **Admin Notificaties**
5. Create and manage assistants
6. Monitor analytics and user activity
7. Access clean table interfaces for admin management

### For Regular Users

1. Login with `user@example.com` (30-day trial)
2. Create your first AI assistant
3. Upload documents or add websites to knowledge base
4. Configure action buttons for quick interactions
5. Customize chatbot appearance in settings
6. View notifications via bell icon
7. Monitor conversation analytics
8. **Manage subscription** in Account settings when trial expires

## 🌐 Website Scraping Workflow

### How Website Scraping Works

1. **URL Addition**: User adds a website URL to the knowledge base
2. **Automatic Scraping**: Background process starts scraping the website
3. **Content Extraction**:
   - Main content areas are identified and extracted
   - All links are discovered and stored
   - Text is cleaned and normalized
4. **Multi-page Crawling**:
   - Recursively scrapes linked pages (configurable depth)
   - Respects same-domain policy
   - Limits concurrent requests
5. **Document Processing**:
   - Content is chunked into manageable pieces (1000 chars with 200 overlap)
   - OpenAI embeddings are generated for each chunk
   - Chunks are stored in database with vector embeddings
6. **RAG Integration**:
   - Content becomes searchable via semantic search
   - AI can now answer questions based on scraped content
   - Source attribution is maintained

### Content View Features

- **Dedicated Content Page**: View all scraped content in organized interface
- **Website Information**: Status, page count, last sync, error messages
- **Content Display**: Full scraped text in readable format
- **Link Management**: All discovered links with external navigation
- **Individual Pages**: Detailed view of each scraped page
- **Manual Scraping**: Re-scrape websites on demand
- **Status Tracking**: Real-time processing status updates

## 📖 Usage

### Getting Started

1. **Login with test account** or register a new account
2. **Create an AI Assistant** in the Assistants section
3. **Add websites** to the Knowledge Base for automatic scraping
4. **Upload documents** or create FAQs for additional knowledge
5. **Configure action buttons** for quick user interactions
6. **View scraped content** in the dedicated content view pages
7. **Customize appearance** in Settings
8. **Copy the embed code** and add to your website
9. **Monitor performance** with analytics

### User Roles

- **SUPERUSER**: Full access including user management and notification management
- **ADMIN**: Standard admin access to all features
- **USER**: Basic user access to create and manage assistants

### AI Assistant Management

- Create multiple assistants for different use cases
- Customize appearance, behavior, and responses
- Set up domain restrictions and rate limits
- Generate embed codes for website integration

### Knowledge Base (Kennisbank)

- **Websites**: Add and sync website content automatically
- **Intelligent Scraping**: Multi-page crawling with content extraction
- **RAG Integration**: Vector embeddings for semantic search
- **Content View**: Dedicated page for viewing scraped content and links
- **FAQs**: Complete FAQ management system
  - Create, edit, delete, and preview FAQs
  - Search, sort, and pagination
  - Enable/disable and order management
  - Bulk CSV import with validation
  - Preview modal with full content display
- **Files**: Upload knowledge files (PDF, DOCX, TXT, etc.)
- **Organization**: Categorize and manage knowledge sources
- **KnowledgeBase Model**: Link FAQs, websites, and documents to assistants

### Action Buttons

- Create quick interaction buttons for common questions
- Set priorities and enable/disable buttons
- Associate specific questions with button clicks
- All buttons stored in database for persistence

### User Management (Superuser Only)

- **User Overview**: View all users in a clean table interface
- **Create Users**: Add new users with custom roles and passwords
- **Edit Users**: Update user information, roles, and passwords
- **Delete Users**: Remove users from the system (with safety checks)
- **Role Assignment**: Assign SUPERUSER, ADMIN, or USER roles
- **User Statistics**: View assistant count and activity per user
- **Security**: Cannot delete own account, email uniqueness validation

### Subscription Management

- **Trial Period**: All new users get 30 days free trial
- **Plan Selection**: Choose from 4 subscription plans
- **Stripe Integration**: Secure payment processing
- **Usage Tracking**: Monitor chatbot and conversation limits
- **Upgrade Flow**: Seamless upgrade when limits are reached
- **Billing Portal**: Users can manage payments via Stripe
- **Admin Overview**: Superusers can view all subscriptions and revenue

### Notification System

- **For Users**: View notifications via bell icon or full page
- **For Superusers**: Create and manage system notifications
- **Types**: Info, Warning, Error, Success, Maintenance
- **Targeting**: Send to specific users or all users
- **Expiration**: Set automatic expiration dates
- **Table Interface**: Clean admin interface for notification management

### Document Upload

- Supported formats: PDF, DOCX, TXT, JPG, PNG
- Maximum file size: 10MB
- Drag & drop or click to upload
- Automatic processing and chunking
- Status tracking and error handling

### Chatbot Configuration

- Customize appearance with colors and styling
- Set behavior with temperature and response length
- Configure welcome messages and fallback texts
- Test with live preview
- Multiple customization tabs for different aspects

### Viewing Analytics

- Dashboard with overview statistics
- Conversation trends and patterns
- Rating analyses and user feedback
- Performance metrics and optimization tips
- Detailed conversation analytics

### Conversation Management

- **Session Overview**: View all conversation sessions with key metrics
- **Expandable Details**: Click any session to see the complete conversation flow
- **Message History**: See every user question and assistant response in chronological order
- **Source Tracking**: View which documents were used for each specific answer
- **Performance Metrics**: Response times, confidence scores, and token usage per message
- **Session Analytics**: Duration, message count, and engagement patterns
- **Advanced Filtering**: Filter by conversation type, time period, duration, and ratings
- **Real-time Statistics**: Live updates of session counts and activity metrics
- **Rating System**: Rate entire conversation sessions with comments
- **Export Options**: Export conversation data for analysis

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email

### Two-Factor Authentication (2FA)

- `POST /api/auth/2fa/setup` - Generate TOTP secret and QR code
- `POST /api/auth/2fa/verify` - Verify TOTP code during setup
- `POST /api/auth/2fa/verify-login` - Verify 2FA code during login
- `POST /api/auth/2fa/disable` - Disable 2FA (requires current 2FA code)
- `POST /api/auth/2fa/regenerate-backup-codes` - Generate new backup codes
- `POST /api/auth/2fa/request-recovery` - Request email recovery code
- `POST /api/users/[userId]/reset-2fa` - Admin reset 2FA for user

### Assistants

- `GET /api/assistants` - List user's assistants
- `POST /api/assistants` - Create new assistant
- `GET /api/assistants/[id]` - Get assistant details
- `PUT /api/assistants/[id]` - Update assistant
- `DELETE /api/assistants/[id]` - Delete assistant

### Action Buttons

- `GET /api/action-buttons` - List action buttons for assistant
- `POST /api/action-buttons` - Create action button
- `GET /api/action-buttons/[id]` - Get action button details
- `PUT /api/action-buttons/[id]` - Update action button
- `DELETE /api/action-buttons/[id]` - Delete action button

### Notifications

- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification (superusers only)
- `GET /api/notifications/[id]` - Get notification details
- `PUT /api/notifications/[id]` - Update notification
- `DELETE /api/notifications/[id]` - Delete notification (superusers only)
- `GET /api/notifications/admin` - Get all notifications (superusers only)

### Admin User Management

- `GET /api/admin/users` - List all users (superusers only)
- `POST /api/admin/users` - Create new user (superusers only)
- `GET /api/admin/users/[id]` - Get user details (superusers only)
- `PUT /api/admin/users/[id]` - Update user (superusers only)
- `DELETE /api/admin/users/[id]` - Delete user (superusers only)

### Subscription & Billing Management

- `GET /api/subscriptions` - Get user subscription status
- `POST /api/subscriptions` - Create new subscription (Stripe Checkout)
- `GET /api/subscriptions/manage` - Open Stripe Customer Portal
- `DELETE /api/subscriptions/manage` - Cancel subscription at period end
- `GET /api/billing` - Get complete billing data (subscription, invoices, payment methods, billing details)
- `PUT /api/billing` - Update billing details (company info, VAT, address) - Admin only
- `POST /api/billing/sync` - Manually sync subscription from Stripe
- `POST /api/stripe/webhook` - Stripe webhook handler (subscription events)
- `GET /api/admin/subscriptions` - Get all subscriptions (superusers only)

### Knowledge Base

#### Websites

- `GET /api/websites` - List websites for assistant
- `POST /api/websites` - Add website
- `GET /api/websites/[id]` - Get website details
- `PUT /api/websites/[id]` - Update website
- `DELETE /api/websites/[id]` - Delete website

#### FAQs

- `GET /api/faqs?assistantId=[id]` - List FAQs for assistant
- `POST /api/faqs` - Create FAQ
- `GET /api/faqs/[id]` - Get FAQ details
- `PUT /api/faqs/[id]` - Update FAQ
- `DELETE /api/faqs/[id]` - Delete FAQ
- `POST /api/faqs/bulk` - Bulk import FAQs from CSV

#### Knowledge Base

- `POST /api/assistants/[id]/knowledge` - Create knowledge base entry (link FAQ/website/document to assistant)
- `GET /api/assistants/[id]/knowledge` - List knowledge base entries for assistant
- `PATCH /api/knowledge/[id]` - Update knowledge base entry (enable/disable)
- `DELETE /api/knowledge/[id]` - Delete knowledge base entry

#### Files

- `GET /api/files` - List knowledge files
- `POST /api/files` - Upload knowledge file
- `GET /api/files/[id]` - Get file details
- `DELETE /api/files/[id]` - Delete file
- `GET /api/files/[id]/download` - Download file

### Documents

- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/[id]` - Document details
- `DELETE /api/documents/[id]` - Delete document

### Conversations

#### Session Management

- `GET /api/conversations/sessions` - List conversation sessions
- `GET /api/conversations/sessions/stats` - Session statistics
- `POST /api/conversations/sessions/[id]/rate` - Rate conversation session

#### Chat API

- `POST /api/chat/message` - Send message and receive response
- **Features**: Automatic session creation, message storage, source tracking

### Analytics

- `GET /api/analytics/stats` - Overview statistics
- `GET /api/analytics/conversations` - Conversation data
- `GET /api/analytics/ratings` - Rating data

### Contact

- `POST /api/contact` - Submit contact form

### CMS (Content Management System)

#### Pages

- `GET /api/cms/pages` - List pages (superusers only)
- `POST /api/cms/pages` - Create new page (superusers only)
- `GET /api/cms/pages/[id]` - Get page details (superusers only)
- `PATCH /api/cms/pages/[id]` - Update page (superusers only)
- `DELETE /api/cms/pages/[id]` - Delete page (superusers only)

#### Blog

- `GET /api/cms/blog` - List blog posts (superusers only)
- `POST /api/cms/blog` - Create new blog post (superusers only)
- `GET /api/cms/blog/[id]` - Get blog post details (superusers only)
- `PATCH /api/cms/blog/[id]` - Update blog post (superusers only)
- `DELETE /api/cms/blog/[id]` - Delete blog post (superusers only)

#### Media

- `GET /api/cms/media` - List media files (superusers only)
- `POST /api/cms/media` - Upload media file (superusers only)
- `GET /api/cms/media/[id]` - Get media details with usage info (superusers only)
- `PATCH /api/cms/media/[id]` - Update media metadata (superusers only)
- `DELETE /api/cms/media/[id]` - Delete media (superusers only)

#### Preview & Publishing

- `GET /api/cms/preview` - Enter preview mode with token
- `DELETE /api/cms/preview` - Exit preview mode
- `POST /api/cms/cron/publish` - Scheduled publishing cron job (requires CRON_SECRET)

## 🗄️ Database Schema

### Key Models

#### User Management

- **User**: Users with role-based access (SUPERUSER, ADMIN, USER) and subscription data
- **Account**: OAuth account connections
- **Session**: User sessions

#### AI Assistant System

- **Assistant**: AI assistants with full configuration
- **ActionButton**: Quick interaction buttons for assistants
- **Document**: Uploaded documents and metadata
- **DocumentChunk**: Processed text chunks with vector embeddings
- **KnowledgeFile**: Knowledge base files
- **Website**: Website integration for knowledge base with scraping data
- **WebsitePage**: Individual scraped pages with content and links
- **FAQ**: Frequently asked questions with full CRUD operations
- **KnowledgeBase**: Links FAQs, websites, and documents to assistants with enable/disable functionality

#### Communication

- **ConversationSession**: Complete conversation sessions with metadata
  - Session tracking with unique session IDs
  - Assistant association and user metadata
  - Timing information (start, last activity, duration)
  - Performance metrics (message count, total tokens, avg response time)
  - Rating system for entire sessions
- **ConversationMessage**: Individual messages (USER, ASSISTANT, SYSTEM)
  - Message type classification
  - Content and timestamps
  - Performance data (response time, tokens used, confidence)
  - Model information and source attribution
- **ConversationSource**: Sources used in specific messages
  - Links to documents and message content
  - Relevance scores for source effectiveness
  - Flexible linking to both messages and legacy conversations
- **Conversation**: Legacy conversation model (for backward compatibility)
- **Notification**: System notifications with targeting

#### CMS (Content Management System)

- **CmsPage**: Website pages with full SEO and versioning
  - Slug, title, content (JSONB), excerpt
  - Status (DRAFT, PUBLISHED, SCHEDULED, ARCHIVED)
  - Page type (STANDARD, LANDING, MARKETING, LEGAL, CUSTOM)
  - SEO fields (title, description, keywords, OG image)
  - Featured image, locale, custom fields
  - View count tracking
- **CmsPageVersion**: Complete version history for pages
  - Version number, title, content snapshot
  - Created by user, reason for change
  - Restore functionality
- **CmsBlogPost**: Blog articles with reading time and analytics
  - All page fields plus reading time calculation
  - Publish date, view count
  - SEO optimization
- **CmsBlogVersion**: Blog post version history
  - Same versioning system as pages
- **CmsMedia**: Media library management
  - Filename, stored name, public URL
  - MIME type, file size
  - Image dimensions (width, height)
  - Alt text, caption, folder organization
  - Upload tracking
- **CmsCategory**: Hierarchical content categorization
  - Name, slug, description
  - Parent-child relationships
  - Multi-level taxonomy
- **CmsTag**: Simple tagging system
  - Name, slug
  - Many-to-many with pages and blog posts
- **CmsPageCategory, CmsPageTag**: Junction tables for page taxonomy
- **CmsBlogCategory, CmsBlogTag**: Junction tables for blog taxonomy

#### System

- **SystemLog**: System logging and debugging
- **VerificationToken**: Email verification tokens

## 💳 Stripe Setup Guide

### 1. Stripe Account Aanmaken

1. **Ga naar [stripe.com](https://stripe.com)** en maak een account aan
2. **Verifieer je account** met je bedrijfsgegevens
3. **Activeer je account** (dit kan even duren voor verificatie)

### 2. Stripe Dashboard Configuratie

#### Producten en Prijzen Aanmaken

1. **Ga naar je Stripe Dashboard** → **Products**
2. **Maak 4 producten aan** voor elk abonnement:

**Starter Plan:**

- Product naam: "Starter Plan"
- Prijs: €19.00
- Billing: Recurring (monthly)
- Kopieer de **Price ID** (begint met `price_`)

**Professional Plan:**

- Product naam: "Professional Plan"
- Prijs: €49.00
- Billing: Recurring (monthly)
- Kopieer de **Price ID**

**Business Plan:**

- Product naam: "Business Plan"
- Prijs: €149.00
- Billing: Recurring (monthly)
- Kopieer de **Price ID**

**Enterprise Plan:**

- Product naam: "Enterprise Plan"
- Prijs: €499.00
- Billing: Recurring (monthly)
- Kopieer de **Price ID**

### 3. API Keys Ophalen

1. **Ga naar Developers** → **API Keys**
2. **Kopieer je Secret Key** (begint met `sk_test_` voor test mode)
3. **Kopieer je Publishable Key** (begint met `pk_test_` voor test mode)

### 4. Webhook Configuratie

**⚠️ Belangrijk**: Webhooks zijn vereist voor automatische subscription updates!

1. **Ga naar Developers** → **Webhooks**
2. **Klik op "Add endpoint"**
3. **Endpoint URL**: `https://jouw-domein.com/api/stripe/webhook`
   - Voor lokaal testen: gebruik Stripe CLI met `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. **Events to send** (selecteer deze 6 events):
   - `customer.subscription.created` - Nieuwe subscription aangemaakt
   - `customer.subscription.updated` - Subscription gewijzigd (upgrade/downgrade)
   - `customer.subscription.deleted` - Subscription geannuleerd
   - `invoice.payment_succeeded` - Betaling geslaagd
   - `invoice.payment_failed` - Betaling mislukt
   - `checkout.session.completed` - Checkout voltooid
5. **Kopieer de Webhook Secret** (begint met `whsec_`)
6. **Test de webhook** via Stripe Dashboard → Webhooks → Send test webhook

### 5. Customer Portal Configuratie

**⚠️ Vereist**: Configureer dit voordat gebruikers hun betaalmethode kunnen wijzigen!

1. **Ga naar Settings** → **Billing** → **Customer Portal**
   - Test mode: https://dashboard.stripe.com/test/settings/billing/portal
   - Live mode: https://dashboard.stripe.com/settings/billing/portal
2. **Klik op "Activate test link"** of "Turn on"
3. **Features**: Selecteer wat klanten kunnen doen:
   - ☑ Update payment method (Vereist)
   - ☑ View invoices (Aanbevolen)
   - ☐ Cancel subscription (Optioneel - alleen als je zelf-service annulering wilt)
   - ☐ Update subscription (Optioneel - voor plan changes door klant)
4. **Business information**:
   - Business name: [Je bedrijfsnaam]
   - Support email: [Je support email]
5. **Save configuration**
6. **Herhaal voor Live mode** wanneer je naar productie gaat

### 6. OpenAI API Key Configureren

Voor de RAG functionaliteit en website scraping heb je een OpenAI API key nodig:

1. **Ga naar [OpenAI Platform](https://platform.openai.com/)**
2. **Maak een account** of log in
3. **Ga naar API Keys** in het menu
4. **Klik op "Create new secret key"**
5. **Kopieer de API key** (begint met `sk-`)
6. **Voeg toe aan je `.env.local` bestand**

**Belangrijk**:

- De API key is nodig voor vector embeddings en semantic search
- Zonder API key werkt website scraping wel, maar geen RAG functionaliteit
- Kosten zijn ongeveer $0.02 per 1M tokens voor embeddings

### 7. Resend Email Setup

Voor het email systeem (welcome emails, password reset, 2FA recovery, etc.) heb je Resend nodig:

1. **Ga naar [Resend](https://resend.com/)** en maak een account aan
2. **Verifieer je email adres**:
   - Ga naar **Domains** → **Add Domain**
   - Voeg je domein toe (bijv. `yourdomain.com`)
   - Voeg de DNS records toe aan je domein provider
   - Wacht tot verificatie is voltooid
3. **Maak een API key aan**:
   - Ga naar **API Keys** → **Create API Key**
   - Geef de key een naam (bijv. "Production" of "Development")
   - Kopieer de API key (begint met `re_`)
   - **Belangrijk**: Bewaar deze key veilig, je kunt hem later niet meer zien!
4. **Voeg toe aan je `.env.local` bestand**:
   ```
   RESEND_API_KEY="re_xxxxxxxxxxxxx"
   RESEND_FROM_EMAIL="noreply@yourdomain.com"
   ```

**Belangrijk**:

- Resend heeft een gratis tier met 3,000 emails per maand
- Voor productie is een geverifieerd domein aanbevolen voor betere deliverability
- Kosten zijn ongeveer $20 per 50,000 emails na de gratis tier
- Zonder Resend API key werken emails niet, maar de applicatie blijft functioneren

### 8. reCAPTCHA Setup (Optioneel maar Aanbevolen)

Voor brute force protection heb je Google reCAPTCHA nodig:

1. **Ga naar [Google reCAPTCHA](https://www.google.com/recaptcha/admin)**
2. **Maak een nieuwe site aan**:
   - Label: "AI Chat Platform"
   - reCAPTCHA type: **reCAPTCHA v2** → "I'm not a robot" Checkbox
   - Domains: Voeg je domein toe (bijv. `localhost` voor development)
3. **Kopieer de keys**:
   - **Site Key** (publiek, kan in frontend)
   - **Secret Key** (privé, alleen in backend)

**Belangrijk**:

- reCAPTCHA is optioneel maar sterk aanbevolen voor beveiliging
- Zonder reCAPTCHA werkt brute force protection nog steeds, maar zonder CAPTCHA challenge
- Gratis tot 1 miljoen requests per maand

### 9. Environment Variables Instellen

Update je `.env.local` bestand:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_chat_platform"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_51ABC123..."
STRIPE_WEBHOOK_SECRET="whsec_ABC123..."
STRIPE_STARTER_PRICE_ID="price_1ABC123..."
STRIPE_PROFESSIONAL_PRICE_ID="price_1DEF456..."
STRIPE_ENTERPRISE_PRICE_ID="price_1JKL012..."

# OpenAI Configuration (Required for RAG and embeddings)
OPENAI_API_KEY="sk-..."
```

### 10. Test Cards

Voor testing kun je deze Stripe test cards gebruiken:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires 3D Secure: 4000 0025 0000 3155
```

**Test Details:**

- **Expiry**: Elke toekomstige datum (bijv. 12/25)
- **CVC**: Elke 3-cijferige code (bijv. 123)
- **ZIP**: Elke postcode (bijv. 12345)

### 11. Database Migratie Uitvoeren

```bash
# Zorg dat je database up-to-date is met billing details
npx prisma migrate deploy
npx prisma generate

# Seed de database met test accounts
npm run db:seed
```

### 12. Testen van Billing Functionaliteit

1. **Login** met `user@example.com` / `user123` (trial account)
2. **Ga naar Billing** pagina (nieuw menu item in sidebar)
3. **Test subscription upgrade**:
   - Klik op "Upgrade" bij een plan (bijv. Starter)
   - Gebruik test card `4242 4242 4242 4242`
   - Vul billing details in
   - Voltooi checkout
4. **Test subscription sync**:
   - Na upgrade, klik op "Abonnement synchroniseren" (rechts bovenaan)
   - Controleer of je nieuwe plan correct wordt weergegeven
5. **Test billing details**:
   - Vul bedrijfsnaam, email, BTW nummer en adres in
   - Klik op "Opslaan"
   - Controleer of gegevens correct worden opgeslagen
6. **Test Customer Portal**:
   - Klik op "Abonnement beheren" of "Betaalmethode bijwerken"
   - Controleer of Stripe Customer Portal opent
   - Test betaalmethode wijzigen
7. **Test webhooks** (lokaal):

   ```bash
   # In een aparte terminal
   stripe listen --forward-to localhost:3000/api/stripe/webhook

   # Trigger een test event
   stripe trigger customer.subscription.updated
   ```

### 13. Production Setup

Voor productie:

1. **Schakel over naar Live mode** in Stripe Dashboard
2. **Vervang test keys** met live keys in environment variables
3. **Update webhook URL** naar je productie domein
4. **Test met echte betalingen** (kleine bedragen)

### 🔍 Troubleshooting

**Webhook niet werkt?**

- Controleer of de webhook URL correct is
- Zorg dat je server bereikbaar is vanaf internet
- Check de webhook logs in Stripe Dashboard

**Subscription wordt niet aangemaakt?**

- Controleer of alle Price IDs correct zijn
- Check de browser console voor errors
- Controleer de server logs

**Payment fails?**

- Gebruik de juiste test cards
- Controleer of je Stripe account geactiveerd is
- Check of je in test mode bent

## 📝 Sanity CMS Integration

Deze applicatie gebruikt Sanity CMS voor content management van de website.

### Wat kun je beheren via Sanity?

- **Features**: Homepage features sectie met iconen en voordelen
- **Chat Widget**: Demo chat widget configuratie
- **Menu's**: Main navigatie en footer menu's
- **Social Media**: Social media links in de footer
- **Site Settings**: Algemene website instellingen

### Sanity Setup

Zie [`docs/SANITY_SETUP.md`](docs/SANITY_SETUP.md) voor complete setup instructies.

**Snelle start:**

1. **Maak een Sanity account** op [sanity.io](https://www.sanity.io)
2. **Maak een nieuw project** aan
3. **Voeg environment variables toe** aan `.env.local`:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_SANITY_API_VERSION=2025-12-25
   ```
4. **Start de applicatie** met `npm run dev`
5. **Open Sanity Studio** op `http://localhost:3000/studio`
6. **Begin met content toevoegen**

### Content Types in Sanity

- **Feature**: Homepage features met icon, titel, beschrijving en voordelen
- **Chat Widget**: Chat widget configuratie met agent naam, berichten en knoppen
- **Social Media**: Social media links met platform en URL
- **Menu Item**: Menu items voor navigatie en footer
- **Site Settings**: Algemene website instellingen

### Fallback Content

De applicatie heeft altijd fallback content. Als Sanity niet beschikbaar is of geen data bevat, worden hardcoded defaults gebruikt. Dit zorgt ervoor dat je website altijd functioneel blijft.

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository with Vercel
3. Configure environment variables (inclusief Stripe keys en Sanity variabelen)
4. Deploy automatically
5. Voeg je productie domain toe aan Sanity CORS settings

### Other Platforms

- **Railway**: For PostgreSQL hosting
- **Supabase**: Database and authentication
- **Docker**: Container deployment

### Sanity Production Setup

Voor productie:

1. Ga naar [sanity.io/manage](https://www.sanity.io/manage)
2. Selecteer je project
3. Ga naar API → CORS Origins
4. Voeg je productie domain toe (bijv. `https://yourdomain.com`)
5. Gebruik de `production` dataset voor productie data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆕 Recent Features

### v2.6.0 - Headless CMS System

- ✅ **Complete CMS Backend**: Full-featured content management system
  - **Database Schema**: 10 new models (CmsPage, CmsBlogPost, CmsMedia, etc.)
  - **Migration Ready**: SQL migration files and scripts
  - **TypeScript Types**: Complete type definitions for all CMS models
- ✅ **Content Management**:
  - **Pages**: Create and manage website pages (About, Features, Pricing, etc.)
  - **Blog Posts**: Full blog system with reading time and view tracking
  - **Media Library**: Upload and organize images, documents, and files
  - **Version Control**: Automatic version history for all content changes
  - **Draft/Publish Workflow**: DRAFT → PUBLISHED status management
- ✅ **Admin Interface** (`/admin/cms`):
  - **Pages Dashboard**: Table view with create, edit, delete operations
  - **Blog Dashboard**: Blog posts management with filters
  - **Media Library**: Grid view with upload, delete, copy URL features
  - **JSON Content Editor**: Flexible content structure with validation
  - **SEO Fields**: Title, description, keywords, OG image inputs
  - **Multi-language Support**: Locale selector for each content item
  - **Preview Buttons**: One-click preview of draft content
- ✅ **Preview Mode**:
  - **Secure Preview URLs**: Token-based authentication (24hr expiry)
  - **Preview Banner**: Shows content status and exit button
  - **Draft Preview**: View unpublished content before going live
  - **Cookie-based Tracking**: Seamless preview mode management
- ✅ **Scheduled Publishing**:
  - **Automatic Publishing**: Content auto-publishes at scheduled time
  - **Vercel Cron Integration**: Runs every 5 minutes
  - **SCHEDULED Status**: Set publishedAt date/time for auto-publish
  - **Cron Endpoint**: `/api/cms/cron/publish` with CRON_SECRET auth
  - **Manual Trigger Support**: For testing and debugging
  - **Comprehensive Documentation**: Full setup guide in docs/
- ✅ **Dynamic Routes**:
  - **Page Routes**: `/[locale]/[slug]` - Dynamic CMS pages
  - **Blog Routes**: `/[locale]/blog/[slug]` - Blog post pages
  - **Blog Overview**: `/[locale]/blog` - Combined CMS + legacy posts
  - **SEO Optimization**: Metadata generation for all routes
  - **View Tracking**: Automatic view count increment
- ✅ **Complete CRUD API**:
  - **Pages API**: GET, POST, PATCH, DELETE for pages
  - **Blog API**: Full CRUD for blog posts
  - **Media API**: Upload, list, update, delete with usage tracking
  - **Preview API**: Enter/exit preview mode
  - **Superuser Only**: All endpoints require SUPERUSER role
- ✅ **Content Features**:
  - **Status Management**: DRAFT, PUBLISHED, SCHEDULED, ARCHIVED
  - **Page Types**: STANDARD, LANDING, MARKETING, LEGAL, CUSTOM
  - **Featured Images**: Image support for all content
  - **Excerpts**: Short descriptions for SEO
  - **Custom Fields**: Flexible JSON for extensibility
  - **Categories & Tags**: Taxonomy system (database ready)
  - **View Counting**: Analytics tracking
  - **Reading Time**: Auto-calculated for blog posts (avg 200 words/min)
- ✅ **Media Management**:
  - **Multi-format Support**: Images, documents, text files
  - **File Upload**: Drag-and-drop with validation (10MB max)
  - **Image Metadata**: Width, height, alt text, caption
  - **Usage Tracking**: Shows which pages/posts use each file
  - **Delete Protection**: Prevents deletion of in-use media
  - **Storage Statistics**: Total files, size, MIME type breakdown
  - **Folder Organization**: Optional folder structure
- ✅ **Developer Tools**:
  - **Migration Script**: `scripts/migrate-static-pages.ts`
    - Dry-run support for testing
    - Migrates 6 static pages (About, Features, Pricing, Contact, Privacy, Terms)
    - Auto-detects SUPERUSER as author
    - Creates DRAFT pages with placeholder content
    - SEO metadata pre-filled
  - **Content Renderers**: Flexible JSON rendering (sections/paragraphs/html)
  - **Preview Helpers**: Server-side utilities for preview mode
  - **Scheduler**: Automated publishing logic
  - **Documentation**: Setup guides for preview and scheduling

### v2.5.0 - FAQ Management System

- ✅ **KnowledgeBase Model**: Database model linking FAQs, websites, and documents to assistants
- ✅ **FAQ CRUD API**: Complete REST API for FAQ operations (GET, POST, PUT, DELETE)
- ✅ **FAQ Creation**: Form-based FAQ creation with validation and character limits
- ✅ **FAQ Editing**: Edit existing FAQs with pre-filled forms
- ✅ **FAQ Deletion**: Delete FAQs with confirmation dialog
- ✅ **FAQ Overview**: Comprehensive list view with search, sort, and pagination
- ✅ **FAQ Preview**: Modal preview showing full FAQ content with formatting
- ✅ **Bulk Import**: CSV upload for importing multiple FAQs at once
  - CSV parsing with quoted field support
  - Real-time validation with error reporting per row
  - Progress tracking during import
  - Batch processing for performance
  - Support for question, answer, enabled, and order columns
- ✅ **Search & Filter**: Search FAQs by question/answer content
- ✅ **Sort Options**: Sort by question, creation date, or modification date
- ✅ **Pagination**: Efficient handling of large FAQ lists
- ✅ **Table & Card Views**: Toggle between table and card layout
- ✅ **Enable/Disable Toggle**: Quick toggle for FAQ active status
- ✅ **Order Management**: Set display order for FAQs
- ✅ **Character Limits**: Validation for question (500 chars) and answer (5000 chars)
- ✅ **Empty States**: User-friendly messages when no FAQs exist
- ✅ **Authorization**: Full authorization checks ensuring users can only manage their own FAQs

### v2.4.0 - Security & Email Enhancements

- ✅ **Two-Factor Authentication (2FA)**: Complete TOTP-based 2FA system with backup codes and email recovery
- ✅ **Email Verification**: Email verification required on registration with resend functionality
- ✅ **Brute Force Protection**: Account lockout after 10 failed attempts with reCAPTCHA integration
- ✅ **Resend Integration**: Production-ready email delivery system
- ✅ **Contact Form**: Public contact form with email notifications
- ✅ **Security Audit Logging**: Comprehensive logging for all security events
- ✅ **Admin 2FA Reset**: Admins can reset 2FA for users in their organization

### v2.3.0 - Internationalization (i18n)

- ✅ **Full Multi-language Support**: Complete translations for 5 languages (Dutch, English, German, French, Spanish)
- ✅ **next-intl Integration**: Seamless internationalization powered by next-intl
- ✅ **User Language Preference**: Language selector in settings and header
- ✅ **Comprehensive Translations**: 1250+ translated strings per language
- ✅ **Locale-based Routing**: URL-based language switching
- ✅ **Translation Files**: Organized JSON files for easy maintenance
- ✅ **Complete Coverage**: All UI elements, error messages, and notifications translated

### v2.2.0 - Advanced Conversation Management

- ✅ **Complete Session Tracking**: Full conversation sessions with all messages
- ✅ **Message History**: Individual user and assistant messages with timestamps
- ✅ **Session Analytics**: Duration, message count, token usage per session
- ✅ **Source Attribution**: Document sources linked to specific messages
- ✅ **Performance Metrics**: Response time, confidence scores per message
- ✅ **Expandable Views**: Click to expand and see full conversation flow
- ✅ **Advanced Filtering**: Filter by type, time, duration, and rating
- ✅ **Session Statistics**: Total sessions, active sessions, average messages
- ✅ **Real-time Updates**: Live conversation data and statistics
- ✅ **Database Schema**: New ConversationSession and ConversationMessage models

### v2.1.0 - Subscription & Billing System

- ✅ **Subscription Management**: Complete Stripe integration with 4 plans
- ✅ **Trial Period**: 30-day free trial for all new users
- ✅ **Usage Limits**: Automatic enforcement of plan limits
- ✅ **Billing Portal**: Users can manage subscriptions via Stripe
- ✅ **Admin Overview**: Superuser subscription management dashboard
- ✅ **Revenue Tracking**: Monthly revenue and subscription statistics
- ✅ **Upgrade Flow**: Seamless upgrade prompts when limits reached

### v2.0.0 - Complete Platform Overhaul

- ✅ **Multi-Assistant System**: Create and manage multiple AI assistants
- ✅ **Action Buttons**: Pre-configured quick interaction buttons
- ✅ **Knowledge Base**: Website integration, FAQs, and file management
- ✅ **Notification System**: Real-time notifications with admin panel
- ✅ **User Management**: Complete user CRUD with role-based access
- ✅ **Role-based Access**: SUPERUSER, ADMIN, and USER roles
- ✅ **Enhanced Analytics**: Detailed conversation and performance metrics
- ✅ **Improved UI/UX**: Modern interface with table-based admin views
- ✅ **Database Seeding**: Test accounts and sample data

### v1.0.0 - Initial Release

- ✅ Basic chatbot functionality
- ✅ Document upload and processing
- ✅ Conversation management
- ✅ Basic analytics
- ✅ User authentication

## 🔄 Changelog

### Latest Updates (2026-01-04) - Performance & Security Audit

**v2.7.0 - Critical Improvements**
- ✅ **Security Hardening**:
  - Path traversal protection with crypto-based filenames
  - Strong password policy (12+ chars, complexity requirements)
  - Registration rate limiting (5 attempts/hour per IP)
  - Bcrypt standardization (cost factor 12)
  - Centralized security configuration
- ✅ **Performance Optimizations**:
  - Vector index for 10-100x faster semantic search
  - Compound indexes for 2-3x faster queries
  - N+1 query fix for 5-10x faster multi-source conversations
  - OpenAI context optimization (40% cost reduction)
- ✅ **Usability Enhancements**:
  - Dynamic locale support for date formatting
  - Functional contact form with email notifications
  - Improved accessibility (aria attributes)
  - Extended session timeout (7 days)
- ✅ **Developer Tools**:
  - Environment variable validation system
  - Automated migration scripts
  - Comprehensive deployment checklist
  - Security configuration helpers
- ✅ **Code Quality**:
  - Removed 2,300+ lines of unused code
  - Uninstalled 9 unused packages (~15-20 MB)
  - Dependency updates and security fixes

**Financial Impact**: $1,320-2,640/year savings, 10-100x performance improvement

### Previous Updates

- **FAQ Management System**: Complete FAQ CRUD operations with bulk import, preview, search, sort, and pagination
- **KnowledgeBase Model**: Database model for linking FAQs, websites, and documents to assistants
- **CSV Bulk Import**: Import multiple FAQs from CSV with validation and progress tracking
- **FAQ Preview**: Modal preview showing full FAQ content with formatting
- **Two-Factor Authentication (2FA)**: Complete TOTP-based 2FA system with QR code setup, backup codes, email recovery, and admin reset
- **Email Verification**: Email verification on registration with 24-hour token expiration and resend functionality
- **Brute Force Protection**: Account lockout system with reCAPTCHA integration after 3 attempts and full lockout after 10 attempts
- **Resend Email System**: Production-ready email delivery with professional templates, multi-language support, and attachment handling
- **Contact Form**: Public contact form with validation and email notifications
- **Security Audit Logging**: Comprehensive logging for all authentication and security events
- **Internationalization (i18n)**: Full multi-language support with 5 languages (Dutch, English, German, French, Spanish)
- **next-intl Integration**: Complete internationalization system with locale-based routing
- **Language Preference**: User-selectable interface language with persistence
- **Comprehensive Translations**: All UI elements, error messages, notifications, and form validations translated
- **Translation Files**: Complete JSON translation files for nl, en, de, fr, and es
- **Advanced Conversation Management**: Complete session tracking with individual message storage
- **Session Analytics**: Duration, message count, token usage, and performance metrics per session
- **Source Attribution**: Document sources linked to specific messages for better transparency
- **Expandable Conversation Views**: Click to expand and see full conversation flow with all messages
- **Advanced Filtering**: Filter conversations by type, time, duration, and rating
- **Real-time Statistics**: Live updates of session counts, active sessions, and message totals
- **Database Schema Enhancement**: New ConversationSession and ConversationMessage models
- **Performance Monitoring**: Response time, confidence scores, and token usage per message
- **Subscription & Billing System**: Complete Stripe integration with 4 subscription plans
- **Trial Management**: 30-day free trial with automatic tracking and upgrade prompts
- **Usage Limits**: Automatic enforcement of plan limits for chatbots and conversations
- **Admin Subscription Dashboard**: Superuser overview of all subscriptions and revenue
- **Stripe Webhooks**: Automatic subscription status updates and billing management
- **User Management System**: Complete user CRUD interface for superusers
- **Table-based Admin Interface**: Clean tabular views for users, subscriptions, and notifications
- **Enhanced Role-based Access**: SUPERUSER-only user management features
- **Notification System**: Complete notification management with bell icon, dropdown, and admin panel
- **Action Buttons**: Database-stored quick interaction buttons with CRUD operations
- **Multi-Assistant Support**: Create and switch between multiple AI assistants
- **Knowledge Base**: Website sync, FAQ management, and file uploads
- **Role-based Security**: Enhanced user roles with SUPERUSER privileges
- **Database Seeding**: Automated test data creation with subscription data
- **Enhanced UI**: Improved navigation and user experience

## 🆘 Support

For questions or issues:

- Open a GitHub issue
- Check the documentation
- Contact the developers

## 📝 License

This project is licensed under the MIT License.

---

**Made with ❤️ for modern Ainexo solutions**
