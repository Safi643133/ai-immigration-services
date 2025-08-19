-- Create ceac_application_ids table for storing application IDs
-- This table stores the application IDs and dates for future application retrieval

CREATE TABLE IF NOT EXISTS ceac_application_ids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    application_id TEXT NOT NULL,
    application_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ceac_application_ids_job_id ON ceac_application_ids(job_id);
CREATE INDEX IF NOT EXISTS idx_ceac_application_ids_application_id ON ceac_application_ids(application_id);
CREATE INDEX IF NOT EXISTS idx_ceac_application_ids_created_at ON ceac_application_ids(created_at);

-- Add unique constraint to prevent duplicate application IDs
ALTER TABLE ceac_application_ids ADD CONSTRAINT unique_application_id UNIQUE (application_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE ceac_application_ids ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own application IDs
CREATE POLICY "Users can view own application IDs" ON ceac_application_ids
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert their own application IDs
CREATE POLICY "Users can insert own application IDs" ON ceac_application_ids
    FOR INSERT WITH CHECK (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own application IDs
CREATE POLICY "Users can update own application IDs" ON ceac_application_ids
    FOR UPDATE USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own application IDs
CREATE POLICY "Users can delete own application IDs" ON ceac_application_ids
    FOR DELETE USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_ceac_application_ids_updated_at 
    BEFORE UPDATE ON ceac_application_ids 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ceac_application_ids' 
ORDER BY ordinal_position;
