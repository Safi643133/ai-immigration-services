-- Create only the missing ceac_security_answers table
-- ceac_application_ids table already exists with proper schema

-- Create ceac_security_answers table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS ceac_security_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    security_question TEXT NOT NULL,
    security_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_ceac_security_answers_job_id ON ceac_security_answers(job_id);

-- Enable RLS
ALTER TABLE ceac_security_answers ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own security answers" ON ceac_security_answers
    FOR SELECT USING (job_id IN (SELECT id FROM ceac_automation_jobs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own security answers" ON ceac_security_answers
    FOR INSERT WITH CHECK (job_id IN (SELECT id FROM ceac_automation_jobs WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own security answers" ON ceac_security_answers
    FOR UPDATE USING (job_id IN (SELECT id FROM ceac_automation_jobs WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own security answers" ON ceac_security_answers
    FOR DELETE USING (job_id IN (SELECT id FROM ceac_automation_jobs WHERE user_id = auth.uid()));

-- Add trigger for updated_at
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
WHERE table_schema = 'public' 
    AND table_name = 'ceac_security_answers'
ORDER BY ordinal_position;
