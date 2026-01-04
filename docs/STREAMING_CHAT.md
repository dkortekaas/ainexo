# Streaming Chat Implementation Guide

This document explains how to use the streaming chat feature for real-time AI responses.

---

## Overview

The streaming chat feature provides real-time, progressive responses using Server-Sent Events (SSE). Instead of waiting for the complete response, users see the AI's answer being generated token-by-token.

### Benefits

✅ **Better UX**: Users see responses immediately
✅ **Perceived Performance**: Feels faster than waiting
✅ **Engagement**: More interactive conversation experience
✅ **Lower Latency**: First token appears within ~500ms

---

## Architecture

### Server-Side (SSE)

**Endpoint**: `POST /api/chat/stream`

**Flow**:
1. Client sends message via POST
2. Server validates API key and quota
3. Server initiates OpenAI streaming
4. Server sends SSE events as tokens arrive
5. Server saves complete message to database
6. Server sends completion signal

**Event Types**:
- `content` - Text chunks
- `sources` - Relevant document sources
- `done` - Stream completion
- `error` - Error occurred

### Client-Side (React Hook)

**Hook**: `useStreamingChat()`

**Features**:
- Message state management
- Stream consumption
- Error handling
- Cancellation support
- Auto-reconnection

---

## Usage

### Client-Side (React Component)

```typescript
import { useStreamingChat } from "@/hooks/useStreamingChat";

export function ChatComponent() {
  const {
    messages,
    isStreaming,
    currentResponse,
    sources,
    error,
    sendMessage,
    cancelStream,
  } = useStreamingChat({
    apiKey: "cbk_your_api_key",
    onMessage: (message) => {
      console.log("Complete message:", message);
    },
    onError: (error) => {
      console.error("Stream error:", error);
    },
  });

  const handleSubmit = async (question: string) => {
    await sendMessage({
      question,
      sessionId: "optional-session-id",
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      },
    });
  };

  return (
    <div>
      {/* Previous messages */}
      {messages.map((msg, idx) => (
        <div key={idx}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}

      {/* Current streaming response */}
      {isStreaming && (
        <div>
          <strong>assistant:</strong> {currentResponse}
          <span className="cursor-blink">▋</span>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div>
          <strong>Sources:</strong>
          {sources.map((source, idx) => (
            <div key={idx}>{source.documentName}</div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <div className="error">{error}</div>}

      {/* Input form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.question;
        handleSubmit(input.value);
        input.value = "";
      }}>
        <input name="question" disabled={isStreaming} />
        <button type="submit" disabled={isStreaming}>
          {isStreaming ? "Streaming..." : "Send"}
        </button>
        {isStreaming && (
          <button type="button" onClick={cancelStream}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}
```

### Non-React Usage

```typescript
import { streamChatMessage } from "@/hooks/useStreamingChat";

async function chat() {
  try {
    for await (const chunk of streamChatMessage({
      apiKey: "cbk_your_api_key",
      question: "What is TypeScript?",
    })) {
      process.stdout.write(chunk); // Print each chunk as it arrives
    }
    console.log("\n[Stream complete]");
  } catch (error) {
    console.error("Error:", error);
  }
}

chat();
```

### Direct API Call (cURL)

```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "X-Chatbot-API-Key: cbk_your_api_key" \
  -d '{
    "question": "What is TypeScript?",
    "sessionId": "session-123"
  }'
```

**Response (SSE format)**:
```
data: {"type":"content","content":"TypeScript"}
data: {"type":"content","content":" is"}
data: {"type":"content","content":" a"}
data: {"type":"content","content":" typed"}
data: {"type":"content","content":" superset"}
data: {"type":"content","content":" of"}
data: {"type":"content","content":" JavaScript"}
data: {"type":"sources","sources":[{"documentName":"typescript-docs.pdf","relevanceScore":0.95}]}
data: {"type":"done","messageId":"msg-123","sessionId":"session-123"}
```

---

## API Reference

### POST /api/chat/stream

**Headers**:
- `Content-Type`: application/json
- `X-Chatbot-API-Key`: Your API key (required)

**Request Body**:
```typescript
{
  question: string;        // 1-1000 characters
  sessionId?: string;      // Optional session ID (auto-generated if omitted)
  metadata?: {
    userAgent?: string;
    referrer?: string;
  };
}
```

**Response**: Server-Sent Events (text/event-stream)

**Event Types**:

1. **Content Event**:
```json
{
  "type": "content",
  "content": "text chunk"
}
```

2. **Sources Event**:
```json
{
  "type": "sources",
  "sources": [
    {
      "documentName": "doc.pdf",
      "documentType": "PDF",
      "relevanceScore": 0.95,
      "url": "https://..."
    }
  ]
}
```

3. **Done Event**:
```json
{
  "type": "done",
  "messageId": "msg-123",
  "sessionId": "session-123"
}
```

4. **Error Event**:
```json
{
  "type": "error",
  "error": "Error message"
}
```

---

## Hook API: useStreamingChat()

### Parameters

```typescript
{
  apiKey: string;                      // Required: API key
  apiUrl?: string;                     // Optional: Custom endpoint (default: /api/chat/stream)
  onMessage?: (message) => void;       // Optional: Callback when message complete
  onError?: (error: Error) => void;    // Optional: Callback on error
  onComplete?: () => void;             // Optional: Callback when stream completes
}
```

### Return Value

```typescript
{
  messages: ChatMessage[];       // All messages in conversation
  isStreaming: boolean;          // True while streaming
  error: string | null;          // Error message if any
  currentResponse: string;       // Current streaming response
  sources: ChatSource[];         // Relevant document sources
  sendMessage: (options) => Promise<void>;
  cancelStream: () => void;      // Cancel ongoing stream
  clearMessages: () => void;     // Clear all messages
  retryLastMessage: () => void;  // Retry last user message
}
```

---

## Comparison: Streaming vs. Non-Streaming

| Feature | Non-Streaming (`/api/chat/message`) | Streaming (`/api/chat/stream`) |
|---------|-------------------------------------|--------------------------------|
| **Response Time** | Wait for complete response (~2-10s) | First token in ~500ms |
| **UX** | Loading spinner | Progressive display |
| **Perceived Speed** | Slower | Faster |
| **Bandwidth** | Same | Same |
| **Complexity** | Lower (simple JSON) | Higher (SSE handling) |
| **Cancellation** | Not supported | Supported |
| **Use Case** | API integrations | User-facing chat |

---

## Performance Considerations

### Server-Side

1. **Connection Management**:
   - SSE keeps connection open
   - Limit concurrent streams per user
   - Use timeouts to prevent hung connections

2. **Buffering**:
   - Nginx: `X-Accel-Buffering: no` header prevents buffering
   - Vercel: Automatic SSE support
   - Cloudflare: Works with SSE

3. **Rate Limiting**:
   - Same as non-streaming (60 req/min)
   - Consider limiting concurrent streams

### Client-Side

1. **Memory**:
   - SSE creates long-lived connections
   - Clean up on unmount
   - Clear old messages

2. **Error Recovery**:
   - Automatic retry on disconnect
   - Cancel and retry functionality
   - Fallback to non-streaming

---

## Error Handling

### Common Errors

**1. Connection Lost**:
```typescript
onError: (error) => {
  if (error.message.includes("network")) {
    // Retry with exponential backoff
    setTimeout(() => retryLastMessage(), 2000);
  }
}
```

**2. Rate Limit**:
```typescript
{
  "type": "error",
  "error": "Rate limit exceeded"
}
```

**3. Quota Exceeded**:
```typescript
{
  "type": "error",
  "error": "Conversation quota exceeded"
}
```

### Error Recovery Strategy

```typescript
const { sendMessage, retryLastMessage, error } = useStreamingChat({
  apiKey,
  onError: (error) => {
    console.error("Stream error:", error);

    // Auto-retry on network errors
    if (error.name === "NetworkError") {
      setTimeout(() => {
        retryLastMessage();
      }, 2000);
    }
  },
});
```

---

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 6+ | ✅ Full |
| Firefox | 6+ | ✅ Full |
| Safari | 5+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| IE | - | ❌ Not supported |

**Polyfill**: Not required for modern browsers

---

## Testing

### Unit Tests

```typescript
import { renderHook, act } from "@testing-library/react-hooks";
import { useStreamingChat } from "@/hooks/useStreamingChat";

describe("useStreamingChat", () => {
  it("should stream messages", async () => {
    const { result } = renderHook(() =>
      useStreamingChat({ apiKey: "test-key" })
    );

    await act(async () => {
      await result.current.sendMessage({ question: "Hello" });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[1].role).toBe("assistant");
  });

  it("should handle errors", async () => {
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useStreamingChat({ apiKey: "invalid-key", onError })
    );

    await act(async () => {
      await result.current.sendMessage({ question: "Hello" });
    });

    expect(onError).toHaveBeenCalled();
    expect(result.current.error).toBeTruthy();
  });
});
```

### Integration Tests

```typescript
describe("Streaming Chat API", () => {
  it("should stream response", async () => {
    const chunks: string[] = [];

    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Chatbot-API-Key": "test-key",
      },
      body: JSON.stringify({ question: "Hello" }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.some((c) => c.includes('"type":"content"'))).toBe(true);
    expect(chunks.some((c) => c.includes('"type":"done"'))).toBe(true);
  });
});
```

---

## Migration from Non-Streaming

### Before (Non-Streaming)

```typescript
const response = await fetch("/api/chat/message", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Chatbot-API-Key": apiKey,
  },
  body: JSON.stringify({ question }),
});

const data = await response.json();
console.log(data.answer);
```

### After (Streaming)

```typescript
import { streamChatMessage } from "@/hooks/useStreamingChat";

for await (const chunk of streamChatMessage({
  apiKey,
  question,
})) {
  process.stdout.write(chunk);
}
```

---

## Deployment Considerations

### Vercel

✅ **Works out of the box** - Vercel supports SSE natively

**Configuration**:
```json
// vercel.json
{
  "functions": {
    "app/api/chat/stream/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### Nginx

Add to nginx config:
```nginx
location /api/chat/stream {
  proxy_pass http://localhost:3000;
  proxy_buffering off;
  proxy_cache off;
  proxy_set_header Connection '';
  chunked_transfer_encoding off;
}
```

### Cloudflare

✅ **Works with Workers** - SSE supported

**Note**: Cloudflare has 100s timeout on Free plan. Consider upgrading.

---

## Best Practices

1. **Always handle errors**:
   ```typescript
   const { error, retryLastMessage } = useStreamingChat({ apiKey });

   if (error) {
     return <ErrorMessage error={error} onRetry={retryLastMessage} />;
   }
   ```

2. **Show streaming indicator**:
   ```typescript
   {isStreaming && <TypingIndicator />}
   ```

3. **Enable cancellation**:
   ```typescript
   {isStreaming && <button onClick={cancelStream}>Stop</button>}
   ```

4. **Cleanup on unmount**:
   ```typescript
   useEffect(() => {
     return () => cancelStream();
   }, [cancelStream]);
   ```

5. **Progressive enhancement**:
   ```typescript
   const useFallback = !("ReadableStream" in window);

   if (useFallback) {
     // Use non-streaming endpoint
   } else {
     // Use streaming
   }
   ```

---

## Troubleshooting

### Issue: Stream never completes

**Cause**: Missing `done` event
**Solution**: Check server logs for errors

### Issue: Chunks arrive slowly

**Cause**: Buffering in reverse proxy
**Solution**: Add `X-Accel-Buffering: no` header

### Issue: Connection drops

**Cause**: Timeout or network issue
**Solution**: Implement retry logic

---

## Additional Resources

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [OpenAI Streaming Guide](https://platform.openai.com/docs/api-reference/streaming)
- [Next.js Streaming](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)

---

*Last Updated: 2026-01-04*
*Version: 1.0*
