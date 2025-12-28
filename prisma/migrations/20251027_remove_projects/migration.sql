-- Remove project-related features

-- Drop project tables
DROP TABLE IF EXISTS "project_documents" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;

-- Remove projectId from conversation_sessions
ALTER TABLE "conversation_sessions" DROP COLUMN IF EXISTS "projectId";
ALTER TABLE "conversation_sessions" DROP COLUMN IF EXISTS "contextCache";
ALTER TABLE "conversation_sessions" DROP COLUMN IF EXISTS "contextCachedAt";

-- Remove projectId from ChatbotSettings
ALTER TABLE "ChatbotSettings" DROP COLUMN IF EXISTS "projectId";
