-- Fix existing tables for CEAC automation
-- This script works with your existing schema

-- 1. Create ceac_security_answers table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS ceac_security_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    security_question TEXT NOT NULL,
    security_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create ceac_application_ids table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS ceac_application_ids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    application_id TEXT NOT NULL,
    application_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ceac_security_answers_job_id ON ceac_security_answers(job_id);
CREATE INDEX IF NOT EXISTS idx_ceac_application_ids_job_id ON ceac_application_ids(job_id);

-- Add unique constraint
ALTER TABLE ceac_application_ids ADD CONSTRAINT unique_application_id UNIQUE (application_id);

-- Enable RLS
ALTER TABLE ceac_security_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceac_application_ids ENABLE ROW LEVEL SECURITY;

-- Add basic policies
CREATE POLICY "Users can view own security answers" ON ceac_security_answers
    FOR SELECT USING (job_id IN (SELECT id FROM ceac_automation_jobs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own security answers" ON ceac_security_answers
    FOR INSERT WITH CHECK (job_id IN (SELECT id FROM ceac_automation_jobs WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own application IDs" ON ceac_application_ids
    FOR SELECT USING (job_id IN (SELECT id FROM ceac_automation_jobs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own application IDs" ON ceac_application_ids
    FOR INSERT WITH CHECK (job_id IN (SELECT id FROM ceac_automation_jobs WHERE user_id = auth.uid()));

-- Verify tables created
SELECT table_name, COUNT(*) as columns 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('ceac_security_answers', 'ceac_application_ids')
GROUP BY table_name;
