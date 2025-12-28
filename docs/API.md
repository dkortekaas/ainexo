# API Endpoints Specificatie

## Base URL

Development: http://localhost:3000/api
Production: https://your-app.vercel.app/api

## Authenticatie

### Admin Endpoints

Vereisen een geldige sessie via Auth.js:
Cookie: next-auth.session-token=<session-token>

### Widget Endpoints (Public)

Vereisen een API key in de header:
X-Chatbot-API-Key: cbk_live_abc123xyz789

---

## 1. Authentication Endpoints

### POST /api/auth/signup

Registreer nieuwe admin gebruiker (alleen voor initiële setup).

**Request Body:**

```json
{
  "name": "Jan Jansen",
  "email": "jan@voorbeeld.nl",
  "password": "securePassword123!"
}
Response: 201 Created
json{
  "success": true,
  "user": {
    "id": "clx1234567890",
    "email": "jan@voorbeeld.nl",
    "name": "Jan Jansen",
    "role": "ADMIN"
  }
}
Errors:

400 Bad Request - Email al in gebruik
422 Unprocessable Entity - Validatiefout

Validatie Regels:

Email: Geldig email formaat
Password: Minimaal 8 karakters, 1 hoofdletter, 1 cijfer
Name: Minimaal 2 karakters


POST /api/auth/signin
Inloggen (Auth.js endpoint).
Request Body:
json{
  "email": "jan@voorbeeld.nl",
  "password": "securePassword123!"
}
Response: 200 OK
json{
  "user": {
    "id": "clx1234567890",
    "email": "jan@voorbeeld.nl",
    "name": "Jan Jansen"
  }
}
Errors:

401 Unauthorized - Ongeldige credentials


GET /api/auth/session
Huidige sessie ophalen.
Response: 200 OK
json{
  "user": {
    "id": "clx1234567890",
    "email": "jan@voorbeeld.nl",
    "name": "Jan Jansen",
    "role": "ADMIN"
  },
  "expires": "2025-10-30T10:00:00.000Z"
}

2. Document Management
POST /api/documents/upload
Upload een document (PDF, DOCX, TXT, afbeelding).
Auth Required: ✅ Admin session
Request: multipart/form-data
file: <binary>
Response: 201 Created
json{
  "success": true,
  "document": {
    "id": "clx1234567890",
    "name": "handleiding.pdf",
    "originalName": "product_handleiding_v2.pdf",
    "type": "PDF",
    "mimeType": "application/pdf",
    "fileSize": 2048576,
    "status": "PROCESSING",
    "createdAt": "2025-09-30T10:00:00.000Z"
  }
}
Errors:

400 Bad Request - Ongeldig bestandstype
413 Payload Too Large - Bestand groter dan 10MB
401 Unauthorized - Niet ingelogd

Toegestane bestandstypen:

PDF: application/pdf
DOCX: application/vnd.openxmlformats-officedocument.wordprocessingml.document
TXT: text/plain
Afbeeldingen: image/jpeg, image/png


POST /api/documents/url
Voeg een URL toe voor scraping.
Auth Required: ✅ Admin session
Request Body:
json{
  "url": "https://voorbeeld.nl/kennisbank/artikel-1"
}
Response: 201 Created
json{
  "success": true,
  "document": {
    "id": "clx1234567891",
    "name": "Artikel 1 - Kennisbank",
    "type": "URL",
    "url": "https://voorbeeld.nl/kennisbank/artikel-1",
    "status": "PROCESSING",
    "createdAt": "2025-09-30T10:00:00.000Z"
  }
}
Errors:

400 Bad Request - Ongeldige URL
422 Unprocessable Entity - URL niet bereikbaar
401 Unauthorized - Niet ingelogd

Validatie:

URL moet beginnen met http:// of https://
URL moet bereikbaar zijn (status 200)
Maximum 1 MB content size


GET /api/documents
Haal alle documenten op met filtering en paginering.
Auth Required: ✅ Admin session
Query Parameters:
?page=1                     # Pagina nummer (default: 1)
&limit=20                   # Items per pagina (default: 20, max: 100)
&type=PDF,DOCX             # Filter op type (comma-separated)
&status=COMPLETED          # Filter op status
&search=handleiding        # Zoek in naam/content
&sortBy=createdAt          # Sorteer op veld (createdAt, name, fileSize)
&sortOrder=desc            # Sorteer richting (asc, desc)
Response: 200 OK
json{
  "success": true,
  "data": [
    {
      "id": "clx1234567890",
      "name": "handleiding.pdf",
      "originalName": "product_handleiding_v2.pdf",
      "type": "PDF",
      "mimeType": "application/pdf",
      "status": "COMPLETED",
      "fileSize": 2048576,
      "chunksCount": 15,
      "metadata": {
        "pages": 23,
        "chunkCount": 15,
        "totalTokens": 5420
      },
      "createdAt": "2025-09-30T10:00:00.000Z",
      "updatedAt": "2025-09-30T10:05:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}

GET /api/documents/:id
Haal specifiek document op met alle details.
Auth Required: ✅ Admin session
Response: 200 OK
json{
  "success": true,
  "document": {
    "id": "clx1234567890",
    "name": "handleiding.pdf",
    "originalName": "product_handleiding_v2.pdf",
    "type": "PDF",
    "mimeType": "application/pdf",
    "status": "COMPLETED",
    "fileSize": 2048576,
    "filePath": "/documents/abc123.pdf",
    "contentText": "Volledige geëxtraheerde tekst...",
    "metadata": {
      "pages": 23,
      "author": "Bedrijf BV",
      "chunkCount": 15,
      "totalTokens": 5420
    },
    "chunks": [
      {
        "id": "chunk1",
        "chunkIndex": 0,
        "content": "Sectie 1: Introductie...",
        "tokenCount": 150,
        "metadata": {
          "startChar": 0,
          "endChar": 580
        }
      }
    ],
    "createdAt": "2025-09-30T10:00:00.000Z",
    "updatedAt": "2025-09-30T10:05:00.000Z"
  }
}
Errors:

404 Not Found - Document bestaat niet
401 Unauthorized - Niet ingelogd


DELETE /api/documents/:id
Verwijder een document en alle bijbehorende chunks.
Auth Required: ✅ Admin session
Response: 200 OK
json{
  "success": true,
  "message": "Document succesvol verwijderd",
  "deletedId": "clx1234567890"
}
Errors:

404 Not Found - Document bestaat niet
401 Unauthorized - Niet ingelogd
500 Internal Server Error - Verwijderen mislukt


3. Chatbot Settings
GET /api/chatbot/settings
Haal huidige chatbot instellingen op.
Auth Required: ✅ Admin session
Response: 200 OK
json{
  "success": true,
  "settings": {
    "id": "clx1234567890",
    "name": "Support Bot",
    "welcomeMessage": "Welkom! Waarmee kan ik je helpen?",
    "placeholderText": "Typ je vraag...",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E40AF",
    "tone": "professional",
    "language": "nl",
    "maxResponseLength": 500,
    "temperature": 0.7,
    "fallbackMessage": "Sorry, ik kan deze vraag niet beantwoorden.",
    "position": "bottom-right",
    "showBranding": true,
    "isActive": true,
    "apiKey": "cbk_live_abc123xyz789",
    "allowedDomains": [
      "https://voorbeeld.nl",
      "https://www.voorbeeld.nl"
    ],
    "rateLimit": 10,
    "createdAt": "2025-09-01T10:00:00.000Z",
    "updatedAt": "2025-09-30T10:00:00.000Z"
  }
}

PUT /api/chatbot/settings
Update chatbot instellingen.
Auth Required: ✅ Admin session
Request Body:
json{
  "name": "Customer Support Bot",
  "welcomeMessage": "Hallo! Hoe kan ik u vandaag helpen?",
  "primaryColor": "#FF6B6B",
  "tone": "friendly",
  "allowedDomains": [
    "https://voorbeeld.nl",
    "https://www.voorbeeld.nl",
    "https://shop.voorbeeld.nl"
  ],
  "rateLimit": 20
}
Response: 200 OK
json{
  "success": true,
  "settings": {
    "id": "clx1234567890",
    "name": "Customer Support Bot",
    "welcomeMessage": "Hallo! Hoe kan ik u vandaag helpen?",
    "primaryColor": "#FF6B6B",
    "tone": "friendly",
    "allowedDomains": [
      "https://voorbeeld.nl",
      "https://www.voorbeeld.nl",
      "https://shop.voorbeeld.nl"
    ],
    "rateLimit": 20,
    "updatedAt": "2025-09-30T10:30:00.000Z"
  }
}
Errors:

400 Bad Request - Validatiefout
401 Unauthorized - Niet ingelogd

Validatie Regels:

primaryColor: Hex kleur (bijv. #FF6B6B)
tone: Moet één van: professional, friendly, casual
temperature: 0.0 - 1.0
maxResponseLength: 100 - 2000 tokens
rateLimit: 1 - 100 requests per minuut


POST /api/chatbot/settings/regenerate-key
Genereer nieuwe API key (oude wordt ongeldig).
Auth Required: ✅ Admin session
Response: 200 OK
json{
  "success": true,
  "apiKey": "cbk_live_new123xyz789",
  "message": "API key succesvol geregenereerd. Update je embed code."
}

GET /api/chatbot/public-config
Haal publieke configuratie op voor widget (geen auth).
Headers:
X-Chatbot-API-Key: cbk_live_abc123xyz789
Response: 200 OK
json{
  "success": true,
  "config": {
    "name": "Support Bot",
    "welcomeMessage": "Welkom! Waarmee kan ik je helpen?",
    "placeholderText": "Typ je vraag...",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E40AF",
    "position": "bottom-right",
    "showBranding": true
  }
}
Errors:

401 Unauthorized - Ongeldige API key
403 Forbidden - Subscription expired (verlopen trial of regulier abonnement)

**Subscription Validation:**

Dit endpoint controleert automatisch of de subscription van de chatbot eigenaar actief is:
- Trial abonnementen: Check `trialEndDate < now`
- Reguliere abonnementen: Check `subscriptionEndDate < now`
- Status check: Alleen `TRIAL` en `ACTIVE` zijn toegestaan

Bij verlopen subscription:
json{
  "success": false,
  "error": "Subscription expired. Please renew your subscription to continue using the chatbot."
}


4. Chat Endpoints (Public - Widget)
POST /api/chat/message
Verstuur een vraag naar de chatbot.
Headers:
X-Chatbot-API-Key: cbk_live_abc123xyz789
X-Session-ID: session_abc123 (optioneel)
Content-Type: application/json
Request Body:
json{
  "question": "Hoe kan ik mijn wachtwoord resetten?",
  "sessionId": "session_abc123",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://voorbeeld.nl/help"
  }
}
Response: 200 OK
json{
  "success": true,
  "data": {
    "conversationId": "clx1234567890",
    "answer": "Om je wachtwoord te resetten, ga naar de inlogpagina en klik op 'Wachtwoord vergeten'. Je ontvangt dan een reset link per email.",
    "sources": [
      {
        "documentName": "FAQ Handleiding",
        "documentType": "PDF",
        "relevanceScore": 0.92
      },
      {
        "documentName": "Gebruikershandleiding",
        "documentType": "DOCX",
        "relevanceScore": 0.87
      }
    ],
    "responseTime": 1250,
    "sessionId": "session_abc123"
  }
}
Errors:

400 Bad Request - Validatiefout
401 Unauthorized - Ongeldige API key
403 Forbidden - Domain niet toegestaan OF subscription expired
429 Too Many Requests - Rate limit overschreden

**Subscription Validation:**

Dit endpoint controleert automatisch of de subscription van de chatbot eigenaar actief is:
- Trial abonnementen: Check `trialEndDate < now`
- Reguliere abonnementen: Check `subscriptionEndDate < now`
- Status check: Alleen `TRIAL` en `ACTIVE` zijn toegestaan

Bij verlopen subscription (403):
json{
  "success": false,
  "error": "Subscription expired. Please renew your subscription to continue using the chatbot."
}

Rate Limiting:

Limiet wordt ingesteld in chatbot settings (default: 10 req/min)
Header: X-RateLimit-Remaining: 8
Header bij limit: Retry-After: 60


GET /api/chat/history/:sessionId
Haal chat geschiedenis op voor een sessie (optioneel).
Headers:
X-Chatbot-API-Key: cbk_live_abc123xyz789
Response: 200 OK
json{
  "success": true,
  "history": [
    {
      "id": "clx1234567890",
      "question": "Wat zijn jullie openingstijden?",
      "answer": "Wij zijn geopend van maandag tot vrijdag van 9:00 tot 17:00 uur.",
      "sources": [
        {
          "documentName": "Algemene Info",
          "documentType": "URL"
        }
      ],
      "createdAt": "2025-09-30T10:00:00.000Z"
    },
    {
      "id": "clx1234567891",
      "question": "Leveren jullie ook op zaterdag?",
      "answer": "Ja, we leveren ook op zaterdag tussen 10:00 en 15:00 uur.",
      "sources": [
        {
          "documentName": "Verzendbeleid",
          "documentType": "PDF"
        }
      ],
      "createdAt": "2025-09-30T10:02:00.000Z"
    }
  ],
  "sessionStarted": "2025-09-30T10:00:00.000Z",
  "messageCount": 2
}

5. Conversations & Analytics
GET /api/conversations
Haal alle conversaties op met filtering.
Auth Required: ✅ Admin session
Query Parameters:
?page=1                      # Pagina nummer
&limit=50                    # Items per pagina (max: 100)
&rated=false                 # Filter op beoordeling (true, false, all)
&rating=5                    # Filter op specifieke rating (1-5)
&dateFrom=2025-09-01        # Vanaf datum (ISO 8601)
&dateTo=2025-09-30          # Tot datum (ISO 8601)
&search=wachtwoord          # Zoek in vraag/antwoord
&sortBy=createdAt           # Sorteer veld
&sortOrder=desc             # Sorteer richting
Response: 200 OK
json{
  "success": true,
  "data": [
    {
      "id": "clx1234567890",
      "sessionId": "session_abc123",
      "question": "Hoe reset ik mijn wachtwoord?",
      "answer": "Om je wachtwoord te resetten...",
      "rating": 5,
      "ratingNotes": "Perfect antwoord, duidelijk en compleet",
      "ratedAt": "2025-09-30T11:00:00.000Z",
      "ratedBy": "clx_admin123",
      "responseTime": 1250,
      "model": "gpt-4o-mini",
      "tokensUsed": 342,
      "confidence": 0.89,
      "sources": [
        {
          "documentName": "FAQ Handleiding",
          "documentType": "PDF",
          "relevanceScore": 0.92
        }
      ],
      "createdAt": "2025-09-30T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 50,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": false
  },
  "stats": {
    "totalConversations": 156,
    "averageRating": 4.2,
    "unratedCount": 45,
    "averageResponseTime": 1450
  }
}

GET /api/conversations/:id
Haal specifieke conversatie op met alle details.
Auth Required: ✅ Admin session
Response: 200 OK
json{
  "success": true,
  "conversation": {
    "id": "clx1234567890",
    "sessionId": "session_abc123",
    "question": "Hoe reset ik mijn wachtwoord?",
    "answer": "Om je wachtwoord te resetten, ga naar...",
    "rating": 5,
    "ratingNotes": "Perfect antwoord",
    "ratedAt": "2025-09-30T11:00:00.000Z",
    "ratedBy": "clx_admin123",
    "responseTime": 1250,
    "model": "gpt-4o-mini",
    "tokensUsed": 342,
    "confidence": 0.89,
    "sources": [
      {
        "id": "source1",
        "documentId": "doc123",
        "documentName": "FAQ Handleiding",
        "documentType": "PDF",
        "chunkContent": "Wachtwoord resetten: Ga naar de inlogpagina...",
        "relevanceScore": 0.92
      }
    ],
    "metadata": {
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "referrer": "https://voorbeeld.nl/help"
    },
    "createdAt": "2025-09-30T10:00:00.000Z"
  }
}
Errors:

404 Not Found - Conversatie bestaat niet
401 Unauthorized - Niet ingelogd


PUT /api/conversations/:id/rating
Beoordeel een conversatie.
Auth Required: ✅ Admin session
Request Body:
json{
  "rating": 5,
  "notes": "Uitstekend antwoord, duidelijk en compleet"
}
Response: 200 OK
json{
  "success": true,
  "conversation": {
    "id": "clx1234567890",
    "rating": 5,
    "ratingNotes": "Uitstekend antwoord, duidelijk en compleet",
    "ratedAt": "2025-09-30T12:00:00.000Z",
    "ratedBy": "clx_admin123"
  }
}
Errors:

400 Bad Request - Ongeldige rating (moet 1-5 zijn)
404 Not Found - Conversatie bestaat niet
401 Unauthorized - Niet ingelogd

Validatie:

rating: Integer tussen 1 en 5
notes: Optioneel, max 500 karakters


DELETE /api/conversations/:id/rating
Verwijder beoordeling van een conversatie.
Auth Required: ✅ Admin session
Response: 200 OK
json{
  "success": true,
  "message": "Beoordeling verwijderd"
}

GET /api/conversations/export
Exporteer conversaties naar CSV.
Auth Required: ✅ Admin session
Query Parameters:
?dateFrom=2025-09-01
&dateTo=2025-09-30
&rated=all
&format=csv
Response: 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="conversations_2025-09-30.csv"

ID,Datum,Tijd,Sessie,Vraag,Antwoord,Rating,Notities,Reactietijd (ms),Model,Tokens
clx123,2025-09-30,10:00:00,session_abc,Hoe reset ik...,Om je wachtwoord...,5,Perfect,1250,gpt-4o-mini,342
clx124,2025-09-30,10:05:00,session_xyz,What zijn...,Wij zijn geopend...,4,Goed,980,gpt-4o-mini,256
Alternatieve formats:

format=json - JSON export
format=xlsx - Excel export (toekomstig)


6. Analytics & Dashboard
GET /api/analytics/dashboard
Haal dashboard statistieken op.
Auth Required: ✅ Admin session
Query Parameters:
?period=7d    # Periode: 7d, 30d, 90d, all (default: 7d)
Response: 200 OK
json{
  "success": true,
  "period": "7d",
  "stats": {
    "totalConversations": 1543,
    "conversationsThisPeriod": 234,
    "averageRating": 4.3,
    "averageResponseTime": 1450,
    "averageConfidence": 0.82,
    "totalTokensUsed": 458920,
    "estimatedCost": 2.15,
    "ratingDistribution": {
      "1": 12,
      "2": 24,
      "3": 45,
      "4": 89,
      "5": 134,
      "unrated": 45
    },
    "topQuestions": [
      {
        "question": "Hoe reset ik mijn wachtwoord?",
        "count": 45,
        "averageRating": 4.8
      },
      {
        "question": "Wat zijn de openingstijden?",
        "count": 38,
        "averageRating": 4.9
      }
    ],
    "conversationsByDay": [
      {
        "date": "2025-09-24",
        "count": 34,
        "averageRating": 4.2
      },
      {
        "date": "2025-09-25",
        "count": 42,
        "averageRating": 4.4
      }
    ],
    "documentsUsed": [
      {
        "documentId": "doc123",
        "documentName": "FAQ Handleiding",
        "documentType": "PDF",
        "usageCount": 156,
        "averageRelevance": 0.87
      },
      {
        "documentId": "doc124",
        "documentName": "Productinformatie",
        "documentType": "DOCX",
        "usageCount": 89,
        "averageRelevance": 0.82
      }
    ],
    "hourlyDistribution": [
      { "hour": 0, "count": 5 },
      { "hour": 1, "count": 2 },
      { "hour": 9, "count": 45 },
      { "hour": 10, "count": 67 }
    ]
  }
}

GET /api/analytics/trends
Haal trends op over tijd.
Auth Required: ✅ Admin session
Query Parameters:
?metric=conversations    # Metric: conversations, rating, responseTime
&period=30d             # Periode
&granularity=day        # Granulariteit: hour, day, week, month
Response: 200 OK
json{
  "success": true,
  "metric": "conversations",
  "data": [
    {
      "timestamp": "2025-09-01T00:00:00.000Z",
      "value": 34,
      "change": 12.5
    },
    {
      "timestamp": "2025-09-02T00:00:00.000Z",
      "value": 42,
      "change": 23.5
    }
  ]
}

7. System Endpoints
GET /api/system/health
Systeem health check (public endpoint).
Response: 200 OK
json{
  "status": "healthy",
  "timestamp": "2025-09-30T10:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "connected",
      "latency": 12
    },
    "openai": {
      "status": "available",
      "latency": 145
    },
    "storage": {
      "status": "available",
      "used": "245MB",
      "limit": "10GB"
    }
  },
  "uptime": 2592000
}
Status codes:

200 - Healthy
503 - Unhealthy (service down)


GET /api/system/stats
Systeem statistieken (admin only).
Auth Required: ✅ Admin session
Response: 200 OK
json{
  "success": true,
  "stats": {
    "documents": {
      "total": 87,
      "byType": {
        "PDF": 45,
        "DOCX": 23,
        "TXT": 12,
        "URL": 7
      },
      "totalSize": "245MB",
      "processing": 2,
      "failed": 1
    },
    "chunks": {
      "total": 1245,
      "averagePerDocument": 14.3,
      "totalTokens": 342890
    },
    "conversations": {
      "total": 1543,
      "today": 45,
      "thisWeek": 234,
      "thisMonth": 892
    },
    "apiUsage": {
      "callsToday": 342,
      "tokensToday": 89456,
      "estimatedCostToday": 0.89
    }
  }
}

Error Response Format
Alle errors volgen dit formaat:
json{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific error details"
  },
  "timestamp": "2025-09-30T10:00:00.000Z"
}
Common Error Codes
CodeStatusDescriptionUNAUTHORIZED401Niet ingelogd of ongeldige API keyFORBIDDEN403Geen toegang tot resourceNOT_FOUND404Resource niet gevondenVALIDATION_ERROR400Input validatie misluktRATE_LIMIT_EXCEEDED429Te veel requestsINTERNAL_ERROR500Server foutSERVICE_UNAVAILABLE503Service tijdelijk niet beschikbaar

Rate Limiting
Admin Endpoints

Limiet: 100 requests per minuut per sessie
Headers:

X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696073600



Widget Endpoints

Configureerbaar per chatbot (default: 10 req/min)
Per API key
Headers:

X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
Retry-After: 60 (bij overschrijding)




Webhooks (Toekomstig)
POST /api/webhooks/conversation
Ontvang notificatie bij nieuwe conversatie.
Payload:
json{
  "event": "conversation.created",
  "data": {
    "conversationId": "clx123",
    "question": "...",
    "answer": "...",
    "confidence": 0.89
  },
  "timestamp": "2025-09-30T10:00:00.000Z"
}

API Versioning
Huidige versie: v1
Bij breaking changes:

Nieuwe versie: /api/v2/...
Oude versie blijft 6 maanden ondersteund
Deprecation headers: X-API-Deprecated: true

```
