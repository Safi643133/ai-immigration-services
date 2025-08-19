-- Create only the ceac_security_answers table
-- Skip policies since they already exist

-- Create ceac_security_answers table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS ceac_security_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    security_question TEXT NOT NULL,
    security_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_ceac_security_answers_job_id ON ceac_security_answers(job_id);

-- Enable RLS (if not already enabled)
ALTER TABLE ceac_security_answers ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_ceac_security_answers_updated_at'
    ) THEN
        CREATE TRIGGER update_ceac_security_answers_updated_at 
            BEFORE UPDATE ON ceac_security_answers 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

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
