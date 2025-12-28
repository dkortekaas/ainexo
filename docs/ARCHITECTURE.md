# Architectuur & Tech Stack

## Overzicht

Het Ainexo bestaat uit drie hoofdcomponenten:

1. **Admin Portal** - Next.js applicatie voor beheer
2. **Backend API** - Next.js API routes
3. **Chatbot Widget** - Standalone React applicatie

## Architectuur Diagram

┌─────────────────────────────────────────────────────────┐
│ Admin Portal │
│ (Next.js + React + shadcn/ui) │
└─────────────────────────────────────────────────────────┘
│
│ API Calls
▼
┌─────────────────────────────────────────────────────────┐
│ Backend API │
│ (Next.js API Routes) │
│ ┌────────────────────────────────────────────────────┐ │
│ │ • Authentication (Auth.js v5) │ │
│ │ • Document Processing │ │
│ │ • RAG Pipeline (OpenAI + pgvector) │ │
│ │ • Conversation Management │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
│ │ │
▼ ▼ ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Neon DB │ │ OpenAI API │ │ Vercel Blob │
│ (PostgreSQL) │ │ (GPT-4) │ │ Storage │
└──────────────┘ └──────────────┘ └──────────────┘
│
└── pgvector extension
▲
│ Embed Script
┌─────────────────────────────────────────────────────────┐
│ Chatbot Widget │
│ (Standalone React Bundle) │
│ Embedded in customer websites via <script> tag │
└─────────────────────────────────────────────────────────┘

## Tech Stack Details

### Frontend

#### Admin Portal

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: React Query (TanStack Query)
- **Icons**: Lucide React

#### Chatbot Widget

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS (Shadow DOM isolation)
- **Bundle Format**: IIFE (Immediately Invoked Function Expression)

### Backend

- **Framework**: Next.js 14+ API Routes
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Authentication**: Auth.js v5 (NextAuth.js)
- **Validation**: Zod
- **API Format**: REST

### Database

- **Provider**: Neon (Serverless PostgreSQL)
- **ORM**: Prisma
- **Extensions**: pgvector (for embeddings)
- **Connection Pooling**: Built-in (PgBouncer)

### AI & ML

- **LLM Provider**: OpenAI
- **Models**:
  - `gpt-4o-mini` - Cost-effective for MVP
  - `gpt-4o` - Advanced queries (optional)
  - `text-embedding-3-small` - Embeddings (1536 dimensions)
- **Vector Search**: PostgreSQL + pgvector
- **Similarity**: Cosine similarity

### Storage

- **Development**: Local file system
- **Production**: Vercel Blob Storage
- **Max File Size**: 10MB

### Deployment

- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Regions**: Global (auto-distributed)
- **SSL**: Automatic HTTPS

## Data Flow

### Document Ingestion Flow

Upload Document
↓
Store File (Blob Storage)
↓
Extract Text (pdf-parse/mammoth)
↓
Chunk Text (1000 chars with 200 overlap)
↓
Generate Embeddings (OpenAI API)
↓
Store in Database (PostgreSQL + pgvector)

### Query Flow (RAG)

User Question
↓
Generate Query Embedding (OpenAI)
↓
Vector Similarity Search (pgvector)
↓
Retrieve Top 5 Chunks
↓
Build Context Prompt
↓
Generate Answer (GPT-4)
↓
Return Answer + Sources

## Security Architecture

### Authentication

- Session-based auth (Auth.js v5)
- HTTP-only cookies
- CSRF protection
- Secure password hashing (bcrypt)

### API Security

- API key authentication for widget
- Rate limiting (per API key)
- Domain whitelisting
- Input validation (Zod)

### Data Security

- SSL/TLS encryption in transit
- Database encryption at rest (Neon)
- Sensitive data in environment variables
- No credentials in code

## Performance Considerations

### Caching Strategy

- React Query cache (5 minutes TTL)
- Browser localStorage (session data)
- CDN caching (static assets)

### Optimization

- Image optimization (Next.js Image)
- Code splitting (dynamic imports)
- Widget lazy loading
- Connection pooling (Prisma + Neon)

### Scalability

- Serverless functions (auto-scaling)
- Database auto-scaling (Neon)
- Edge CDN distribution
- Async processing (document ingestion)

## Monitoring & Logging

- **Analytics**: Vercel Analytics
- **Error Tracking**: Console logging (Sentry optional)
- **Performance**: Web Vitals
- **Database**: Neon dashboard

## Development Workflow

Local Development
↓
Git Commit
↓
Push to GitHub
↓
Vercel Auto-Deploy (Preview)
↓
Merge to Main
↓
Production Deploy

## Environment Separation

| Environment | Database                        | URL                | Purpose           |
| ----------- | ------------------------------- | ------------------ | ----------------- |
| Development | Local PostgreSQL or Neon Branch | localhost:3000     | Local development |
| Staging     | Neon Branch (staging)           | staging.vercel.app | Testing           |
| Production  | Neon Main                       | your-domain.com    | Live application  |

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android 90+

## System Requirements

### Development

- Node.js 18+
- 8GB RAM minimum
- PostgreSQL 14+ (or Neon account)

### Production

- Managed by Vercel (serverless)
- Database: Neon auto-scaling
- No server management required
