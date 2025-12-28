-- Add selectedAssistantIcon column to ChatbotSettings if it doesn't exist
-- This column may already exist in the database, so we check first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ChatbotSettings' 
        AND column_name = 'selectedAssistantIcon'
    ) THEN
        ALTER TABLE "ChatbotSettings" ADD COLUMN "selectedAssistantIcon" TEXT DEFAULT 'robot';
    END IF;
END $$;

