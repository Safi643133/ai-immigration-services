-- Setup all required tables for CEAC automation system
-- Run this in your Supabase SQL Editor

-- 1. Create ceac_security_answers table
CREATE TABLE IF NOT EXISTS ceac_security_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    security_question TEXT NOT NULL,
    security_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create ceac_application_ids table
CREATE TABLE IF NOT EXISTS ceac_application_ids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    application_id TEXT NOT NULL,
    application_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create ceac_field_mappings table (for future form filling)
CREATE TABLE IF NOT EXISTS ceac_field_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ceac_version TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    field_selector TEXT NOT NULL,
    field_type TEXT NOT NULL,
    field_label TEXT,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ceac_security_answers_job_id ON ceac_security_answers(job_id);
CREATE INDEX IF NOT EXISTS idx_ceac_security_answers_created_at ON ceac_security_answers(created_at);

CREATE INDEX IF NOT EXISTS idx_ceac_application_ids_job_id ON ceac_application_ids(job_id);
CREATE INDEX IF NOT EXISTS idx_ceac_application_ids_application_id ON ceac_application_ids(application_id);
CREATE INDEX IF NOT EXISTS idx_ceac_application_ids_created_at ON ceac_application_ids(created_at);

CREATE INDEX IF NOT EXISTS idx_ceac_field_mappings_version ON ceac_field_mappings(ceac_version);
CREATE INDEX IF NOT EXISTS idx_ceac_field_mappings_step ON ceac_field_mappings(step_number);
CREATE INDEX IF NOT EXISTS idx_ceac_field_mappings_active ON ceac_field_mappings(is_active);

-- Add unique constraints
ALTER TABLE ceac_application_ids ADD CONSTRAINT unique_application_id UNIQUE (application_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE ceac_security_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceac_application_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceac_field_mappings ENABLE ROW LEVEL SECURITY;

-- Security answers policies
CREATE POLICY "Users can view own security answers" ON ceac_security_answers
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own security answers" ON ceac_security_answers
    FOR INSERT WITH CHECK (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own security answers" ON ceac_security_answers
    FOR UPDATE USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own security answers" ON ceac_security_answers
    FOR DELETE USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Application IDs policies
CREATE POLICY "Users can view own application IDs" ON ceac_application_ids
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own application IDs" ON ceac_application_ids
    FOR INSERT WITH CHECK (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own application IDs" ON ceac_application_ids
    FOR UPDATE USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own application IDs" ON ceac_application_ids
    FOR DELETE USING (
        job_id IN (
            SELECT id FROM ceac_automation_jobs 
            WHERE user_id = auth.uid()
        )
    );

-- Field mappings policies (read-only for all authenticated users)
CREATE POLICY "Users can view field mappings" ON ceac_field_mappings
    FOR SELECT USING (auth.role() = 'authenticated');

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

CREATE TRIGGER update_ceac_application_ids_updated_at 
    BEFORE UPDATE ON ceac_application_ids 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ceac_field_mappings_updated_at 
    BEFORE UPDATE ON ceac_field_mappings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample field mappings for DS-160 form
INSERT INTO ceac_field_mappings (ceac_version, step_number, field_selector, field_type, field_label, is_required) VALUES
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_ddlPersonTitle', 'select', 'Person Title', true),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_txtPersonFirstName', 'text', 'First Name', true),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_txtPersonLastName', 'text', 'Last Name', true),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_txtPersonFullNameInNativeAlphabet', 'text', 'Full Name in Native Alphabet', false),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_txtPersonOtherNames', 'text', 'Other Names', false),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_txtPersonTelephoneNumber', 'text', 'Telephone Number', true),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_txtPersonEmailAddress', 'email', 'Email Address', false),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_txtPersonDateOfBirth', 'date', 'Date of Birth', true),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_txtPersonPlaceOfBirth', 'text', 'Place of Birth', true),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_ddlPersonGender', 'select', 'Gender', true),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_ddlPersonMaritalStatus', 'select', 'Marital Status', true),
('DS-160', 1, '#ctl00_SiteContentPlaceHolder_ucPerson1_txtPersonNationality', 'text', 'Nationality', true)
ON CONFLICT DO NOTHING;

-- Verify the tables were created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('ceac_security_answers', 'ceac_application_ids', 'ceac_field_mappings')
ORDER BY table_name, ordinal_position;
