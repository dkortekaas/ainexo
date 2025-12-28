# Database Schema

## Database Provider: Neon PostgreSQL

Neon is een serverless PostgreSQL provider met:

-   Auto-scaling compute
-   Branching (git-style database branches)
-   Point-in-time recovery
-   Built-in connection pooling

## Schema Overview

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  extensions = [pgvector(map: "vector")]
}
```

Tables

1. Authentication Tables (Auth.js v5)
   users
   Gebruikers van het admin platform.
   ColumnTypeDescriptionidString (cuid)Primary keynameString?GebruikersnaamemailString (unique)Email adresemailVerifiedDateTime?Email verificatie timestampimageString?Profielfoto URLpasswordString?Gehashed wachtwoordroleUserRoleADMIN of USERcreatedAtDateTimeAanmaakdatumupdatedAtDateTimeLaatste update
   Relations:

accounts[] - OAuth accounts
sessions[] - Actieve sessies
chatbotSettings[] - Chatbot configuraties

prismamodel User {
id String @id @default(cuid())
name String?
email String @unique
emailVerified DateTime?
image String?
password String?
role UserRole @default(ADMIN)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

accounts Account[]
sessions Session[]
chatbotSettings ChatbotSettings[]

@@map("users")
}

enum UserRole {
ADMIN
USER
}
accounts
OAuth provider accounts (voor toekomstige uitbreidingen).
prismamodel Account {
id String @id @default(cuid())
userId String
type String
provider String
providerAccountId String
refresh_token String? @db.Text
access_token String? @db.Text
expires_at Int?
token_type String?
scope String?
id_token String? @db.Text
session_state String?

user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@unique([provider, providerAccountId])
@@map("accounts")
}
sessions
Actieve gebruikerssessies.
prismamodel Session {
id String @id @default(cuid())
sessionToken String @unique
userId String
expires DateTime
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@map("sessions")
}
verification_tokens
Verificatie tokens voor email verificatie en password reset.
prismamodel VerificationToken {
identifier String
token String @unique
expires DateTime

@@unique([identifier, token])
@@map("verification_tokens")
}

2. Document Management
   documents
   Hoofdtabel voor alle documenten en content.
   ColumnTypeDescriptionidString (cuid)Primary keynameStringWeergavenaamoriginalNameStringOriginele bestandsnaamtypeDocumentTypePDF, DOCX, TXT, URL, IMAGEmimeTypeString?MIME type (bijv. application/pdf)fileSizeInt?Bestandsgrootte in bytesfilePathString?Pad naar opgeslagen bestandurlString?URL (voor URL type)contentTextTextGeëxtraheerde tekstmetadataJson?Extra metadatastatusDocumentStatusPROCESSING, COMPLETED, FAILEDerrorMessageText?Foutmelding bij failurecreatedAtDateTimeUpload datumupdatedAtDateTimeLaatste update
   Relations:

chunks[] - Text chunks met embeddings
conversationSources[] - Gebruik in conversaties

prismamodel Document {
id String @id @default(cuid())
name String
originalName String
type DocumentType
mimeType String?
fileSize Int?
filePath String?
url String?
contentText String @db.Text
metadata Json?
status DocumentStatus @default(PROCESSING)
errorMessage String? @db.Text

createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

chunks DocumentChunk[]
conversationSources ConversationSource[]

@@index([type])
@@index([status])
@@index([createdAt])
@@map("documents")
}

enum DocumentType {
PDF
DOCX
TXT
URL
IMAGE
}

enum DocumentStatus {
PROCESSING
COMPLETED
FAILED
}
document_chunks
Text chunks met vector embeddings voor semantic search.
ColumnTypeDescriptionidString (cuid)Primary keydocumentIdStringForeign key naar documentschunkIndexIntVolgorde binnen documentcontentTextChunk tekstembeddingvector(1536)OpenAI embedding vectortokenCountInt?Aantal tokensmetadataJson?Extra chunk metadatacreatedAtDateTimeAanmaakdatum
Indexes:

documentId - Voor efficiënte lookup
Vector index - Voor similarity search

prismamodel DocumentChunk {
id String @id @default(cuid())
documentId String
chunkIndex Int
content String @db.Text
embedding Unsupported("vector(1536)")?
tokenCount Int?
metadata Json?

createdAt DateTime @default(now())

document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

@@index([documentId])
@@map("document_chunks")
}

3. Chatbot Configuration
   chatbot_settings
   Configuratie-instellingen voor de chatbot.
   ColumnTypeDescriptionidString (cuid)Primary keyuserIdStringForeign key naar usersnameStringChatbot naamwelcomeMessageStringWelkomstberichtplaceholderTextStringInput placeholderprimaryColorStringHex kleurcodesecondaryColorStringHex kleurcodetoneStringprofessional, friendly, casuallanguageStringTaalcode (nl, en, etc.)maxResponseLengthIntMax tokens voor antwoordtemperatureFloatOpenAI temperature (0-1)fallbackMessageStringDefault antwoord bij geen matchpositionStringbottom-right, bottom-leftshowBrandingBooleanToon "Powered by"isActiveBooleanChatbot actief/inactiefapiKeyString (unique)API key voor widget authallowedDomainsString[]Whitelist van domainsrateLimitIntRequests per minuutcreatedAtDateTimeAanmaakdatumupdatedAtDateTimeLaatste update
   prismamodel ChatbotSettings {
   id String @id @default(cuid())
   userId String
   name String @default("AI Assistent")
   welcomeMessage String @default("Hallo! Hoe kan ik je helpen?")
   placeholderText String @default("Stel een vraag...")
   primaryColor String @default("#3B82F6")
   secondaryColor String @default("#1E40AF")

tone String @default("professional")
language String @default("nl")
maxResponseLength Int @default(500)
temperature Float @default(0.7)
fallbackMessage String @default("Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie.")

position String @default("bottom-right")
showBranding Boolean @default(true)
isActive Boolean @default(true)

apiKey String @unique @default(cuid())
allowedDomains String[]
rateLimit Int @default(10)

createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@map("chatbot_settings")
}

4. Conversations & Analytics
   conversations
   Alle chatbot conversaties voor analytics en beoordeling.
   ColumnTypeDescriptionidString (cuid)Primary keysessionIdStringUnieke sessie identifieripAddressString?IP adres gebruikeruserAgentText?Browser user agentreferrerString?Referrer URLquestionTextGestelde vraaganswerTextGegeven antwoordresponseTimeInt?Response tijd in msratingSmallInt?Beoordeling 1-5ratingNotesText?Notities bij beoordelingratedAtDateTime?Beoordelings timestampratedByString?User ID van beoordelaarmodelString?Gebruikt AI modeltokensUsedInt?Aantal gebruikte tokensconfidenceFloat?Confidence score 0-1createdAtDateTimeTijdstip vraag
   Relations:

sources[] - Gebruikte document bronnen

prismamodel Conversation {
id String @id @default(cuid())
sessionId String
ipAddress String?
userAgent String? @db.Text
referrer String?

question String @db.Text
answer String @db.Text
responseTime Int?

rating Int? @db.SmallInt
ratingNotes String? @db.Text
ratedAt DateTime?
ratedBy String?

model String?
tokensUsed Int?
confidence Float?

createdAt DateTime @default(now())

sources ConversationSource[]

@@index([sessionId])
@@index([rating])
@@index([createdAt])
@@map("conversations")
}
conversation_sources
Mapping tussen conversaties en gebruikte document chunks.
ColumnTypeDescriptionidString (cuid)Primary keyconversationIdStringForeign key naar conversationsdocumentIdStringForeign key naar documentschunkContentTextGebruikte chunk tekstrelevanceScoreFloat?Similarity score
prismamodel ConversationSource {
id String @id @default(cuid())
conversationId String
documentId String
chunkContent String @db.Text
relevanceScore Float?

conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

@@index([conversationId])
@@map("conversation_sources")
}

5. System Logging
   system_logs
   System logs voor debugging en monitoring.
   prismamodel SystemLog {
   id String @id @default(cuid())
   level LogLevel
   message String @db.Text
   context Json?
   userId String?
   createdAt DateTime @default(now())

@@index([level])
@@index([createdAt])
@@map("system_logs")
}

enum LogLevel {
INFO
WARNING
ERROR
CRITICAL
}

Database Setup

1. Environment Configuration
   env# Neon Connection String (pooled)
   DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"

# Direct connection (for migrations)

DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require" 2. Enable pgvector Extension
sqlCREATE EXTENSION IF NOT EXISTS vector; 3. Prisma Commands
bash# Generate Prisma Client
npx prisma generate

# Create migration

npx prisma migrate dev --name init

# Apply migrations (production)

npx prisma migrate deploy

# Seed database

npx prisma db seed

# Open Prisma Studio

npx prisma studio 4. Seed Data
Create prisma/seed.ts:
typescriptimport { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
const hashedPassword = await bcrypt.hash('admin123', 10)

const admin = await prisma.user.upsert({
where: { email: 'admin@example.com' },
update: {},
create: {
email: 'admin@example.com',
name: 'Admin',
password: hashedPassword,
role: 'ADMIN',
},
})

await prisma.chatbotSettings.upsert({
where: { userId: admin.id },
update: {},
create: {
userId: admin.id,
name: 'AI Assistent',
welcomeMessage: 'Hallo! Hoe kan ik je helpen?',
placeholderText: 'Stel een vraag...',
},
})

console.log('✅ Database seeded successfully')
}

main()
.catch(console.error)
.finally(() => prisma.$disconnect())

Queries & Indexes
Common Queries
typescript// Find documents by status
await prisma.document.findMany({
where: { status: 'COMPLETED' },
include: { chunks: true }
})

// Get conversations with ratings
await prisma.conversation.findMany({
where: { rating: { not: null } },
include: { sources: { include: { document: true } } },
orderBy: { createdAt: 'desc' }
})

// Vector similarity search (raw SQL)
await prisma.$queryRaw`  SELECT *
  FROM document_chunks
  WHERE 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 5`
Performance Indexes
sql-- Document lookup
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_created ON documents(created_at);

-- Conversation analytics
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_rating ON conversations(rating);
CREATE INDEX idx_conversations_created ON conversations(created_at);

-- Vector similarity (HNSW index for faster search)
CREATE INDEX idx_chunks_embedding ON document_chunks
USING hnsw (embedding vector_cosine_ops);

Backup & Recovery
Neon Backups

Automatic daily backups
Point-in-time recovery (7 days retention)
Branch-based backups

Manual Export
bash# Export database
pg_dump $DATABASE_URL > backup.sql

# Import database

psql $DATABASE_URL < backup.sql

Database Monitoring
Prisma Studio
bashnpx prisma studio
Neon Dashboard

Query performance
Connection pool usage
Storage metrics
Active connections

Query Logging
typescriptconst prisma = new PrismaClient({
log: ['query', 'info', 'warn', 'error'],
})
