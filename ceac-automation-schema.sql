-- CEAC Automation Database Schema
-- Phase 1: Enhanced Form Storage and CEAC Integration Tables

-- Create new ENUM types for CEAC automation
DO $$ BEGIN
    CREATE TYPE ceac_job_status AS ENUM (
        'queued', 
        'running', 
        'succeeded', 
        'completed',
        'failed', 
        'needs_human', 
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_level AS ENUM (
        'debug', 
        'info', 
        'warn', 
        'error'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE artifact_type AS ENUM (
        'screenshot', 
        'html', 
        'har', 
        'pdf', 
        'json', 
        'video',
        'log'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhance existing form_submissions table
DO $$
BEGIN
    -- Add new columns to form_submissions if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' AND column_name = 'submission_reference'
    ) THEN
        ALTER TABLE form_submissions ADD COLUMN submission_reference VARCHAR(50) UNIQUE;
        ALTER TABLE form_submissions ADD COLUMN ceac_application_id VARCHAR(20);
        ALTER TABLE form_submissions ADD COLUMN ceac_confirmation_id VARCHAR(20);
        ALTER TABLE form_submissions ADD COLUMN submission_attempt_count INTEGER DEFAULT 0;
        ALTER TABLE form_submissions ADD COLUMN last_submission_attempt TIMESTAMPTZ;
        ALTER TABLE form_submissions ADD COLUMN form_validation_status validation_status DEFAULT 'pending';
        ALTER TABLE form_submissions ADD COLUMN pre_submission_checks JSONB;
        ALTER TABLE form_submissions ADD COLUMN ceac_submission_status ceac_job_status;
        
        -- Create index on submission_reference for quick lookups
        CREATE INDEX IF NOT EXISTS idx_form_submissions_reference ON form_submissions(submission_reference);
        CREATE INDEX IF NOT EXISTS idx_form_submissions_ceac_app_id ON form_submissions(ceac_application_id);
        CREATE INDEX IF NOT EXISTS idx_form_submissions_ceac_status ON form_submissions(ceac_submission_status);
        
        RAISE NOTICE 'Enhanced form_submissions table with CEAC columns';
    ELSE
        RAISE NOTICE 'form_submissions table already enhanced';
    END IF;
END $$;

-- Create CEAC automation jobs table
CREATE TABLE IF NOT EXISTS ceac_automation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES form_submissions(id) ON DELETE CASCADE,
    status ceac_job_status DEFAULT 'queued',
    ceac_version VARCHAR(10) DEFAULT '2025.01',
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    ceac_application_id VARCHAR(20),
    ceac_confirmation_id VARCHAR(20),
    embassy_location VARCHAR(100),
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    idempotency_key VARCHAR(100) UNIQUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CEAC job events table
CREATE TABLE IF NOT EXISTS ceac_job_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    event_type VARCHAR(50),
    level event_level DEFAULT 'info',
    message TEXT,
    payload JSONB DEFAULT '{}',
    page_url VARCHAR(500),
    screenshot_path VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CEAC artifacts table
CREATE TABLE IF NOT EXISTS ceac_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    artifact_type artifact_type,
    storage_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    step_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CEAC field mappings table
CREATE TABLE IF NOT EXISTS ceac_field_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ceac_version VARCHAR(10) DEFAULT '2025.01',
    page_identifier VARCHAR(100),
    ds160_step_number INTEGER,
    field_group VARCHAR(100),
    ds160_field_path VARCHAR(200),
    ceac_selector JSONB,
    ceac_action VARCHAR(50),
    field_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB DEFAULT '{}',
    fallback_selectors JSONB DEFAULT '[]',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CEAC sessions table
CREATE TABLE IF NOT EXISTS ceac_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
    session_identifier VARCHAR(100),
    ceac_location VARCHAR(100),
    session_cookies JSONB DEFAULT '{}',
    session_expires_at TIMESTAMPTZ,
    user_agent VARCHAR(500),
    viewport_size VARCHAR(20) DEFAULT '1920x1080',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ceac_jobs_user_id ON ceac_automation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ceac_jobs_status ON ceac_automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ceac_jobs_scheduled ON ceac_automation_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ceac_jobs_submission_id ON ceac_automation_jobs(submission_id);
CREATE INDEX IF NOT EXISTS idx_ceac_jobs_idempotency ON ceac_automation_jobs(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_ceac_events_job_id ON ceac_job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_ceac_events_timestamp ON ceac_job_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ceac_events_level ON ceac_job_events(level);

CREATE INDEX IF NOT EXISTS idx_ceac_artifacts_job_id ON ceac_artifacts(job_id);
CREATE INDEX IF NOT EXISTS idx_ceac_artifacts_type ON ceac_artifacts(artifact_type);

CREATE INDEX IF NOT EXISTS idx_ceac_mappings_version ON ceac_field_mappings(ceac_version);
CREATE INDEX IF NOT EXISTS idx_ceac_mappings_step ON ceac_field_mappings(ds160_step_number);
CREATE INDEX IF NOT EXISTS idx_ceac_mappings_active ON ceac_field_mappings(is_active);

CREATE INDEX IF NOT EXISTS idx_ceac_sessions_job_id ON ceac_sessions(job_id);

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS handle_ceac_jobs_updated_at ON ceac_automation_jobs;
CREATE TRIGGER handle_ceac_jobs_updated_at
    BEFORE UPDATE ON ceac_automation_jobs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_ceac_mappings_updated_at ON ceac_field_mappings;
CREATE TRIGGER handle_ceac_mappings_updated_at
    BEFORE UPDATE ON ceac_field_mappings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on all new tables
ALTER TABLE ceac_automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceac_job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceac_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceac_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceac_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own CEAC jobs" ON ceac_automation_jobs;
DROP POLICY IF EXISTS "Users can insert own CEAC jobs" ON ceac_automation_jobs;
DROP POLICY IF EXISTS "Users can update own CEAC jobs" ON ceac_automation_jobs;

DROP POLICY IF EXISTS "Users can view own job events" ON ceac_job_events;
DROP POLICY IF EXISTS "Users can view own artifacts" ON ceac_artifacts;
DROP POLICY IF EXISTS "Users can view own sessions" ON ceac_sessions;
DROP POLICY IF EXISTS "Authenticated users can view field mappings" ON ceac_field_mappings;

-- Create RLS policies for ceac_automation_jobs
CREATE POLICY "Users can view own CEAC jobs" ON ceac_automation_jobs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own CEAC jobs" ON ceac_automation_jobs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own CEAC jobs" ON ceac_automation_jobs
    FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for ceac_job_events
CREATE POLICY "Users can view own job events" ON ceac_job_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ceac_automation_jobs 
            WHERE ceac_automation_jobs.id = ceac_job_events.job_id 
            AND ceac_automation_jobs.user_id = auth.uid()
        )
    );

-- Create RLS policies for ceac_artifacts
CREATE POLICY "Users can view own artifacts" ON ceac_artifacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ceac_automation_jobs 
            WHERE ceac_automation_jobs.id = ceac_artifacts.job_id 
            AND ceac_automation_jobs.user_id = auth.uid()
        )
    );

-- Create RLS policies for ceac_sessions
CREATE POLICY "Users can view own sessions" ON ceac_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ceac_automation_jobs 
            WHERE ceac_automation_jobs.id = ceac_sessions.job_id 
            AND ceac_automation_jobs.user_id = auth.uid()
        )
    );

-- Create RLS policies for ceac_field_mappings (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view field mappings" ON ceac_field_mappings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON ceac_automation_jobs TO authenticated;
GRANT ALL ON ceac_job_events TO authenticated;
GRANT ALL ON ceac_artifacts TO authenticated;
GRANT ALL ON ceac_field_mappings TO authenticated;
GRANT ALL ON ceac_sessions TO authenticated;

-- Insert initial CEAC field mappings for DS-160 Step 1 (Personal Information - Part 1)
INSERT INTO ceac_field_mappings (
    ceac_version, 
    page_identifier, 
    ds160_step_number, 
    field_group, 
    ds160_field_path, 
    ceac_selector, 
    ceac_action, 
    field_order, 
    is_required,
    notes
) VALUES
-- Step 1: Personal Information - Part 1
('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.surnames', 
 '{"type": "label", "value": "Surname", "fallbacks": [{"type": "css", "value": "input[name*=\"surname\"]"}]}', 
 'fill', 1, true, 'Surname (family name) in capital letters'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.given_names', 
 '{"type": "label", "value": "Given Names", "fallbacks": [{"type": "css", "value": "input[name*=\"given\"]"}]}', 
 'fill', 2, true, 'Given names (first and middle) in capital letters'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.full_name_native_alphabet', 
 '{"type": "label", "value": "Full Name in Native Alphabet", "fallbacks": [{"type": "css", "value": "input[name*=\"native\"]"}]}', 
 'fill', 3, false, 'Full name in native alphabet if different from English'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.full_name_native_alphabet_na', 
 '{"type": "label", "value": "Does Not Apply", "fallbacks": [{"type": "css", "value": "input[type=\"checkbox\"][name*=\"na\"]"}]}', 
 'checkbox', 4, false, 'Check if native alphabet does not apply'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.other_names_used', 
 '{"type": "label", "value": "Have you ever used other names", "fallbacks": [{"type": "css", "value": "input[name*=\"other_names\"]"}]}', 
 'radio', 5, true, 'Whether other names have been used'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.telecode_name', 
 '{"type": "label", "value": "Do you have a telecode", "fallbacks": [{"type": "css", "value": "input[name*=\"telecode\"]"}]}', 
 'radio', 6, true, 'Whether person has telecode representation of name'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.sex', 
 '{"type": "label", "value": "Sex", "fallbacks": [{"type": "css", "value": "select[name*=\"sex\"]"}]}', 
 'select', 7, true, 'Sex: Male or Female'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.marital_status', 
 '{"type": "label", "value": "Marital Status", "fallbacks": [{"type": "css", "value": "select[name*=\"marital\"]"}]}', 
 'select', 8, true, 'Current marital status'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.date_of_birth', 
 '{"type": "label", "value": "Date of Birth", "fallbacks": [{"type": "css", "value": "input[name*=\"birth\"]"}]}', 
 'date', 9, true, 'Date of birth in MM/DD/YYYY format'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.place_of_birth_city', 
 '{"type": "label", "value": "City of Birth", "fallbacks": [{"type": "css", "value": "input[name*=\"birth_city\"]"}]}', 
 'fill', 10, true, 'City where person was born'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.place_of_birth_state', 
 '{"type": "label", "value": "State/Province of Birth", "fallbacks": [{"type": "css", "value": "input[name*=\"birth_state\"]"}]}', 
 'fill', 11, false, 'State or province of birth'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.place_of_birth_state_na', 
 '{"type": "label", "value": "Does Not Apply", "fallbacks": [{"type": "css", "value": "input[type=\"checkbox\"][name*=\"state_na\"]"}]}', 
 'checkbox', 12, false, 'Check if state/province does not apply'),

('2025.01', 'personal_info_1', 1, 'personal_info', 'personal_info.place_of_birth_country', 
 '{"type": "label", "value": "Country/Region of Birth", "fallbacks": [{"type": "css", "value": "select[name*=\"birth_country\"]"}]}', 
 'select', 13, true, 'Country or region where person was born')

ON CONFLICT DO NOTHING;

-- Create function to generate unique submission reference
CREATE OR REPLACE FUNCTION generate_submission_reference()
RETURNS TEXT AS $$
DECLARE
    ref TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate reference in format: SUB-YYYYMMDD-XXXXX
        ref := 'SUB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
        
        -- Check if reference already exists
        SELECT COUNT(*) INTO exists_check FROM form_submissions WHERE submission_reference = ref;
        
        -- If unique, exit loop
        IF exists_check = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate submission reference on insert
CREATE OR REPLACE FUNCTION set_submission_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.submission_reference IS NULL THEN
        NEW.submission_reference := generate_submission_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate submission reference
DROP TRIGGER IF EXISTS trigger_set_submission_reference ON form_submissions;
CREATE TRIGGER trigger_set_submission_reference
    BEFORE INSERT ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION set_submission_reference();

-- Create function to update form_submissions when CEAC job status changes
CREATE OR REPLACE FUNCTION sync_ceac_status_to_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the form submission with CEAC status and IDs
    UPDATE form_submissions 
    SET 
        ceac_submission_status = NEW.status,
        ceac_application_id = NEW.ceac_application_id,
        ceac_confirmation_id = NEW.ceac_confirmation_id,
        last_submission_attempt = CASE 
            WHEN NEW.status IN ('running', 'succeeded', 'failed') THEN NOW() 
            ELSE last_submission_attempt 
        END,
        submission_attempt_count = CASE 
            WHEN NEW.status = 'running' AND OLD.status != 'running' THEN submission_attempt_count + 1
            ELSE submission_attempt_count 
        END,
        updated_at = NOW()
    WHERE id = NEW.submission_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync CEAC job status back to form submission
DROP TRIGGER IF EXISTS trigger_sync_ceac_status ON ceac_automation_jobs;
CREATE TRIGGER trigger_sync_ceac_status
    AFTER UPDATE ON ceac_automation_jobs
    FOR EACH ROW EXECUTE FUNCTION sync_ceac_status_to_submission();

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'CEAC automation schema setup completed successfully';
END $$;
