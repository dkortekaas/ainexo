# Chatbot Widget

Een standalone React widget die embedded kan worden in elke website via een simpel script tag.

## Features

- 🚀 **Lightweight**: Minimale bundle size
- 🎨 **Customizable**: Kleuren, positie, teksten aanpasbaar
- 📱 **Responsive**: Werkt op desktop en mobile
- 🔒 **Secure**: Shadow DOM isolatie, geen style conflicts
- 💾 **Persistent**: Session en messages worden opgeslagen
- 🌐 **Universal**: Werkt in elke website (WordPress, Shopify, etc.)

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build
```

## Build Output

Na `npm run build` worden de volgende bestanden gegenereerd in `../public/widget/`:

- `widget-bundle.js` - Main JavaScript bundle
- `widget-bundle.css` - Styles (wordt inline geladen)

## Integration

### Basic Usage

```html
<script
  src="https://your-app.vercel.app/widget/loader.js"
  data-chatbot-id="cbk_live_abc123xyz789"
></script>
```

### Advanced Configuration

```html
<script
  src="https://your-app.vercel.app/widget/loader.js"
  data-chatbot-id="cbk_live_abc123xyz789"
  data-name="Support Bot"
  data-welcome="Welkom bij onze support!"
  data-placeholder="Hoe kunnen we je helpen?"
  data-primary-color="#FF6B6B"
  data-secondary-color="#FF5252"
  data-position="bottom-left"
  data-show-branding="false"
></script>
```

## Configuration Options

| Attribute              | Description        | Default                        |
| ---------------------- | ------------------ | ------------------------------ |
| `data-chatbot-id`      | API key (required) | -                              |
| `data-api-url`         | Backend API URL    | `https://your-app.vercel.app`  |
| `data-name`            | Bot name           | `AI Assistent`                 |
| `data-welcome`         | Welcome message    | `Hallo! Hoe kan ik je helpen?` |
| `data-placeholder`     | Input placeholder  | `Stel een vraag...`            |
| `data-primary-color`   | Primary color      | `#3B82F6`                      |
| `data-secondary-color` | Secondary color    | `#1E40AF`                      |
| `data-position`        | Position           | `bottom-right`                 |
| `data-show-branding`   | Show branding      | `true`                         |

## API Endpoints

De widget verwacht de volgende API endpoints:

### POST /api/chat/message

```json
{
  "question": "User question",
  "sessionId": "session_123",
  "metadata": {
    "userAgent": "...",
    "referrer": "..."
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123",
    "answer": "Bot response",
    "sources": [...],
    "responseTime": 1500,
    "sessionId": "session_123"
  }
}
```

### GET /api/chatbot/public-config

Headers: `X-Chatbot-API-Key: cbk_live_abc123`

Response:

```json
{
  "config": {
    "name": "Custom Bot Name",
    "welcomeMessage": "Custom welcome",
    "primaryColor": "#FF6B6B"
  }
}
```

## Testing

1. Start development server: `npm run dev`
2. Open `http://localhost:3000/test.html`
3. Test widget functionality

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Customer Website                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ <script src="loader.js" data-chatbot-id="...">    │ │
│ └────────────────────────────────────────────────────┘ │
│ │                                                     │
│ ▼                                                     │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Loader Script                                      │ │
│ │ - Parse config from data attributes                │ │
│ │ - Load CSS & JS bundle                            │ │
│ │ - Initialize widget                               │ │
│ └────────────────────────────────────────────────────┘ │
│ │                                                     │
│ ▼                                                     │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Widget (Shadow DOM)                               │ │
│ │ - Isolated styles                                 │ │
│ │ - React components                                │ │
│ │ - Local state management                          │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
│
│ API Calls
▼
┌─────────────────────────────────────────────────────────┐
│ Backend API                                            │
│ - POST /api/chat/message                              │
│ - GET /api/chatbot/public-config                      │
└─────────────────────────────────────────────────────────┘
```

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Performance

- Bundle size: ~50KB gzipped
- Load time: <200ms
- Memory usage: <5MB
- No external dependencies (except React)

## Security

- Shadow DOM isolation
- No access to host page DOM
- API key validation
- Input sanitization
- CORS protection
