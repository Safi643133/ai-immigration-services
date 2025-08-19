-- Create ceac_security_answers table for storing security question answers
-- This table stores the answers to security questions for future application retrieval

CREATE TABLE IF NOT EXISTS ceac_security_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    security_question TEXT NOT NULL,
    security_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ceac_security_answers_job_id ON ceac_security_answers(job_id);
CREATE INDEX IF NOT EXISTS idx_ceac_security_answers_created_at ON ceac_security_answers(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE ceac_security_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own security answers
CREATE POLICY "Users can view own security answers" ON ceac_security_answers
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert their own security answers
CREATE POLICY "Users can insert own security answers" ON ceac_security_answers
    FOR INSERT WITH CHECK (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own security answers
CREATE POLICY "Users can update own security answers" ON ceac_security_answers
    FOR UPDATE USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own security answers
CREATE POLICY "Users can delete own security answers" ON ceac_security_answers
    FOR DELETE USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ceac_security_answers_updated_at 
    BEFORE UPDATE ON ceac_security_answers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ceac_security_answers' 
ORDER BY ordinal_position;
