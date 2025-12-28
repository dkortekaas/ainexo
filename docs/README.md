# Ainexo - MVP Documentatie

Een self-hosted chatbot platform waarmee organisaties een AI-gestuurde chatbot kunnen creëren die vragen beantwoordt op basis van hun eigen documenten en kennisbank.

## 📋 Inhoudsopgave

1. [Architectuur & Tech Stack](./ARCHITECTURE.md)
2. [Database Schema](./DATABASE.md)
3. [API Endpoints](./API.md)
4. [Component Architectuur](./COMPONENTS.md)
5. [Deployment Guide](./DEPLOYMENT.md)
6. [AI/RAG Pipeline](./RAG.md)
7. [Widget Implementatie](./WIDGET.md)
8. [Subscription Protection](./SUBSCRIPTION-PROTECTION.md)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- OpenAI API key

### Installation

```bash
# Clone repository
git clone <repository-url>
cd chatbot-platform

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
Visit http://localhost:3000
🏗️ Project Structure
.
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility libraries
├── prisma/               # Database schema
├── widget/               # Chatbot widget (standalone)
└── public/               # Static files
🔑 Core Features
Admin Portal

✅ Document upload (PDF, DOCX, TXT)
✅ URL scraping
✅ Afbeelding upload
✅ Chatbot configuratie
✅ Conversatie analytics
✅ Beoordeling systeem (1-5)

Chatbot Widget

✅ Minimaliseerbaar chatvenster
✅ Real-time antwoorden
✅ Bronvermelding
✅ Sessie persistentie
✅ Responsive design

📊 Tech Stack

Framework: Next.js 14+ (App Router)
Styling: TailwindCSS + shadcn/ui
Database: PostgreSQL (Neon) + Prisma
AI: OpenAI API (GPT-4 + Embeddings)
Vector Search: pgvector
Auth: Auth.js v5
Deployment: Vercel
Storage: Vercel Blob

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
🧪 Testing
bash# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Type check
npm run type-check
📦 Deployment
See DEPLOYMENT.md for detailed deployment instructions.
bash# Deploy to Vercel
vercel --prod
📖 API Documentation
API documentation available at: http://localhost:3000/api/docs
Or see API.md for full specification.
🤝 Contributing

Fork the repository
Create feature branch (git checkout -b feature/amazing-feature)
Commit changes (git commit -m 'Add amazing feature')
Push to branch (git push origin feature/amazing-feature)
Open Pull Request

📄 License
MIT License - see LICENSE file for details
🆘 Support

Documentation: docs/
Issues: GitHub Issues
Email: support@example.com
```
