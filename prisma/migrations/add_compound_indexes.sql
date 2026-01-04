-- Add compound indexes for improved query performance
-- These indexes optimize common query patterns in the application

-- ConversationMessage: Improve performance when fetching messages for a session ordered by time
-- Used in conversation history retrieval
CREATE INDEX IF NOT EXISTS conversation_messages_session_created_idx
ON conversation_messages (session_id, created_at DESC);

-- Website: Improve performance when filtering websites by assistant and status
-- Used in website management dashboard
CREATE INDEX IF NOT EXISTS websites_assistant_status_idx
ON websites (assistant_id, status);

-- WebsitePage: Improve performance when fetching pages for a website
CREATE INDEX IF NOT EXISTS website_pages_website_id_idx
ON website_pages (website_id);

-- ConversationSession: Improve performance when looking up sessions by assistant
CREATE INDEX IF NOT EXISTS conversation_sessions_assistant_idx
ON conversation_sessions (assistant_id);
