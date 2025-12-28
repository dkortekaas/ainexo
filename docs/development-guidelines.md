# Development Guidelines voor Ainexo

## Algemene Setup

### Versies en Dependencies

- Gebruik altijd de exacte versies zoals gespecificeerd in package.json
- Controleer regelmatig de package.json voor versie-updates
- Voer na het pullen van updates altijd `npm install` uit
- Bij het toevoegen van nieuwe packages, controleer compatibiliteit met:
  - Next.js 15.3.1
  - React 18
  - Prisma 6.7.0
  - Tailwind CSS 4.1.5

### Configuratie

- Gebruik ESLint en Prettier met de volgende configuratie:

  ```json
  // eslint.config.mjs
  export default {
    extends: [
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended",
      "prettier"
    ],
    plugins: ["@typescript-eslint"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_" }
      ],
      "import/order": [
        "error",
        {
          "groups": [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index"
          ],
          "newlines-between": "always",
          "alphabetize": { "order": "asc", "caseInsensitive": true }
        }
      ]
    }
  }
  ```

### Project Structuur

```
/
├── app/                    # Next.js app directory
│   ├── [locale]/          # Geïnternationaliseerde routes
│   ├── api/               # API Routes
│   ├── auth/              # Authenticatie pagina's
│   └── (pages)/           # Hoofdpagina's
├── components/            # React componenten
│   ├── ui/               # UI componenten
│   └── forms/            # Formulier componenten
├── lib/                   # Gedeelde utilities
├── types/                 # TypeScript type definities
├── prisma/               # Database schema en migraties
├── public/               # Statische bestanden
├── messages/             # i18n vertalingen
└── i18n/                 # i18n configuratie
```

## TypeScript Best Practices

### Type Definities

- Gebruik expliciete types in plaats van `any`
- Maak herbruikbare interface definities in `types/` directory
- Gebruik TypeScript generics voor herbruikbare componenten
- Gebruik union types voor beperkte opties

### Voorbeeld voor Component Types

```typescript
// types/components.ts
export interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  isFullWidth?: boolean;
  isDisabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

## Next.js Best Practices

### App Router

- Gebruik de App Router voor alle nieuwe routes
- Implementeer server components waar mogelijk
- Gebruik `loading.tsx` voor Suspense boundaries
- Implementeer route groups met parentheses: `(groupname)`

### Data Fetching

```typescript
// Voorbeeld van een server component met data fetching
export default async function Page() {
  const data = await fetchData();
  return <MyComponent data={data} />;
}
```

### Metadata

```typescript
// app/layout.tsx
export const metadata = {
  title: {
    template: "%s | Declair",
    default: "Declair",
  },
  description: "Declaratie management systeem",
};
```

## React Best Practices

### Functionele Componenten

- Gebruik functionele componenten met hooks
- Implementeer memoization voor zware componenten
- Gebruik correct geneste componenten

### Custom Hooks

```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
```

## Internationalisatie (i18n)

### Setup

- Gebruik next-intl voor vertalingen
- Plaats vertalingen in de `messages/` directory
- Volg de naamgeving: `[locale].json`

### Voorbeeld

```typescript
// messages/nl.json
{
  "common": {
    "submit": "Versturen",
    "cancel": "Annuleren"
  }
}

// Component gebruik
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  return <button>{t('submit')}</button>;
}
```

## Authenticatie en Beveiliging

### NextAuth.js Setup

- Gebruik de Prisma adapter voor NextAuth.js
- Implementeer twee-factor authenticatie waar nodig
- Gebruik middleware voor route bescherming

### Voorbeeld Middleware

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Implementeer je autorisatie logica
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

## Database en Prisma

### Schema Design

- Gebruik Prisma schema voor database definities
- Implementeer relaties tussen modellen
- Gebruik migrations voor schema updates

### Voorbeeld Schema

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  company   Company  @relation(fields: [companyId], references: [id])
  companyId String
}

enum Role {
  USER
  APPROVER
  ADMIN
}
```

## API Routes

### Structuur

- Plaats API routes in `app/api/`
- Gebruik route handlers voor API endpoints
- Implementeer error handling

### Voorbeeld Route Handler

```typescript
// app/api/declarations/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const declarations = await prisma.declaration.findMany();
    return NextResponse.json(declarations);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

## Bestandsopslag

### Vercel Blob Storage

- Gebruik Vercel Blob voor bestandsopslag
- Implementeer upload limieten
- Valideer bestandstypen

### Voorbeeld Upload

```typescript
import { put } from "@vercel/blob";

export async function uploadFile(file: File) {
  const { url } = await put(file.name, file, {
    access: "public",
    contentType: file.type,
  });
  return url;
}
```

## Testing

### Unit Tests

- Schrijf tests voor kritieke componenten
- Gebruik React Testing Library
- Test error scenarios

### Voorbeeld Test

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Deployment

### Vercel Deployment

- Gebruik Vercel voor deployment
- Configureer environment variables
- Setup CI/CD pipeline

### Environment Variables

```bash
# .env.example
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourapp.com"
BLOB_READ_WRITE_TOKEN="your-token"
```

## Code Review Guidelines

### Pull Requests

- Beschrijf wijzigingen duidelijk
- Voeg tests toe waar nodig
- Update documentatie
- Volg de coding standards

### Commit Messages

- Gebruik duidelijke commit messages
- Volg het format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore

## Performance

### Optimalisaties

- Gebruik React Server Components
- Implementeer caching waar mogelijk
- Optimaliseer afbeeldingen
- Gebruik lazy loading

### Monitoring

- Monitor Core Web Vitals
- Track error rates
- Monitor API performance
